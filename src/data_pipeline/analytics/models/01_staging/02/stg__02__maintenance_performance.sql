WITH
    shift_metadata AS (
        SELECT
        
            tm.team_member_id,
            tm.user_name,
            tm.freshdesk_fk AS freshdesk_agent_name,
            ms.id as shift_id,
            ms.start_time::date as start_date,
            ms.end_time ::date as end_date
        
        FROM {{ ref('stg__01__team_members') }} AS tm
        INNER JOIN {{ source('backend', 'maintenance_shifts') }} AS ms
            USING(team_member_id)
        WHERE tm.active
    ),

    ticket_churn AS (
        SELECT
            ticket_id,
            assigned_agent_name,
            status,
            status_label,
            created_at,
            valid_from
        FROM {{ ref('stg__02__all_freshdesk_tickets') }}
        WHERE group_id = {{ var('engineering_freshdesk_group') }} 
    ),

    -- Compute the active window for each status period
    ticket_status_periods AS (
        SELECT
            ticket_id,
            assigned_agent_name,
            status,
            status_label,
            created_at,
            valid_from,
            LEAD(valid_from) OVER (
                PARTITION BY ticket_id ORDER BY valid_from
            ) AS valid_to
        FROM ticket_churn
    ),

    -- Tickets active when the shift started (inherited from previous engineer)
    inherited_tickets AS (
        SELECT
            sm.shift_id,
            COUNT(DISTINCT t.ticket_id) AS inherited_ticket_count
        FROM shift_metadata AS sm
        INNER JOIN ticket_status_periods AS t
            ON t.assigned_agent_name = sm.freshdesk_agent_name
            AND t.valid_from::date < sm.start_date
            AND (t.valid_to IS NULL OR t.valid_to::date >= sm.start_date)
            AND {{ filter_open_tickets_only("t.status_label") }}
        GROUP BY sm.shift_id
    ),

    -- Tickets that moved to 'open' status during the shift
    opened_tickets AS (
        SELECT
            sm.shift_id,
            COUNT(DISTINCT t.ticket_id) AS opened_during_shift_count
        FROM shift_metadata AS sm
        INNER JOIN ticket_status_periods AS t
            ON t.assigned_agent_name = sm.freshdesk_agent_name
            AND t.valid_from::date BETWEEN sm.start_date AND sm.end_date
            AND UPPER(t.status_label) = 'OPEN'
        GROUP BY sm.shift_id
    ),

    -- Tickets resolved or closed during the shift
    closed_tickets AS (
        SELECT
            sm.shift_id,
            COUNT(DISTINCT t.ticket_id) AS closed_during_shift_count
        FROM shift_metadata AS sm
        INNER JOIN ticket_status_periods AS t
            ON t.assigned_agent_name = sm.freshdesk_agent_name
            AND t.valid_from::date BETWEEN sm.start_date AND sm.end_date
            AND {{ filter_open_tickets_only("t.status_label") }}
        GROUP BY sm.shift_id
    ),

    -- Tickets still active at shift end (passed off to next engineer)
    passed_off_tickets AS (
        SELECT
            sm.shift_id,
            COUNT(DISTINCT t.ticket_id) AS passed_off_ticket_count
        FROM shift_metadata AS sm
        INNER JOIN ticket_status_periods AS t
            ON t.assigned_agent_name = sm.freshdesk_agent_name
            AND t.valid_from::date <= sm.end_date
            AND (t.valid_to IS NULL OR t.valid_to::date > sm.end_date)
            AND {{ filter_open_tickets_only("t.status_label") }}
        GROUP BY sm.shift_id
    )

SELECT
    sm.*,
    COALESCE(i.inherited_ticket_count, 0)      AS inherited_ticket_count,
    COALESCE(o.opened_during_shift_count, 0)   AS opened_during_shift_count,
    COALESCE(c.closed_during_shift_count, 0)   AS closed_during_shift_count,
    COALESCE(p.passed_off_ticket_count, 0)     AS passed_off_ticket_count
FROM shift_metadata AS sm
LEFT JOIN inherited_tickets     AS i USING(shift_id)
LEFT JOIN opened_tickets        AS o USING(shift_id)
LEFT JOIN closed_tickets        AS c USING(shift_id)
LEFT JOIN passed_off_tickets    AS p USING(shift_id)