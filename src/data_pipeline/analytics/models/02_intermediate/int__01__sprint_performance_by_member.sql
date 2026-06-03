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
            COUNT(DISTINCT task_id) AS total_tasks_assigned,
            COUNT(
                CASE
                    WHEN (completed_on::DATE >= sp.start_date AND completed_on <= sp.end_date 
                        -- NOTE: We added this field after the pipeline was originally built
                        -- Rather than default to "late" we'll default to on-time and let the data be updated as we backfill this field
                        OR completed_on IS NULL)
                        AND completed = TRUE 
                        THEN 1
                    ELSE NULL
                END
            ) AS tasks_completed_on_time,

            -- Get a count of how many tasks were assigned to this team member 
            --in each sprint, broken out by sprint points
            {{ aggregate_by_column('1', 'sprint_points') }},
            {{ aggregate_by_column('2', 'sprint_points') }},
            {{ aggregate_by_column('3', 'sprint_points') }},
            {{ aggregate_by_column('5', 'sprint_points') }},
            {{ aggregate_by_column('8', 'sprint_points') }},
            {{ aggregate_by_column('11', 'sprint_points') }},

            {{ aggregate_by_column('Low Priority', 'priority') }},
            {{ aggregate_by_column('Medium Priority', 'priority') }},
            {{ aggregate_by_column('High Priority', 'priority') }},
            {{ aggregate_by_column('Urgent - Top Priority', 'priority') }}

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
    ) AS average_points_per_task,
    ROUND(
        p.tasks_completed_on_time::NUMERIC / NULLIF(p.total_tasks_assigned, 0), 3
    ) AS on_time_completion_rate,

    p.sprint_points_1,
    p.sprint_points_2,
    p.sprint_points_3,
    p.sprint_points_5,
    p.sprint_points_8,
    p.sprint_points_11,
    p.priority_low_priority,
    p.priority_medium_priority,
    p.priority_high_priority,
    p.priority_urgent___top_priority AS priority_urgent

FROM sprint_periods sp
LEFT JOIN team_members tm
    USING(team_id)
LEFT JOIN performance p
    ON tm.team_member_id = p.team_member_id
    AND sp.id = p.sprint_period_id