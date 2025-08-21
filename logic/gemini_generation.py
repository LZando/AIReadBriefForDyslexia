import sys
import os
import json
from pathlib import Path
import fitz
import base64
from google import genai
from google.genai import types

#This file provide Gemini response

def extract_text_from_pdf(pdf_path):
    try:
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text
    except Exception as e:
        return f"Error extracting text from {pdf_path}: {str(e)}"

def generate_with_gemini(input_text, mode):
    print("Request ready")
    if mode.lower() == "summarization":
        prompt = (
            "Ti verranno forniti uno o più capitoli di un libro; "
            "crea un riassunto molto dettagliato del contenuto condiviso."
        )
    else:
        prompt = (
            "Ti verranno forniti uno o più capitoli di un libro; "
            "organizza chiaramente i personaggi in ordine di rilevanza, "
            "evidenziando chi sono, le loro caratteristiche e cosa hanno fatto in breve."
            "Il risutalto deve essere esempio Marco: [Descrizione] [Breve descrizione di cose fatte]"
            "Solo personaggi dentro il libro, non parlare dell'autore o altre cose in prefazione su personaggi non nel libro"
        )

    try:
        client = genai.Client(
            api_key=os.environ.get("GEMINI_API_KEY"),
        )

        model = "gemini-2.5-flash"
        contents = [
            types.Content(
                role="user",
                parts=[
                    types.Part.from_text(text=input_text),
                ],
            ),
        ]
        generate_content_config = types.GenerateContentConfig(
            thinking_config = types.ThinkingConfig(
                thinking_budget=-1,
            ),
            system_instruction=[
                types.Part.from_text(text=prompt),
            ],
        )

        response_text = ""
        for chunk in client.models.generate_content_stream(
            model=model,
            contents=contents,
            config=generate_content_config,
        ):
            response_text += chunk.text

        return response_text
        
    except Exception as e:
        return f"Error generating with Gemini: {str(e)}"

def extract_chapter_info(bookname, selected_chapters, mode):
    try:
        if not os.environ.get("GEMINI_API_KEY"):
            raise ValueError("GEMINI_API_KEY environment variable not set")

        book_dir = Path('bookstore') / 'elaboratebook' / bookname
        
        if not book_dir.exists():
            raise FileNotFoundError(f"Book directory not found: {book_dir}")

        chapters_info = []
        all_chapters_text = ""
        
        for chapter_id in selected_chapters:
            if '_cap' in chapter_id:
                chapter_number = chapter_id.split('_cap')[1]

                pattern = f'cap{chapter_number}*.pdf'
                chapter_files = list(book_dir.glob(pattern))
                
                if chapter_files:
                    chapter_file = chapter_files[0]
                    filename = chapter_file.name

                    import re
                    match = re.match(r'cap(\d+)\[(.+)\]\.pdf', filename)
                    if match:
                        cap_num = int(match.group(1))
                        cap_title = match.group(2).replace('_', ' ')
                        chapter_text = extract_text_from_pdf(str(chapter_file))
                        
                        chapter_info = {
                            'chapter_number': cap_num,
                            'chapter_title': cap_title,
                            'filename': filename,
                            'file_path': str(chapter_file),
                            'url': f'/api/chapter-file/{bookname}/{filename}',
                            'chapter_id': chapter_id,
                            'text': chapter_text
                        }
                        
                        chapters_info.append(chapter_info)

                        all_chapters_text += f"\n\n=== CAPITOLO {cap_num}: {cap_title} ===\n\n{chapter_text}"
                    else:
                        print(f"Error: Filename {filename} doesn't match expected pattern", file=sys.stderr)
                else:
                    print(f"Error: No files found for pattern {pattern}", file=sys.stderr)
            else:
                print(f"Error: Chapter ID {chapter_id} doesn't contain '_cap'", file=sys.stderr)

        chapters_info.sort(key=lambda x: x['chapter_number'])


        if all_chapters_text.strip():
            summary = generate_with_gemini(all_chapters_text, mode)
        else:
            summary = "No chapter content found for generation."
        
        result = {
            'status': 'success',
            'bookname': bookname,
            'total_chapters': len(chapters_info),
            'chapters': chapters_info,
            'combined_text': all_chapters_text,
            'gemini_summary': summary,
            'book_directory': str(book_dir),
            'generation_ready': True,
            'debug_info': {
                'selected_chapters': selected_chapters,
                'book_dir_exists': book_dir.exists(),
                'files_in_dir': [str(f) for f in book_dir.glob('*')] if book_dir.exists() else []
            }
        }
        
        return result
        
    except Exception as e:
        import traceback
        return {
            'status': 'error',
            'message': str(e),
            'traceback': traceback.format_exc(),
            'bookname': bookname,
            'generation_ready': False
        }

def main():
    print("Recever ready")
    if len(sys.argv) < 4:
        print(json.dumps({
            'status': 'error',
            'message': 'Usage: python gemini_generation.py <bookname> <chapter_ids_json> <mode>'
        }))
        sys.exit(1)
    
    try:
        bookname = sys.argv[1]
        chapter_ids_json = sys.argv[2]
        mode = sys.argv[3]

        selected_chapters = json.loads(chapter_ids_json)

        result = extract_chapter_info(bookname, selected_chapters, mode)
        print(json.dumps(result))
        
        
    except json.JSONDecodeError:
        print(json.dumps({
            'status': 'error',
            'message': 'Invalid JSON format for chapter IDs'
        }))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({
            'status': 'error',
            'message': str(e)
        }))
        sys.exit(1)

if __name__ == '__main__':
    main() 