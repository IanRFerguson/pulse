import type {
  CreateMaintenanceShiftPayload,
  CreateSprintPayload,
  CreateTeamMemberPayload,
  CreateTeamPayload,
  MaintenanceMetric,
  MaintenanceShiftRecord,
  SprintMember,
  SprintMetric,
  Sprint,
  Team,
  TeamMemberDetail,
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

  getTeamMembersRaw: () => apiFetch<TeamMemberDetail[]>('/api/team-members-raw'),

  getSprints: () => apiFetch<Sprint[]>('/api/sprints'),

  getMaintenanceShifts: () => apiFetch<MaintenanceShiftRecord[]>('/api/maintenance-shifts'),

  updateTeam: (id: string, payload: { name: string }) =>
    apiFetch<{ id: string; name: string }>(`/api/teams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  updateTeamMember: (
    id: string,
    payload: {
      username: string;
      team_id: string;
      github_username?: string;
      asana_id?: string;
      freshdesk_agent?: string;
    },
  ) =>
    apiFetch<{ id: string; username: string }>(`/api/team-members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  updateSprint: (
    id: string,
    payload: {
      team_id: string;
      friendly_name?: string;
      start_date: string;
      end_date: string;
    },
  ) =>
    apiFetch<{ id: string }>(`/api/sprints/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  updateMaintenanceShift: (
    id: string,
    payload: { team_member_id: string; start_date: string; end_date: string },
  ) =>
    apiFetch<{ id: string }>(`/api/maintenance-shifts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  getSprintMembers: (sprintId: string) =>
    apiFetch<SprintMember[]>(`/api/sprints/${encodeURIComponent(sprintId)}/members`),

  upsertSprintMember: (
    sprintId: string,
    teamMemberId: string,
    payload: { working_days: number; is_on_maintenance: boolean },
  ) =>
    apiFetch<{ id: string }>(
      `/api/sprints/${encodeURIComponent(sprintId)}/members/${encodeURIComponent(teamMemberId)}`,
      { method: 'PUT', body: JSON.stringify(payload) },
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
