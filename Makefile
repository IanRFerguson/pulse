.PHONY: ruff mypy
ruff:
	@uv run ruff check --fix .
	@uv run ruff format .

mypy:
	@uv run mypy src/