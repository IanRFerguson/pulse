{{
    config(
        alias="maintenance_performance",
    )
}}

SELECT
    {{
        dbt_utils.star(
            ref('int__maintenance_performance'),
        )
    }}
FROM {{ ref('int__maintenance_performance') }}