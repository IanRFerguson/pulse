from typing import Any

from dlt import pipeline
from pydantic import BaseModel

from src.common import metrics_logger

#####


class DltSource(BaseModel):
    """
    Base class for DLT sources.
    """

    def __init__(self, pipeline_name: str, destination_name: str, dataset_name: str):
        self.pipeline_name = pipeline_name
        self.destination_name = destination_name
        self.dataset_name = dataset_name

        self.pipeline = pipeline(
            pipeline_name=self.pipeline_name,
            destination=self.destination_name,
            dataset=self.dataset_name,
        )

    def load(self, source_data: Any) -> None:
        """
        Load data from the source. This method should be implemented by subclasses.
        """

        load_info = self.pipeline.run(source_data)
        metrics_logger.info(load_info)
