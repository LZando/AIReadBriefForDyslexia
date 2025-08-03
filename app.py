from flask import Flask, request, jsonify, send_from_directory, render_template_string
import os
import sys
import json
import subprocess
from pathlib import Path
import shutil
from concurrent.futures import ProcessPoolExecutor, as_completed, TimeoutError
import atexit

app = Flask(__name__)

# Configurazione
app.config['DEBUG'] = True

# Pool di processi per elaborazione PDF (inizializzato solo quando necessario)
pdf_process_pool = None

def get_pdf_pool():
    global pdf_process_pool
    if pdf_process_pool is None:
        pdf_process_pool = ProcessPoolExecutor(
            max_workers=3,  # Max 3 processi paralleli per PDf
            mp_context=None  # Usa il context di default
        )
        # Cleanup automatico all'uscita dell'app
        atexit.register(lambda: pdf_process_pool.shutdown(wait=True))
    return pdf_process_pool
@app.route('/')
def index():
    return send_from_directory('frontend', 'index.html')
@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory('frontend', filename)
@app.route('/assets/<path:filename>')
def assets_files(filename):
    return send_from_directory('assets', filename)

# API Routes
@app.route('/api/health')
def health():
    return jsonify({
        'status': 'OK',
        'message': 'API is running',
        'timestamp': str(datetime.utcnow())
    })

