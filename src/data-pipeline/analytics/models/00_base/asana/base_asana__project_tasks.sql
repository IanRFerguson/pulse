SELECT
    {{ 
        dbt_utils.star(
            from=source('asana', 'project_tasks')
        ) 
    }}
FROM {{ source('asana', 'project_tasks') }}