WITH
    team_members AS (
        SELECT
            
            team_member_id,
            user_name,
            team_name,
            team_id,
            github_fk,
            asana_fk,
            freshdesk_fk
        
        FROM {{ ref('stg__01__team_members') }}
        WHERE active
    ),

    github AS (
        SELECT

            github_user_id,
            JSONB_AGG(
                JSONB_BUILD_OBJECT(
                    'github_username', github_username,
                    'github_repo_name', github_repo_name,
                    'pr_id', id,
                    'pr_title', title,
                    'pr_number', number,
                    'branch_name', branch_name,
                    'created_at', created_at,
                    'days_active', days_active,
                    'is_draft', is_draft,
                    'is_merged', is_merged,
                    'is_closed_unmerged', is_closed_unmerged,
                    'github_author_association', github_author_association,
                    'github_assignee_login', github_assignee_login
                )
            ) AS github_data
        FROM {{ ref('stg__01__github') }}
        GROUP BY github_user_id
    ),

    asana AS (
        SELECT

            assignee_name,
            JSONB_AGG(
                JSONB_BUILD_OBJECT(
                    'task_id', task_id,
                    'name', name,
                    'completed', completed,
                    'modified_at', modified_at,
                    'days_active', days_active,
                    'due_on', due_on,
                    'is_overdue', is_overdue,
                    'priority', priority,
                    'sprint_planning', sprint_planning,
                    'started_on', started_on,
                    'added_to_sprint', added_to_sprint,
                    'sprint_points', sprint_points
                )
            ) AS asana_data,
            SUM(
                CASE 
                    WHEN sprint_planning IS NOT NULL
                        AND NOT completed 
                        AND NOT is_blocked THEN CAST(sprint_points AS INTEGER)
                    ELSE 0 
                END
            ) AS active_sprint_points

        FROM {{ ref('stg__01__asana') }}
        GROUP BY assignee_name
    ),

    freshdesk AS (
        SELECT

            assigned_agent_name,
            JSONB_AGG(
                JSONB_BUILD_OBJECT(
                    'ticket_id', ticket_id,
                    'ticket_subject', ticket_subject,
                    'created_at', created_at,
                    'updated_at', updated_at,
                    'due_by_date', due_by_date,
                    'days_active', days_active,
                    'is_overdue', is_overdue,
                    'status', status,
                    'priority', priority
                )
            ) AS freshdesk_data

        FROM {{ ref('stg__01__freshdesk') }}
        GROUP BY assigned_agent_name
    )

SELECT
    
    team_member_id,
    user_name,
    team_id,
    team_name,

    github_data,
    asana_data,
    active_sprint_points,
    freshdesk_data,

    CURRENT_TIMESTAMP AS _dbt_updated_at

FROM team_members
LEFT JOIN github 
    ON CAST(team_members.github_fk AS TEXT) = CAST(github.github_user_id AS TEXT)
LEFT JOIN asana 
    ON CAST(team_members.asana_fk AS TEXT) = CAST(asana.assignee_name AS TEXT)
LEFT JOIN freshdesk 
    ON CAST(team_members.freshdesk_fk AS TEXT) = CAST(freshdesk.assigned_agent_name AS TEXT)