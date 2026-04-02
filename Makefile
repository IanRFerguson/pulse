.PHONY: ruff mypy
ruff:
	@uv run ruff check --fix .
	@uv run ruff format .

mypy:
	@uv run mypy src/

pytest:
	@uv run pytest -v tests/