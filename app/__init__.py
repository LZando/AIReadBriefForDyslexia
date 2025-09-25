from flask import Flask
from .config import Config

def create_app():
    """
    Creates and configures a Flask application instance.
    """
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize directories and other app-level setups
    Config.init_app(app)

    # Register blueprints
    from .routes.main_routes import main_bp
    from .routes.library_routes import library_bp
    from .routes.book_routes import book_bp

    app.register_blueprint(main_bp)
    app.register_blueprint(library_bp)
    app.register_blueprint(book_bp)

    # Register error handlers
    from .utils.error_handlers import register_error_handlers
    register_error_handlers(app)

    return app