WITH
    shift_metadata AS (
        SELECT
        
            tm.team_member_id,
            tm.user_name,
            ms.id as shift_id,
            ms.start_time::date as start_date,
            ms.end_time ::date as end_date
        
        FROM {{ ref('stg__01__team_members') }} AS tm
        INNER JOIN {{ source('backend', 'maintenance_shifts') }} AS ms
            USING(team_member_id)
        WHERE tm.active
    )

SELECT * FROM shift_metadata