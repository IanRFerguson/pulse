import click

from devops.database_helpers.helpers import create_db_session
from src.web_app.backend.models import Team, TeamMember

#####


def get_team_id(team_name: str, session) -> int | None:
    """Helper function to get a team ID by team name."""

    team = session.query(Team).filter_by(name=team_name).first()
    return team.id if team else None


@click.command()
@click.option(
    "-t",
    "--team-name",
    prompt="Team name",
    help="The name of the team to add the user to.",
)
@click.option(
    "-u",
    "--user-name",
    prompt="User name",
    help="The name of the user to add to the team.",
)
@click.option(
    "--github-fk", prompt="GitHub user id", help="The GitHub username of the user."
)
@click.option(
    "--asana-fk",
    prompt="Asana user id",
    help="The Asana user ID of the user.",
    required=False,
)
@click.option(
    "--freshdesk-fk",
    prompt="Freshdesk user id",
    help="The Freshdesk user ID of the user.",
    required=False,
)
def cli(
    team_name: str, user_name: str, github_fk: str, asana_fk: str, freshdesk_fk: str
) -> None:
    """CLI command to add a user to a team."""

    with create_db_session() as session:
        team_id = get_team_id(team_name=team_name, session=session)

        if not team_id:
            click.echo(f"Team '{team_name}' not found.")
            raise click.Abort()

        if not asana_fk:
            asana_fk = user_name  # Default to user name if Asana ID is not provided

        if not freshdesk_fk:
            freshdesk_fk = (
                user_name  # Default to user name if Freshdesk ID is not provided
            )

        team_member = TeamMember(
            team_id=team_id,
            user_name=user_name,
            github_fk=github_fk,
            asana_fk=asana_fk,
            freshdesk_fk=freshdesk_fk,
        )
        session.add(team_member)
        session.commit()
        click.echo(f"Added user '{user_name}' to team '{team_name}'.")


#####

if __name__ == "__main__":
    cli()
