{{
    config(
        alias="ic_metrics"
    )
}}

SELECT
    {{
        dbt_utils.star(
            ref('int__ic_metrics'),
        )
    }}
FROM {{ ref('int__ic_metrics') }}