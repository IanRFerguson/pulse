export interface ThemeConfig {
  company: {
    name: string;
    logo_url: string | null;
  };
  colors: Record<string, string>;
}

export interface TeamMemberSummary {
  id: string;
  username: string;
  email: string;
  team: string;
  github_fk: string | null;
  asana_fk: string | null;
  freshdesk_fk: string | null;
  github_pr_count: number;
  freshdesk_ticket_count: number;
  asana_task_count: number;
}

export interface GithubPR {
  id: number;
  title: string;
  repo: string;
  branch: string;
  is_draft: boolean;
  url: string;
}

export interface FreshdeskTicket {
  id: number;
  subject: string;
  status: string;
  priority: string;
}

export interface AsanaTask {
  id: string;
  name: string;
  due_on: string | null;
  url: string | null;
}

export interface TeamMemberDetail {
  id: string;
  username: string;
  email: string;
  team: string;
  github_fk: string | null;
  asana_fk: string | null;
  freshdesk_fk: string | null;
  github_prs: GithubPR[];
  freshdesk_tickets: FreshdeskTicket[];
  asana_tasks: AsanaTask[];
}

export interface Team {
  id: string;
  name: string;
}

export interface CreateTeamMemberPayload {
  username: string;
  email: string;
  team_id: string;
  github_username?: string;
  asana_id?: string;
  freshdesk_agent?: string;
}

export type MetricCategory = 'github' | 'freshdesk' | 'asana';

export interface ActiveExpansion {
  memberId: string;
  category: MetricCategory;
}
