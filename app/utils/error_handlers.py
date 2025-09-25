from flask import jsonify

def register_error_handlers(app):
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({"success": False, "error": "Bad Request"}), 400

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"success": False, "error": "Not Found"}), 404

    @app.errorhandler(500)
    def internal_server_error(error):
        # In a real app, you would log the error details
        return jsonify({"success": False, "error": "Internal Server Error"}), 500

    # Generic handler for other exceptions
    @app.errorhandler(Exception)
    def unhandled_exception(e):
        # Log the exception e
        return jsonify({"success": False, "error": "An unexpected error occurred."}), 500