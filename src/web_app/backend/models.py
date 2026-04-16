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
    user_name = db.Column(db.String(80), nullable=False)
    team_id = db.Column(db.Uuid, db.ForeignKey("teams.id"), nullable=False)

    created_at = db.Column(db.DateTime, server_default=db.func.now(), nullable=False)
    modified_at = db.Column(
        db.DateTime,
        server_default=db.func.now(),
        onupdate=db.func.now(),
        nullable=False,
    )
    active = db.Column(db.Boolean, default=True, nullable=False)

    github_fk = db.Column(db.String(80), nullable=True)
    asana_fk = db.Column(db.String(80), nullable=True)
    freshdesk_fk = db.Column(db.String(80), nullable=True)

    team = db.relationship("Team", backref=db.backref("members", lazy=True))

    def __repr__(self):
        return f"<TeamMember user_name={self.user_name} team_id={self.team_id}>"


class Team(db.Model):
    """Represents a team in the system."""

    __tablename__ = "teams"

    id = db.Column(db.Uuid, primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(80), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now(), nullable=False)
    modified_at = db.Column(
        db.DateTime,
        server_default=db.func.now(),
        onupdate=db.func.now(),
        nullable=False,
    )

    def __repr__(self):
        return f"<Team {self.name}>"


class MaintenanceShift(db.Model):
    """Represents a maintenance shift for a team."""

    __tablename__ = "maintenance_shifts"

    id = db.Column(db.Uuid, primary_key=True, default=uuid.uuid4)
    team_member_id = db.Column(
        db.Uuid, db.ForeignKey("team_members.id"), nullable=False
    )
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)

    team_member = db.relationship(
        "TeamMember", backref=db.backref("maintenance_shifts", lazy=True)
    )

    def __repr__(self):
        return f"<MaintenanceShift team_member_id={self.team_member_id} start_time={self.start_time} end_time={self.end_time}>"
