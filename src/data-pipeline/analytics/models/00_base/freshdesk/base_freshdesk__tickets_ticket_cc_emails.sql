SELECT
    {{ 
        dbt_utils.star(
            from=source('freshdesk', 'tickets__ticket_cc_emails')
        ) 
    }}
FROM {{ source('freshdesk', 'tickets__ticket_cc_emails') }}