import sys
import json
import fitz
from pathlib import Path
from collections import Counter

def find_max_font(page):
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
    common_font = Counter(fonts_with_max_size).most_common(1)[0][0]
    return common_font, max_size


def find_chapter_pages(pdf_path, target_font, target_size):
    doc = fitz.open(pdf_path)
    found_pages, found_titles = [], []
    for i in range(len(doc)):
        page = doc.load_page(i)
        content = page.get_text("dict")
        for block in content["blocks"]:
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    if span["text"].strip() and span["font"] == target_font and span["size"] == target_size:
                        found_pages.append(i + 1)
                        found_titles.append(span["text"].strip())
                        break
                else:
                    continue
                break
            else:
                continue
            break
    doc.close()
    return found_pages, found_titles


def extract_chapters(bookname, reference_page):
    try:
        pdf_path = Path("bookstore") / "booktemp" / f"{bookname}.pdf"
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF not found: {pdf_path}")

        doc = fitz.open(str(pdf_path))
        if reference_page < 1 or reference_page > len(doc):
            raise ValueError(f"Reference page {reference_page} out of range (1-{len(doc)})")

        font_hugger, size_hugger = find_max_font(doc.load_page(reference_page - 1))
        if not font_hugger:
            raise ValueError("No valid font found on reference page")

        chapter_pages, chapter_titles = find_chapter_pages(str(pdf_path), font_hugger, size_hugger)

        chapters = []
        for i, (page, title) in enumerate(zip(chapter_pages, chapter_titles)):
            end_page = chapter_pages[i + 1] - 1 if i + 1 < len(chapter_pages) else len(doc)
            chapters.append(
                {
                    "chapterNumber": i + 1,
                    "title": title,
                    "startPage": page,
                    "endPage": end_page,
                    "pageCount": end_page - page + 1,
                }
            )
        doc.close()
        return {
            "status": "success",
            "bookname": bookname,
            "referencePage": reference_page,
            "detectedFont": font_hugger,
            "detectedSize": size_hugger,
            "totalChapters": len(chapters),
            "chapters": chapters,
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "bookname": bookname,
            "referencePage": reference_page,
        }


def main():
    if len(sys.argv) != 3:
        print(
            json.dumps(
                {
                    "status": "error",
                    "message": "Usage: python chapterlistcreator.py <bookname> <reference_page>",
                }
            )
        )
        sys.exit(1)

    bookname = sys.argv[1]
    try:
        reference_page = int(sys.argv[2])
    except ValueError:
        print(json.dumps({"status": "error", "message": "Reference page must be an integer"}))
        sys.exit(1)

    result = extract_chapters(bookname, reference_page)

    print(json.dumps(result))
    sys.exit(0 if result["status"] == "success" else 1)


if __name__ == "__main__":
    main()
