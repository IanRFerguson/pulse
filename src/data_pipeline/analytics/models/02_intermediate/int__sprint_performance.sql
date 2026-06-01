WITH
    sprint_periods AS (
        SELECT
            {{
                dbt_utils.star(
                    source("backend", "sprint_period")
                )
            }}
        FROM {{ source("backend", "sprint_period") }}
    ),

    team_members AS (
        SELECT

            tm.team_member_id,
            tm.user_name,
            tm.team_id,
            tm.team_name,
            tm.asana_fk

        FROM {{ ref("stg__01__team_members") }} tm
        WHERE tm.active
    ),

    performance AS (
        SELECT

            tm.team_member_id,
            sp.id AS sprint_period_id,
            SUM(sprint_points::NUMERIC) AS total_sprint_points,
            COUNT(DISTINCT task_id) AS total_tasks_assigned

        FROM {{ ref("stg__01__asana") }} a
        JOIN sprint_periods sp
            ON a.added_to_sprint::DATE BETWEEN sp.start_date AND sp.end_date
        JOIN team_members tm
            ON a.assignee_name = tm.asana_fk
        GROUP BY 1,2
    )

SELECT 
    
    sp.id AS sprint_period_id,

    tm.team_id,
    tm.team_name,
    tm.user_name,

    sp.friendly_name AS sprint_period_name,
    sp.start_date,
    sp.end_date,

    p.total_sprint_points,
    p.total_tasks_assigned,
    ROUND(
        p.total_sprint_points::NUMERIC / NULLIF(p.total_tasks_assigned, 0), 3
    ) AS average_points_per_task

FROM sprint_periods sp
LEFT JOIN team_members tm
    USING(team_id)
LEFT JOIN performance p
    ON tm.team_member_id = p.team_member_id
    AND sp.id = p.sprint_period_id