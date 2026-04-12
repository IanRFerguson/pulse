import type {
  CreateTeamMemberPayload,
  CreateTeamPayload,
  Team,
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
    apiFetch<{ id: string; username: string; email: string; team: string }>(
      '/api/create-team-member',
      { method: 'POST', body: JSON.stringify(payload) },
    ),

  getTeams: () => apiFetch<Team[]>('/api/teams'),

  createTeam: (payload: CreateTeamPayload) =>
    apiFetch<{ id: string; name: string }>('/api/create-team', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
