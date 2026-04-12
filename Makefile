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

docker:
	@uv run \
		devops/push_docker_image.py \
		--dockerfile ./devops/docker/Dockerfile.pipe