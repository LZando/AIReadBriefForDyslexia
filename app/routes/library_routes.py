from flask import Blueprint, request, jsonify
from pathlib import Path
import shutil
import re

library_bp = Blueprint('library_bp', __name__)

ELABORATE_BOOK_DIR = Path("bookstore") / "elaboratebook"
BOOK_TEMP_DIR = Path("bookstore") / "booktemp"

@library_bp.route("/api/library", methods=["GET"])
def get_library():
    books = []
    if ELABORATE_BOOK_DIR.exists():
        for item in ELABORATE_BOOK_DIR.iterdir():
            if item.is_dir():
                display_name = item.name.replace("_", " ").title()
                books.append({
                    "name": item.name,
                    "id": item.name,
                    "displayName": display_name,
                    "description": f"Processed book: {display_name}"
                })
    return jsonify({"success": True, "books": books})

@library_bp.route("/api/library/<book_id>", methods=["DELETE"])
def delete_book(book_id):
    # Basic sanitization
    safe_book_id = re.sub(r'[^a-zA-Z0-9_-]', '', book_id)
    if not safe_book_id == book_id:
        return jsonify({"success": False, "error": "Invalid book ID format."}), 400

    book_path = ELABORATE_BOOK_DIR / safe_book_id

    if not book_path.exists() or not book_path.is_dir():
        return jsonify({"success": False, "error": "Book not found"}), 404

    try:
        shutil.rmtree(book_path)
        return jsonify({"success": True, "message": "Book deleted successfully"})
    except Exception as e:
        # Log error e
        return jsonify({"success": False, "error": "Failed to delete book"}), 500

@library_bp.route("/api/upload-book", methods=["POST"])
def upload_book():
    if "book-file" not in request.files:
        return jsonify({"success": False, "error": "No file part"}), 400

    file = request.files["book-file"]
    title = request.form.get("title", "").strip()

    if not title or not file.filename:
        return jsonify({"success": False, "error": "Missing title or file"}), 400

    # Sanitize title to create a safe bookname
    bookname = re.sub(r"[^a-z0-9_]", "", title.lower().replace(" ", "_"))

    # Ensure the temporary directory exists
    BOOK_TEMP_DIR.mkdir(parents=True, exist_ok=True)

    file_path = BOOK_TEMP_DIR / f"{bookname}.pdf"

    try:
        file.save(str(file_path))
        return jsonify({
            "success": True,
            "bookname": bookname,
            "title": title,
            "author": request.form.get("author", "Unknown Author").strip(),
        })
    except Exception as e:
        # Log error e
        return jsonify({"success": False, "error": "Failed to save uploaded file."}), 500