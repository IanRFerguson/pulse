import uuid as uuid_mod

from flask import jsonify, request

from common import metrics_logger

from ...config import FlaskConfig
from ...models import (
    MaintenanceShift,
    SprintPeriod,
    Team,
    TeamMember,
    TeamMemberSprint,
    db,
)
from . import bp

#####


@bp.route("/teams/<team_id>", methods=["PUT"])
def update_team(team_id: str):
    if FlaskConfig.DEMO_MODE:
        data = request.get_json(silent=True) or {}
        return jsonify({"id": team_id, "name": data.get("name", "")})

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400
    if not data.get("name"):
        return jsonify({"error": "Missing required field: name"}), 400

    try:
        uid = uuid_mod.UUID(team_id)
    except ValueError:
        return jsonify({"error": "Invalid team_id"}), 400

    team = db.session.get(Team, uid)
    if team is None:
        return jsonify({"error": "Team not found"}), 404

    team.name = data["name"]
    db.session.commit()
    metrics_logger.info(f"Updated team {team_id}: name={team.name}")
    return jsonify({"id": str(team.id), "name": team.name})


@bp.route("/team-members/<member_id>", methods=["PUT"])
def update_team_member(member_id: str):
    if FlaskConfig.DEMO_MODE:
        data = request.get_json(silent=True) or {}
        return jsonify({"id": member_id, "username": data.get("username", "")})

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    for field in ("username", "team_id"):
        if not data.get(field):
            return jsonify({"error": f"Missing required field: {field}"}), 400

    try:
        uid = uuid_mod.UUID(member_id)
        team_uuid = uuid_mod.UUID(data["team_id"])
    except ValueError:
        return jsonify({"error": "Invalid ID"}), 400

    member = db.session.get(TeamMember, uid)
    if member is None:
        return jsonify({"error": "Team member not found"}), 404

    team = db.session.get(Team, team_uuid)
    if team is None:
        return jsonify({"error": "Team not found"}), 404

    member.user_name = data["username"]
    member.team_id = team.id
    member.github_fk = data.get("github_username") or None
    member.asana_fk = data.get("asana_id") or None
    member.freshdesk_fk = data.get("freshdesk_agent") or None
    db.session.commit()
    metrics_logger.info(f"Updated team member {member_id}: username={member.user_name}")
    return jsonify({"id": str(member.id), "username": member.user_name})


@bp.route("/sprints/<sprint_id>", methods=["PUT"])
def update_sprint(sprint_id: str):
    if FlaskConfig.DEMO_MODE:
        return jsonify({"id": sprint_id})

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    for field in ("team_id", "start_date", "end_date"):
        if not data.get(field):
            return jsonify({"error": f"Missing required field: {field}"}), 400

    try:
        uid = uuid_mod.UUID(sprint_id)
        team_uuid = uuid_mod.UUID(data["team_id"])
    except ValueError:
        return jsonify({"error": "Invalid ID"}), 400

    sprint = db.session.get(SprintPeriod, uid)
    if sprint is None:
        return jsonify({"error": "Sprint not found"}), 404

    team = db.session.get(Team, team_uuid)
    if team is None:
        return jsonify({"error": "Team not found"}), 404

    sprint.team_id = team.id
    sprint.friendly_name = data.get("friendly_name") or None
    sprint.start_date = data["start_date"]
    sprint.end_date = data["end_date"]
    db.session.commit()
    metrics_logger.info(f"Updated sprint {sprint_id}")
    return jsonify({"id": str(sprint.id)})


@bp.route("/maintenance-shifts/<shift_id>", methods=["PUT"])
def update_maintenance_shift(shift_id: str):
    if FlaskConfig.DEMO_MODE:
        return jsonify({"id": shift_id})

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    for field in ("team_member_id", "start_date", "end_date"):
        if not data.get(field):
            return jsonify({"error": f"Missing required field: {field}"}), 400

    try:
        uid = uuid_mod.UUID(shift_id)
        member_uuid = uuid_mod.UUID(data["team_member_id"])
    except ValueError:
        return jsonify({"error": "Invalid ID"}), 400

    shift = db.session.get(MaintenanceShift, uid)
    if shift is None:
        return jsonify({"error": "Maintenance shift not found"}), 404

    member = db.session.get(TeamMember, member_uuid)
    if member is None:
        return jsonify({"error": "Team member not found"}), 404

    shift.team_member_id = member.id
    shift.start_date = data["start_date"]
    shift.end_date = data["end_date"]
    db.session.commit()
    metrics_logger.info(f"Updated maintenance shift {shift_id}")
    return jsonify({"id": str(shift.id)})


@bp.route("/sprints/<sprint_id>/members/<team_member_id>", methods=["PUT"])
def upsert_sprint_member(sprint_id: str, team_member_id: str):
    if FlaskConfig.DEMO_MODE:
        return jsonify({"id": team_member_id})

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    for field in ("working_days", "is_on_maintenance"):
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    try:
        sprint_uid = uuid_mod.UUID(sprint_id)
        member_uid = uuid_mod.UUID(team_member_id)
    except ValueError:
        return jsonify({"error": "Invalid ID"}), 400

    sprint = db.session.get(SprintPeriod, sprint_uid)
    if sprint is None:
        return jsonify({"error": "Sprint not found"}), 404

    member = db.session.get(TeamMember, member_uid)
    if member is None:
        return jsonify({"error": "Team member not found"}), 404

    record = (
        db.session.query(TeamMemberSprint)
        .filter_by(sprint_period_id=sprint_uid, team_member_id=member_uid)
        .first()
    )
    if record is None:
        record = TeamMemberSprint(
            sprint_period_id=sprint_uid, team_member_id=member_uid
        )
        db.session.add(record)

    record.working_days = data["working_days"]
    record.is_on_maintenance = data["is_on_maintenance"]
    db.session.commit()
    metrics_logger.info(f"Upserted sprint member {sprint_id}/{team_member_id}")
    return jsonify({"id": str(record.id)})
