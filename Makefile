.PHONY: ruff mypy app
ruff:
	@uv run ruff check --fix .
	@uv run ruff format .

mypy:
	@uv run mypy src/

pytest:
	@uv run pytest -v tests/

app:
	@docker compose up --build

backend:
	@docker compose up --build web-app

frontend:
	@cd src/web_app/frontend && npm run dev

docker:
	@uv run \
		devops/push_docker_image.py \
		--dockerfile ./devops/docker/Dockerfile.pipe