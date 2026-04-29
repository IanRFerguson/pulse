import os
from dataclasses import dataclass

import yaml

from common import metrics_logger

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
    if os.environ.get("DEMO_MODE", "").lower() in ("1", "true", "yes"):
        metrics_logger.warning("DEMO_MODE is enabled - using default theme")
        return _DEFAULT_THEME

    try:
        with open(_THEME_PATH) as f:
            resp = yaml.safe_load(f) or _DEFAULT_THEME
            metrics_logger.info("Using custom config")
            return resp
    except FileNotFoundError:
        metrics_logger.warning("No config YAML found - using defaults")
        return _DEFAULT_THEME


_db_host = os.environ["DB_HOST"]
_db_kwargs = dict(
    driver=os.environ["DB_DRIVER"],
    username=os.environ["DB_USERNAME"],
    password=os.environ["DB_PASSWORD"],
    database=os.environ["DB_NAME"],
)

if _db_host.startswith("/"):
    # Unix socket path — Cloud SQL Auth Proxy via Cloud Run volume mount
    SQLALCHEMY_DATABASE_URI = (
        "{driver}://{username}:{password}@/{database}?host={host}".format(
            host=_db_host, **_db_kwargs
        )
    )
else:
    # TCP connection — local dev or direct host
    SQLALCHEMY_DATABASE_URI = (
        "{driver}://{username}:{password}@{host}:{port}/{database}".format(
            host=_db_host, port=os.environ["DB_PORT"], **_db_kwargs
        )
    )


@dataclass
class FlaskConfig:
    """Configuration for the Flask application."""

    DEBUG: bool = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    TESTING: bool = os.environ.get("FLASK_TESTING", "false").lower() == "true"
    SECRET_KEY: str = os.environ["SECRET_KEY"]
    SQLALCHEMY_DATABASE_URI: str = SQLALCHEMY_DATABASE_URI
