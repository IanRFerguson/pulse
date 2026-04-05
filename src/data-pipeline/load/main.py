import os

import click
from config import LOAD_MAP, setup_dlt_environment

from src.common import metrics_logger

#####


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
def cli(source: str, full_refresh: bool) -> None:
    """
    Run the data loading process for the specified source(s).

    Args:
        source (str): The source to load (github, asana, freshdesk). If None, all sources will be loaded.
        full_refresh (bool): If True, perform a full refresh by replacing existing data. Otherwise, perform an incremental load.
    """

    setup_dlt_environment()

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
