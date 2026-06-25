{{
    config(
        materialized='incremental',
        incremental_strategy='append',
        full_refresh=false,
        tags=["freshdesk"],
        on_schema_change='sync_all_columns'
    )
}}

SELECT
  
    group_id,
    COUNT(DISTINCT surrogate_ticket_id) AS ticket_count,
    CURRENT_TIMESTAMP AS _inserted_at

FROM {{ ref("stg__01__freshdesk")}}
WHERE group_id = {{ var("engineering_freshdesk_group") }}
    AND status_label NOT IN ('closed', 'resolved')
GROUP BY 1