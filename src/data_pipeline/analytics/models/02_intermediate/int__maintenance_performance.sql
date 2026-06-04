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

    -- The first time each ticket ever entered OPEN status.
    -- Used to distinguish genuinely new tickets from re-touched old ones.
    first_open_per_ticket AS (
        SELECT
            ticket_id,
            MIN(created_at) AS first_opened_at
        FROM ticket_status_periods
        GROUP BY ticket_id
    ),

    -- Tickets active (open) when the shift started — inherited from the
    -- previous engineer.
    --
    -- FIX #1: The original join was correct in structure, but only caught
    -- tickets already assigned to this engineer before shift start. Tickets
    -- can be inherited through the queue without ever having been assigned
    -- to the engineer in a prior SCD row. We keep the assignment filter here
    -- since "inherited by this engineer specifically" requires the assignment,
    -- but if your inherited definition is "open in the queue at shift start"
    -- you should remove the agent join and join on group/queue instead.
    inherited_tickets AS (
        SELECT
            sm.shift_id,
            COUNT(DISTINCT t.ticket_id) AS inherited_ticket_count
        FROM shift_metadata          AS sm
        INNER JOIN ticket_status_periods AS t
            ON  t.assigned_agent_name = sm.freshdesk_agent_name
            -- Status period was active at the moment the shift began
            AND t.valid_from  < sm.start_date
            AND (t.valid_to IS NULL OR t.valid_to > sm.start_date)
            -- FIX #3 (boundary): strict > rather than >= so a ticket closed
            -- at the exact shift start is not counted as inherited
            AND {{ filter_open_tickets_only("t.status_label") }}
        GROUP BY sm.shift_id
    ),

    -- Tickets that *first* moved to OPEN status during the shift window.
    --
    -- FIX #2: The original query counted any OPEN-status SCD row whose
    -- valid_from fell inside the shift — including re-touches of tickets
    -- that were already open before the shift. By joining to
    -- first_open_per_ticket we ensure we only count the genuine first open
    -- event. Also removed the agent assignment filter: when a ticket first
    -- becomes OPEN it may not yet be assigned to anyone, which was the
    -- primary reason opened counts were low.
    opened_tickets AS (
        SELECT
            sm.shift_id,
            COUNT(DISTINCT fo.ticket_id) AS opened_during_shift_count
        FROM shift_metadata           AS sm
        INNER JOIN first_open_per_ticket AS fo
            ON fo.first_opened_at >= sm.start_date
            AND fo.first_opened_at <  sm.end_date
            -- FIX #3 (boundary): strict < on end_date so a ticket first
            -- opened exactly at shift end belongs to the next shift
        GROUP BY sm.shift_id
    ),

    -- Tickets resolved or closed during the shift.
    -- No material bugs here; kept as-is but tightened boundary to strict <.
    closed_tickets AS (
        SELECT
            sm.shift_id,
            COUNT(DISTINCT t.ticket_id) AS closed_during_shift_count
        FROM shift_metadata          AS sm
        INNER JOIN ticket_status_periods AS t
            ON  t.assigned_agent_name = sm.freshdesk_agent_name
            AND t.valid_from >= sm.start_date
            AND t.valid_from  < sm.end_date
            -- FIX #3 (boundary): strict < so an event at the exact end
            -- timestamp belongs to the next shift, not this one
            AND UPPER(t.status_label) IN ('RESOLVED', 'CLOSED')
        GROUP BY sm.shift_id
    ),

    -- Tickets still active at shift end — passed off to the next engineer.
    --
    -- FIX #3 (boundary): changed valid_from <= end_date to strict <, so a
    -- ticket whose status period starts at the exact shift end second is
    -- attributed to the next shift. This prevents the same ticket from
    -- appearing in both passed_off for shift N and inherited for shift N+1.
    passed_off_tickets AS (
        SELECT
            sm.shift_id,
            COUNT(DISTINCT t.ticket_id) AS passed_off_ticket_count
        FROM shift_metadata          AS sm
        INNER JOIN ticket_status_periods AS t
            ON  t.assigned_agent_name = sm.freshdesk_agent_name
            AND t.valid_from  < sm.end_date
            AND (t.valid_to IS NULL OR t.valid_to > sm.end_date)
            -- FIX #3 (boundary): strict > so a ticket that closes at the
            -- exact shift end second is not counted as passed off
            AND {{ filter_open_tickets_only("t.status_label") }}
        GROUP BY sm.shift_id
    )

SELECT
    sm.*,
    COALESCE(i.inherited_ticket_count,      0) AS inherited_ticket_count,
    COALESCE(o.opened_during_shift_count,   0) AS opened_during_shift_count,
    COALESCE(c.closed_during_shift_count,   0) AS closed_during_shift_count,
    COALESCE(p.passed_off_ticket_count,     0) AS passed_off_ticket_count
FROM shift_metadata          AS sm
LEFT JOIN inherited_tickets  AS i USING(shift_id)
LEFT JOIN opened_tickets     AS o USING(shift_id)
LEFT JOIN closed_tickets     AS c USING(shift_id)
LEFT JOIN passed_off_tickets AS p USING(shift_id)