from flask import Flask, request, jsonify, send_from_directory, render_template_string
import os
import sys
import json
import subprocess
from pathlib import Path

app = Flask(__name__)

# Configurazione
app.config['DEBUG'] = True

# Serve i file statici del frontend
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
        'message': 'AI Read Brief for Dyslexia API is running',
        'timestamp': str(datetime.utcnow())
    })

@app.route('/api/cleanup', methods=['POST'])
def cleanup_workspace():
    """Clean up cache contents and original PDFs, keep chapter folders"""
    try:
        import shutil
        
        # Clean cache directory contents but keep the directory
        cache_dir = Path('bookstore') / 'elaboratebook' / 'cache'
        if cache_dir.exists():
            # Remove all contents of cache directory
            for item in cache_dir.iterdir():
                if item.is_file():
                    item.unlink()
                elif item.is_dir():
                    shutil.rmtree(item)
        else:
            # Create cache directory if it doesn't exist
            cache_dir.mkdir(parents=True, exist_ok=True)
        
        # Clean only PDFs in bookstore root (original files)
        bookstore_dir = Path('bookstore')
        if bookstore_dir.exists():
            for pdf_file in bookstore_dir.glob('*.pdf'):
                pdf_file.unlink()
        
        # DON'T remove chapter folders in elaboratebook - those are the library!
        
        return jsonify({
            'success': True,
            'message': 'Cache and original PDFs cleaned successfully'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/book-info/<bookname>')
def book_info(bookname):
    try:
        # Esegui lo script Python per ottenere le info del libro
        result = subprocess.run([
            sys.executable, 'logic/extractor.py', bookname
        ], capture_output=True, text=True, check=True)
        
        # Parse del risultato JSON
        data = json.loads(result.stdout.strip())
        
        if data.get('status') == 'error':
            return jsonify({'error': data.get('message', 'Errore sconosciuto')}), 500
        
        # Controlla le pagine disponibili nella cache
        cache_dir = Path('bookstore') / 'elaboratebook' / 'cache' / bookname
        available_pages = []
        
        if cache_dir.exists():
            for file in cache_dir.glob('page_*.png'):
                try:
                    page_num = int(file.stem.split('_')[1])
                    available_pages.append(page_num)
                except (ValueError, IndexError):
                    continue
            available_pages.sort()
        
        return jsonify({
            'bookname': bookname,
            'totalPages': data.get('pages', 24),
            'availablePages': available_pages,
            'cacheDirectory': str(cache_dir)
        })
        
    except subprocess.CalledProcessError as e:
        return jsonify({'error': f'Errore nello script Python: {e.stderr}'}), 500
    except json.JSONDecodeError:
        return jsonify({'error': 'Errore nella risposta dallo script Python'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/bookelaboration', methods=['POST'])
def book_elaboration():
    data = request.get_json()
    bookname = data.get('bookname')
    
    if not bookname:
        return jsonify({'error': 'Bookname is required'}), 400
    
    try:
        # Esegui lo script Python per elaborare il libro
        result = subprocess.run([
            sys.executable, 'logic/extractor.py', bookname
        ], capture_output=True, text=True, check=True)
        
        # Parse del risultato JSON
        response_data = json.loads(result.stdout.strip())
        
        if response_data.get('status') == 'error':
            return jsonify({'error': response_data.get('message', 'Errore sconosciuto')}), 500
        
        return jsonify({
            'success': True,
            'pages': response_data.get('pages', 24),
            'message': 'Book processed successfully'
        })
        
    except subprocess.CalledProcessError as e:
        return jsonify({'error': f'Errore nello script Python: {e.stderr}'}), 500
    except json.JSONDecodeError:
        return jsonify({'error': 'Errore nella risposta dallo script Python'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/book-image/<bookname>/<int:page_number>')
def book_image(bookname, page_number):
    """Serve le immagini delle pagine del libro"""
    cache_dir = Path('bookstore') / 'elaboratebook' / 'cache' / bookname
    image_file = cache_dir / f'page_{page_number:03d}.png'
    
    if image_file.exists():
        return send_from_directory(cache_dir, f'page_{page_number:03d}.png')
    else:
        # Se l'immagine non esiste, prova a generarla
        try:
            result = subprocess.run([
                sys.executable, 'logic/extractor.py', bookname, str(page_number)
            ], capture_output=True, text=True, check=True)
            
            # Se la generazione ha successo, servi l'immagine
            if image_file.exists():
                return send_from_directory(cache_dir, f'page_{page_number:03d}.png')
            else:
                return jsonify({'error': 'Image not found and could not be generated'}), 404
                
        except subprocess.CalledProcessError:
            return jsonify({'error': 'Failed to generate image'}), 404

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

@app.route('/api/library', methods=['GET'])
def get_library():
    """Get all available books from the elaboratebook directory"""
    try:
        elaboratebook_path = Path('bookstore') / 'elaboratebook'
        books = []
        
        if elaboratebook_path.exists():
            for item in elaboratebook_path.iterdir():
                # Include only directories and exclude 'cache' folder
                if item.is_dir() and item.name != 'cache':
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

@app.route('/api/library', methods=['POST'])
def add_to_library():
    data = request.get_json()
    title = data.get('title')
    author = data.get('author', 'Unknown Author')
    
    if not title:
        return jsonify({
            'success': False,
            'message': 'Title is required'
        }), 400
    
    # TODO: Salva nel database
    print(f'Adding book: {title} by {author}')
    
    return jsonify({
        'success': True,
        'message': 'Book added to library',
        'book': {
            'id': int(time.time()),
            'title': title,
            'author': author,
            'dateAdded': datetime.utcnow().isoformat()
        }
    })

@app.route('/api/analyze-chapter', methods=['POST'])
def analyze_chapter():
    data = request.get_json()
    bookname = data.get('bookname')
    reference_page = data.get('pageNumber')  # Ora usata come pagina di riferimento
    
    if not bookname or not reference_page:
        return jsonify({
            'success': False,
            'message': 'Bookname and reference page are required'
        }), 400
    
    try:
        # Chiama lo script chapterlistcreator.py
        result = subprocess.run([
            sys.executable, 'logic/chapterlistcreator.py', bookname, str(reference_page)
        ], capture_output=True, text=True, check=True)
        
        # Parse del risultato JSON
        chapters_data = json.loads(result.stdout.strip())
        
        if chapters_data.get('status') == 'error':
            return jsonify({
                'success': False,
                'error': chapters_data.get('message', 'Errore sconosciuto')
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
            'error': f'Errore nello script di estrazione capitoli: {e.stderr}'
        }), 500
    except json.JSONDecodeError:
        return jsonify({
            'success': False,
            'error': 'Errore nella risposta dello script di estrazione capitoli'
        }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/upload-book', methods=['POST'])
def upload_book():
    """Upload and save user's PDF book to elaboratebook directory"""
    try:
        if 'pdf-file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No PDF file provided'
            }), 400
        
        file = request.files['pdf-file']
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
        
        # Create clean book name from title
        bookname = title.lower().replace(' ', '_').replace('-', '_')
        # Remove non-alphanumeric characters except underscore
        import re
        bookname = re.sub(r'[^a-z0-9_]', '', bookname)
        
        # Create directories
        elaboratebook_dir = Path('bookstore') / 'elaboratebook'
        book_dir = elaboratebook_dir / bookname
        book_dir.mkdir(parents=True, exist_ok=True)
        
        # Save PDF file
        pdf_path = book_dir / f'{bookname}.pdf'
        file.save(str(pdf_path))
        
        # Also save to bookstore root for processing
        bookstore_pdf = Path('bookstore') / f'{bookname}.pdf'
        import shutil
        shutil.copy2(pdf_path, bookstore_pdf)
        
        return jsonify({
            'success': True,
            'message': f'Book "{title}" uploaded successfully',
            'bookname': bookname,
            'title': title,
            'author': author,
            'path': str(pdf_path)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/copy-book', methods=['POST'])
def copy_book():
    """Copy selected book from elaboratebook to bookstore directory"""
    try:
        data = request.get_json()
        bookname = data.get('bookname')
        
        if not bookname:
            return jsonify({
                'success': False,
                'error': 'Book name is required'
            }), 400
        
        # Source and destination paths
        source_dir = Path('bookstore') / 'elaboratebook' / bookname
        dest_file = Path('bookstore') / f'{bookname}.pdf'
        
        if not source_dir.exists():
            return jsonify({
                'success': False,
                'error': f'Book "{bookname}" not found in library'
            }), 404
        
        # Find the first PDF file in the source directory
        pdf_files = list(source_dir.glob('*.pdf'))
        if not pdf_files:
            return jsonify({
                'success': False,
                'error': f'No PDF file found for book "{bookname}"'
            }), 404
        
        source_pdf = pdf_files[0]  # Take the first PDF found
        
        # Copy the PDF to bookstore
        import shutil
        shutil.copy2(source_pdf, dest_file)
        
        return jsonify({
            'success': True,
            'message': f'Book "{bookname}" copied successfully',
            'bookname': bookname,
            'sourcePath': str(source_pdf),
            'destinationPath': str(dest_file)
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