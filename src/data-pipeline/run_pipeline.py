import os
import subprocess

import click
from dotenv import load_dotenv

from src.common import metrics_logger

#####


def setup_runtime_environment(docker: bool) -> None:
    """
    Set up the runtime environment for the pipeline.
    If running in Docker, change to the /app directory.
    Otherwise, load environment variables from the .local/local.env file
    and change to the project root directory.

    Args:
        docker (bool): If True, set up for Docker. Otherwise, set up for local development.
    """

    if docker:
        os.chdir("/app")
        return

    ROOT = os.path.abspath(
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
    )
    load_dotenv(os.path.join(ROOT, ".local", "local.env"))

    os.chdir(ROOT)


@click.command()
@click.option("--docker", is_flag=True, help="Run the pipeline in Docker")
def run_pipeline_locally(docker: bool):
    """
    Run the entire data pipeline locally, including loading data with dlt and
    running dbt transformations.

    Args:
        docker (bool): If True, run the pipeline in Docker. Otherwise, run locally.
    """

    setup_runtime_environment(docker=docker)
    metrics_logger.info(f"Running pipeline from {os.getcwd()}")

    # Run the loading step with dlt
    subprocess.run(["uv", "run", "src/data-pipeline/load/main.py"], check=True)

    # Run the dbt transformations
    subprocess.run(
        ["cd src/data-pipeline/analytics && uv run dbt build"], shell=True, check=True
    )


#####

if __name__ == "__main__":
    run_pipeline_locally()
