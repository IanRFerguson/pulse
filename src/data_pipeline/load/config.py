import os

from sources import AsanaSource, FreshdeskSource, GithubSource

from src.common import metrics_logger

#####

LOAD_MAP = [
    {
        "friendly_name": "GitHub",
        "source_cls": GithubSource,
        "pipeline_name": "github_pipeline",
        "gcs_prefix": "github",
        "destination_name": "postgres",
        "dataset_name": "github_data",
    },
    {
        "friendly_name": "Asana",
        "source_cls": AsanaSource,
        "pipeline_name": "asana_pipeline",
        "gcs_prefix": "asana",
        "destination_name": "postgres",
        "dataset_name": "asana_data",
    },
    {
        "friendly_name": "Freshdesk",
        "source_cls": FreshdeskSource,
        "pipeline_name": "freshdesk_pipeline",
        "gcs_prefix": "freshdesk",
        "destination_name": "postgres",
        "dataset_name": "freshdesk_data",
    },
]

DLT_ENV_MAP = {
    "production": {
        "DB_HOST": "DESTINATION__POSTGRES__CREDENTIALS__HOST",
        "DB_PORT": "DESTINATION__POSTGRES__CREDENTIALS__PORT",
        "DB_USERNAME": "DESTINATION__POSTGRES__CREDENTIALS__USERNAME",
        "DB_PASSWORD": "DESTINATION__POSTGRES__CREDENTIALS__PASSWORD",
        "DB_NAME": "DESTINATION__POSTGRES__CREDENTIALS__DATABASE",
    },
    "local": {
        "LOCAL_DB_HOST": "DESTINATION__POSTGRES__CREDENTIALS__HOST",
        "LOCAL_DB_PORT": "DESTINATION__POSTGRES__CREDENTIALS__PORT",
        "LOCAL_DB_USERNAME": "DESTINATION__POSTGRES__CREDENTIALS__USERNAME",
        "LOCAL_DB_PASSWORD": "DESTINATION__POSTGRES__CREDENTIALS__PASSWORD",
        "LOCAL_DB_NAME": "DESTINATION__POSTGRES__CREDENTIALS__DATABASE",
    },
}


def setup_dlt_environment():
    MAP = (
        DLT_ENV_MAP["local"]
        if os.getenv("LOCAL") == "true"
        else DLT_ENV_MAP["production"]
    )
    for key, value in MAP.items():
        metrics_logger.debug(f"Setting `{key}` environment variable for dlt")
        try:
            os.environ[value] = os.environ[key]
        except KeyError:
            metrics_logger.error(
                f"Environment variable `{key}` not found. Please set it before running the pipeline."
            )
            raise
