from flask import Blueprint, send_from_directory, jsonify
from pathlib import Path
import shutil

main_bp = Blueprint('main_bp', __name__)

APP_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = APP_DIR.parent / "frontend"
ASSETS_DIR = APP_DIR.parent / "assets"
BOOK_TEMP_DIR = Path("bookstore") / "booktemp"

@main_bp.route("/")
def index():
    return send_from_directory(FRONTEND_DIR, "index.html")

@main_bp.route("/<path:filename>")
def static_files(filename):
    return send_from_directory(FRONTEND_DIR, filename)

@main_bp.route("/assets/<path:filename>")
def assets_files(filename):
    return send_from_directory(ASSETS_DIR, filename)

@main_bp.route("/api/health")
def health():
    from datetime import datetime
    return jsonify({
        "status": "OK",
        "message": "API is running",
        "timestamp": str(datetime.utcnow())
    })

@main_bp.route("/api/cleanup", methods=["POST"])
def cleanup_pending_books():
    try:
        if BOOK_TEMP_DIR.exists():
            for item in BOOK_TEMP_DIR.iterdir():
                if item.is_file() or item.is_symlink():
                    item.unlink()
                elif item.is_dir():
                    shutil.rmtree(item)
        return jsonify({"success": True, "message": "Temporary files cleaned up."})
    except Exception as e:
        # In a real app, log the error e
        return jsonify({"success": False, "error": "Failed to clean up temporary files."}), 500