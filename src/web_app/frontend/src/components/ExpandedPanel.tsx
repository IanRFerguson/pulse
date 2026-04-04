import type { MetricCategory, TeamMemberSummary } from '../types';

interface Props {
  category: MetricCategory;
  member: TeamMemberSummary;
}

const STATUS_LABELS: Record<number, string> = {
  2: 'Open',
  3: 'Pending',
  4: 'Resolved',
  5: 'Closed',
  6: 'Waiting',
};

const PRIORITY_LABELS: Record<number, string> = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
  4: 'Urgent',
};

const PRIORITY_CLASS: Record<string, string> = {
  Urgent: 'badge-danger',
  High: 'badge-warning',
  Medium: 'badge-neutral',
  Low: 'badge-neutral',
};

export default function ExpandedPanel({ category, member }: Props) {
  if (category === 'github') {
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
                <a
                  href={`https://github.com/${pr.github_repo_name}/pull/${pr.pr_number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="expanded-link"
                >
                  <span className="pr-repo">{pr.github_repo_name}</span>
                  <span className="pr-separator">#</span>
                  <span className="pr-number">{pr.pr_number}</span>
                  <span className="pr-title">{pr.pr_title}</span>
                </a>
                {pr.is_draft && <span className="badge badge-neutral">Draft</span>}
                <span className="pr-created">
                  Opened {pr.created_at ? new Date(pr.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (category === 'freshdesk') {
    const tickets = (member.freshdesk_data ?? []).filter((t) =>
      [2, 3, 6].includes(t.status),
    );
    return (
      <div className="expanded-panel">
        {tickets.length === 0 ? (
          <p className="expanded-empty">No open tickets.</p>
        ) : (
          <ul className="expanded-list">
            {tickets.map((t) => {
              const priorityLabel = PRIORITY_LABELS[t.priority] ?? String(t.priority);
              return (
                <li key={t.ticket_id} className="expanded-item">
                  <a href={`https://movementcooperative.freshdesk.com/a/tickets/${t.ticket_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="expanded-link">
                    <span className="ticket-id">#{t.ticket_id}</span>
                    <span className="ticket-subject">{t.ticket_subject}</span>
                  </a>
                  <span className={`badge ${PRIORITY_CLASS[priorityLabel] ?? 'badge-neutral'}`}>
                    {priorityLabel}
                  </span>
                  <span className="badge badge-neutral">
                    {STATUS_LABELS[t.status] ?? t.status}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }

  // asana
  const tasks = (member.asana_data ?? []).filter((t) => !t.completed);
  return (
    <div className="expanded-panel">
      {tasks.length === 0 ? (
        <p className="expanded-empty">No active tasks.</p>
      ) : (
        <ul className="expanded-list">
          {tasks.map((task) => (
            <li key={task.task_id} className="expanded-item">
              {/* TODO - If other teams are going to use this we'll need to make the URL dynamic */}
              <a href={`https://app.asana.com/1/506377617206170/project/1200839284702516/task/${task.task_id}?focus=true`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="expanded-link">
                <span className="task-name">{task.name}</span>
              </a>
              
              {task.due_on && (
                <span className="task-due">
                  Due {new Date(task.due_on).toLocaleDateString()}
                </span>
              )}
              {task.priority && (
                <span className={`badge ${PRIORITY_CLASS[task.priority] ?? 'badge-neutral'}`}>
                  {task.priority}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
