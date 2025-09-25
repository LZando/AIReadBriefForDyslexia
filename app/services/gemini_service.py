import os
import fitz
import re
from pathlib import Path

ELABORATE_BOOK_DIR = Path('bookstore') / 'elaboratebook'

def _extract_text_from_pdf(pdf_path):
    """Extracts all text from a given PDF file."""
    try:
        with fitz.open(pdf_path) as doc:
            return "".join(page.get_text() for page in doc)
    except Exception as e:
        # Log this error properly in a real application
        print(f"Error extracting text from {pdf_path}: {e}")
        return ""

def _generate_with_gemini(input_text: str, mode: str):
    """Generates content using the Gemini AI based on the provided text and mode."""
    # Lazy import google.genai to avoid slow startup
    from google import genai
    from google.genai import types

    if mode.lower() == "summarization":
        prompt = (
            "Ti verranno forniti uno o più capitoli di un libro; "
            "crea un riassunto molto dettagliato del contenuto condiviso."
        )
    else:
        prompt = (
            "Ti verranno forniti uno o più capitoli di un libro; "
            "organizza chiaramente i personaggi in ordine di rilevanza, "
            "evidenziando chi sono, le loro caratteristiche e cosa hanno fatto in breve. "
            "Il risultato deve essere nel formato 'Marco: [Descrizione] [Breve descrizione di cose fatte]'. "
            "Includi solo personaggi del libro, escludendo l'autore o altri non presenti nel testo."
        )

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable not set")

    try:
        client = genai.Client(api_key=api_key)
        model = "gemini-1.5-flash"  # Ensure this is the intended model

        system_instruction = types.Part.from_text(prompt)
        contents = [types.Content(role="user", parts=[types.Part.from_text(text=input_text)])]

        response = client.generate_content(
            model=model,
            contents=contents,
            system_instruction=system_instruction
        )
        return response.text
    except Exception as e:
        # Log this error properly
        print(f"Error generating with Gemini: {e}")
        raise

def process_chapters_with_gemini(bookname: str, selected_chapters: list, mode: str):
    """
    Extracts text from selected PDF chapters, generates a summary or character analysis
    using Gemini, and returns the result.
    """
    book_dir = ELABORATE_BOOK_DIR / bookname
    if not book_dir.exists():
        raise FileNotFoundError(f"Book directory not found: {book_dir}")

    chapters_info = []
    all_chapters_text = ""

    for chapter_id in selected_chapters:
        match_chapter = re.match(r'.*_cap(\d+)', chapter_id)
        if not match_chapter:
            continue

        chapter_number = match_chapter.group(1)
        pattern = f'cap{chapter_number}*.pdf'

        try:
            chapter_file = next(book_dir.glob(pattern))
        except StopIteration:
            continue

        match_file = re.match(r'cap(\d+)\[(.+?)\]\.pdf', chapter_file.name)
        if not match_file:
            continue

        cap_num = int(match_file.group(1))
        cap_title = match_file.group(2).replace('_', ' ')
        chapter_text = _extract_text_from_pdf(chapter_file)

        chapter_info = {
            'chapter_number': cap_num,
            'chapter_title': cap_title,
            'filename': chapter_file.name,
            'text': chapter_text
        }
        chapters_info.append(chapter_info)
        all_chapters_text += f"\n\n=== CAPITOLO {cap_num}: {cap_title} ===\n\n{chapter_text}"

    chapters_info.sort(key=lambda x: x['chapter_number'])

    if not all_chapters_text.strip():
        summary = "No chapter content found for generation."
    else:
        summary = _generate_with_gemini(all_chapters_text, mode)

    return {
        'status': 'success',
        'bookname': bookname,
        'chapters': chapters_info,
        'gemini_summary': summary,
    }