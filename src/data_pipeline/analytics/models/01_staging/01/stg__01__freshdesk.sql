SELECT

    ticket_id,
    ticket_subject,
    assigned_agent_name,
    group_id,
    ticket_type,
    created_at,
    updated_at,
    CURRENT_DATE - created_at::DATE AS days_active,
    due_by_date::DATE < CURRENT_DATE AS is_overdue,
    due_by_date,
    status,
    status_label,
    priority,
    surrogate_ticket_id,
    surrogate_ticket_status_id

FROM {{ ref("stg__00__freshdesk_tickets") }}