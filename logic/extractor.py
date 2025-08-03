import os
import sys
import json
import fitz


def get_page_count(bookname):
    pdf_path = os.path.join('bookstore', 'booktemp', f'{bookname}.pdf')
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"File not found: {pdf_path}")

    doc = fitz.open(pdf_path)
    try:
        return len(doc)
    finally:
        doc.close()


def extract_page_image(bookname, page_number):
    pdf_path = os.path.join('bookstore', 'booktemp', f'{bookname}.pdf')
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    output_dir = os.path.join("bookstore", "booktemp", "elaboratebook", "cache", bookname)
    os.makedirs(output_dir, exist_ok=True)

    doc = fitz.open(pdf_path)
    try:
        total_pages = len(doc)
        if page_number < 1 or page_number > total_pages:
            raise ValueError(f"Page {page_number} out of range (1-{total_pages})")

        page = doc.load_page(page_number - 1)
        image = page.get_pixmap(dpi=150)
        filename = f"page_{page_number:03d}.png"
        output_path = os.path.join(output_dir, filename)
        image.save(output_path)
        
        if not os.path.exists(output_path):
            raise Exception(f"Failed to save image: {output_path}")
            
        return filename, output_path
    finally:
        doc.close()


def extract_book_info(bookname):
    try:
        page_count = get_page_count(bookname)
        return {
            "status": "ok",
            "pages": page_count,
            "bookname": bookname
        }
    except Exception as e:
        return {
            "status": "error", 
            "message": str(e),
            "bookname": bookname
        }


if __name__ == '__main__':
    try:
        if len(sys.argv) < 2:
            raise ValueError("Missing bookname")

        bookname = sys.argv[1]

        if len(sys.argv) == 3 and sys.argv[2] == '--all':
            total_pages = get_page_count(bookname)
            generated = []

            for page_number in range(1, total_pages + 1):
                filename, full_path = extract_page_image(bookname, page_number)
                generated.append(filename)

            print(json.dumps({
                "status": "ok",
                "bookname": bookname,
                "pages": total_pages,
                "generated": generated
            }))
        elif len(sys.argv) == 3:
            page_number = int(sys.argv[2])
            filename, full_path = extract_page_image(bookname, page_number)
            print(json.dumps({
                "status": "ok",
                "bookname": bookname,
                "filename": filename
            }))
        else:
            pages = get_page_count(bookname)
            print(json.dumps({
                "status": "ok",
                "bookname": bookname,
                "pages": pages
            }))

    except Exception as e:
        print(json.dumps({
            "status": "error",
            "message": str(e),
            "bookname": bookname if 'bookname' in locals() else None
        }))
        sys.exit(1)
