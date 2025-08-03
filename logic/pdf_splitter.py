#!/usr/bin/env python3
import sys
import os
import json
import fitz  # PyMuPDF
from pathlib import Path

def split_pdf_into_chapters(bookname, chapters_data):
    """
    Divide un PDF in capitoli e li salva in una cartella dedicata
    """
    try:
        # Percorso del PDF originale
        pdf_path = Path('bookstore') / f'{bookname}.pdf'
        
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF non trovato: {pdf_path}")
        
        # Crea la cartella di destinazione
        output_dir = Path('bookstore') / 'elaboratebook' / bookname
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Apri il documento PDF
        doc = fitz.open(str(pdf_path))
        
        created_files = []
        
        # Elabora ogni capitolo
        for chapter in chapters_data.get('chapters', []):
            chapter_num = chapter['chapterNumber']
            chapter_title = chapter['title']
            start_page = chapter['startPage'] - 1  # PyMuPDF usa indici 0-based
            end_page = chapter['endPage'] - 1      # PyMuPDF usa indici 0-based
            
            # Pulisci il titolo per il nome del file
            clean_title = "".join(c for c in chapter_title if c.isalnum() or c in (' ', '-', '_')).strip()
            clean_title = clean_title.replace(' ', '_')
            
            # Crea un nuovo documento per questo capitolo
            chapter_doc = fitz.open()
            
            # Copia le pagine del capitolo
            for page_num in range(start_page, end_page + 1):
                if page_num < len(doc):
                    chapter_doc.insert_pdf(doc, from_page=page_num, to_page=page_num)
            
            # Nome del file del capitolo
            chapter_filename = f"cap{chapter_num}[{clean_title}].pdf"
            chapter_path = output_dir / chapter_filename
            
            # Salva il capitolo
            chapter_doc.save(str(chapter_path))
            chapter_doc.close()
            
            created_files.append({
                "chapterNumber": chapter_num,
                "title": chapter_title,
                "filename": chapter_filename,
                "path": str(chapter_path),
                "startPage": chapter['startPage'],
                "endPage": chapter['endPage'],
                "pageCount": chapter['pageCount']
            })
        
        doc.close()
        
        result = {
            "status": "success",
            "bookname": bookname,
            "outputDirectory": str(output_dir),
            "totalChapters": len(created_files),
            "createdFiles": created_files,
            "message": f"PDF diviso con successo in {len(created_files)} capitoli"
        }
        
        return result
        
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "bookname": bookname
        }

def main():
    if len(sys.argv) != 3:
        print(json.dumps({
            "status": "error",
            "message": "Usage: python pdf_splitter.py <bookname> <chapters_json_file>"
        }))
        sys.exit(1)
    
    try:
        bookname = sys.argv[1]
        chapters_json_file = sys.argv[2]
        
        # Leggi i dati dei capitoli dal file JSON
        with open(chapters_json_file, 'r', encoding='utf-8') as f:
            chapters_data = json.load(f)
        
        result = split_pdf_into_chapters(bookname, chapters_data)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
        if result["status"] == "error":
            sys.exit(1)
            
    except FileNotFoundError:
        print(json.dumps({
            "status": "error",
            "message": "Chapters data file not found"
        }))
        sys.exit(1)
    except json.JSONDecodeError:
        print(json.dumps({
            "status": "error",
            "message": "Invalid JSON in chapters data file"
        }))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({
            "status": "error",
            "message": f"Unexpected error: {str(e)}"
        }))
        sys.exit(1)

if __name__ == "__main__":
    main() 