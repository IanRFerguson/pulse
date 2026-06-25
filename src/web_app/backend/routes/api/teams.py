import uuid as uuid_mod

from flask import jsonify
from sqlalchemy import text

from ...config import FlaskConfig
from ...mock_data import (
    MOCK_MAINTENANCE_SHIFTS,
    MOCK_SPRINTS,
    MOCK_TEAM_MEMBERS,
    MOCK_TEAM_MEMBERS_RAW,
    MOCK_TEAMS,
)
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


@bp.route("/team-members-raw")
def list_team_members_raw():
    """Returns all team members with raw FK fields for the admin panel."""

    if FlaskConfig.DEMO_MODE:
        return jsonify(MOCK_TEAM_MEMBERS_RAW)

    members = (
        db.session.query(TeamMember)
        .join(Team, TeamMember.team_id == Team.id)
        .filter(TeamMember.active.is_(True))
        .order_by(Team.name, TeamMember.user_name)
        .all()
    )
    return jsonify(
        [
            {
                "id": str(m.id),
                "user_name": m.user_name,
                "team_id": str(m.team_id),
                "team_name": m.team.name,
                "github_fk": m.github_fk,
                "asana_fk": m.asana_fk,
                "freshdesk_fk": m.freshdesk_fk,
            }
            for m in members
        ]
    )


@bp.route("/sprints")
def list_sprints():
    """Returns all sprint periods."""

    if FlaskConfig.DEMO_MODE:
        return jsonify(MOCK_SPRINTS)

    rows = (
        db.session.query(SprintPeriod)
        .join(Team, SprintPeriod.team_id == Team.id)
        .order_by(Team.name, SprintPeriod.start_date.desc())
        .all()
    )
    return jsonify(
        [
            {
                "id": str(r.id),
                "team_id": str(r.team_id),
                "team_name": r.team.name,
                "friendly_name": r.friendly_name,
                "start_date": str(r.start_date),
                "end_date": str(r.end_date),
            }
            for r in rows
        ]
    )


@bp.route("/sprints/<sprint_id>/members")
def list_sprint_members(sprint_id: str):
    """Returns all active team members for a sprint's team with their TeamMemberSprint data."""
    try:
        uid = uuid_mod.UUID(sprint_id)
    except ValueError:
        return jsonify({"error": "Invalid sprint_id"}), 400

    sprint = db.session.get(SprintPeriod, uid)
    if sprint is None:
        return jsonify({"error": "Sprint not found"}), 404

    team_members = (
        db.session.query(TeamMember)
        .filter_by(team_id=sprint.team_id, active=True)
        .order_by(TeamMember.user_name)
        .all()
    )

    existing = {
        tms.team_member_id: tms
        for tms in db.session.query(TeamMemberSprint)
        .filter_by(sprint_period_id=uid)
        .all()
    }

    return jsonify(
        [
            {
                "id": str(existing[tm.id].id) if tm.id in existing else None,
                "team_member_id": str(tm.id),
                "user_name": tm.user_name,
                "working_days": existing[tm.id].working_days
                if tm.id in existing
                else 10,
                "is_on_maintenance": existing[tm.id].is_on_maintenance
                if tm.id in existing
                else False,
            }
            for tm in team_members
        ]
    )


@bp.route("/maintenance-shifts")
def list_maintenance_shifts():
    """Returns all maintenance shifts."""

    if FlaskConfig.DEMO_MODE:
        return jsonify(MOCK_MAINTENANCE_SHIFTS)

    rows = (
        db.session.query(MaintenanceShift)
        .join(TeamMember, MaintenanceShift.team_member_id == TeamMember.id)
        .join(Team, TeamMember.team_id == Team.id)
        .order_by(MaintenanceShift.start_date.desc())
        .all()
    )
    return jsonify(
        [
            {
                "id": str(r.id),
                "team_member_id": str(r.team_member_id),
                "team_id": str(r.team_member.team_id),
                "user_name": r.team_member.user_name,
                "team_name": r.team_member.team.name,
                "start_date": str(r.start_date),
                "end_date": str(r.end_date),
            }
            for r in rows
        ]
    )


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
