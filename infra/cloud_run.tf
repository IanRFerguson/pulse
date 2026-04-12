locals {
  cron_object = [
    "0 8 * * 1-5",
    "0 10 * * 1-5",
    "0 14 * * 1-5",
    "0 16 * * 1-5"
  ]
}

resource "google_cloud_run_v2_job" "data_pipeline" {
  name           = "tmc-pulse-data-pipeline"
  location       = "us-central1"
  client         = "gcloud"
  client_version = "552.0.0"

  template {
    template {
      service_account = null
      max_retries     = 0

      containers {
        image = var.production_docker_image

        command = ["uv"]
        args    = ["run", "/app/src/data_pipeline/run_pipeline.py"]

        // Postgres Connection variables
        env {
          name  = "DB_DRIVER"
          value = "postgresql"
        }
        env {
          name  = "DB_HOST"
          value = var.db_host
        }
        env {
          name  = "DB_PORT"
          value = var.db_port
        }
        env {
          name  = "DB_NAME"
          value = var.db_name
        }
        env {
          name  = "DB_USERNAME"
          value = var.db_username
        }
        env {
          name  = "DB_PASSWORD"
          value = var.db_password
        }

        // dlt Secrets variables
        env {
          name  = "SOURCES__GITHUB__ACCESS_TOKEN"
          value = var.github_access_token
        }
        env {
          name  = "SOURCES__ASANA__ACCESS_TOKEN"
          value = var.asana_access_token
        }
        env {
          name  = "SOURCES__FRESHDESK__DOMAIN"
          value = var.freshdesk_domain
        }
        env {
          name  = "SOURCES__FRESHDESK__API_SECRET_KEY"
          value = var.freshdesk_api_secret_key
        }
      }
    }
  }
}

resource "google_cloud_scheduler_job" "job" {
  for_each         = toset(local.cron_object)
  name             = "run-tmc-pulse-data-pipeline-${each.key}" # Added key to name to ensure uniqueness
  description      = "Triggers TMC Pulse data pipeline at ${each.key}"
  schedule         = each.value
  time_zone        = "America/New_York"
  region           = "us-central1"
  attempt_deadline = "320s"

  http_target {
    http_method = "POST"
    # The URL must point to the Google Cloud Run API 'run' action
    uri = "https://${google_cloud_run_v2_job.data_pipeline.location}-run.googleapis.com/v2/${google_cloud_run_v2_job.data_pipeline.id}:run"

    oidc_token {
      service_account_email = google_service_account.pulse_sa.email
      # Audience must be the base Google Cloud Run API
      audience = "https://${google_cloud_run_v2_job.data_pipeline.location}-run.googleapis.com/"
    }
  }
}
