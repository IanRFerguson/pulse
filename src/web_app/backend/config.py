import os
from dataclasses import dataclass

#####

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
