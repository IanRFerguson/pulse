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

    teams AS (
        SELECT
            team_id,
            team_name
        FROM {{ ref("stg__01__team_members") }}
        WHERE active
        GROUP BY 1,2
    )

SELECT 
    
    sp.id AS sprint_period_id,

    tm.team_id,
    tm.team_name,

    sp.friendly_name AS sprint_period_name,
    sp.start_date,
    sp.end_date,

    COUNT(
        CASE
            WHEN spbm.user_name IS NOT NULL AND spbm.total_sprint_points IS NOT NULL
                THEN 1
            ELSE NULL
        END
    ) AS total_team_members,
    SUM(total_sprint_points) AS total_sprint_points,
    SUM(total_tasks_assigned) AS total_tasks_assigned,
    SUM(sprint_points_1) AS sprint_points_1,
    SUM(sprint_points_2) AS sprint_points_2,
    SUM(sprint_points_3) AS sprint_points_3,
    SUM(sprint_points_5) AS sprint_points_5,
    SUM(sprint_points_8) AS sprint_points_8,
    SUM(sprint_points_11) AS sprint_points_11,
    SUM(priority_low_priority) AS priority_low_priority,
    SUM(priority_medium_priority) AS priority_medium_priority,
    SUM(priority_high_priority) AS priority_high_priority,
    SUM(priority_urgent) AS priority_urgent

FROM sprint_periods sp
LEFT JOIN teams tm
    USING(team_id)
LEFT JOIN {{ ref("int__01__sprint_performance_by_member") }} spbm
    ON spbm.sprint_period_id = sp.id
    AND spbm.team_id = tm.team_id
GROUP BY 1,2,3,4,5,6