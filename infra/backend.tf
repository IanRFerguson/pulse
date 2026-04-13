// NOTE - Ian manages this state in an external bucket to
// prevent accidental deletion of the state file.
terraform {
  backend "gcs" {
    bucket = "ian-dev"
    prefix = "terraform/state/tmc-pulse"
  }
}
