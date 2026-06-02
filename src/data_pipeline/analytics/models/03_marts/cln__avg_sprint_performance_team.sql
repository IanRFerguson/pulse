{{
    config(
        alias="average_sprint_performance_by_team"
    )
}}

SELECT
    {{
        dbt_utils.star(
            ref('int__02__sprint_performance_by_team'),
        )
    }}
FROM {{ ref('int__02__sprint_performance_by_team') }}