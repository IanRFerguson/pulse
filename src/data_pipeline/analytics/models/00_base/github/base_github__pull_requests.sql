SELECT
    {{ 
        dbt_utils.star(
            from=source('github', 'pull_requests')
        ) 
    }}
FROM {{ source('github', 'pull_requests') }}