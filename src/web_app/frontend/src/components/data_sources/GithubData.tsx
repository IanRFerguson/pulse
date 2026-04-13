import type { TeamMemberSummary } from '../../types';

interface Props {
  member: TeamMemberSummary;
}

export default function GitHubPanel({ member }: Props) {
  const prs = (member.github_data ?? [])
    .filter((pr) => !pr.is_merged && !pr.is_closed_unmerged)
    .sort((a, b) => -1 * (b.days_active - a.days_active));
  return (
    <div className="expanded-panel">
      {prs.length === 0 ? (
        <p className="expanded-empty">No open pull requests.</p>
      ) : (
        <ul className="expanded-list">
          {prs.map((pr) => (
            <li key={pr.pr_id} className="expanded-item">
              {/* Adds a link to the pull request on GitHub */}
              <a
                href={`https://github.com/${pr.github_repo_name}/pull/${pr.pr_number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="expanded-link"
              >
                {/* Tidy display of pull request information */}
                <span className="pr-repo">{pr.github_repo_name}</span>
                <span className="pr-separator">#</span>
                <span className="pr-number">{pr.pr_number}</span>
                <span className="pr-title">{pr.pr_title}</span>
              </a>

              {/* Display draft status if applicable */}
              {pr.is_draft && (
                <span className="badge badge-neutral">Draft</span>
              )}

              {/* Display the number of days the pull request has been active */}
              <span className="pr-created">{pr.days_active} days active</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
