{{
    config(
        alias="sprint_performance_by_team"
    )
}}

SELECT
    {{
        dbt_utils.star(
            ref('int__01__sprint_performance_by_team'),
        )
    }}
FROM {{ ref('int__01__sprint_performance_by_team') }}