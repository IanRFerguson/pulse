resource "google_storage_bucket" "data_pipeline_bucket" {
  name                        = "pulse-data-pipeline-bucket"
  location                    = "US"
  force_destroy               = true
  uniform_bucket_level_access = true

  lifecycle {
    prevent_destroy = false
  }
}
