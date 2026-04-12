variable "project_id" {
  description = "The ID of the GCP project to deploy to."
  type        = string
}

variable "bucket_name" {
  description = "The name of the GCS bucket to store the Terraform state."
  type        = string
}

variable "production_docker_image" {
  description = "The Docker image to use for the production environment."
  type        = string
  default     = "us-central1-docker.pkg.dev/ian-is-online/tmc-pulse/pulse:latest"
}

// Postgres Connection variables
variable "db_host" {
  description = "The hostname of the Postgres database."
  type        = string
}

variable "db_port" {
  description = "Port to connect to Postgres with"
  type        = number
}

variable "db_name" {
  description = "The name of the Postgres database."
  type        = string
}

variable "db_username" {
  description = "The username to connect to the Postgres database with."
  type        = string
}

variable "db_password" {
  description = "The password to connect to the Postgres database with."
  type        = string
  sensitive   = true
}


// dlt Secrets variables
variable "github_access_token" {
  description = "The access token to connect to the GitHub API with."
  type        = string
  sensitive   = true
}

variable "asana_access_token" {
  description = "The access token to connect to the Asana API with."
  type        = string
  sensitive   = true
}

variable "freshdesk_domain" {
  description = "The domain of the Freshdesk account to connect to."
  type        = string
}

variable "freshdesk_api_secret_key" {
  description = "The API secret key to connect to the Freshdesk API with."
  type        = string
  sensitive   = true
}
