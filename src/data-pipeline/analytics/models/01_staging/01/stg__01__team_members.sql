SELECT

    team_member_id,
    user_name,
    team_id,
    team_name,
    created_at,
    modified_at,
    active,
    github_fk,
    asana_fk,
    freshdesk_fk,
    surrogate_team_member_id

FROM {{ ref("stg__00__team_members") }}