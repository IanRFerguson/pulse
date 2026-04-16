import type { TeamMemberSummary } from '../../types';
import { PRIORITY_CLASS } from '../LabelInterface';

interface Props {
  member: TeamMemberSummary;
}

function translateToPriorityLabel(priority: string): string {
  switch (priority) {
    case 'Low Priority':
      return 'Low';
    case 'Medium Priority':
      return 'Medium';
    case 'High Priority':
      return 'High';
    case 'URGENT - Top Priority':
      return 'Urgent';
    default:
      return String(priority);
  }
}

export default function AsanaPanel({ member }: Props) {
  const tasks = (member.asana_data ?? [])
    .filter((t) => !t.completed)
    .filter((t) => t.sprint_planning === 'Added to Sprint')
    .sort((a, b) => {
      if (!a.due_on && !b.due_on) return 0;
      if (!a.due_on) return 1;
      if (!b.due_on) return -1;
      return new Date(a.due_on).getTime() - new Date(b.due_on).getTime();
    });
  console.log(tasks);
  return (
    <div className="expanded-panel">
      {tasks.length === 0 ? (
        <p className="expanded-empty">No active tasks.</p>
      ) : (
        <ul className="expanded-list">
          {tasks.map((task) => (
            <li key={task.task_id} className="expanded-item">
              {/* TODO - If other teams are going to use this we'll need to make the URL dynamic */}
              {/* Adds a link to the task on Asana */}
              <a
                href={`https://app.asana.com/1/506377617206170/project/1200839284702516/task/${task.task_id}?focus=true`}
                target="_blank"
                rel="noopener noreferrer"
                className="expanded-link"
              >
                <span className="task-name">{task.name}</span>
              </a>

              {/* Display the priority of the task */}
              {task.priority && (
                <span
                  className={`badge ${PRIORITY_CLASS[translateToPriorityLabel(task.priority)] ?? 'badge-neutral'}`}
                >
                  {translateToPriorityLabel(task.priority)}
                </span>
              )}

              {/* Display the due date of the task */}
              {task.due_on &&
                (() => {
                  const isOverdue =
                    new Date(task.due_on) < new Date(new Date().toDateString());
                  return (
                    <>
                      {/* Display overdue status if applicable */}
                      {isOverdue && (
                        <span className="badge freshdesk-badge-danger">
                          Overdue
                        </span>
                      )}

                      {/* Display the due date of the task */}
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
