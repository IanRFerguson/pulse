{{
    config(
        alias="average_sprint_performance_by_member",
    )
}}

SELECT
    {{
        dbt_utils.star(
            ref('int__02__sprint_performance_by_member'),
        )
    }}
FROM {{ ref('int__02__sprint_performance_by_member') }}