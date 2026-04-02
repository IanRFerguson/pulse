import logging
import os
import sys

from colorlog import ColoredFormatter

#####


metrics_logger = logging.getLogger(__name__)
_handler = logging.StreamHandler(sys.stdout)
_formatter = ColoredFormatter(
    "%(log_color)s%(levelname)s%(reset)s %(message)s",
    reset=True,
    log_colors={
        "DEBUG": "cyan",
        "INFO": "green",
        "WARNING": "yellow",
        "ERROR": "red",
        "CRITICAL": "red,bg_white",
    },
    style="%",
)

_handler.setFormatter(_formatter)
metrics_logger.addHandler(_handler)
metrics_logger.setLevel("INFO")

if os.environ.get("DEBUG") == "true":
    metrics_logger.setLevel("DEBUG")
    metrics_logger.debug("Logging at debug level")
