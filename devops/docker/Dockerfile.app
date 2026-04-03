FROM python:3.12-slim

WORKDIR /app

COPY pyproject.toml .

# This is goofy but it allows us to cache the dependencies in a layer and not 
# have to re-install them every time we change the source code
COPY README.md .

RUN pip install --no-cache-dir uv
RUN uv sync --group web_app --no-install-project

COPY ./src/web-app web_app
COPY ./src/common common

EXPOSE 5000
CMD ["uv", "run", "gunicorn", "-b", "0.0.0.0:5000", "web_app.backend.wsgi:application"]