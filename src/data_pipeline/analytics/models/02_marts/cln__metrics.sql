{{
    config(
        alias="ic_metrics"
    )
}}

SELECT
    {{
        dbt_utils.star(
            ref('stg__02__ic_metrics'),
        )
    }}
FROM {{ ref('stg__02__ic_metrics') }}