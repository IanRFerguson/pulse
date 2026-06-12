export interface ThemeConfig {
  company: {
    name: string;
    team_name: string | null;
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
  sprint_planning: string | null;
  added_to_sprint: string | null;
  is_blocked: boolean;
}

export interface TeamMemberSummary {
  id: string;
  username: string;
  team: string;
  github_data: GithubPR[] | null;
  asana_data: AsanaTask[] | null;
  freshdesk_data: FreshdeskTicket[] | null;
  active_sprint_points: number | null;
}

export interface Team {
  id: string;
  name: string;
}

export interface TeamMemberOption {
  id: string;
  name: string;
}

export interface CreateTeamMemberPayload {
  username: string;
  team_id: string;
  github_username?: string;
  asana_id?: string;
  freshdesk_agent?: string;
}

export interface CreateTeamPayload {
  name: string;
}

export type MetricCategory = 'github' | 'freshdesk' | 'asana';

export interface ActiveExpansion {
  memberId: string;
  category: MetricCategory;
}

export interface CreateMaintenanceShiftPayload {
  team_id: string;
  team_member_id: string;
  start_date: string;
  end_date: string;
}

export interface CreateSprintPayload {
  team_id: string;
  friendly_name: string;
  start_date: string;
  end_date: string;
}

export interface MaintenanceMetric {
  shift_id: string;
  team_member_id: string;
  user_name: string;
  start_date: string;
  end_date: string;
  opened_during_shift_count: number;
  closed_during_shift_count: number;
  passed_off_ticket_count: number;
}

export interface Sprint {
  id: string;
  team_id: string;
  team_name: string;
  friendly_name: string | null;
  start_date: string;
  end_date: string;
}

export interface MaintenanceShiftRecord {
  id: string;
  team_member_id: string;
  team_id: string;
  user_name: string;
  team_name: string;
  start_date: string;
  end_date: string;
}

export interface TeamMemberDetail {
  id: string;
  user_name: string;
  team_id: string;
  team_name: string;
  github_fk: string | null;
  asana_fk: string | null;
  freshdesk_fk: string | null;
}

export interface SprintMetric {
  sprint_period_id: string;
  team_id: string;
  team_name: string;
  user_name: string;
  sprint_period_name: string;
  start_date: string;
  end_date: string;
  total_sprint_points: number | null;
  total_tasks_assigned: number | null;
  average_points_per_task: number | null;
}