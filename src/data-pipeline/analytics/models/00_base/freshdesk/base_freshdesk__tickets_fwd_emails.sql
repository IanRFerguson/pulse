SELECT
    {{ 
        dbt_utils.star(
            from=source('freshdesk', 'tickets__fwd_emails')
        ) 
    }}
FROM {{ source('freshdesk', 'tickets__fwd_emails') }}