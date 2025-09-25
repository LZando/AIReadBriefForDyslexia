import fitz
from pathlib import Path
from collections import Counter

BOOK_TEMP_DIR = Path("bookstore") / "booktemp"

def _find_max_font(page):
    """Finds the most common font among the largest text on a page."""
    content = page.get_text("dict")
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
    fonts_with_max_size = [f for _, f, s in spans if s == max_size]

    if not fonts_with_max_size:
        return None, max_size

    common_font = Counter(fonts_with_max_size).most_common(1)[0][0]
    return common_font, max_size

def _find_chapter_pages(pdf_path, target_font, target_size):
    """Finds pages and titles that match the chapter heading font and size."""
    found_pages, found_titles = [], []
    with fitz.open(pdf_path) as doc:
        for i, page in enumerate(doc):
            content = page.get_text("dict")
            for block in content["blocks"]:
                for line in block.get("lines", []):
                    for span in line.get("spans", []):
                        if (
                            span["text"].strip() and
                            span["font"] == target_font and
                            span["size"] == target_size
                        ):
                            found_pages.append(i + 1)
                            found_titles.append(span["text"].strip())
                            break
                    else:
                        continue
                    break
                else:
                    continue
                break
    return found_pages, found_titles

def extract_chapters(bookname: str, reference_page: int):
    """
    Extracts chapter information from a PDF based on font analysis of a reference page.
    """
    pdf_path = BOOK_TEMP_DIR / f"{bookname}.pdf"
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    with fitz.open(pdf_path) as doc:
        if not (1 <= reference_page <= len(doc)):
            raise ValueError(f"Reference page {reference_page} out of range (1-{len(doc)})")

        font_hugger, size_hugger = _find_max_font(doc.load_page(reference_page - 1))
        if not font_hugger:
            raise ValueError("No valid font found on reference page")

        chapter_pages, chapter_titles = _find_chapter_pages(pdf_path, font_hugger, size_hugger)

        chapters = []
        for i, (page, title) in enumerate(zip(chapter_pages, chapter_titles)):
            end_page = chapter_pages[i + 1] - 1 if i + 1 < len(chapter_pages) else len(doc)
            chapters.append({
                "chapterNumber": i + 1,
                "title": title,
                "startPage": page,
                "endPage": end_page,
                "pageCount": end_page - page + 1,
            })

    return {
        "status": "success",
        "bookname": bookname,
        "referencePage": reference_page,
        "detectedFont": font_hugger,
        "detectedSize": size_hugger,
        "totalChapters": len(chapters),
        "chapters": chapters,
    }