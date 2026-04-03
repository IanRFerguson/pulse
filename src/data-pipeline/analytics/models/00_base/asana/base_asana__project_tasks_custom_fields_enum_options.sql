SELECT
    {{ 
        dbt_utils.star(
            from=source('asana', 'project_tasks__custom_fields__enum_options')
        ) 
    }}
FROM {{ source('asana', 'project_tasks__custom_fields__enum_options') }}