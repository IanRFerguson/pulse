from sqlalchemy import TextClause, text

from common import metrics_logger

from ...models import db

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


def get_sprint_metrics_query(by_team: bool, average: bool) -> TextClause:
    """
    Helper function to construct the appropriate SQL query for retrieving sprint metrics
    based on the provided parameters.
    Args:
        by_team (bool): Whether to group metrics by team.
        average (bool): Whether to calculate average metrics per team member.
    Returns:
        TextClause: The constructed SQL query string.
    """

    if by_team:
        if average:
            metrics_logger.info(
                "Constructing SQL query for average sprint metrics by team..."
            )
            return text(
                "SELECT * FROM dbt_dev.average_sprint_performance_by_team ORDER BY start_date DESC, team_name"
            )

        else:
            metrics_logger.info(
                "Constructing SQL query for total sprint metrics by team..."
            )
            return text(
                "SELECT * FROM dbt_dev.sprint_performance_by_team ORDER BY start_date DESC, team_name"
            )

    else:
        if average:
            metrics_logger.info(
                "Constructing SQL query for average sprint metrics by individual..."
            )
            return text(
                "SELECT * FROM dbt_dev.average_sprint_performance_by_member ORDER BY start_date DESC, user_name"
            )

        else:
            metrics_logger.info(
                "Constructing SQL query for total sprint metrics by individual..."
            )
            return text(
                "SELECT * FROM dbt_dev.sprint_performance_by_member ORDER BY start_date DESC, user_name"
            )
