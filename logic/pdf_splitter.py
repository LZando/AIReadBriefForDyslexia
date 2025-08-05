import sys, os, json, fitz
from pathlib import Path


def split_pdf_into_chapters(bookname, chapters_data):
    try:
        pdf_path   = Path("bookstore") / "booktemp"     / f"{bookname}.pdf"
        output_dir = Path("bookstore") / "elaboratebook" /  bookname

        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF not found: {pdf_path}")

        output_dir.mkdir(parents=True, exist_ok=True)
        doc = fitz.open(pdf_path)

        created = []
        for ch in chapters_data.get("chapters", []):
            n, title = ch["chapterNumber"], ch["title"]
            start, end = ch["startPage"] - 1, ch["endPage"] - 1   # 0-based
            clean = "".join(c for c in title if c.isalnum() or c in " -_").strip().replace(" ", "_")
            chapter_doc = fitz.open()
            for p in range(start, end + 1):
                if p < len(doc):
                    chapter_doc.insert_pdf(doc, from_page=p, to_page=p)
            filename = f"cap{n}[{clean}].pdf"
            chapter_path = output_dir / filename
            chapter_doc.save(chapter_path)
            chapter_doc.close()
            created.append({
                "chapterNumber": n,
                "title": title,
                "filename": filename,
                "path": str(chapter_path),
                "startPage": ch["startPage"],
                "endPage":   ch["endPage"],
                "pageCount": ch["pageCount"],
            })

        doc.close()
        return {
            "status": "success",
            "bookname": bookname,
            "outputDirectory": str(output_dir),
            "totalChapters": len(created),
            "createdFiles": created,
            "message": f"PDF split into {len(created)} chapters",
        }

    except Exception as e:
        return {"status": "error", "message": str(e), "bookname": bookname}


def main():
    if len(sys.argv) != 3:
        print(json.dumps({"status": "error",
                          "message": "Usage: pdf_splitter.py <bookname> <chapters_json>"}))
        sys.exit(1)

    bookname, chapters_json_file = sys.argv[1:3]

    try:
        with open(chapters_json_file, encoding="utf-8") as f:
            chapters_data = json.load(f)
    except FileNotFoundError:
        print(json.dumps({"status": "error", "message": "Chapters JSON not found"}))
        sys.exit(1)
    except json.JSONDecodeError:
        print(json.dumps({"status": "error", "message": "Invalid JSON"}))
        sys.exit(1)

    result = split_pdf_into_chapters(bookname, chapters_data)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    sys.exit(0 if result["status"] == "success" else 1)

if __name__ == "__main__":
    main()
