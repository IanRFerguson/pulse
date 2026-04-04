WITH
    base AS (
        SELECT

            id,
            user__login AS github_username,
            user__id AS github_user_id,

            created_at,
            updated_at,

            base__repo__full_name AS github_repo_name,
            head__ref AS branch_name,
            draft AS is_draft,
            title,
            author_association AS github_author_association,
            assignee__login AS github_assignee_login,
            assignee__id AS github_assignee_id,
            CASE
                WHEN merged_at IS NOT NULL THEN TRUE
                ELSE FALSE
            END AS is_merged,
            CASE
                WHEN state = 'closed' AND merged_at IS NULL THEN TRUE
                ELSE FALSE
            END AS is_closed_unmerged,

            -- For joining purposes only
            _dlt_id

        FROM {{ ref("base_github__pull_requests") }}
    ),

    requested_reviewers AS (
        SELECT

            login AS reviewer_github_username,
            id AS reviewer_github_user_id,

            -- For joining purposes only
            _dlt_parent_id

        FROM {{ ref("base_github__pull_request_requested_reviewers") }}
    )

SELECT
    
    id,
    title,
    github_username,
    github_user_id,

    created_at,
    updated_at,

    github_repo_name,
    branch_name,
    is_draft,
    is_merged,
    is_closed_unmerged,
    github_author_association,
    github_assignee_login,
    github_assignee_id,

    reviewer_github_username,
    reviewer_github_user_id,

    {{ dbt_utils.generate_surrogate_key(["id"]) }} AS surrogate_pull_request_id,
    {{ dbt_utils.generate_surrogate_key(["id", "reviewer_github_user_id"]) }} AS surrogate_pull_request_reviewer_id

FROM base
LEFT JOIN requested_reviewers
    ON base._dlt_id = requested_reviewers._dlt_parent_id