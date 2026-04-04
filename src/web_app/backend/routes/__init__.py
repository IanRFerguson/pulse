from flask import Blueprint

bp = Blueprint("api", __name__, url_prefix="/api")

from . import api  # noqa: E402, F401  # registers routes onto bp
