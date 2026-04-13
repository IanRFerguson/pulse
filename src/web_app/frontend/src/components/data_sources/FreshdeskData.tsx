import type { TeamMemberSummary } from '../../types';
import {
  PRIORITY_LABELS,
  PRIORITY_CLASS,
  STATUS_LABELS,
} from '../LabelInterface';

interface Props {
  member: TeamMemberSummary;
}

export default function FreshdeskPanel({ member }: Props) {
  const tickets = (member.freshdesk_data ?? [])
    .filter((t) => ![4, 5].includes(t.status))
    .sort((a, b) => -1 * (b.days_active - a.days_active));

  return (
    <div className="expanded-panel">
      {tickets.length === 0 ? (
        <p className="expanded-empty">No open tickets.</p>
      ) : (
        <ul className="expanded-list">
          {tickets.map((t) => {
            const priorityLabel =
              PRIORITY_LABELS[t.priority] ?? String(t.priority);
            return (
              <li key={t.ticket_id} className="expanded-item">

                {/* Adds a link to the ticket on Freshdesk */}
                <a
                  href={`https://movementcooperative.freshdesk.com/a/tickets/${t.ticket_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="expanded-link"
                >
                  <span className="ticket-id">#{t.ticket_id}</span>
                  <span className="ticket-subject">{t.ticket_subject}</span>
                </a>

                {/* Display the priority of the ticket */}
                <span
                  className={`badge ${PRIORITY_CLASS[priorityLabel] ?? 'badge-neutral'}`}
                >
                  {priorityLabel}
                </span>

                {/* Display the status of the ticket */}
                <span className="badge badge-neutral">
                  {STATUS_LABELS[t.status] ?? t.status}
                </span>

                {/* Display the number of days the ticket has been active */}
                <span className="pr-created">{t.days_active} days active</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
