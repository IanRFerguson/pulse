import uuid as uuid_mod

from flask import jsonify, request
from sqlalchemy import select, text

from common import metrics_logger

from ..config import load_theme
from ..models import Team, TeamMember, User, db
from . import bp
from .helpers import (
    _count_active_tasks,
    _count_open_prs,
    _count_open_tickets,
)

#####


@bp.route("/config")
def get_config():
    """Endpoint to retrieve application configuration, including theme settings."""
    return jsonify(load_theme())


@bp.route("/teams")
def list_teams():
    """Endpoint to list all teams."""

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

    rows = (
        db.session.execute(
            text(
                "SELECT"
                " team_member_id AS id,"
                " user_name AS username,"
                " team_name AS team,"
                " github_fk,"
                " asana_fk,"
                " freshdesk_fk"
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
        d["github_pr_count"] = _count_open_prs(d["github_fk"]) if d["github_fk"] else 0
        d["freshdesk_ticket_count"] = (
            _count_open_tickets(d["freshdesk_fk"]) if d["freshdesk_fk"] else 0
        )
        d["asana_task_count"] = (
            _count_active_tasks(d["asana_fk"]) if d["asana_fk"] else 0
        )
        result.append(d)

    return jsonify(result)


@bp.route("/team-members/<member_id>")
def get_team_member(member_id: str):
    """Endpoint to retrieve details for a specific team member, including their GitHub PRs, Freshdesk tickets, and Asana tasks."""

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
                " github_fk,"
                " asana_fk,"
                " freshdesk_fk"
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

    # GitHub PRs -------------------------------------------------------
    github_prs: list[dict] = []
    if d["github_fk"]:
        try:
            pr_rows = (
                db.session.execute(
                    text(
                        "SELECT id, github_repo_name, branch_name, is_draft"
                        " FROM dbt_dev_staging.stg__01__github"
                        " WHERE github_username = :login"
                        " AND is_merged = false AND is_closed_unmerged = false"
                        " ORDER BY created_at DESC"
                    ),
                    {"login": d["github_fk"]},
                )
                .mappings()
                .fetchall()
            )
            github_prs = [
                {
                    "id": r["id"],
                    "repo": r["github_repo_name"],
                    "branch": r["branch_name"],
                    "is_draft": bool(r["is_draft"]),
                    "url": f"https://github.com/{r['github_repo_name']}/pull/{r['id']}",
                }
                for r in pr_rows
            ]
        except Exception:
            pass

    # Freshdesk tickets ------------------------------------------------
    STATUS_LABELS = {2: "Open", 3: "Pending", 4: "Resolved", 5: "Closed", 6: "Waiting"}
    PRIORITY_LABELS = {1: "Low", 2: "Medium", 3: "High", 4: "Urgent"}

    freshdesk_tickets: list[dict] = []
    if d["freshdesk_fk"]:
        try:
            ticket_rows = (
                db.session.execute(
                    text(
                        "SELECT ticket_id, ticket_subject, status, priority"
                        " FROM dbt_dev_staging.stg__01__freshdesk"
                        " WHERE assigned_agent_name = :agent AND status IN (2, 3, 6)"
                        " ORDER BY created_at DESC"
                    ),
                    {"agent": d["freshdesk_fk"]},
                )
                .mappings()
                .fetchall()
            )
            freshdesk_tickets = [
                {
                    "id": r["ticket_id"],
                    "subject": r["ticket_subject"],
                    "status": STATUS_LABELS.get(r["status"], str(r["status"])),
                    "priority": PRIORITY_LABELS.get(r["priority"], str(r["priority"])),
                }
                for r in ticket_rows
            ]
        except Exception:
            pass

    # Asana tasks ------------------------------------------------------
    asana_tasks: list[dict] = []
    if d["asana_fk"]:
        try:
            task_rows = (
                db.session.execute(
                    text(
                        "SELECT task_id, name, due_on"
                        " FROM dbt_dev_staging.stg__01__asana"
                        " WHERE assignee_id = :gid AND completed = false"
                        " ORDER BY due_on ASC NULLS LAST"
                    ),
                    {"gid": d["asana_fk"]},
                )
                .mappings()
                .fetchall()
            )
            asana_tasks = [
                {
                    "id": r["task_id"],
                    "name": r["name"],
                    "due_on": r["due_on"].isoformat() if r["due_on"] else None,
                    "url": None,
                }
                for r in task_rows
            ]
        except Exception:
            pass

    d.update(
        {
            "github_prs": github_prs,
            "freshdesk_tickets": freshdesk_tickets,
            "asana_tasks": asana_tasks,
        }
    )
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
