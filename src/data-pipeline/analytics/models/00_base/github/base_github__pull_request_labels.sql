SELECT
    {{ 
        dbt_utils.star(
            from=source('github', 'pull_requests__labels')
        ) 
    }}
FROM {{ source('github', 'pull_requests__labels') }}