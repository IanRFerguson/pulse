WITH
    team_members AS (
        SELECT
            
            team_member_id,
            team_name,
            user_name,
            github_fk,
            asana_fk,
            freshdesk_fk
        
        FROM {{ ref('stg__01__team_members') }}
        WHERE active
    )

SELECT
    *
FROM team_members