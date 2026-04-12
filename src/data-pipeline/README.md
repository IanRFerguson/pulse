# Data Pipeline

ETL pipeline for ingesting and transforming data from multiple sources.

## Components

- **load/** - Data ingestion from external sources (Asana, Freshdesk, GitHub)
- **analytics/** - dbt project for data modeling and transformation
- **run_pipeline.py** - Main pipeline orchestration
  - You can run this from the root directory with `uv run src/data-pipeline/run_pipeline.py`
- **task_scheduler.py** - Scheduled pipeline execution

## Architecture

Data flows from external sources → dlt ingestion → Postgres → dbt transformations, before being picked up by the web application (see [the README](../web_app/README.md)).

When you spin up the web app with Docker Compose, the pipeline is automatically scheduled to run every 5 minutes in order to keep the data fresh in the dashboard.
