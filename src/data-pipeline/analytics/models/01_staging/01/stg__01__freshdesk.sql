SELECT

    ticket_id,
    ticket_subject,
    assigned_agent_name,
    created_at,
    updated_at,
    due_by_date,
    status,
    priority,
    surrogate_ticket_id

FROM {{ ref("stg__00__freshdesk_tickets") }}