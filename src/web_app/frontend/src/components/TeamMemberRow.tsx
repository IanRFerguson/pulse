import type {
  ActiveExpansion,
  MetricCategory,
  TeamMemberSummary,
} from '../types';
import ExpandedPanel from './ExpandedPanel';

interface Props {
  member: TeamMemberSummary;
  activeExpansion: ActiveExpansion | null;
  onBadgeClick: (memberId: string, category: MetricCategory) => void;
}

interface BadgeProps {
  label: string;
  count: number;
  category: MetricCategory;
  active: boolean;
  onClick: () => void;
}

function MetricBadge({ label, count, category, active, onClick }: BadgeProps) {
  return (
    <button
      className={`metric-badge metric-badge--${category}${active ? ' metric-badge--active' : ''}`}
      onClick={onClick}
      aria-pressed={active}
      aria-label={`${label}: ${count} items`}
    >
      <span className="metric-badge__label">{label}</span>
      <span className="metric-badge__count">{count}</span>
      <span className="metric-badge__chevron">{active ? '▲' : '▼'}</span>
    </button>
  );
}

export default function TeamMemberRow({
  member,
  activeExpansion,
  onBadgeClick,
}: Props) {
  const isExpanded = activeExpansion?.memberId === member.id;
  const expandedCategory = isExpanded ? activeExpansion!.category : null;

  const openPrCount = (member.github_data ?? []).filter(
    (pr) => !pr.is_merged && !pr.is_closed_unmerged,
  ).length;
  const openTicketCount = (member.freshdesk_data ?? []).filter(
    (t) => [2, 3, 6].includes(t.status),
  ).length;
  const activeTaskCount = (member.asana_data ?? []).filter(
    (t) => !t.completed,
  ).length;

  return (
    <>
      <tr className="member-row">
        <td className="member-name-cell">
          <span className="member-name">{member.username}</span>
          <span className="member-team-badge">{member.team}</span>
        </td>
        <td>
          <MetricBadge
            label="GitHub"
            count={openPrCount}
            category="github"
            active={isExpanded && expandedCategory === 'github'}
            onClick={() => onBadgeClick(member.id, 'github')}
          />
        </td>
        <td>
          <MetricBadge
            label="Freshdesk"
            count={openTicketCount}
            category="freshdesk"
            active={isExpanded && expandedCategory === 'freshdesk'}
            onClick={() => onBadgeClick(member.id, 'freshdesk')}
          />
        </td>
        <td>
          <MetricBadge
            label="Asana"
            count={activeTaskCount}
            category="asana"
            active={isExpanded && expandedCategory === 'asana'}
            onClick={() => onBadgeClick(member.id, 'asana')}
          />
        </td>
      </tr>

      {isExpanded && expandedCategory && (
        <tr className="expansion-row">
          <td colSpan={4}>
            <ExpandedPanel
              category={expandedCategory}
              member={member}
            />
          </td>
        </tr>
      )}
    </>
  );
}
