import click
from sources import AsanaSource, FreshdeskSource, GithubSource
from src.common import metrics_logger

#####

LOAD_MAP = [
    {
        "friendly_name": "GitHub",
        "source_cls": GithubSource,
        "pipeline_name": "github_pipeline",
        "destination_name": "postgres",
        "dataset_name": "github_data",
    },
    {
        "friendly_name": "Asana",
        "source_cls": AsanaSource,
        "pipeline_name": "asana_pipeline",
        "destination_name": "postgres",
        "dataset_name": "asana_data",
    },
    {
        "friendly_name": "Freshdesk",
        "source_cls": FreshdeskSource,
        "pipeline_name": "freshdesk_pipeline",
        "destination_name": "postgres",
        "dataset_name": "freshdesk_data",
    },
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
    load_errors = []
    for _map in LOAD_MAP:
        if source and not _map["source_cls"].__name__.lower().startswith(source):
            continue
        instance = _map["source_cls"](
            pipeline_name=_map["pipeline_name"],
            destination_name=_map["destination_name"],
            dataset_name=_map["dataset_name"],
            full_refresh=full_refresh,
        )
        metrics_logger.info(f"Starting load for {_map['friendly_name'].upper()}")
        try:
            instance.load()
        except Exception as e:
            metrics_logger.error(f"Error loading {_map['friendly_name'].upper()}: {e}")
            load_errors.append(_map["friendly_name"])

    if load_errors:
        raise Exception(f"Data load failed for: {', '.join(load_errors)}")
    else:
        metrics_logger.info("✅ Data load complete for all sources")


#####

if __name__ == "__main__":
    cli()
