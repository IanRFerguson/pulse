import click

from devops.database_helpers import create_db_session
from src.web_app.backend.models import MaintenanceShift, TeamMember

#####


@click.command()
@click.option(
    "-u",
    "--user-name",
    prompt="User name",
    help="The name of the user to add to the maintenance shift.",
)
@click.option(
    "--start-date",
    prompt="Start date",
    help="The start date of the maintenance shift.",
    type=click.DateTime(formats=["%Y-%m-%d"]),
)
@click.option(
    "--end-date",
    prompt="End date",
    help="The end date of the maintenance shift.",
    type=click.DateTime(formats=["%Y-%m-%d"]),
)
def cli(user_name: str, start_date: str, end_date: str) -> None:
    """CLI command to add a user to a maintenance shift."""

    with create_db_session() as session:
        team_member = session.query(TeamMember).filter_by(user_name=user_name).first()
        if not team_member:
            click.echo(f"User '{user_name}' not found.")
            raise click.Abort()

        shift = MaintenanceShift(
            team_member_id=team_member.id,
            start_time=start_date,
            end_time=end_date,
        )
        session.add(shift)
        session.commit()
        click.echo(
            f"Added '{user_name}' to maintenance shift from {start_date} to {end_date}."
        )


#####

if __name__ == "__main__":
    cli()
