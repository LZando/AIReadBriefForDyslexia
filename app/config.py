from pathlib import Path
import os

class Config:
    """Base configuration."""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'a_default_secret_key')

    # Project root directory
    BASE_DIR = Path(__file__).resolve().parent.parent

    # Path for storing books
    BOOKSTORE_PATH = BASE_DIR / "bookstore"
    BOOK_TEMP_PATH = BOOKSTORE_PATH / "booktemp"
    ELABORATE_BOOK_PATH = BOOKSTORE_PATH / "elaboratebook"

    # Static and frontend files
    FRONTEND_FOLDER = BASE_DIR / 'frontend'
    ASSETS_FOLDER = BASE_DIR / 'assets'

    @staticmethod
    def init_app(app):
        # Create necessary directories if they don't exist
        Config.BOOKSTORE_PATH.mkdir(exist_ok=True)
        Config.BOOK_TEMP_PATH.mkdir(exist_ok=True)
        Config.ELABORATE_BOOK_PATH.mkdir(exist_ok=True)