from flask import jsonify

from ...config import load_theme
from . import bp

#####


@bp.route("/config")
def get_config():
    """Endpoint to retrieve application configuration, including theme settings."""
    return jsonify(load_theme())
