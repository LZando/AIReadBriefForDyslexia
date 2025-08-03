#!/usr/bin/env python3
import sys
import os
import json
from pathlib import Path
import fitz  # PyMuPDF for PDF text extraction

# To run this code you need to install the following dependencies:
# pip install google-genai

import base64
from google import genai
from google.genai import types

def extract_text_from_pdf(pdf_path):
    """Extract text from PDF file"""
    try:
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text
    except Exception as e:
        return f"Error extracting text from {pdf_path}: {str(e)}"

def generate_with_gemini(input_text):
    """Generate content using Gemini AI"""
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
                types.Part.from_text(text="""Ti verrà fornito un capitolo/i di un libro, creami un riassunto molto dettagliato di quanto ti è stato condiviso."""),
            ],
        )

        # Collect all chunks
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

def extract_chapter_info(bookname, selected_chapters):
    """
    Extract chapter information and generate summaries with Gemini
    
    Args:
        bookname (str): Name of the book
        selected_chapters (list): List of selected chapter IDs
    
    Returns:
        dict: Chapter information with Gemini-generated summaries
    """
    try:
        # Check for Gemini API key
        if not os.environ.get("GEMINI_API_KEY"):
            raise ValueError("GEMINI_API_KEY environment variable not set")
        
        # Base path for the book
        book_dir = Path('bookstore') / 'elaboratebook' / bookname
        
        if not book_dir.exists():
            raise FileNotFoundError(f"Book directory not found: {book_dir}")
        
        # Debug: List all files in the directory (to stderr)
        print(f"DEBUG: Book directory {book_dir} exists", file=sys.stderr)
        print(f"DEBUG: Files in directory: {list(book_dir.glob('*'))}", file=sys.stderr)
        print(f"DEBUG: Selected chapters: {selected_chapters}", file=sys.stderr)
        
        # Extract chapter information and texts
        chapters_info = []
        all_chapters_text = ""
        
        for chapter_id in selected_chapters:
            print(f"DEBUG: Processing chapter_id: {chapter_id}", file=sys.stderr)
            # Parse chapter ID format: bookname_cap{number}
            if '_cap' in chapter_id:
                chapter_number = chapter_id.split('_cap')[1]
                print(f"DEBUG: Extracted chapter number: {chapter_number}", file=sys.stderr)
                
                # Find the corresponding PDF file (use simpler pattern)
                pattern = f'cap{chapter_number}*.pdf'
                chapter_files = list(book_dir.glob(pattern))
                print(f"DEBUG: Looking for pattern {pattern}, found files: {chapter_files}", file=sys.stderr)
                
                if chapter_files:
                    chapter_file = chapter_files[0]
                    filename = chapter_file.name
                    print(f"DEBUG: Processing file: {filename}", file=sys.stderr)
                    
                    # Extract title from filename: cap{number}[TITLE].pdf
                    import re
                    match = re.match(r'cap(\d+)\[(.+)\]\.pdf', filename)
                    if match:
                        cap_num = int(match.group(1))
                        cap_title = match.group(2).replace('_', ' ')
                        print(f"DEBUG: Extracted cap_num: {cap_num}, cap_title: {cap_title}", file=sys.stderr)
                        
                        # Extract text from PDF
                        chapter_text = extract_text_from_pdf(str(chapter_file))
                        print(f"DEBUG: Extracted text length: {len(chapter_text)}", file=sys.stderr)
                        
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
                        
                        # Add to combined text
                        all_chapters_text += f"\n\n=== CAPITOLO {cap_num}: {cap_title} ===\n\n{chapter_text}"
                    else:
                        print(f"DEBUG: Filename {filename} doesn't match expected pattern", file=sys.stderr)
                else:
                    print(f"DEBUG: No files found for pattern {pattern}", file=sys.stderr)
            else:
                print(f"DEBUG: Chapter ID {chapter_id} doesn't contain '_cap'", file=sys.stderr)
        
        # Sort by chapter number
        chapters_info.sort(key=lambda x: x['chapter_number'])
        
        print(f"DEBUG: Total chapters found: {len(chapters_info)}", file=sys.stderr)
        print(f"DEBUG: Combined text length: {len(all_chapters_text)}", file=sys.stderr)
        
        # Generate summary with Gemini only if we have text
        if all_chapters_text.strip():
            summary = generate_with_gemini(all_chapters_text)
        else:
            summary = "Nessun contenuto di capitoli trovato per la generazione."
        
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
    """Main function for command line usage"""
    if len(sys.argv) < 3:
        print(json.dumps({
            'status': 'error',
            'message': 'Usage: python gemini_generation.py <bookname> <chapter_ids_json>'
        }))
        sys.exit(1)
    
    try:
        bookname = sys.argv[1]
        chapter_ids_json = sys.argv[2]
        
        # Parse chapter IDs
        selected_chapters = json.loads(chapter_ids_json)
        
        # Extract chapter information
        result = extract_chapter_info(bookname, selected_chapters)
        
        # Output result as JSON
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
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