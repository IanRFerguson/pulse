import click
import subprocess
from dotenv import load_dotenv
import os
from src.common import metrics_logger

#####

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
load_dotenv(os.path.join(ROOT, ".local", "local.env"))

os.chdir(ROOT)


@click.command()
def run_pipeline_locally():
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
