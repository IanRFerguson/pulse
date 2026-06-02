import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import TeamMemberRow from '../components/TeamMemberRow';
import type {
  ActiveExpansion,
  MaintenanceMetric,
  MetricCategory,
  SprintMetric,
  TeamMemberSummary,
  ThemeConfig,
} from '../types';

type DashboardTab = 'team' | 'maintenance' | 'sprint';

interface Props {
  theme: ThemeConfig | null;
}

export default function Dashboard({ theme }: Props) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('team');
  const [members, setMembers] = useState<TeamMemberSummary[]>([]);
  const [maintenanceMetrics, setMaintenanceMetrics] = useState<MaintenanceMetric[]>([]);
  const [sprintMetrics, setSprintMetrics] = useState<SprintMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const teamName = theme?.company?.team_name ?? 'Team Dashboard';

  const [activeExpansion, setActiveExpansion] =
    useState<ActiveExpansion | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    if (activeTab === 'team') {
      api
        .getTeamMembers()
        .then(setMembers)
        .catch((err: unknown) =>
          setError(
            err instanceof Error ? err.message : 'Failed to load team members',
          ),
        )
        .finally(() => setLoading(false));
    } else if (activeTab === 'maintenance') {
      api
        .getMaintenanceMetrics()
        .then(setMaintenanceMetrics)
        .catch((err: unknown) =>
          setError(
            err instanceof Error ? err.message : 'Failed to load maintenance metrics',
          ),
        )
        .finally(() => setLoading(false));
    } else if (activeTab === 'sprint') {
      api
        .getSprintMetrics()
        .then(setSprintMetrics)
        .catch((err: unknown) =>
          setError(
            err instanceof Error ? err.message : 'Failed to load sprint metrics',
          ),
        )
        .finally(() => setLoading(false));
    }
  }, [activeTab]);

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
        <h1 className="page-title">{teamName}</h1>
        <p className="page-subtitle">
          {activeTab === 'team' && `${members.length} team member${members.length !== 1 ? 's' : ''}`}
          {activeTab === 'maintenance' && 'Maintenance Shift Performance'}
          {activeTab === 'sprint' && 'Sprint Performance'}
        </p>
      </div>

      <div className="tab-toggle">
        <button
          className={`tab-button ${activeTab === 'team' ? 'active' : ''}`}
          onClick={() => setActiveTab('team')}
        >
          Team Dashboard
        </button>
        <button
          className={`tab-button ${activeTab === 'maintenance' ? 'active' : ''}`}
          onClick={() => setActiveTab('maintenance')}
        >
          Maintenance Metrics
        </button>
        <button
          className={`tab-button ${activeTab === 'sprint' ? 'active' : ''}`}
          onClick={() => setActiveTab('sprint')}
        >
          Sprint Metrics
        </button>
      </div>

      {activeTab === 'team' && (
        <>
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
                        activeExpansion?.memberId === member.id
                          ? activeExpansion
                          : null
                      }
                      onBadgeClick={handleBadgeClick}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === 'maintenance' && (
        <div className="table-wrapper">
          {maintenanceMetrics.length === 0 ? (
            <div className="empty-state">
              <p>No maintenance shift data available.</p>
            </div>
          ) : (
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Team Member</th>
                  <th>Shift Period</th>
                  <th>Inherited</th>
                  <th>Opened</th>
                  <th>Closed</th>
                  <th>Passed Off</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceMetrics.map((metric) => (
                  <tr key={metric.shift_id}>
                    <td>{metric.user_name}</td>
                    <td>
                      {metric.start_date} - {metric.end_date}
                    </td>
                    <td>{metric.inherited_ticket_count}</td>
                    <td>{metric.opened_during_shift_count}</td>
                    <td>{metric.closed_during_shift_count}</td>
                    <td>{metric.passed_off_ticket_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'sprint' && (
        <div className="table-wrapper">
          {sprintMetrics.length === 0 ? (
            <div className="empty-state">
              <p>No sprint performance data available.</p>
            </div>
          ) : (
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Team</th>
                  <th>Team Member</th>
                  <th>Sprint</th>
                  <th>Period</th>
                  <th>Total Points</th>
                  <th>Total Tasks</th>
                  <th>Avg Points/Task</th>
                </tr>
              </thead>
              <tbody>
                {sprintMetrics.map((metric, idx) => (
                  <tr key={`${metric.sprint_period_id}-${metric.user_name}-${idx}`}>
                    <td>{metric.team_name}</td>
                    <td>{metric.user_name}</td>
                    <td>{metric.sprint_period_name}</td>
                    <td>
                      {metric.start_date} - {metric.end_date}
                    </td>
                    <td>{metric.total_sprint_points ?? '-'}</td>
                    <td>{metric.total_tasks_assigned ?? '-'}</td>
                    <td>{metric.average_points_per_task ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
