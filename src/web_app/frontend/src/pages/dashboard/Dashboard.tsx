import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api';
import TeamDashboard from './components/TeamDashboard';
import MaintenanceMetrics from './components/MaintenanceMetrics';
import SprintMetrics from './components/SprintMetrics';
import type {
  ActiveExpansion,
  MaintenanceMetric,
  MetricCategory,
  SprintMetric,
  TeamMemberSummary,
  ThemeConfig,
} from '../../types';

type DashboardTab = 'team' | 'sprint' | 'maintenance';

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
  const [sprintByTeam, setSprintByTeam] = useState(false);
  const [sprintAverages, setSprintAverages] = useState(true);

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
        .getSprintMetrics(sprintByTeam, sprintAverages)
        .then(setSprintMetrics)
        .catch((err: unknown) =>
          setError(
            err instanceof Error ? err.message : 'Failed to load sprint metrics',
          ),
        )
        .finally(() => setLoading(false));
    }
  }, [activeTab, sprintByTeam, sprintAverages]);

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
          className={`tab-button ${activeTab === 'sprint' ? 'active' : ''}`}
          onClick={() => setActiveTab('sprint')}
        >
          Sprint Metrics
        </button>
        <button
          className={`tab-button ${activeTab === 'maintenance' ? 'active' : ''}`}
          onClick={() => setActiveTab('maintenance')}
        >
          Maintenance Metrics
        </button>

      </div>

      {activeTab === 'team' && (
        <TeamDashboard
          members={members}
          activeExpansion={activeExpansion}
          onBadgeClick={handleBadgeClick}
        />
      )}

      {activeTab === 'maintenance' && (
        <MaintenanceMetrics metrics={maintenanceMetrics} />
      )}

      {activeTab === 'sprint' && (
        <SprintMetrics
          metrics={sprintMetrics}
          byTeam={sprintByTeam}
          averages={sprintAverages}
          onByTeamChange={setSprintByTeam}
          onAveragesChange={setSprintAverages}
        />
      )}
    </div>
  );
}
