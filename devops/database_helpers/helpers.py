import contextlib

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.web_app.backend.config import SQLALCHEMY_DATABASE_URI
from src.web_app.backend.models import Team, TeamMember, User

#####


@contextlib.contextmanager
def create_db_session(db_url: str = SQLALCHEMY_DATABASE_URI):
    """Context manager for creating a SQLAlchemy session."""

    engine = create_engine(db_url)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        yield session
    finally:
        session.close()
