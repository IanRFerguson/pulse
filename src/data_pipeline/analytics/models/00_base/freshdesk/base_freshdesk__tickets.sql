SELECT
    {{ 
        dbt_utils.star(
            from=source('freshdesk', 'tickets')
        ) 
    }}
FROM {{ source('freshdesk', 'tickets') }}