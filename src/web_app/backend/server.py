from flask import Flask

from common import metrics_logger

from .config import FlaskConfig
from .models import db
from .routes import bp as api_bp

#####

app = Flask(__name__)
app.config.from_object(FlaskConfig())

app.logger = metrics_logger
app.logger.handlers = metrics_logger.handlers

db.init_app(app)

app.register_blueprint(api_bp)


@app.route("/")
def home():
    return "Hello, World!"
