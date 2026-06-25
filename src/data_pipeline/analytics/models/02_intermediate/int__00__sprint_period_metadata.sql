WITH
    sprint_periods AS (
        SELECT
            {{
                dbt_utils.star(
                    source("backend", "sprint_period")
                )
            }}
        FROM {{ source("backend", "sprint_period") }}
    ),

    team_members AS (
        SELECT

            tm.team_member_id,
            tm.user_name,
            tm.team_id,
            tm.team_name,
            tm.asana_fk

        FROM {{ ref("stg__01__team_members") }} tm
        WHERE tm.active
    ),

    team_member_sprints AS (
        SELECT

            tms.id,
            tms.team_member_id,
            tms.sprint_period_id,
            tms.working_days

        FROM {{ source("backend", "team_member_sprint") }} tms
    ),

    sprint_period_metadata AS (
        SELECT

            sp.id as sprint_period_id,
            sp.friendly_name,
            sp.start_date,
            sp.end_date,
            t.team_id,
            t.team_name,
            t.team_member_id,
            t.user_name,
            t.asana_fk,
            tms.working_days,
            {{
                dbt_utils.generate_surrogate_key(
                    [
                        "sp.id",
                        "t.team_member_id",
                    ]
                )
            }} AS team_member_sprint_id

        FROM sprint_periods sp 
        LEFT JOIN team_members t
            USING(team_id)
        LEFT JOIN team_member_sprints tms
            ON t.team_member_id = tms.team_member_id
            AND sp.id = tms.sprint_period_id
    )

SELECT * FROM sprint_period_metadata