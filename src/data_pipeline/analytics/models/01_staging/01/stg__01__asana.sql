SELECT

    task_id,
    name,
    assignee_id,
    assignee_name,
    completed,
    modified_at,
    due_on,

    CASE
        WHEN due_on::DATE < CURRENT_DATE THEN TRUE
        ELSE FALSE
    END AS is_overdue,
    CASE
        WHEN "Is Blocked" = 'BLOCKED' THEN TRUE
        ELSE FALSE
    END AS is_blocked,
    CURRENT_DATE - modified_at::DATE AS days_active,

    -- Custom fields
    "Priority" AS priority,
    "Sprint Planning" AS sprint_planning,
    "Started On" AS started_on,
    "Added to Sprint" AS added_to_sprint,
    COALESCE(
        "Complexity - Sprint Points",
        "Sprint Points",
        NULL
    ) AS sprint_points,

    tasks.surrogate_task_id


FROM {{ ref("stg__00__asana_tasks") }} AS tasks
LEFT JOIN {{ ref("stg__00__asana_custom_fields") }} AS custom_fields
    ON tasks._dlt_id = custom_fields._dlt_parent_id