locals {
  pulse_sa_roles = [
    "storage.admin",
    "cloudbuild.builds.editor",
    "logging.logWriter",
    "artifactregistry.createOnPushWriter",
    "run.admin",
    "run.invoker",
    "iam.serviceAccountUser",
    "iam.serviceAccountTokenCreator",
    "cloudsql.client",
  ]
}

resource "google_service_account" "pulse_sa" {
  account_id   = "pulse-sa"
  display_name = "TMC Pulse Service Account"
}

resource "google_project_iam_member" "pulse_sa_roles" {
  for_each = toset(local.pulse_sa_roles)
  project  = "ian-is-online"
  role     = "roles/${each.value}"
  member   = "serviceAccount:${google_service_account.pulse_sa.email}"
}

resource "google_service_account_key" "pulse_sa_key" {
  service_account_id = google_service_account.pulse_sa.name
}

resource "local_file" "pulse_sa_key" {
  content  = base64decode(google_service_account_key.pulse_sa_key.private_key)
  filename = "${path.module}/../.local/pulse_sa_key.json"
}
