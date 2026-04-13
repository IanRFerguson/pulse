locals {
  pulse_sa_roles = [
    "storage.admin",
    "cloudbuild.builds.editor",
    "logging.logWriter",
    "artifactregistry.createOnPushWriter",
    "run.admin",
    "iam.serviceAccountUser",
    "iam.serviceAccountTokenCreator",
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
