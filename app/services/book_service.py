import os
import fitz
from pathlib import Path

BOOK_TEMP_DIR = Path("bookstore") / "booktemp"

def get_book_path(bookname: str) -> Path:
    """Constructs the full path for a given book's PDF file."""
    return BOOK_TEMP_DIR / f"{bookname}.pdf"

def extract_book_info(bookname: str) -> dict:
    """
    Extracts the number of pages from a PDF file.
    """
    pdf_path = get_book_path(bookname)
    if not pdf_path.exists():
        return {"status": "error", "message": f"File not found: {pdf_path}"}

    try:
        with fitz.open(pdf_path) as doc:
            pages = len(doc)
    except Exception as e:
        return {"status": "error", "message": str(e)}

    return {"status": "ok", "bookname": bookname, "pages": pages}

def extract_page_image(bookname: str, page_number: int):
    """
    Extracts an image of a specific page from a PDF and saves it.
    """
    pdf_path = get_book_path(bookname)
    if not pdf_path.exists():
        raise FileNotFoundError(f"File not found: {pdf_path}")

    output_dir = BOOK_TEMP_DIR / "cache" / bookname
    output_dir.mkdir(parents=True, exist_ok=True)

    with fitz.open(pdf_path) as doc:
        if not 1 <= page_number <= len(doc):
            raise ValueError(
                f"Page number {page_number} is out of range (1-{len(doc)})"
            )

        page = doc.load_page(page_number - 1)
        pix = page.get_pixmap(dpi=150)

        filename = f"page_{page_number:03d}.png"
        full_path = output_dir / filename
        pix.save(full_path)

        return filename, str(full_path)