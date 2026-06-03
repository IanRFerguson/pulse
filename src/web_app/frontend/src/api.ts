import type {
  CreateMaintenanceShiftPayload,
  CreateSprintPayload,
  CreateTeamMemberPayload,
  CreateTeamPayload,
  MaintenanceMetric,
  SprintMetric,
  Team,
  TeamMemberOption,
  TeamMemberSummary,
  ThemeConfig,
} from './types';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getConfig: () => apiFetch<ThemeConfig>('/api/config'),

  getTeamMembers: () => apiFetch<TeamMemberSummary[]>('/api/team-members'),

  createTeamMember: (payload: CreateTeamMemberPayload) =>
    apiFetch<{ id: string; username: string; team: string }>(
      '/api/create-team-member',
      { method: 'POST', body: JSON.stringify(payload) },
    ),

  getTeams: () => apiFetch<Team[]>('/api/teams'),

  getTeamMembersByTeam: (teamId: string) =>
    apiFetch<TeamMemberOption[]>(`/api/teams/${encodeURIComponent(teamId)}/members`),

  createTeam: (payload: CreateTeamPayload) =>
    apiFetch<{ id: string; name: string }>('/api/create-team', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  createMaintenanceShift: (payload: CreateMaintenanceShiftPayload) =>
    apiFetch<{ id: string; username: string; team: string, start_date: string, end_date: string }>(
      '/api/create-maintenance-shift',
      { method: 'POST', body: JSON.stringify(payload) },
    ),

  createSprint: (payload: CreateSprintPayload) =>
    apiFetch<{ id: string; friendly_name: string; team: string, start_date: string, end_date: string }>(
      '/api/create-sprint',
      { method: 'POST', body: JSON.stringify(payload) },
    ),

  getMaintenanceMetrics: () => apiFetch<MaintenanceMetric[]>('/api/maintenance-metrics'),

  getSprintMetrics: (byTeam?: boolean, averages?: boolean) => {
    const params = new URLSearchParams();
    if (byTeam) params.set('byTeam', 'true');
    if (averages) params.set('average', 'true');
    const query = params.toString();
    return apiFetch<SprintMetric[]>(`/api/sprint-metrics${query ? `?${query}` : ''}`);
  },
};
