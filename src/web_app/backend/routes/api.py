import os
import uuid as uuid_mod

from flask import jsonify, request
from sqlalchemy import select, text

from common import metrics_logger

from ..config import load_theme
from ..mock_data import MOCK_TEAM_MEMBERS, MOCK_TEAMS
from ..models import Team, TeamMember, User, db
from . import bp

DEMO_MODE = os.environ.get("DEMO_MODE", "").lower() in ("1", "true", "yes")

#####


@bp.route("/config")
def get_config():
    """Endpoint to retrieve application configuration, including theme settings."""
    return jsonify(load_theme())


@bp.route("/teams")
def list_teams():
    """Endpoint to list all teams."""

    if DEMO_MODE:
        return jsonify(MOCK_TEAMS)

    rows = (
        db.session.execute(
            text(
                "SELECT DISTINCT team_id, team_name"
                " FROM dbt_dev.ic_metrics"
                " ORDER BY team_name"
            )
        )
        .mappings()
        .all()
    )
    return jsonify([{"id": str(r["team_id"]), "name": r["team_name"]} for r in rows])


@bp.route("/team-members")
def list_team_members():
    """Endpoint to list all team members."""

    if DEMO_MODE:
        return jsonify(MOCK_TEAM_MEMBERS)

    rows = (
        db.session.execute(
            text(
                "SELECT"
                " team_member_id AS id,"
                " user_name AS username,"
                " team_name AS team,"
                " github_data,"
                " asana_data,"
                " freshdesk_data"
                " FROM dbt_dev.ic_metrics"
            )
        )
        .mappings()
        .all()
    )

    result = []
    for row in rows:
        d = dict(row)
        d["id"] = str(d["id"])
        result.append(d)

    return jsonify(result)


@bp.route("/team-members/<member_id>")
def get_team_member(member_id: str):
    """Endpoint to retrieve details for a specific team member."""

    if DEMO_MODE:
        match = next((m for m in MOCK_TEAM_MEMBERS if m["id"] == member_id), None)
        if match is None:
            return jsonify({"error": "Team member not found"}), 404
        return jsonify(match)

    try:
        uid = uuid_mod.UUID(member_id)
    except ValueError:
        return jsonify({"error": "Invalid member ID"}), 400

    row = (
        db.session.execute(
            text(
                "SELECT"
                " team_member_id AS id,"
                " user_name AS username,"
                " team_name AS team,"
                " github_data,"
                " asana_data,"
                " freshdesk_data"
                " FROM dbt_dev.ic_metrics"
                " WHERE team_member_id = :id"
            ),
            {"id": str(uid)},
        )
        .mappings()
        .first()
    )

    if row is None:
        return jsonify({"error": "Team member not found"}), 404

    d = dict(row)
    d["id"] = str(d["id"])
    return jsonify(d)


@bp.route("/team-members", methods=["POST"])
def create_team_member():
    """Endpoint to create a new team member and associate them with a team."""

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    for field in ("username", "email", "team_id"):
        if not data.get(field):
            return jsonify({"error": f"Missing required field: {field}"}), 400

    try:
        team_uuid = uuid_mod.UUID(data["team_id"])
    except ValueError:
        return jsonify({"error": "Invalid team_id"}), 400

    team = db.session.get(Team, team_uuid)
    if team is None:
        return jsonify({"error": "Team not found"}), 404

    existing_user = db.session.execute(
        select(User).where(User.email == data["email"])
    ).scalar_one_or_none()

    if existing_user:
        user = existing_user
    else:
        user = User(username=data["username"], email=data["email"])
        db.session.add(user)
        db.session.flush()

    member = TeamMember(
        user_id=user.id,
        team_id=team.id,
        github_fk=data.get("github_username") or None,
        asana_fk=data.get("asana_id") or None,
        freshdesk_fk=data.get("freshdesk_agent") or None,
    )
    db.session.add(member)
    db.session.commit()

    return (
        jsonify(
            {
                "id": str(member.id),
                "username": user.username,
                "email": user.email,
                "team": team.name,
            }
        ),
        201,
    )
