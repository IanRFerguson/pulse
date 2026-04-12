import type { TeamMemberSummary } from '../../types';

interface Props {
  member: TeamMemberSummary;
}

export default function GitHubPanel({ member }: Props) {
  const prs = (member.github_data ?? []).filter(
    (pr) => !pr.is_merged && !pr.is_closed_unmerged,
  );
  return (
    <div className="expanded-panel">
      {prs.length === 0 ? (
        <p className="expanded-empty">No open pull requests.</p>
      ) : (
        <ul className="expanded-list">
          {prs.map((pr) => (
            <li key={pr.pr_id} className="expanded-item">
              {/*  */}
              <a
                href={`https://github.com/${pr.github_repo_name}/pull/${pr.pr_number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="expanded-link"
              >
                {/*  */}
                <span className="pr-repo">{pr.github_repo_name}</span>
                <span className="pr-separator">#</span>
                <span className="pr-number">{pr.pr_number}</span>
                <span className="pr-title">{pr.pr_title}</span>
              </a>

              {/*  */}
              {pr.is_draft && (
                <span className="badge badge-neutral">Draft</span>
              )}
              <span className="pr-created">Opened {pr.created_at}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
