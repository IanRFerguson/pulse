SELECT
    {{ 
        dbt_utils.star(
            from=source('asana', 'project_tasks__custom_fields')
        ) 
    }}
FROM {{ source('asana', 'project_tasks__custom_fields') }}