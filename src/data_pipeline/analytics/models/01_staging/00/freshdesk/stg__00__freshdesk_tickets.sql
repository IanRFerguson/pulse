WITH
    base AS (
        SELECT

            id AS ticket_id,
            subject AS ticket_subject,
            group_id,
            type AS ticket_type,
            responder_id,
            assigned_agent_name,
            created_at,
            updated_at,
            DATE(due_by) AS due_by_date,
            status,
            priority,
            _inserted_at,
            _transformed_at

        FROM {{ ref("base_freshdesk__tickets") }}
    )

SELECT

    ticket_id,
    ticket_subject,
    group_id,
    ticket_type,
    responder_id,
    assigned_agent_name,
    created_at,
    updated_at,
    due_by_date,
    status,
    {{ get_status_label("status") }} AS status_label,
    priority,
    _inserted_at,
    _transformed_at,
    {{ dbt_utils.generate_surrogate_key(["ticket_id"]) }} AS surrogate_ticket_id,
    {{ dbt_utils.generate_surrogate_key(["ticket_id", "status", "updated_at"]) }} AS surrogate_ticket_status_id

FROM base