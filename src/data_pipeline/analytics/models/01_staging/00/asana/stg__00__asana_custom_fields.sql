WITH
    base AS (
        SELECT

            gid AS custom_field_id,
            enabled,
            name,
            description,
            display_value,
            _dlt_parent_id

        FROM {{ ref("base_asana__project_tasks_custom_fields")}}
    )

SELECT

    _dlt_parent_id,

    {{ dbt_utils.pivot(
        'name',
        dbt_utils.get_column_values(ref('base_asana__project_tasks_custom_fields'), 'name'),
        agg='MAX',
        then_value='display_value',
        else_value='NULL'
    ) }},

    {{ dbt_utils.generate_surrogate_key(['_dlt_parent_id']) }} AS surrogate_task_id

FROM base
GROUP BY _dlt_parent_id