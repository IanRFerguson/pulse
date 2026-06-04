import os
from typing import Any

import dlt
from dlt.destinations import filesystem as filesystem_destination
from dlt.sources.filesystem import filesystem as filesystem_source
from dlt.sources.filesystem import read_parquet
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
            destination=filesystem_destination(bucket_url=self._gcs_path),
        )
        self._load_pipeline = dlt.pipeline(
            f"{self.pipeline_name}__load",
            destination="postgres",
            dataset_name=self.dataset_name,
        )

    def _resource_names(self, source_data: list[Any]) -> list[str]:
        resource_names: list[str] = []

        for source in source_data:
            if hasattr(source, "selected_resources"):
                resource_names.extend(source.selected_resources.keys())
            elif hasattr(source, "name"):
                resource_names.append(source.name)

        return resource_names

    def _staged_sources(self, resource_names: list[str]) -> list[Any]:
        return [
            read_parquet()
            .with_name(resource_name)
            .pipe_data_from(
                filesystem_source(
                    self._gcs_path,
                    file_glob=f"{self._extract_pipeline.dataset_name}/{resource_name}/*.parquet",
                )
            )
            for resource_name in resource_names
        ]

    def sources(self) -> list[Any]:
        raise NotImplementedError

    def extract(self) -> Any:
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
        resource_names = self._resource_names(source_data)

        # First, save to GCS for data lake / backup
        metrics_logger.info(f"Loading to GCS at {self._gcs_path}...")
        extract_info = self._extract_pipeline.run(
            source_data, loader_file_format="parquet"
        )
        metrics_logger.info(f"GCS load complete: {extract_info}")

        # Then, load the staged parquet files from GCS into Postgres
        metrics_logger.info("Loading to Postgres...")
        load_info = self._load_pipeline.run(self._staged_sources(resource_names))

        metrics_logger.info(f"Postgres load complete: {load_info}")
