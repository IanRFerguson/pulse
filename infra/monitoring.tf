resource "google_monitoring_notification_channel" "email" {
  display_name = "TMC Pulse Alerts Email"
  type         = "email"

  labels = {
    email_address = var.alert_email
  }
}

resource "google_monitoring_alert_policy" "data_pipeline_failure" {
  display_name = "TMC Pulse data pipeline failed"
  combiner     = "OR"

  conditions {
    display_name = "Cloud Run job execution failed"

    condition_threshold {
      filter          = "resource.type = \"cloud_run_job\" AND resource.labels.job_name = \"${google_cloud_run_v2_job.data_pipeline.name}\" AND metric.type = \"run.googleapis.com/job/completed_execution_count\" AND metric.labels.result = \"failed\""
      comparison      = "COMPARISON_GT"
      threshold_value = 0
      duration        = "0s"

      aggregations {
        alignment_period   = "300s"
        per_series_aligner = "ALIGN_SUM"
      }

      trigger {
        count = 1
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email.id]

  alert_strategy {
    auto_close = "1800s"
  }

  documentation {
    content   = "The `${google_cloud_run_v2_job.data_pipeline.name}` Cloud Run job failed. Check the execution logs in Cloud Run for details."
    mime_type = "text/markdown"
  }
}
