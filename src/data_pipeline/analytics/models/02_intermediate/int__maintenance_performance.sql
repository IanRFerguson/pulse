WITH
    shift_metadata AS (
        SELECT
            tm.team_member_id,
            tm.user_name,
            tm.freshdesk_fk                 AS freshdesk_agent_name,
            ms.id                           AS shift_id,
            ms.start_date,
            ms.end_date
        FROM {{ ref('stg__01__team_members') }}      AS tm
        INNER JOIN {{ source('backend', 'maintenance_shifts') }} AS ms
            USING(team_member_id)
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

    -- Strip same-status duplicate rows before computing period windows.
    -- Freshdesk's updated_at fires on any field edit, so raw snapshots can
    -- have consecutive rows with the same status and a different updated_at.
    ticket_status_transitions AS (
        SELECT ticket_id, assigned_agent_name, status, status_label, created_at, valid_from
        FROM (
            SELECT
                *,
                LAG(status) OVER (PARTITION BY ticket_id ORDER BY valid_from) AS prev_status
            FROM ticket_churn
        ) AS _transitions
        WHERE prev_status IS NULL OR status != prev_status
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
        FROM ticket_status_transitions
    ),

    -- The first time each ticket entered the engineering group's queue.
    -- A ticket may have originated in another group; valid_from captures
    -- when it became our team's responsibility, not when it was created.
    first_assigned_to_team AS (
        SELECT
            ticket_id,
            MIN(valid_from) AS first_assigned_at
        FROM ticket_status_periods
        GROUP BY ticket_id
    ),

    -- Tickets first assigned to our team during the shift window.
    opened_tickets AS (
        SELECT
            sm.shift_id,
            COUNT(DISTINCT fa.ticket_id) AS opened_during_shift_count
        FROM shift_metadata               AS sm
        INNER JOIN first_assigned_to_team AS fa
            ON  fa.first_assigned_at >= sm.start_date
            AND fa.first_assigned_at <  sm.end_date
        GROUP BY sm.shift_id
    ),

    -- Team tickets that moved to resolved or closed during the shift.
    closed_tickets AS (
        SELECT
            sm.shift_id,
            COUNT(DISTINCT t.ticket_id) AS closed_during_shift_count
        FROM shift_metadata          AS sm
        INNER JOIN ticket_status_periods AS t
            ON  t.valid_from >= sm.start_date
            AND t.valid_from  < sm.end_date
            AND UPPER(t.status_label) IN ('RESOLVED', 'CLOSED')
        GROUP BY sm.shift_id
    ),

    -- Team tickets still open at shift end — carried into the next shift.
    passed_off_tickets AS (
        SELECT
            sm.shift_id,
            COUNT(DISTINCT t.ticket_id) AS passed_off_ticket_count
        FROM shift_metadata          AS sm
        INNER JOIN ticket_status_periods AS t
            ON  t.valid_from  < sm.end_date
            AND (t.valid_to IS NULL OR t.valid_to > sm.end_date)
            AND {{ filter_open_tickets_only("t.status_label") }}
        GROUP BY sm.shift_id
    )

SELECT
    sm.*,
    COALESCE(o.opened_during_shift_count,   0) AS opened_during_shift_count,
    COALESCE(c.closed_during_shift_count,   0) AS closed_during_shift_count,
    COALESCE(p.passed_off_ticket_count,     0) AS passed_off_ticket_count
FROM shift_metadata          AS sm
LEFT JOIN opened_tickets     AS o USING(shift_id)
LEFT JOIN closed_tickets     AS c USING(shift_id)
LEFT JOIN passed_off_tickets AS p USING(shift_id)
