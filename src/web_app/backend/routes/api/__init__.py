import os

from flask import Blueprint

bp = Blueprint("api", __name__, url_prefix="/api")

DEMO_MODE = os.environ.get("DEMO_MODE", "").lower() in ("1", "true", "yes")

from . import create, general, metrics, teams  # noqa: F401
