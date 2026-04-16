SELECT
    {{ 
        dbt_utils.star(
            from=source('github', 'pull_requests__requested_reviewers')
        ) 
    }}
FROM {{ source('github', 'pull_requests__requested_reviewers') }}