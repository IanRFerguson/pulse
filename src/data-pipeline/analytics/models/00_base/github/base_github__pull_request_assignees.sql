SELECT
    {{ 
        dbt_utils.star(
            from=source('github', 'pull_requests__assignees')
        ) 
    }}
FROM {{ source('github', 'pull_requests__assignees') }}