from flask import Flask, render_template

from common import metrics_logger

from .config import FlaskConfig
from .models import db
from .routes import bp as api_bp

#####

app = Flask(
    __name__,
    static_folder="../frontend/dist",
    static_url_path="/",
    template_folder="../frontend/dist",
)
app.config.from_object(FlaskConfig())

app.logger = metrics_logger
app.logger.handlers = metrics_logger.handlers

db.init_app(app)

app.register_blueprint(api_bp)


@app.route("/")
def home():
    return render_template("index.html")
