{{
    config(
        alias="sprint_performance_by_member",
    )
}}

SELECT
    {{
        dbt_utils.star(
            ref('int__01__sprint_performance_by_member'),
        )
    }}
FROM {{ ref('int__01__sprint_performance_by_member') }}