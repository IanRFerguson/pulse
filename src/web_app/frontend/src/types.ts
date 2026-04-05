export interface ThemeConfig {
  company: {
    name: string;
    logo_url: string | null;
  };
  colors: Record<string, string>;
}

export interface GithubPR {
  pr_id: number;
  pr_title: string;
  pr_number: number;
  github_username: string;
  github_repo_name: string;
  branch_name: string;
  created_at: string | null;
  days_active: number;
  is_draft: boolean;
  is_merged: boolean;
  is_closed_unmerged: boolean;
  github_author_association: string | null;
  github_assignee_login: string | null;
}

export interface FreshdeskTicket {
  ticket_id: number;
  ticket_subject: string;
  status: number;
  priority: number;
  days_active: number;
  created_at: string | null;
  updated_at: string | null;
  due_by_date: string | null;
}

export interface AsanaTask {
  task_id: string;
  name: string;
  completed: boolean;
  days_active: number;
  due_on: string | null;
  priority: string | null;
  sprint_points: number | null;
}

export interface TeamMemberSummary {
  id: string;
  username: string;
  team: string;
  github_data: GithubPR[] | null;
  asana_data: AsanaTask[] | null;
  freshdesk_data: FreshdeskTicket[] | null;
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
