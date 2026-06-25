WITH
    sprint_period_metadata AS (
        SELECT
            {{
                dbt_utils.star(
                    ref("int__00__sprint_period_metadata")
                )
            }}
        FROM {{ ref("int__00__sprint_period_metadata") }}
    ),

    performance AS (
        SELECT

            spm.team_member_sprint_id,
        
            SUM(sprint_points::NUMERIC) AS total_sprint_points,
            COUNT(DISTINCT task_id) AS total_tasks_assigned,
            COUNT(
                CASE
                    WHEN (completed_on::DATE >= spm.start_date AND completed_on <= spm.end_date
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
        JOIN sprint_period_metadata spm
            ON a.added_to_sprint::DATE BETWEEN spm.start_date::DATE AND spm.end_date::DATE
            AND a.assignee_name = spm.asana_fk
        GROUP BY 1
    )

SELECT

    spm.sprint_period_id,

    spm.team_id,
    spm.team_name,
    spm.user_name,

    spm.friendly_name AS sprint_period_name,
    spm.start_date,
    spm.end_date,
    spm.working_days,

    p.total_sprint_points,
    p.total_tasks_assigned,
    p.tasks_completed_on_time,

    (p.total_sprint_points / NULLIF(spm.working_days, 0)) AS average_points_per_work_day,
    (p.total_tasks_assigned / NULLIF(spm.working_days, 0)) AS average_tasks_per_work_day,

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

FROM sprint_period_metadata spm
LEFT JOIN performance p
    ON spm.team_member_sprint_id = p.team_member_sprint_id