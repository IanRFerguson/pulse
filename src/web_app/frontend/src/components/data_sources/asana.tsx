import type { TeamMemberSummary } from '../../types';
import { PRIORITY_CLASS } from '../LabelInterface';

interface Props {
  member: TeamMemberSummary;
}

export default function AsanaPanel({ member }: Props) {
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
              <a
                href={`https://app.asana.com/1/506377617206170/project/1200839284702516/task/${task.task_id}?focus=true`}
                target="_blank"
                rel="noopener noreferrer"
                className="expanded-link"
              >
                <span className="task-name">{task.name}</span>
              </a>

              {/*  */}
              {task.priority && (
                <span
                  className={`badge ${PRIORITY_CLASS[task.priority] ?? 'badge-neutral'}`}
                >
                  {task.priority}
                </span>
              )}

              {/*  */}
              {task.due_on &&
                (() => {
                  const isOverdue =
                    new Date(task.due_on) < new Date(new Date().toDateString());
                  return (
                    <>
                      {isOverdue && (
                        <span className="badge freshdesk-badge-danger">
                          Overdue
                        </span>
                      )}
                      <span className="task-due">
                        Due {new Date(task.due_on).toLocaleDateString()}
                      </span>
                    </>
                  );
                })()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
