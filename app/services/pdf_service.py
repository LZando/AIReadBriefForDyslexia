import fitz
from pathlib import Path

BOOK_TEMP_DIR = Path("bookstore") / "booktemp"
ELABORATE_BOOK_DIR = Path("bookstore") / "elaboratebook"

def split_pdf_into_chapters(bookname: str, chapters_data: dict):
    """
    Splits a single PDF into multiple chapter-based PDFs.
    """
    pdf_path = BOOK_TEMP_DIR / f"{bookname}.pdf"
    output_dir = ELABORATE_BOOK_DIR / bookname

    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    output_dir.mkdir(parents=True, exist_ok=True)

    created_files = []
    with fitz.open(pdf_path) as doc:
        for ch in chapters_data.get("chapters", []):
            n = ch["chapterNumber"]
            title = ch["title"]
            start_page = ch["startPage"] - 1  # 0-based index
            end_page = ch["endPage"] - 1      # 0-based index

            # Sanitize title for filename
            clean_title = "".join(c for c in title if c.isalnum() or c in " -_").strip().replace(" ", "_")

            filename = f"cap{n}[{clean_title}].pdf"
            chapter_path = output_dir / filename

            with fitz.open() as chapter_doc:
                chapter_doc.insert_pdf(doc, from_page=start_page, to_page=end_page)
                chapter_doc.save(chapter_path)

            created_files.append({
                "chapterNumber": n,
                "title": title,
                "filename": filename,
                "path": str(chapter_path),
                "pageCount": ch["pageCount"],
            })

    return {
        "status": "success",
        "bookname": bookname,
        "outputDirectory": str(output_dir),
        "totalChapters": len(created_files),
        "createdFiles": created_files,
    }