from flask import Blueprint, request, jsonify, send_from_directory
from pathlib import Path
import json

from app.services.book_service import extract_book_info, extract_page_image
from app.services.chapter_service import extract_chapters
from app.services.pdf_service import split_pdf_into_chapters
from app.services.gemini_service import process_chapters_with_gemini

book_bp = Blueprint('book_bp', __name__)

ELABORATE_BOOK_DIR = Path("bookstore") / "elaboratebook"
BOOK_TEMP_DIR = Path("bookstore") / "booktemp"

@book_bp.route("/api/bookelaboration", methods=["POST"])
def book_elaboration():
    data = request.get_json()
    bookname = data.get("bookname")
    page = data.get("page")

    if not bookname:
        return jsonify({"error": "Bookname is required"}), 400

    try:
        if page:
            filename, _ = extract_page_image(bookname, int(page))
            return jsonify({"success": True, "filename": filename})

        info = extract_book_info(bookname)
        if info["status"] != "ok":
            return jsonify({"error": info["message"]}), 500

        return jsonify({"success": True, "pages": info["pages"]})
    except (ValueError, FileNotFoundError) as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@book_bp.route("/api/book-image/<bookname>/<int:page_number>")
def book_image(bookname, page_number):
    try:
        cache_dir = BOOK_TEMP_DIR / "cache" / bookname
        image_filename, _ = extract_page_image(bookname, page_number)
        return send_from_directory(cache_dir, image_filename)
    except FileNotFoundError:
        return jsonify({"error": "Image not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@book_bp.route("/api/analyze-chapter", methods=["POST"])
def analyze_chapter():
    data = request.get_json()
    bookname = data.get("bookname")
    reference_page = data.get("pageNumber")

    if not bookname or not reference_page:
        return jsonify({"success": False, "message": "Bookname and pageNumber are required"}), 400

    try:
        result = extract_chapters(bookname, int(reference_page))
        if result.get("status") != "success":
            return jsonify({"success": False, "error": result.get("message")}), 500
        return jsonify({"success": True, **result})
    except (ValueError, FileNotFoundError) as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@book_bp.route("/api/save-chapters", methods=["POST"])
def save_chapters_route():
    data = request.get_json()
    bookname = data.get("bookname")
    chapters_data = data.get("chapters")

    if not bookname or not chapters_data:
        return jsonify({"success": False, "error": "Missing bookname or chapters data"}), 400

    try:
        # The chapters_data is already a dict, no need to write to a temp file
        result = split_pdf_into_chapters(bookname, {"chapters": chapters_data})
        if result.get("status") != "success":
            return jsonify({"success": False, "error": result.get("message")}), 500
        return jsonify({"success": True, **result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@book_bp.route("/api/gemini-generation", methods=["POST"])
def gemini_generation_route():
    data = request.get_json()
    bookname = data.get("bookname")
    selected_chapters = data.get("selectedChapters", [])
    mode = data.get("mode", "Summarization")

    if not bookname or not selected_chapters:
        return jsonify({"success": False, "error": "Missing bookname or selectedChapters"}), 400

    try:
        result = process_chapters_with_gemini(bookname, selected_chapters, mode)
        if result.get("status") != "success":
            return jsonify({"success": False, "error": result.get("message")}), 500
        return jsonify({"success": True, "data": result})
    except ValueError as e: # For missing API key
        return jsonify({"success": False, "error": str(e)}), 500
    except Exception as e:
        return jsonify({"success": False, "error": f"An unexpected error occurred: {e}"}), 500

@book_bp.route("/api/book-chapters/<bookname>", methods=["GET"])
def get_book_chapters(bookname):
    book_dir = ELABORATE_BOOK_DIR / bookname
    if not book_dir.exists():
        return jsonify({"success": True, "bookname": bookname, "chapters": []})

    chapters = []
    import re
    for pdf_file in sorted(book_dir.glob("cap*.pdf")):
        match = re.match(r"cap(\d+)\[(.*?)\]\.pdf", pdf_file.name)
        if match:
            chapter_number = int(match.group(1))
            chapter_title = match.group(2).replace("_", " ")
            chapters.append({
                "number": chapter_number,
                "title": chapter_title,
                "filename": pdf_file.name,
                "id": f"{bookname}_cap{chapter_number}",
                "description": f"Chapter {chapter_number}: {chapter_title}"
            })

    return jsonify({"success": True, "bookname": bookname, "chapters": chapters})

@book_bp.route("/api/chapter-file/<bookname>/<filename>")
def serve_chapter_file(bookname, filename):
    # Basic sanitization
    safe_bookname = re.sub(r'[^a-zA-Z0-9_-]', '', bookname)
    safe_filename = re.sub(r'[^a-zA-Z0-9_\[\]\.-]', '', filename)

    if not safe_bookname == bookname or not safe_filename == filename:
        return jsonify({"error": "Invalid characters in bookname or filename"}), 400

    chapter_dir = ELABORATE_BOOK_DIR / safe_bookname
    if not (chapter_dir / safe_filename).exists():
        return jsonify({"error": "File not found"}), 404

    return send_from_directory(chapter_dir, safe_filename)