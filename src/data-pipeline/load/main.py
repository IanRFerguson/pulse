import click
from sources import AsanaSource, FreshdeskSource, GithubSource

#####

LOAD_MAP = [
    {
        "source_cls": GithubSource,
        "pipeline_name": "github_pipeline",
        "destination_name": "postgres",
        "dataset_name": "github_data",
    },
    {
        "source_cls": AsanaSource,
        "pipeline_name": "asana_pipeline",
        "destination_name": "postgres",
        "dataset_name": "asana_data",
    },
    # {
    #     "source_cls": FreshdeskSource,
    #     "pipeline_name": "freshdesk_pipeline",
    #     "destination_name": "postgres",
    #     "dataset_name": "freshdesk_data",
    # },
]


@click.command()
@click.option(
    "--source",
    type=click.Choice(["github", "asana", "freshdesk"], case_sensitive=False),
    default=None,
    help="Specify which source to load (default: all sources)",
)
@click.option(
    "--full-refresh", is_flag=True, help="Perform a full refresh (replace data)"
)
def cli(source, full_refresh):
    for _map in LOAD_MAP:
        if source and not _map["source_cls"].__name__.lower().startswith(source):
            continue
        instance = _map["source_cls"](
            pipeline_name=_map["pipeline_name"],
            destination_name=_map["destination_name"],
            dataset_name=_map["dataset_name"],
            full_refresh=full_refresh,
        )
        instance.load()


#####

if __name__ == "__main__":
    cli()
