{{
    config(
        materialized='incremental',
        incremental_strategy='append',
        full_refresh=false,
        tags=["freshdesk"]
    )
}}

SELECT

    surrogate_ticket_id,
    {{ dbt_utils.generate_surrogate_key(['ticket_id', 'status', 'updated_at']) }} AS surrogate_ticket_status_id,
    ticket_id,
    ticket_subject,
    assigned_agent_name,
    group_id,
    ticket_type,
    status,
    priority,
    created_at,
    updated_at AS valid_from,
    CURRENT_TIMESTAMP AS _dbt_loaded_at

FROM {{ ref('stg__01__freshdesk') }}

{% if is_incremental() %}
    WHERE updated_at > (SELECT MAX(valid_from) FROM {{ this }})
{% endif %}