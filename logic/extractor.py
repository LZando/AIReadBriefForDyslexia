import sys
import os
import fitz


def main():
    if len(sys.argv) < 2:
        print("Nessun bookname fornito", file=sys.stderr)
        sys.exit(1)

    bookname = sys.argv[1]
    pdf_path = os.path.join('bookstore', f'{bookname}.pdf')

    if not os.path.exists(pdf_path):
        print(f"File non trovato: {pdf_path}", file=sys.stderr)
        sys.exit(1)

    try:
        doc = fitz.open(pdf_path)
        num_pages = len(doc)
        print(num_pages)  # numero di pagine

        # Estrai le immagini per tutte le pagine
        pictureExtractor(pdf_path, bookname, num_pages)

    except Exception as e:
        print(f"Errore durante la lettura del PDF: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        if 'doc' in locals():
            doc.close()


def pictureExtractor(pdf_path, bookname, num_pages):
    # Cartella di output più sicura
    output_dir = os.path.join("bookstore", "elaboratebook", "cache", bookname)

    os.makedirs(output_dir, exist_ok=True)

    doc = fitz.open(pdf_path)
    loadpage = 1
    pagina = doc.load_page(loadpage - 1)
    immagine = pagina.get_pixmap(dpi=150)
    filename = f"page_{loadpage:03d}.png"
    output_path = os.path.join(output_dir, filename)
    immagine.save(output_path)



if __name__ == "__main__":
    main()