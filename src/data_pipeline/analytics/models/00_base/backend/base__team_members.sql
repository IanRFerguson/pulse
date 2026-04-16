SELECT
    {{ 
        dbt_utils.star(
            from=source('backend', 'team_members')
        ) 
    }}
FROM {{ source('backend', 'team_members') }}