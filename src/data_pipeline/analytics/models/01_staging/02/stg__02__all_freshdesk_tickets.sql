{{
    config(
        materialized='incremental',
        incremental_strategy='delete+insert',
        unique_key='surrogate_ticket_status_id',
        full_refresh=target.name == 'local',
        tags=["freshdesk"],
        on_schema_change='sync_all_columns'
    )
}}

{% if is_incremental() %}
WITH max_filter AS (
    SELECT MAX(_inserted_at) AS max_ts FROM {{ this }}
)
{% endif %}

SELECT

    surrogate_ticket_id,
    surrogate_ticket_status_id,
    ticket_id,
    ticket_subject,
    group_id,
    responder_id,
    assigned_agent_name,
    ticket_type,
    status,
    status_label,
    priority,
    created_at,
    updated_at AS valid_from,
    _inserted_at,
    _transformed_at

FROM {{ ref('stg__01__freshdesk') }}

{% if is_incremental() %}
CROSS JOIN max_filter
WHERE _inserted_at > max_filter.max_ts
{% endif %}
