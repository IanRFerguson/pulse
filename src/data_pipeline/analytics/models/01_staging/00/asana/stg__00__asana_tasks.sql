WITH
    base AS (
        SELECT

            gid AS task_id,
            completed,
            modified_at,
            name,
            due_on,

            assignee__gid AS assignee_id,
            assignee__name AS assignee_name,

            _dlt_id

        FROM {{ ref("base_asana__project_tasks") }}
    )

SELECT

    task_id,
    completed,
    modified_at,
    name,
    due_on,

    assignee_id,
    assignee_name,

    _dlt_id,
    {{ dbt_utils.generate_surrogate_key(['task_id']) }} AS surrogate_task_id

FROM base