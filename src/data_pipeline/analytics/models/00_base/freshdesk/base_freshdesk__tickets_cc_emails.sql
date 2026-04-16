SELECT
    {{ 
        dbt_utils.star(
            from=source('freshdesk', 'tickets__cc_emails')
        ) 
    }}
FROM {{ source('freshdesk', 'tickets__cc_emails') }}