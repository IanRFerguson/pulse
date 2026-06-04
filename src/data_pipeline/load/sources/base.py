import os
from typing import Any

import dlt
from dlt.destinations import filesystem
from google.auth import default
from google.oauth2 import service_account
from pydantic import BaseModel, PrivateAttr

from src.common import metrics_logger

#####

GCS_BUCKET = os.environ["GCS_BUCKET"]


class DltSource(BaseModel):
    """
    Base class for DLT sources.

    Each of these subclasses should have an "extract pipeline" (API to GCS) and a "load pipeline" (GCS to Postgres).

    The extract pipeline should be defined in the `sources` method, and the load pipeline should be defined
    in the `model_post_init` method. The `load` method will run both extract and load pipelines.
    """

    pipeline_name: str
    gcs_prefix: str
    destination_name: str
    dataset_name: str
    full_refresh: bool = False

    # Private attributes for internal use
    _extract_pipeline: Any = PrivateAttr(default=None)
    _load_pipeline: Any = PrivateAttr(default=None)
    _gcs_path: str = PrivateAttr(default="")

    def model_post_init(self, __context: Any) -> None:
        self._gcs_path = f"gs://{GCS_BUCKET}/{self.gcs_prefix}"

        # dlt will automatically look for GOOGLE_APPLICATION_CREDENTIALS
        # or local metadata server/gcloud auth.
        self._extract_pipeline = dlt.pipeline(
            f"{self.pipeline_name}__extract",
            destination=filesystem(bucket_url=self._gcs_path),
        )
        self._load_pipeline = dlt.pipeline(
            f"{self.pipeline_name}__load",
            destination="postgres",
            dataset_name=self.dataset_name,
        )

    def extract(self):
        """
        Extract data from the source API and save to GCS.
        """
        metrics_logger.info(f"Extracting data from {self.pipeline_name} to GCS...")
        source_data = self.sources()
        extract_info = self._extract_pipeline.run(
            source_data, loader_file_format="parquet"
        )
        metrics_logger.info(f"Extract complete: {extract_info}")

        return extract_info

    def load(self) -> None:
        """
        Load data to both GCS and Postgres. Extracts from API once and loads to both destinations.
        """
        # Get source data from the API
        metrics_logger.info(f"Extracting data from {self.pipeline_name}...")
        source_data = self.sources()

        # First, save to GCS for data lake / backup
        metrics_logger.info(f"Loading to GCS at {self._gcs_path}...")
        extract_info = self._extract_pipeline.run(source_data)
        metrics_logger.info(f"GCS load complete: {extract_info}")

        # Then, load to Postgres (need to get sources again since they're generators)
        metrics_logger.info("Loading to Postgres...")
        source_data = self.sources()
        load_info = self._load_pipeline.run(source_data)

        metrics_logger.info(f"Postgres load complete: {load_info}")
