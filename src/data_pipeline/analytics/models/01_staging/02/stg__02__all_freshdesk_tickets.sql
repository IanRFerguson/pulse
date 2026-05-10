{{
    config(
        materialized='incremental',
        incremental_strategy='merge',
        unique_key='surrogate_ticket_status_id',
        full_refresh=false,
        tags=["freshdesk"],
        on_schema_change='sync_all_columns'
    )
}}

SELECT

    surrogate_ticket_id,
    surrogate_ticket_status_id,
    ticket_id,
    ticket_subject,
    assigned_agent_name,
    group_id,
    ticket_type,
    status,
    status_label,
    priority,
    created_at,
    updated_at AS valid_from,
    CURRENT_TIMESTAMP AS _dbt_loaded_at

FROM {{ ref('stg__01__freshdesk') }}

{% if is_incremental() %}
    WHERE surrogate_ticket_status_id NOT IN (
        SELECT surrogate_ticket_status_id
        FROM {{ this }}
    )
{% endif %}