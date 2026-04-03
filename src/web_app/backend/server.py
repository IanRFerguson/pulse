from flask import Flask

from common import metrics_logger

from .config import FlaskConfig
from .models import db

#####

app = Flask(__name__)
app.config.from_object(FlaskConfig())

app.logger = metrics_logger
app.logger.handlers = metrics_logger.handlers

db.init_app(app)


@app.route("/")
def home():
    return "Hello, World!"
