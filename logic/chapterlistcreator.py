#!/usr/bin/env python3
import sys
import os
import json
import fitz  # PyMuPDF
from pathlib import Path
from collections import Counter

def find_max_font(pagina):
    """Trova il font più grande in una pagina (titoli dei capitoli)"""
    content = pagina.get_text("dict")
    spans = [
        (span["text"].strip(), span["font"], span["size"])
        for block in content["blocks"]
        for line in block.get("lines", [])
        for span in line.get("spans", [])
        if span["text"].strip()
    ]

    if not spans:
        return None, None

    max_size = max(spans, key=lambda x: x[2])[2]
    fonts_with_max_size = [f for t, f, s in spans if s == max_size]
    common_font = Counter(fonts_with_max_size).most_common(1)[0][0]

    return common_font, max_size

def find_chapter_pages(pdf_path, target_font, target_size):
    """Trova le pagine che contengono i titoli dei capitoli"""
    doc = fitz.open(pdf_path)
    found_pages = []
    found_titles = []

    for i in range(len(doc)):
        page = doc.load_page(i)
        content = page.get_text("dict")
        found = False
        for block in content["blocks"]:
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    if (
                        span["text"].strip()
                        and span["font"] == target_font
                        and span["size"] == target_size
                    ):
                        found_pages.append(i + 1)
                        found_titles.append(span["text"].strip())
                        found = True
                        break
                if found:
                    break
            if found:
                break

    doc.close()
    return found_pages, found_titles

def extract_chapters(bookname, reference_page):
    """
    Estrae la lista dei capitoli dal PDF
    
    Args:
        bookname (str): Nome del libro
        reference_page (int): Pagina di riferimento per identificare il font dei titoli
    
    Returns:
        dict: Lista dei capitoli trovati
    """
    try:
        # Costruisci il percorso del PDF
        pdf_path = Path('bookstore') / f'{bookname}.pdf'
        
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF non trovato: {pdf_path}")
        
        # Apri il documento PDF
        doc = fitz.open(str(pdf_path))
        
        if reference_page < 1 or reference_page > len(doc):
            raise ValueError(f"Numero pagina {reference_page} fuori range (1-{len(doc)})")
        
        # Trova il font più grande nella pagina di riferimento
        reference_page_obj = doc.load_page(reference_page - 1)
        font_hugger, size_hugger = find_max_font(reference_page_obj)
        
        if not font_hugger or not size_hugger:
            raise ValueError("Nessun font valido trovato nella pagina di riferimento")
        
        # Trova tutte le pagine con capitoli
        chapter_pages, chapter_titles = find_chapter_pages(str(pdf_path), font_hugger, size_hugger)
        
        # Costruisci la lista dei capitoli
        chapters = []
        for i, (page, title) in enumerate(zip(chapter_pages, chapter_titles)):
            # Calcola la pagina finale del capitolo
            end_page = chapter_pages[i + 1] - 1 if i + 1 < len(chapter_pages) else len(doc)
            
            chapters.append({
                "chapterNumber": i + 1,
                "title": title,
                "startPage": page,
                "endPage": end_page,
                "pageCount": end_page - page + 1
            })
        
        doc.close()
        
        result = {
            "status": "success",
            "bookname": bookname,
            "referencePage": reference_page,
            "detectedFont": font_hugger,
            "detectedSize": size_hugger,
            "totalChapters": len(chapters),
            "chapters": chapters
        }
        
        return result
        
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "bookname": bookname,
            "referencePage": reference_page
        }

def main():
    if len(sys.argv) != 3:
        print(json.dumps({
            "status": "error",
            "message": "Usage: python chapterlistcreator.py <bookname> <reference_page>"
        }))
        sys.exit(1)
    
    try:
        bookname = sys.argv[1]
        reference_page = int(sys.argv[2])
        
        result = extract_chapters(bookname, reference_page)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
        if result["status"] == "error":
            sys.exit(1)
            
    except ValueError:
        print(json.dumps({
            "status": "error",
            "message": "Reference page must be an integer"
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
