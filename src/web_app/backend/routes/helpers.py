from sqlalchemy import text

from ..models import db

#####


def _count_open_prs(github_login: str) -> int:
    try:
        return (
            db.session.execute(
                text(
                    "SELECT COUNT(*) FROM dbt_dev_staging.stg__01__github"
                    " WHERE github_username = :login"
                    " AND is_merged = false AND is_closed_unmerged = false"
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
                    "SELECT COUNT(*) FROM dbt_dev_staging.stg__01__freshdesk"
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
                    "SELECT COUNT(*) FROM dbt_dev_staging.stg__01__asana"
                    " WHERE assignee_id = :gid AND completed = false"
                ),
                {"gid": assignee_gid},
            ).scalar()
            or 0
        )
    except Exception:
        return 0
