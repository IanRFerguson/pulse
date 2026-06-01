from typing import Optional

import click

from devops.database_helpers import create_db_session
from src.web_app.backend.models import SprintPeriod, Team

#####


@click.command()
@click.option(
    "-t",
    "--team-name",
    prompt="Team name",
    help="The name of the team to add to the sprint period.",
)
@click.option(
    "-f",
    "--friendly-name",
    prompt="Friendly name",
    help="A friendly name for the sprint period.",
)
@click.option(
    "--start-date",
    prompt="Start date",
    help="The start date of the sprint period.",
    type=click.DateTime(formats=["%Y-%m-%d"]),
)
@click.option(
    "--end-date",
    prompt="End date",
    help="The end date of the sprint period.",
    type=click.DateTime(formats=["%Y-%m-%d"]),
)
def cli(
    team_name: str, start_date: str, end_date: str, friendly_name: Optional[str] = None
) -> None:
    """CLI command to add a team to a sprint period."""

    with create_db_session() as session:
        team = session.query(Team).filter_by(name=team_name).first()
        if not team:
            click.echo(f"Team '{team_name}' not found.")
            raise click.Abort()

        sprint = SprintPeriod(
            team_id=team.id,
            friendly_name=friendly_name,
            start_date=start_date,
            end_date=end_date,
        )
        session.add(sprint)
        session.commit()
        click.echo(
            f"Added '{team_name}' sprint period from {start_date} to {end_date}."
        )


#####

if __name__ == "__main__":
    cli()
