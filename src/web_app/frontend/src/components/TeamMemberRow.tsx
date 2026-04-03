import type {
  ActiveExpansion,
  MetricCategory,
  TeamMemberDetail,
  TeamMemberSummary,
} from '../types';
import ExpandedPanel from './ExpandedPanel';

interface Props {
  member: TeamMemberSummary;
  activeExpansion: ActiveExpansion | null;
  detail: TeamMemberDetail | null;
  detailLoading: boolean;
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
  detail,
  detailLoading,
  onBadgeClick,
}: Props) {
  const isExpanded = activeExpansion?.memberId === member.id;
  const expandedCategory = isExpanded ? activeExpansion!.category : null;

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
            count={member.github_pr_count}
            category="github"
            active={isExpanded && expandedCategory === 'github'}
            onClick={() => onBadgeClick(member.id, 'github')}
          />
        </td>
        <td>
          <MetricBadge
            label="Freshdesk"
            count={member.freshdesk_ticket_count}
            category="freshdesk"
            active={isExpanded && expandedCategory === 'freshdesk'}
            onClick={() => onBadgeClick(member.id, 'freshdesk')}
          />
        </td>
        <td>
          <MetricBadge
            label="Asana"
            count={member.asana_task_count}
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
              detail={detail}
              loading={detailLoading}
            />
          </td>
        </tr>
      )}
    </>
  );
}
