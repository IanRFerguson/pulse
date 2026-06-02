import datetime
import os
import uuid as uuid_mod

from flask import jsonify, request
from sqlalchemy import text

from common import metrics_logger

from ..config import load_theme
from ..mock_data import MOCK_TEAM_MEMBERS, MOCK_TEAMS
from ..models import MaintenanceShift, SprintPeriod, Team, TeamMember, db
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

    resp = db.session.query(Team).all()
    return jsonify([{"id": str(r.id), "name": r.name} for r in resp])


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

    if DEMO_MODE:
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


@bp.route("/create-team-member", methods=["POST"])
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

    member = TeamMember(
        user_name=data["username"],
        team_id=team.id,
        github_fk=data.get("github_username") or None,
        asana_fk=data.get("asana_id") or None,
        freshdesk_fk=data.get("freshdesk_agent") or None,
    )
    metrics_logger.info(f"Adding team member {member.user_name} to team {team.name}...")
    db.session.add(member)
    db.session.commit()
    metrics_logger.info("Success")

    return (
        jsonify(
            {
                "member_id": str(member.id),
                "team_id": str(team.id),
                "username": member.user_name,
            }
        ),
        201,
    )


@bp.route("/create-team", methods=["POST"])
def create_team():
    """Endpoint to create a new team."""

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    if not data.get("name"):
        return jsonify({"error": "Missing required field: name"}), 400

    team = Team(name=data["name"])
    metrics_logger.info(f"Creating team {team.name}...")
    db.session.add(team)
    db.session.commit()
    metrics_logger.info("Success")

    return jsonify({"team_id": str(team.id), "name": team.name}), 201


@bp.route("/create-maintenance-shift", methods=["POST"])
def create_maintenance_shift():
    """Endpoint to create a new maintenance shift."""

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    for field in ("team_member_id", "start_time", "end_time"):
        if not data.get(field):
            return jsonify({"error": f"Missing required field: {field}"}), 400

    try:
        team_member_uuid = uuid_mod.UUID(data["team_member_id"])
    except ValueError:
        return jsonify({"error": "Invalid team_member_id"}), 400

    metrics_logger.debug(f"Looking up team member with ID {team_member_uuid}...")
    team_member = db.session.get(TeamMember, team_member_uuid)
    if team_member is None:
        return jsonify({"error": "Team member not found"}), 404

    try:
        start_date = data["start_date"]
        end_date = data["end_date"]
    except ValueError:
        return jsonify({"error": "Invalid date format"}), 400

    shift = MaintenanceShift(
        team_member_id=team_member.id,
        start_date=start_date,
        end_date=end_date,
    )
    db.session.add(shift)
    db.session.commit()

    metrics_logger.info(
        f"Created maintenance shift for {team_member.user_name} from {start_date} to {end_date}"
    )

    return (
        jsonify(
            {
                "team_member_id": str(shift.team_member_id),
                "start_date": start_date,
                "end_date": end_date,
            }
        ),
        201,
    )


@bp.route("/create-sprint", methods=["POST"])
def create_sprint():
    """Endpoint to create a new sprint period."""

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    for field in ("team_id", "start_date", "end_date"):
        if not data.get(field):
            return jsonify({"error": f"Missing required field: {field}"}), 400

    try:
        team_uuid = uuid_mod.UUID(data["team_id"])
    except ValueError:
        return jsonify({"error": "Invalid team_id"}), 400

    team = db.session.get(Team, team_uuid)
    if team is None:
        return jsonify({"error": "Team not found"}), 404

    try:
        start_date = data["start_date"]
        end_date = data["end_date"]
    except ValueError:
        return jsonify({"error": "Invalid date format"}), 400

    sprint = SprintPeriod(
        team_id=team.id,
        friendly_name=data["friendly_name"],
        start_date=start_date,
        end_date=end_date,
    )
    db.session.add(sprint)
    db.session.commit()

    metrics_logger.info(
        f"Created sprint '{sprint.friendly_name}' for team {team.name} from {start_date} to {end_date}"
    )

    return (
        jsonify(
            {
                "id": str(sprint.id),
                "team_id": str(sprint.team_id),
                "friendly_name": sprint.friendly_name,
                "start_date": start_date,
                "end_date": end_date,
            }
        ),
        201,
    )


@bp.route("/maintenance-metrics")
def get_maintenance_metrics():
    """Endpoint to retrieve maintenance performance metrics from dbt model."""

    rows = (
        db.session.execute(
            text(
                "SELECT"
                " shift_id,"
                " team_member_id,"
                " user_name,"
                " start_date,"
                " end_date,"
                " inherited_ticket_count,"
                " opened_during_shift_count,"
                " closed_during_shift_count,"
                " passed_off_ticket_count"
                " FROM dbt_dev_intermediate.int__maintenance_performance"
                " ORDER BY start_date DESC, user_name"
            )
        )
        .mappings()
        .all()
    )

    result = []
    for row in rows:
        d = dict(row)
        d["shift_id"] = str(d["shift_id"])
        d["team_member_id"] = str(d["team_member_id"])
        result.append(d)

    return jsonify(result)


@bp.route("/sprint-metrics")
def get_sprint_metrics():
    """Endpoint to retrieve sprint performance metrics from dbt model."""

    rows = (
        db.session.execute(
            text(
                "SELECT"
                " sprint_period_id,"
                " team_id,"
                " team_name,"
                " user_name,"
                " sprint_period_name,"
                " start_date,"
                " end_date,"
                " total_sprint_points,"
                " total_tasks_assigned,"
                " average_points_per_task"
                " FROM dbt_dev_intermediate.int__sprint_performance"
                " ORDER BY start_date DESC, team_name, user_name"
            )
        )
        .mappings()
        .all()
    )

    result = []
    for row in rows:
        d = dict(row)
        d["sprint_period_id"] = str(d["sprint_period_id"])
        d["team_id"] = str(d["team_id"])
        result.append(d)

    return jsonify(result)
