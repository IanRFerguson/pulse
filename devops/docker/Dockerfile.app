FROM node:20-bullseye AS build

WORKDIR /app

COPY ./src/web_app/frontend/package*.json ./
RUN npm install

COPY ./src/web_app/frontend . 
RUN npm run build

FROM python:3.12-slim

WORKDIR /app

COPY pyproject.toml .
COPY uv.lock .

# This is goofy but it allows us to cache the dependencies in a layer and not 
# have to re-install them every time we change the source code
COPY README.md .

RUN pip install --no-cache-dir uv
RUN uv sync --group web_app --no-install-project

COPY ./src/web_app web_app
COPY ./src/common common

RUN mkdir -p ./web_app/frontend/dist
COPY --from=build /app/dist ./web_app/frontend/dist

EXPOSE 5000
CMD ["uv", "run", "gunicorn", "-b", "0.0.0.0:5000", "web_app.backend.wsgi:application"]