SELECT

    team_members.id AS team_member_id,
    team_members.user_name,

    teams.id AS team_id,
    teams.name AS team_name,

    team_members.created_at,
    team_members.modified_at,
    team_members.active,

    team_members.github_fk,
    team_members.asana_fk,
    team_members.freshdesk_fk,

    {{ dbt_utils.generate_surrogate_key(
        [
            "team_members.id",
            "team_members.team_id"
        ]
    ) }} AS surrogate_team_member_id


FROM {{ ref("base__team_members") }} AS team_members
LEFT JOIN {{ ref("base__teams") }} AS teams
    ON team_members.team_id = teams.id