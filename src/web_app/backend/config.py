import os
from dataclasses import dataclass

import yaml

#####

_THEME_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "theme.yaml")

_DEFAULT_THEME: dict = {
    "company": {"name": "Pulse", "logo_url": None},
    "colors": {
        "primary": "#7c3aed",
        "secondary": "#1e293b",
        "background": "#ffffff",
        "surface": "#f8fafc",
        "border": "#e2e8f0",
        "text": "#334155",
        "text-muted": "#94a3b8",
        "success": "#10b981",
        "warning": "#f59e0b",
        "danger": "#ef4444",
    },
}


def load_theme() -> dict:
    try:
        with open(_THEME_PATH) as f:
            return yaml.safe_load(f) or _DEFAULT_THEME
    except FileNotFoundError:
        return _DEFAULT_THEME


SQLALCHEMY_DATABASE_URI = (
    "{driver}://{username}:{password}@{host}:{port}/{database}".format(
        driver=os.environ["DB_DRIVER"],
        username=os.environ["DB_USERNAME"],
        password=os.environ["DB_PASSWORD"],
        host=os.environ["DB_HOST"],
        port=os.environ["DB_PORT"],
        database=os.environ["DB_NAME"],
    )
)


@dataclass
class FlaskConfig:
    """Configuration for the Flask application."""

    DEBUG: bool = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    TESTING: bool = os.environ.get("FLASK_TESTING", "false").lower() == "true"
    SECRET_KEY: str = os.environ["SECRET_KEY"]
    SQLALCHEMY_DATABASE_URI: str = SQLALCHEMY_DATABASE_URI
