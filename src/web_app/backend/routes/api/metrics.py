from flask import jsonify, request
from sqlalchemy import text

from common import metrics_logger

from ...config import FlaskConfig
from ...models import db
from . import bp
from .helpers import get_sprint_metrics_query

#####


@bp.route("/maintenance-metrics")
def get_maintenance_metrics():
    """Endpoint to retrieve maintenance performance metrics from dbt model."""

    if FlaskConfig.DEMO_MODE:
        metrics_logger.info(
            "DEMO_MODE is enabled - returning empty maintenance metrics"
        )
        return jsonify([])

    metrics_logger.info("Retrieving maintenance performance metrics...")

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
                " FROM dbt_dev.maintenance_performance"
                " ORDER BY start_date DESC, user_name"
            )
        )
        .mappings()
        .all()
    )

    result = []
    for row in rows:
        d = dict(row)
        result.append(d)

    if FlaskConfig.LOCAL:
        metrics_logger.debug(result)

    return jsonify(result)


@bp.route("/sprint-metrics")
def get_sprint_metrics():
    """Endpoint to retrieve sprint performance metrics from dbt model."""

    if FlaskConfig.DEMO_MODE:
        metrics_logger.info("DEMO_MODE is enabled - returning empty sprint metrics")
        return jsonify([])

    match request.args.get("byTeam", "").lower():
        case "true":
            by_team = True
        case _:
            by_team = False

    match request.args.get("average", "").lower():
        case "true":
            average = True
        case _:
            average = False

    _query_text = get_sprint_metrics_query(by_team=by_team, average=average)

    rows = db.session.execute(_query_text).mappings().all()

    result = []
    for row in rows:
        d = dict(row)
        result.append(d)

    if FlaskConfig.LOCAL:
        metrics_logger.debug(result)

    return jsonify(result)
