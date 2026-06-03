SELECT

    team_id,
    team_name,

    AVG(total_sprint_points) AS avg_sprint_points,
    AVG(total_tasks_assigned) AS avg_tasks_assigned,
    AVG(average_on_time_completion_rate) AS avg_tasks_completed_on_time,
    
    AVG(sprint_points_1) AS avg_sprint_points_1,
    AVG(sprint_points_2) AS avg_sprint_points_2,
    AVG(sprint_points_3) AS avg_sprint_points_3,
    AVG(sprint_points_5) AS avg_sprint_points_5,
    AVG(sprint_points_8) AS avg_sprint_points_8,
    AVG(sprint_points_11) AS avg_sprint_points_11,
    
    AVG(priority_low_priority) AS avg_priority_low_priority,
    AVG(priority_medium_priority) AS avg_priority_medium_priority,
    AVG(priority_high_priority) AS avg_priority_high_priority,
    AVG(priority_urgent) AS avg_priority_urgent

FROM {{ ref("int__01__sprint_performance_by_team") }}
GROUP BY 1,2