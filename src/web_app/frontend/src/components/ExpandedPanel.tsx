import type { MetricCategory, TeamMemberDetail } from '../types';

interface Props {
  category: MetricCategory;
  detail: TeamMemberDetail | null;
  loading: boolean;
}

const PRIORITY_CLASS: Record<string, string> = {
  Urgent: 'badge-danger',
  High: 'badge-warning',
  Medium: 'badge-neutral',
  Low: 'badge-neutral',
};

export default function ExpandedPanel({ category, detail, loading }: Props) {
  if (loading || !detail) {
    return (
      <div className="expanded-panel">
        <div className="expanded-loading">Loading…</div>
      </div>
    );
  }

  if (category === 'github') {
    const prs = detail.github_prs;
    return (
      <div className="expanded-panel">
        {prs.length === 0 ? (
          <p className="expanded-empty">No open pull requests.</p>
        ) : (
          <ul className="expanded-list">
            {prs.map((pr) => (
              <li key={pr.id} className="expanded-item">
                <a
                  href={pr.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="expanded-link"
                >
                  <span className="pr-repo">{pr.repo}</span>
                  <span className="pr-separator">#</span>
                  <span className="pr-number">{pr.id}</span>
                  <span className="pr-title">{pr.title}</span>
                </a>
                {pr.is_draft && <span className="badge badge-neutral">Draft</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (category === 'freshdesk') {
    const tickets = detail.freshdesk_tickets;
    return (
      <div className="expanded-panel">
        {tickets.length === 0 ? (
          <p className="expanded-empty">No open tickets.</p>
        ) : (
          <ul className="expanded-list">
            {tickets.map((t) => (
              <li key={t.id} className="expanded-item">
                <span className="ticket-id">#{t.id}</span>
                <span className="ticket-subject">{t.subject}</span>
                <span className={`badge ${PRIORITY_CLASS[t.priority] ?? 'badge-neutral'}`}>
                  {t.priority}
                </span>
                <span className="badge badge-neutral">{t.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // asana
  const tasks = detail.asana_tasks;
  return (
    <div className="expanded-panel">
      {tasks.length === 0 ? (
        <p className="expanded-empty">No active tasks.</p>
      ) : (
        <ul className="expanded-list">
          {tasks.map((task) => (
            <li key={task.id} className="expanded-item">
              {task.url ? (
                <a
                  href={task.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="expanded-link"
                >
                  {task.name}
                </a>
              ) : (
                <span className="task-name">{task.name}</span>
              )}
              {task.due_on && (
                <span className="task-due">
                  Due {new Date(task.due_on).toLocaleDateString()}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
