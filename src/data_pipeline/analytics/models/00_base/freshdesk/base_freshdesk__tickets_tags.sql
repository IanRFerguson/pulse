SELECT
    {{ 
        dbt_utils.star(
            from=source('freshdesk', 'tickets__tags')
        ) 
    }}
FROM {{ source('freshdesk', 'tickets__tags') }}