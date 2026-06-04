{{
    config(
        materialized='incremental',
        incremental_strategy='merge',
        unique_key='surrogate_ticket_status_id',
        full_refresh=target.name == 'local',
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
    _inserted_at,
    _transformed_at

FROM {{ ref('stg__01__freshdesk') }}

{% if is_incremental() %}
    WHERE _inserted_at > (SELECT MAX(_inserted_at) FROM {{ this }}
{% endif %}