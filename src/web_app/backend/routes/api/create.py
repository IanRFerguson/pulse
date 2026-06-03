import uuid as uuid_mod

from flask import jsonify, request

from common import metrics_logger

from ...models import MaintenanceShift, SprintPeriod, Team, TeamMember, db
from . import bp

#####


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
        friendly_name=data.get("friendly_name"),
        start_date=start_date,
        end_date=end_date,
    )
    db.session.add(sprint)
    db.session.commit()

    metrics_logger.info(
        f"Created sprint '{sprint.friendly_name if sprint.friendly_name else 'Unnamed'}' for team {team.name} from {start_date} to {end_date}"
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
