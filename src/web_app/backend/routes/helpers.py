from sqlalchemy import text

from src.web_app.backend.models import Team, TeamMember, User, db

#####


def _member_to_dict(member: TeamMember, user: User, team: Team) -> dict:
    return {
        "id": str(member.id),
        "username": user.username,
        "email": user.email,
        "team": team.name,
        "github_fk": member.github_fk,
        "asana_fk": member.asana_fk,
        "freshdesk_fk": member.freshdesk_fk,
    }


def _count_open_prs(github_login: str) -> int:
    try:
        return (
            db.session.execute(
                text(
                    "SELECT COUNT(*) FROM github.pull_requests"
                    " WHERE user__login = :login AND state = 'open'"
                ),
                {"login": github_login},
            ).scalar()
            or 0
        )
    except Exception:
        return 0


def _count_open_tickets(agent_name: str) -> int:
    try:
        return (
            db.session.execute(
                text(
                    "SELECT COUNT(*) FROM freshdesk.tickets"
                    " WHERE assigned_agent_name = :agent AND status IN (2, 3, 6)"
                ),
                {"agent": agent_name},
            ).scalar()
            or 0
        )
    except Exception:
        return 0


def _count_active_tasks(assignee_gid: str) -> int:
    try:
        return (
            db.session.execute(
                text(
                    "SELECT COUNT(*) FROM asana.project_tasks"
                    " WHERE assignee__gid = :gid AND completed = false"
                ),
                {"gid": assignee_gid},
            ).scalar()
            or 0
        )
    except Exception:
        return 0
