WITH
    shifts AS (
        SELECT
        
            team_member_id,
            TRUE AS is_active_shift
            
        FROM {{ source('backend', 'maintenance_shifts') }}
        WHERE CURRENT_DATE BETWEEN start_time::date AND end_time::date
    )

SELECT

    tm.team_member_id,
    tm.user_name,
    tm.team_id,
    tm.team_name,
    tm.created_at,
    tm.modified_at,     
    tm.active,
    tm.github_fk,
    tm.asana_fk,
    tm.freshdesk_fk,
    tm.surrogate_team_member_id,
    COALESCE(s.is_active_shift, FALSE) AS is_triager

FROM {{ ref("stg__00__team_members") }} tm
LEFT JOIN shifts s
    ON tm.team_member_id = s.team_member_id