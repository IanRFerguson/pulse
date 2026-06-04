{{
    config(
        materialized='incremental',
        unique_key='surrogate_pull_request_id',
        incremental_strategy='merge',
        full_refresh=target.name == 'local',
        on_schema_change='sync_all_columns',
        tags=["github"]
    )
}}

SELECT

    id,
    title,
    number,
    github_username,
    github_user_id,
    created_at,
    updated_at,
    merged_at,
    github_repo_name,
    branch_name,
    is_draft,
    is_merged,
    is_closed_unmerged,
    github_author_association,
    github_assignee_login,
    github_assignee_id,
    reviewers,
    surrogate_pull_request_id,
    _inserted_at,
    _transformed_at

FROM {{ ref("stg__01__github") }}
{% if is_incremental() %}
WHERE _inserted_at > (SELECT MAX(_inserted_at) FROM {{ this }})
{% endif %}