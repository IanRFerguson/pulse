import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import TeamMemberRow from '../components/TeamMemberRow';
import type {
  ActiveExpansion,
  MetricCategory,
  TeamMemberSummary,
} from '../types';

export default function Dashboard() {
  const [members, setMembers] = useState<TeamMemberSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeExpansion, setActiveExpansion] = useState<ActiveExpansion | null>(null);

  useEffect(() => {
    api
      .getTeamMembers()
      .then(setMembers)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to load team members'),
      )
      .finally(() => setLoading(false));
  }, []);

  const handleBadgeClick = useCallback(
    (memberId: string, category: MetricCategory) => {
      // Toggle off if already showing this exact panel
      if (
        activeExpansion?.memberId === memberId &&
        activeExpansion?.category === category
      ) {
        setActiveExpansion(null);
        return;
      }

      setActiveExpansion({ memberId, category });
    },
    [activeExpansion],
  );

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">Loading team members…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-state">{error}</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Team Dashboard</h1>
        <p className="page-subtitle">
          {members.length} team member{members.length !== 1 ? 's' : ''}
        </p>
      </div>

      {members.length === 0 ? (
        <div className="empty-state">
          <p>No team members yet.</p>
          <a href="/add-member" className="btn btn-primary">
            Add the first one
          </a>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Team Member</th>
                <th>GitHub PRs</th>
                <th>Freshdesk Tickets</th>
                <th>Asana Tasks</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <TeamMemberRow
                  key={member.id}
                  member={member}
                  activeExpansion={
                    activeExpansion?.memberId === member.id ? activeExpansion : null
                  }
                  onBadgeClick={handleBadgeClick}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
