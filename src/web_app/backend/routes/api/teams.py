import uuid as uuid_mod

from flask import jsonify
from sqlalchemy import text

from ...config import FlaskConfig
from ...mock_data import MOCK_TEAM_MEMBERS, MOCK_TEAMS
from ...models import Team, TeamMember, db
from . import bp

#####


@bp.route("/teams")
def list_teams():
    """Endpoint to list all teams."""

    if FlaskConfig.DEMO_MODE:
        return jsonify(MOCK_TEAMS)

    resp = db.session.query(Team).all()
    return jsonify([{"id": str(r.id), "name": r.name} for r in resp])


@bp.route("/team-members")
def list_team_members():
    """Endpoint to list all team members."""

    if FlaskConfig.DEMO_MODE:
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
                " freshdesk_data,"
                " active_sprint_points"
                " FROM dbt_dev.ic_metrics"
                " ORDER BY team_name, user_name"
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


@bp.route("/teams/<team_id>/members")
def list_team_members_by_team(team_id: str):
    """Endpoint to list team members for a specific team."""

    if FlaskConfig.DEMO_MODE:
        team = next((t for t in MOCK_TEAMS if t["id"] == team_id), None)
        if team is None:
            return jsonify({"error": "Team not found"}), 404
        members = [
            {"id": m["id"], "name": m["username"]}
            for m in MOCK_TEAM_MEMBERS
            if m["team"] == team["name"]
        ]
        return jsonify(members)

    try:
        team_uuid = uuid_mod.UUID(team_id)
    except ValueError:
        return jsonify({"error": "Invalid team_id"}), 400

    team = db.session.get(Team, team_uuid)
    if team is None:
        return jsonify({"error": "Team not found"}), 404

    members = (
        db.session.query(TeamMember)
        .filter(TeamMember.team_id == team_uuid, TeamMember.active.is_(True))
        .order_by(TeamMember.user_name)
        .all()
    )
    return jsonify([{"id": str(m.id), "name": m.user_name} for m in members])


@bp.route("/team-members/<member_id>")
def get_team_member(member_id: str):
    """Endpoint to retrieve details for a specific team member."""

    if FlaskConfig.DEMO_MODE:
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
                " freshdesk_data,"
                " active_sprint_points"
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
