SELECT

    ticket_id,
    ticket_subject,
    assigned_agent_name,
    created_at,
    updated_at,
    CURRENT_DATE - created_at::DATE AS days_active,
    due_by_date::DATE < CURRENT_DATE AS is_overdue,
    due_by_date,
    status,
    priority,
    surrogate_ticket_id

FROM {{ ref("stg__00__freshdesk_tickets") }}