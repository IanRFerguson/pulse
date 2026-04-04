import click

from devops.database_helpers import create_db_session
from src.web_app.backend.models import Team

#####


@click.command()
@click.option(
    "-t",
    "--team-name",
    prompt="Team name",
    help="The name of the team to create.",
)
def cli(team_name: str) -> None:
    """CLI command to create a new team."""

    with create_db_session() as session:
        existing_team = session.query(Team).filter_by(name=team_name).first()
        if existing_team:
            click.echo(f"Team '{team_name}' already exists.")
            raise click.Abort()

        team = Team(name=team_name)
        session.add(team)
        session.commit()
        click.echo(f"Created team '{team_name}'.")


#####

if __name__ == "__main__":
    cli()
