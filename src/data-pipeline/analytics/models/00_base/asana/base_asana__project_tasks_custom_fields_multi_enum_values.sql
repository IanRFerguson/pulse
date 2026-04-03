SELECT
    {{ 
        dbt_utils.star(
            from=source('asana', 'project_tasks__custom_fields__multi_enum_values')
        ) 
    }}
FROM {{ source('asana', 'project_tasks__custom_fields__multi_enum_values') }}