@app.route('/api/cleanup', methods=['POST'])
def cleanup_workspace():
    try:
        book_temp = Path('bookstore') / 'booktemp'

        if book_temp.exists():
            for item in book_temp.iterdir():
                if item.is_file() or item.is_symlink():
                    item.unlink()
                elif item.is_dir():
                    shutil.rmtree(item)

        return jsonify({
            'success': True,
            'message': 'Cache and original PDFs cleaned successfully'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/library', methods=['GET'])
def get_library():
    try:
        elaboratebook_path = Path('bookstore') / 'elaboratebook'
        books = []
        if elaboratebook_path.exists():
            for item in elaboratebook_path.iterdir():
                books.append({
                    'name': item.name,
                    'id': item.name,
                    'displayName': item.name.replace('_', ' ').title()
                })

        return jsonify({
            'success': True,
            'books': books
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/upload-book', methods=['POST'])
def upload_book():
    try:
        if 'book-file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No book file provided (PDF or EPUB expected)'
            }), 400

        file = request.files['book-file']
        title = request.form.get('title', '').strip()
        author = request.form.get('author', 'Unknown Author').strip()

        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'No file selected'
            }), 400

        if not title:
            return jsonify({
                'success': False,
                'error': 'Title is required'
            }), 400

        import re
        from pathlib import Path

        bookname = title.lower().replace(' ', '_').replace('-', '_')
        bookname = re.sub(r'[^a-z0-9_]', '', bookname)

        filename = file.filename.lower()
        if not (filename.endswith('.pdf') or filename.endswith('.epub')):
            return jsonify({
                'success': False,
                'error': 'Unsupported file type. Only PDF and EPUB are allowed.'
            }), 400

        ext = '.pdf' if filename.endswith('.pdf') else '.epub'

        book_dir = Path('bookstore') / 'booktemp'
        book_dir.mkdir(parents=True, exist_ok=True)

        file_path = book_dir / f'{bookname}{ext}'
        file.save(str(file_path))

        return jsonify({
            'success': True,
            'message': f'Book "{title}" uploaded successfully',
            'bookname': bookname,
            'title': title,
            'author': author,
            'path': str(file_path)
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500



@app.route('/api/bookelaboration', methods=['POST'])
def book_elaboration():
    data = request.get_json()
    bookname = data.get('bookname')
    page = data.get('page')

    if not bookname:
        return jsonify({'error': 'Bookname is required'}), 400
        
    try:
        from logic.extractor import extract_book_info, extract_page_image
        
        pool = get_pdf_pool()
        
        if page:
            future = pool.submit(extract_page_image, bookname, int(page))
            filename, full_path = future.result(timeout=30)
            
            return jsonify({
                'success': True,
                'filename': filename,
                'message': f'Page {page} extracted'
            })
        else:
            future = pool.submit(extract_book_info, bookname)
            response_data = future.result(timeout=15)
            
            if response_data.get('status') == 'error':
                return jsonify({'error': response_data.get('message', 'Error')}), 500
                
            return jsonify({
                'success': True,
                'pages': response_data.get('pages'),
                'message': 'Book processed successfully'
            })

    except TimeoutError:
        return jsonify({'error': 'Processing timeout'}), 408
    except Exception as e:
        app.logger.error(f"Error processing book {bookname}: {str(e)}")
        return jsonify({'error': f'Processing error: {str(e)}'}), 500


@app.route('/api/book-image/<bookname>/<int:page_number>')
def book_image(bookname, page_number):
    cache_dir = Path('bookstore') / 'booktemp' / 'elaboratebook' / 'cache' / bookname
    image_filename = f'page_{page_number:03d}.png'
    image_file = cache_dir / image_filename

    if image_file.exists():
        return send_from_directory(cache_dir, image_filename)
    try:
        from logic.extractor import extract_page_image
        pool = get_pdf_pool()
        future = pool.submit(extract_page_image, bookname, page_number)

        filename, full_path = future.result(timeout=30)
        if image_file.exists():
            return send_from_directory(cache_dir, image_filename)
        else:
            return jsonify({'error': 'Image generation failed'}), 500
            
    except TimeoutError:
        return jsonify({'error': 'Image generation timeout (30s)'}), 408
    except Exception as e:
        app.logger.error(f"Error generating image for {bookname} page {page_number}: {str(e)}")
        return jsonify({'error': f'Failed to generate image: {str(e)}'}), 500

@app.route('/api/analyze-chapter', methods=['POST'])
def analyze_chapter():
    data = request.get_json()

    bookname = data.get('bookname')
    reference_page = data.get('pageNumber')

    if not bookname or not reference_page:
        return jsonify({
            'success': False,
            'message': 'Bookname and reference page are required'
        }), 400

    try:
        cmd = [sys.executable, 'logic/chapterlistcreator.py', bookname, str(reference_page)]

        result = subprocess.run(
            cmd, capture_output=True, text=True, check=True
        )

        chapters_data = json.loads(result.stdout.strip())

        if chapters_data.get('status') == 'error':
            return jsonify({
                'success': False,
                'error': chapters_data.get('message', 'Unknown error')
            }), 500

        return jsonify({
            'success': True,
            'bookname': chapters_data.get('bookname'),
            'referencePage': chapters_data.get('referencePage'),
            'detectedFont': chapters_data.get('detectedFont'),
            'detectedSize': chapters_data.get('detectedSize'),
            'totalChapters': chapters_data.get('totalChapters'),
            'chapters': chapters_data.get('chapters', [])
        })

    except subprocess.CalledProcessError as e:
        return jsonify({
            'success': False,
            'error': f'Error running chapter detection script: {e.stderr or e.stdout}'
        }), 500

    except json.JSONDecodeError as e:
        return jsonify({
            'success': False,
            'error': 'Invalid JSON returned by chapter detection script'
        }), 500

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500



@app.route('/api/book-chapters/<bookname>', methods=['GET'])
def get_book_chapters(bookname):
    """Get all chapters (PDFs) from a specific book directory"""
    try:
        book_dir = Path('bookstore') / 'elaboratebook' / bookname
        chapters = []
        
        if book_dir.exists():
            # Look for chapter PDFs (cap[number][title].pdf format)
            for pdf_file in book_dir.glob('cap*.pdf'):
                # Extract chapter info from filename
                filename = pdf_file.stem
                # Format: cap1[TITLE] or cap10[TITLE]
                import re
                match = re.match(r'cap(\d+)\[(.+)\]', filename)
                if match:
                    chapter_num = int(match.group(1))
                    chapter_title = match.group(2).replace('_', ' ')
                    
                    chapters.append({
                        'number': chapter_num,
                        'title': chapter_title,
                        'filename': pdf_file.name,
                        'id': f"{bookname}_cap{chapter_num}"
                    })
            
            # Sort by chapter number
            chapters.sort(key=lambda x: x['number'])
        
        return jsonify({
            'success': True,
            'bookname': bookname,
            'chapters': chapters
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500







@app.route('/api/gemini-generation', methods=['POST'])
def gemini_generation():
    """Generate content using Gemini AI for selected chapters"""
    try:
        data = request.get_json()
        bookname = data.get('bookname')
        selected_chapters = data.get('selectedChapters', [])
        
        if not bookname:
            return jsonify({
                'success': False,
                'error': 'Book name is required'
            }), 400
        
        if not selected_chapters:
            return jsonify({
                'success': False,
                'error': 'At least one chapter must be selected'
            }), 400
        
        # Check if Gemini API key is available
        if not os.environ.get('GEMINI_API_KEY'):
            return jsonify({
                'success': False,
                'error': 'GEMINI_API_KEY environment variable not set in Flask process'
            }), 500
        
        # Call the gemini generation script
        import json as json_module
        chapters_json = json_module.dumps(selected_chapters)
        
        # Pass environment variables to subprocess
        env = os.environ.copy()
        
        result = subprocess.run([
            sys.executable, 'logic/gemini_generation.py', bookname, chapters_json
        ], capture_output=True, text=True, check=True, env=env)
        
        # Print debug info from stderr
        if result.stderr:
            print("DEBUG from Python script:")
            print(result.stderr)
        
        # Parse the result
        try:
            generation_data = json.loads(result.stdout.strip())
        except json.JSONDecodeError as e:
            print(f"JSON Decode Error: {e}")
            print(f"Raw stdout: {result.stdout}")
            print(f"Raw stderr: {result.stderr}")
            raise
        
        if generation_data.get('status') == 'error':
            return jsonify({
                'success': False,
                'error': generation_data.get('message', 'Unknown error in generation')
            }), 500
        
        return jsonify({
            'success': True,
            'message': 'Chapter information extracted successfully',
            'data': generation_data
        })
        
    except subprocess.CalledProcessError as e:
        return jsonify({
            'success': False,
            'error': f'Error in generation script: {e.stderr}'
        }), 500
    except json.JSONDecodeError:
        return jsonify({
            'success': False,
            'error': 'Error parsing generation script response'
        }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/chapter-file/<bookname>/<filename>')
def serve_chapter_file(bookname, filename):
    """Serve chapter PDF files"""
    try:
        chapter_dir = Path('bookstore') / 'elaboratebook' / bookname
        chapter_file = chapter_dir / filename
        
        if not chapter_file.exists():
            return jsonify({'error': 'Chapter file not found'}), 404
        
        return send_from_directory(chapter_dir, filename)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/save-chapters', methods=['POST'])
def save_chapters():
    data = request.get_json()
    bookname = data.get('bookname')
    chapters_data = data.get('chaptersData')
    
    if not bookname or not chapters_data:
        return jsonify({
            'success': False,
            'message': 'Bookname and chapters data are required'
        }), 400
    
    try:
        # Crea un file temporaneo con i dati dei capitoli
        temp_dir = Path('temp')
        temp_dir.mkdir(exist_ok=True)
        
        temp_file = temp_dir / f'{bookname}_chapters.json'
        with open(temp_file, 'w', encoding='utf-8') as f:
            json.dump(chapters_data, f, ensure_ascii=False, indent=2)
        
        # Chiama lo script pdf_splitter.py
        result = subprocess.run([
            sys.executable, 'logic/pdf_splitter.py', bookname, str(temp_file)
        ], capture_output=True, text=True, check=True)
        
        # Rimuovi il file temporaneo
        temp_file.unlink()
        
        # Parse del risultato JSON
        split_result = json.loads(result.stdout.strip())
        
        if split_result.get('status') == 'error':
            return jsonify({
                'success': False,
                'error': split_result.get('message', 'Errore sconosciuto')
            }), 500
        
        return jsonify({
            'success': True,
            'message': split_result.get('message'),
            'bookname': split_result.get('bookname'),
            'outputDirectory': split_result.get('outputDirectory'),
            'totalChapters': split_result.get('totalChapters'),
            'createdFiles': split_result.get('createdFiles', [])
        })
        
    except subprocess.CalledProcessError as e:
        return jsonify({
            'success': False,
            'error': f'Errore nella divisione del PDF: {e.stderr}'
        }), 500
    except json.JSONDecodeError:
        return jsonify({
            'success': False,
            'error': 'Errore nella risposta dello script di divisione'
        }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    import time
    from datetime import datetime
    app.run(host='0.0.0.0', port=5000, debug=True) 