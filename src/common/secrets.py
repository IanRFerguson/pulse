from typing import Optional

from google.cloud import secretmanager

from src.common.logger import metrics_logger

#####

DEFAULT_PROJECT = "ian-is-online"


def read_secret(
    secret_name: str,
    project_id: str = DEFAULT_PROJECT,
    secret_manager: Optional[secretmanager.SecretManagerServiceClient] = None,
) -> str:
    """
    Reads a secret from Google Cloud Secret Manager.

    Args:
        secret_name: The name of the secret.
        project_id: The ID of the Google Cloud project.
        secret_manager: Optional SecretManagerServiceClient instance.

    Returns:
        The secret value as a string.
    """

    metrics_logger.info(f"Reading secret: {secret_name} from project: {project_id}")

    client = secret_manager or secretmanager.SecretManagerServiceClient()
    name = f"projects/{project_id}/secrets/{secret_name}/versions/latest"
    response = client.access_secret_version(request={"name": name})

    return response.payload.data.decode("UTF-8")
