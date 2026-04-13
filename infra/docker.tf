resource "google_artifact_registry_repository" "tmc-pulse-repo" {
  location      = "us-central1"
  repository_id = "tmc-pulse"
  description   = "TMC Pulse Docker Repository"
  format        = "DOCKER"
}
