SELECT
    {{ 
        dbt_utils.star(
            from=source('backend', 'teams')
        ) 
    }}
FROM {{ source('backend', 'teams') }}