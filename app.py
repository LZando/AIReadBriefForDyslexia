from flask import Flask, request, jsonify, send_from_directory
import os, sys, json, subprocess, shutil, traceback
from pathlib import Path
from datetime import datetime
from logic.extractor import extract_book_info, extract_page_image

app = Flask(__name__)
book_temp = Path("bookstore") / "booktemp"
@app.route("/")
def index():
    return send_from_directory("frontend", "index.html")


@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory("frontend", filename)


@app.route("/assets/<path:filename>")
def assets_files(filename):
    return send_from_directory("assets", filename)


@app.route("/api/health")
def health():
    return jsonify(
        {"status": "OK", "message": "API is running", "timestamp": str(datetime.utcnow())}
    )


@app.route("/api/cleanup", methods=["POST"])
def cleanup_pending_books():
    try:
        for item in book_temp.iterdir():
            if item.is_file() or item.is_symlink():
                item.unlink()
            elif item.is_dir():
                shutil.rmtree(item)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/library", methods=["GET"])
def get_library():
    try:
        books_dir = Path("bookstore") / "elaboratebook"
        books = []
        if books_dir.exists():
            for item in books_dir.iterdir():
                books.append(
                    {
                        "name": item.name,
                        "id": item.name,
                        "displayName": item.name.replace("_", " ").title(),
                    }
                )
        return jsonify({"success": True, "books": books})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/upload-book", methods=["POST"])
def upload_book():
    try:
        if "book-file" not in request.files:
            return jsonify({"success": False, "error": "No file"}), 400
        file = request.files["book-file"]
        title = request.form.get("title", "").strip()
        author = request.form.get("author", "Unknown Author").strip()
        if not title or file.filename == "":
            return jsonify({"success": False, "error": "Missing title or file"}), 400
        import re

        bookname = re.sub(r"[^a-z0-9_]", "", title.lower().replace(" ", "_"))
        ext = ".pdf" if file.filename.lower().endswith(".pdf") else ".epub"
        book_dir = Path("bookstore") / "booktemp"
        book_dir.mkdir(parents=True, exist_ok=True)
        file_path = book_dir / f"{bookname}{ext}"
        file.save(str(file_path))
        return jsonify(
            {
                "success": True,
                "bookname": bookname,
                "title": title,
                "author": author,
                "path": str(file_path),
            }
        )
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/bookelaboration", methods=["POST"])
def book_elaboration():
    data = request.get_json()
    bookname = data.get("bookname")
    page = data.get("page")
    if not bookname:
        return jsonify({"error": "Bookname required"}), 400
    try:
        if page:
            filename, _ = extract_page_image(bookname, int(page))
            return jsonify({"success": True, "filename": filename})
        info = extract_book_info(bookname)
        if info["status"] != "ok":
            return jsonify({"error": info["message"]}), 500
        return jsonify({"success": True, "pages": info["pages"]})
    except Exception as e:
        app.logger.error(e)
        return jsonify({"error": str(e)}), 500


@app.route("/api/book-image/<bookname>/<int:page_number>")
def book_image(bookname, page_number):
    cache_dir = (
        Path("bookstore") / "booktemp" / "elaboratebook" / "cache" / bookname
    )
    image_filename = f"page_{page_number:03d}.png"
    image_file = cache_dir / image_filename
    try:
        if not image_file.exists():
            extract_page_image(bookname, page_number)
        return send_from_directory(cache_dir, image_filename)
    except Exception as e:
        app.logger.error(e)
        return jsonify({"error": str(e)}), 500


@app.route("/api/analyze-chapter", methods=["POST"])
def analyze_chapter():
    data = request.get_json()
    bookname = data.get("bookname")
    reference_page = data.get("pageNumber")
    if not bookname or not reference_page:
        return jsonify({"success": False, "message": "Missing data"}), 400
    try:
        cmd = [
            sys.executable,
            "logic/chapterlistcreator.py",
            bookname,
            str(reference_page),
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode != 0 or not result.stdout.strip():
            return jsonify({"success": False, "error": result.stderr}), 500
        chapters_data = json.loads(result.stdout)
        if chapters_data.get("status") != "success":
            return jsonify({"success": False, "error": chapters_data.get("message")}), 500
        return jsonify({"success": True, **chapters_data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/book-chapters/<bookname>", methods=["GET"])
def get_book_chapters(bookname):
    try:
        book_dir = Path("bookstore") / "elaboratebook" / bookname
        chapters = []
        if book_dir.exists():
            import re

            for pdf_file in book_dir.glob("cap*.pdf"):
                match = re.match(r"cap(\d+)\[(.+)\]", pdf_file.stem)
                if match:
                    chapters.append(
                        {
                            "number": int(match.group(1)),
                            "title": match.group(2).replace("_", " "),
                            "filename": pdf_file.name,
                            "id": f"{bookname}_cap{match.group(1)}",
                        }
                    )
            chapters.sort(key=lambda x: x["number"])
        return jsonify({"success": True, "bookname": bookname, "chapters": chapters})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/gemini-generation", methods=["POST"])
def gemini_generation():
    try:
        data = request.get_json()
        bookname = data.get("bookname")
        selected = data.get("selectedChapters", [])
        if not bookname or not selected:
            return jsonify({"success": False, "error": "Missing data"}), 400
        if not os.environ.get("GEMINI_API_KEY"):
            return jsonify({"success": False, "error": "Missing API key"}), 500
        chapters_json = json.dumps(selected)
        env = os.environ.copy()
        result = subprocess.run(
            [sys.executable, "logic/gemini_generation.py", bookname, chapters_json],
            capture_output=True,
            text=True,
            check=True,
            env=env,
        )
        generation_data = json.loads(result.stdout.strip())
        if generation_data.get("status") == "error":
            return jsonify({"success": False, "error": generation_data.get("message")}), 500
        return jsonify({"success": True, "data": generation_data})
    except subprocess.CalledProcessError as e:
        return jsonify({"success": False, "error": e.stderr}), 500
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/chapter-file/<bookname>/<filename>")
def serve_chapter_file(bookname, filename):
    try:
        chapter_dir = Path("bookstore") / "elaboratebook" / bookname
        if not (chapter_dir / filename).exists():
            return jsonify({"error": "Not found"}), 404
        return send_from_directory(chapter_dir, filename)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/save-chapters", methods=["POST"])
def save_chapters():
    data = request.get_json()
    print(data)
    bookname = data.get("bookname")
    chapters_data = data.get("chapters")
    try:
        temp_dir = Path("temp")
        temp_dir.mkdir(exist_ok=True)
        temp_file = temp_dir / f"{bookname}_chapters.json"
        with open(temp_file, "w", encoding="utf-8") as f:
            json.dump(chapters_data, f, ensure_ascii=False, indent=2)
        result = subprocess.run(
            [sys.executable, "logic/pdf_splitter.py", bookname, str(temp_file)],
            capture_output=True,
            text=True,
            check=True,
        )
        temp_file.unlink()
        split_result = json.loads(result.stdout.strip())
        if split_result.get("status") == "error":
            return jsonify({"success": False, "error": split_result.get("message")}), 500
        return jsonify({"success": True, **split_result})
    except subprocess.CalledProcessError as e:
        return jsonify({"success": False, "error": e.stderr}), 500
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
