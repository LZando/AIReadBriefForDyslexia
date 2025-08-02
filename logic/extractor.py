import sys
import os
import json
import fitz

def main():
    bookname = sys.argv[1]
    pdf_path = os.path.join('bookstore', f'{bookname}.pdf')

    if not os.path.exists(pdf_path):
        print(json.dumps({"status": "error", "message": f"File non trovato: {pdf_path}"}))
        sys.exit(1)

    try:
        doc = fitz.open(pdf_path)
        num_pages = len(doc)

        # Estrazione singola pagina se argomento è presente
        if len(sys.argv) == 3:
            page_number = int(sys.argv[2])
            if page_number < 1 or page_number > num_pages:
                raise ValueError("Numero pagina fuori range")

            filename = pictureExtractor(pdf_path, bookname, page_number)
            print(json.dumps({
                "status": "ok",
                "filename": filename,
                "bookname": bookname
            }))
        else:
            # Elaborazione completa
            print(json.dumps({
                "status": "ok",
                "pages": num_pages,
                "bookname": bookname
            }))


    except Exception as e:
        print(json.dumps({
            "status": "error",
            "message": str(e),
            "bookname": bookname
        }))
        sys.exit(1)
    finally:
        if 'doc' in locals():
            doc.close()


def pictureExtractor(pdf_path, bookname, page_number):
    output_dir = os.path.join("bookstore", "elaboratebook", "cache", bookname)
    os.makedirs(output_dir, exist_ok=True)

    doc = fitz.open(pdf_path)
    pagina = doc.load_page(page_number - 1)
    immagine = pagina.get_pixmap(dpi=150)
    filename = f"page_{page_number:03d}.png"
    output_path = os.path.join(output_dir, filename)
    immagine.save(output_path)
    doc.close()
    return filename


if __name__ == "__main__":
    main()
