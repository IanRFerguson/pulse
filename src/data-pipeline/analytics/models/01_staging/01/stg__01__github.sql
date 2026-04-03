SELECT

    id,
    github_username,
    github_user_id,

    created_at,
    updated_at,

    github_repo_name,
    branch_name,
    is_draft,
    github_author_association,
    github_assignee_login,
    github_assignee_id,

    reviewer_github_username,
    reviewer_github_user_id,

    surrogate_pull_request_id,
    surrogate_pull_request_reviewer_id

FROM {{ ref("stg__00__github_prs") }}