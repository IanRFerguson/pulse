import uuid as uuid_mod

from flask import jsonify, request
from sqlalchemy import select, text

from backend.config import load_theme
from backend.models import Team, TeamMember, User, db
from common import metrics_logger

from . import bp
from .helpers import (
    _count_active_tasks,
    _count_open_prs,
    _count_open_tickets,
    _member_to_dict,
)

#####


@bp.route("/api/config")
def get_config():
    return jsonify(load_theme())


# ---------------------------------------------------------------------------
# Routes – teams
# ---------------------------------------------------------------------------


@bp.route("/api/teams")
def list_teams():
    teams = db.session.execute(select(Team)).scalars().all()
    return jsonify([{"id": str(t.id), "name": t.name} for t in teams])


# ---------------------------------------------------------------------------
# Routes – team members
# ---------------------------------------------------------------------------


@bp.route("/api/team-members")
def list_team_members():
    rows = db.session.execute(
        select(TeamMember, User, Team)
        .join(User, TeamMember.user_id == User.id)
        .join(Team, TeamMember.team_id == Team.id)
    ).all()

    result = []
    for member, user, team in rows:
        d = _member_to_dict(member, user, team)
        d["github_pr_count"] = (
            _count_open_prs(member.github_fk) if member.github_fk else 0
        )
        d["freshdesk_ticket_count"] = (
            _count_open_tickets(member.freshdesk_fk) if member.freshdesk_fk else 0
        )
        d["asana_task_count"] = (
            _count_active_tasks(member.asana_fk) if member.asana_fk else 0
        )
        result.bpend(d)

    return jsonify(result)


@bp.route("/api/team-members/<member_id>")
def get_team_member(member_id: str):
    try:
        uid = uuid_mod.UUID(member_id)
    except ValueError:
        return jsonify({"error": "Invalid member ID"}), 400

    row = db.session.execute(
        select(TeamMember, User, Team)
        .join(User, TeamMember.user_id == User.id)
        .join(Team, TeamMember.team_id == Team.id)
        .where(TeamMember.id == uid)
    ).first()

    if row is None:
        return jsonify({"error": "Team member not found"}), 404

    member, user, team = row
    d = _member_to_dict(member, user, team)

    # GitHub PRs -------------------------------------------------------
    github_prs: list[dict] = []
    if member.github_fk:
        try:
            pr_rows = db.session.execute(
                text(
                    "SELECT id, title, base__repo__full_name, head__ref, draft"
                    " FROM github.pull_requests"
                    " WHERE user__login = :login AND state = 'open'"
                    " ORDER BY created_at DESC"
                ),
                {"login": member.github_fk},
            ).fetchall()
            github_prs = [
                {
                    "id": r[0],
                    "title": r[1],
                    "repo": r[2],
                    "branch": r[3],
                    "is_draft": bool(r[4]),
                    "url": f"https://github.com/{r[2]}/pull/{r[0]}",
                }
                for r in pr_rows
            ]
        except Exception:
            pass

    # Freshdesk tickets ------------------------------------------------
    STATUS_LABELS = {2: "Open", 3: "Pending", 4: "Resolved", 5: "Closed", 6: "Waiting"}
    PRIORITY_LABELS = {1: "Low", 2: "Medium", 3: "High", 4: "Urgent"}

    freshdesk_tickets: list[dict] = []
    if member.freshdesk_fk:
        try:
            ticket_rows = db.session.execute(
                text(
                    "SELECT id, subject, status, priority"
                    " FROM freshdesk.tickets"
                    " WHERE assigned_agent_name = :agent AND status IN (2, 3, 6)"
                    " ORDER BY created_at DESC"
                ),
                {"agent": member.freshdesk_fk},
            ).fetchall()
            freshdesk_tickets = [
                {
                    "id": r[0],
                    "subject": r[1],
                    "status": STATUS_LABELS.get(r[2], str(r[2])),
                    "priority": PRIORITY_LABELS.get(r[3], str(r[3])),
                }
                for r in ticket_rows
            ]
        except Exception:
            pass

    # Asana tasks ------------------------------------------------------
    asana_tasks: list[dict] = []
    if member.asana_fk:
        try:
            task_rows = db.session.execute(
                text(
                    "SELECT gid, name, due_on, permalink_url"
                    " FROM asana.project_tasks"
                    " WHERE assignee__gid = :gid AND completed = false"
                    " ORDER BY due_on ASC NULLS LAST"
                ),
                {"gid": member.asana_fk},
            ).fetchall()
            asana_tasks = [
                {
                    "id": r[0],
                    "name": r[1],
                    "due_on": r[2].isoformat() if r[2] else None,
                    "url": r[3],
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


@bp.route("/api/team-members", methods=["POST"])
def create_team_member():
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
