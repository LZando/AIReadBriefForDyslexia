import os
import sys
import json
import fitz

def _pdf_path(bookname: str) -> str:
    return os.path.join("bookstore", "booktemp", f"{bookname}.pdf")

def extract_book_info(bookname: str) -> dict:
    pdf_path = _pdf_path(bookname)
    if not os.path.exists(pdf_path):
        return {"status": "error", "message": f"File not found: {pdf_path}"}
    doc = fitz.open(pdf_path)
    try:
        pages = len(doc)
    finally:
        doc.close()
    return {"status": "ok", "bookname": bookname, "pages": pages}

def extract_page_image(bookname: str, page_number: int):
    pdf_path = _pdf_path(bookname)
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"File not found: {pdf_path}")
    output_dir = os.path.join(
        "bookstore", "booktemp", "elaboratebook", "cache", bookname
    )
    os.makedirs(output_dir, exist_ok=True)
    doc = fitz.open(pdf_path)
    try:
        if not 1 <= page_number <= len(doc):
            raise ValueError(
                f"Page number out of range (1-{len(doc)} requested {page_number})"
            )
        page = doc.load_page(page_number - 1)
        pix = page.get_pixmap(dpi=150)
        filename = f"page_{page_number:03d}.png"
        full_path = os.path.join(output_dir, filename)
        pix.save(full_path)
        return filename, full_path
    finally:
        doc.close()

def _get_page_count(bookname: str) -> int:
    info = extract_book_info(bookname)
    if info["status"] != "ok":
        raise FileNotFoundError(info["message"])
    return info["pages"]

if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            raise ValueError("Missing bookname argument")

        bookname = sys.argv[1]

        if len(sys.argv) == 2:
            pages = _get_page_count(bookname)
            print(json.dumps({"status": "ok", "bookname": bookname, "pages": pages}))
            sys.exit(0)

        if len(sys.argv) == 3 and sys.argv[2] != "--all":
            page_number = int(sys.argv[2])
            filename, _ = extract_page_image(bookname, page_number)
            print(
                json.dumps(
                    {"status": "ok", "bookname": bookname, "filename": filename}
                )
            )
            sys.exit(0)

        if len(sys.argv) == 3 and sys.argv[2] == "--all":
            total_pages = _get_page_count(bookname)
            generated = []
            for p in range(1, total_pages + 1):
                filename, _ = extract_page_image(bookname, p)
                generated.append(filename)
            print(
                json.dumps(
                    {
                        "status": "ok",
                        "bookname": bookname,
                        "pages": total_pages,
                        "generated": generated,
                    }
                )
            )
            sys.exit(0)

        raise ValueError("Unrecognised arguments")

    except Exception as exc:
        print(
            json.dumps(
                {
                    "status": "error",
                    "message": str(exc),
                    "bookname": locals().get("bookname"),
                }
            )
        )
        sys.exit(1)
