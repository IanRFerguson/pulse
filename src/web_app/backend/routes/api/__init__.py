from flask import Blueprint

bp = Blueprint("api", __name__, url_prefix="/api")

from . import create, edit, general, metrics, teams  # noqa: F401
