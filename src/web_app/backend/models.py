import uuid

from flask_sqlalchemy import SQLAlchemy

#####

db = SQLAlchemy()


class User(db.Model):
    """Represents a user in the system, and allows login to the app."""

    __tablename__ = "users"

    id = db.Column(db.Uuid, primary_key=True, default=uuid.uuid4)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now(), nullable=False)
    modified_at = db.Column(
        db.DateTime,
        server_default=db.func.now(),
        onupdate=db.func.now(),
        nullable=False,
    )
    last_login_at = db.Column(db.DateTime, nullable=True)

    def __repr__(self):
        return f"<User {self.username}>"


class TeamMember(db.Model):
    """Represents a membership of a user in a team."""

    __tablename__ = "team_members"

    id = db.Column(db.Uuid, primary_key=True, default=uuid.uuid4)
    user_id = db.Column(db.Uuid, db.ForeignKey("users.id"), nullable=False)
    team_id = db.Column(db.Uuid, db.ForeignKey("teams.id"), nullable=False)

    created_at = db.Column(db.DateTime, server_default=db.func.now(), nullable=False)
    modified_at = db.Column(
        db.DateTime,
        server_default=db.func.now(),
        onupdate=db.func.now(),
        nullable=False,
    )

    github_fk = db.Column(db.String(80), nullable=True)
    asana_fk = db.Column(db.String(80), nullable=True)
    freshdesk_fk = db.Column(db.String(80), nullable=True)

    team = db.relationship("Team", backref=db.backref("members", lazy=True))

    def __repr__(self):
        return f"<TeamMember user_id={self.user_id} team_id={self.team_id}>"


class Team(db.Model):
    """Represents a team in the system."""

    __tablename__ = "teams"

    id = db.Column(db.Uuid, primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(80), unique=True, nullable=False)

    def __repr__(self):
        return f"<Team {self.name}>"
