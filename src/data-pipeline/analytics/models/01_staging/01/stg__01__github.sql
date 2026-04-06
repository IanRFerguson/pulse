WITH
    base AS (
        SELECT
            {{
                dbt_utils.star(
                    from=ref("stg__00__github_prs")
                )
            }}
        FROM {{ ref("stg__00__github_prs") }}
    ),

    nested AS (
        SELECT
            surrogate_pull_request_id,
            JSONB_AGG(
                JSONB_BUILD_OBJECT(
                    'reviewer_github_username', reviewer_github_username,
                    'reviewer_github_user_id', reviewer_github_user_id,
                    'surrogate_pull_request_reviewer_id', surrogate_pull_request_reviewer_id
                )
            ) AS reviewers
        FROM base
        GROUP BY surrogate_pull_request_id
    )

SELECT DISTINCT

    id,
    title,
    number,
    github_username,
    github_user_id,
    created_at,
    updated_at,
    CURRENT_DATE - created_at::DATE AS days_active,
    github_repo_name,
    branch_name,
    is_draft,
    is_merged,
    is_closed_unmerged,
    github_author_association,
    github_assignee_login,
    github_assignee_id,
    reviewers,
    surrogate_pull_request_id

FROM {{ ref("stg__00__github_prs") }}
LEFT JOIN nested USING (surrogate_pull_request_id)