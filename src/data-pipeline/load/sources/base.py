from typing import Any

import dlt
from pydantic import BaseModel, PrivateAttr

from src.common import metrics_logger

#####


class DltSource(BaseModel):
    """
    Base class for DLT sources.
    """

    pipeline_name: str
    destination_name: str
    dataset_name: str

    _pipeline: Any = PrivateAttr(default=None)

    def model_post_init(self, __context: Any) -> None:
        self._pipeline = dlt.pipeline(
            self.pipeline_name,
            destination=self.destination_name,
            dataset_name=self.dataset_name,
        )

    def load(self, source_data: Any) -> None:
        """
        Load data from the source. This method should be implemented by subclasses.
        """

        load_info = self._pipeline.run(source_data)
        metrics_logger.info(load_info)
