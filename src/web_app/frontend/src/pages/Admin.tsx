import { Fragment, useEffect, useState } from 'react';
import { api } from '../api';
import type {
  CreateMaintenanceShiftPayload,
  CreateSprintPayload,
  CreateTeamMemberPayload,
  CreateTeamPayload,
  MaintenanceShiftRecord,
  Sprint,
  Team,
  TeamMemberDetail,
  TeamMemberOption,
} from '../types';

type Tab = 'teams' | 'members' | 'sprints' | 'maintenance';

// ─── Pagination ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

function usePagination<T>(items: T[]) {
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [items]);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const paged = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return { page, setPage, totalPages, paged };
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="pagination">
      <button
        className="pagination__btn"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
      >
        ← Prev
      </button>
      <span className="pagination__info">
        Page {page} of {totalPages}
      </span>
      <button
        className="pagination__btn"
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next →
      </button>
    </div>
  );
}

// ─── Teams ────────────────────────────────────────────────────────────────────

const EMPTY_TEAM: CreateTeamPayload = { name: '' };

function TeamsPanel() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [addForm, setAddForm] = useState<CreateTeamPayload>(EMPTY_TEAM);
  const [editName, setEditName] = useState('');

  function reload() {
    setError(null);
    setLoading(true);
    api
      .getTeams()
      .then(setTeams)
      .catch(() => setError('Failed to load teams'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
  }, []);

  const { page, setPage, totalPages, paged: pagedTeams } = usePagination(teams);

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createTeam(addForm);
      setAdding(false);
      setAddForm(EMPTY_TEAM);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team');
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(team: Team) {
    setEditingId(team.id);
    setEditName(team.name);
    setAdding(false);
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setSubmitting(true);
    try {
      await api.updateTeam(editingId, { name: editName });
      setEditingId(null);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update team');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="loading-state">Loading teams…</div>;

  return (
    <div className="admin-panel">
      <div className="admin-section-header">
        <span className="admin-section-count">
          {teams.length} team{teams.length !== 1 ? 's' : ''}
        </span>
        <button
          className={`btn ${adding ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => {
            setAdding(!adding);
            setEditingId(null);
          }}
        >
          {adding ? 'Cancel' : '+ Add Team'}
        </button>
      </div>

      {error && <div className="form-error">{error}</div>}

      {adding && (
        <form className="admin-inline-form" onSubmit={submitAdd}>
          <div className="form-group">
            <label className="form-label">
              Team Name <span aria-hidden="true">*</span>
            </label>
            <input
              className="form-input"
              value={addForm.name}
              onChange={(e) => setAddForm({ name: e.target.value })}
              required
              autoFocus
              autoComplete="off"
            />
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setAdding(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : 'Add Team'}
            </button>
          </div>
        </form>
      )}

      {teams.length === 0 ? (
        <div className="empty-state">No teams yet.</div>
      ) : (
        <div className="table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Name</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pagedTeams.map((team) => (
                <Fragment key={team.id}>
                  <tr className="member-row">
                    <td>
                      <span className="member-name">{team.name}</span>
                    </td>
                    <td className="admin-actions-cell">
                      <button
                        className="btn btn-secondary btn--sm"
                        onClick={() =>
                          editingId === team.id ? setEditingId(null) : startEdit(team)
                        }
                      >
                        {editingId === team.id ? 'Cancel' : 'Edit'}
                      </button>
                    </td>
                  </tr>
                  {editingId === team.id && (
                    <tr className="expansion-row">
                      <td colSpan={2}>
                        <form className="expanded-panel admin-edit-form" onSubmit={submitEdit}>
                          <div className="form-group">
                            <label className="form-label">
                              Team Name <span aria-hidden="true">*</span>
                            </label>
                            <input
                              className="form-input"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              required
                              autoFocus
                              autoComplete="off"
                            />
                          </div>
                          <div className="form-actions">
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => setEditingId(null)}
                              disabled={submitting}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="btn btn-primary"
                              disabled={submitting}
                            >
                              {submitting ? 'Saving…' : 'Save Changes'}
                            </button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

// ─── Team Members ─────────────────────────────────────────────────────────────

const EMPTY_MEMBER: CreateTeamMemberPayload = {
  username: '',
  team_id: '',
  github_username: '',
  asana_id: '',
  freshdesk_agent: '',
};

function TeamMembersPanel() {
  const [members, setMembers] = useState<TeamMemberDetail[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [addForm, setAddForm] = useState<CreateTeamMemberPayload>(EMPTY_MEMBER);
  const [editForm, setEditForm] = useState<CreateTeamMemberPayload>(EMPTY_MEMBER);

  function reload() {
    setError(null);
    setLoading(true);
    Promise.all([api.getTeamMembersRaw(), api.getTeams()])
      .then(([m, t]) => {
        setMembers(m);
        setTeams(t);
      })
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
  }, []);

  const { page, setPage, totalPages, paged: pagedMembers } = usePagination(members);

  function handleAddChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setAddForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleEditChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createTeamMember(addForm);
      setAdding(false);
      setAddForm(EMPTY_MEMBER);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team member');
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(m: TeamMemberDetail) {
    setEditingId(m.id);
    setEditForm({
      username: m.user_name,
      team_id: m.team_id,
      github_username: m.github_fk ?? '',
      asana_id: m.asana_fk ?? '',
      freshdesk_agent: m.freshdesk_fk ?? '',
    });
    setAdding(false);
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setSubmitting(true);
    try {
      await api.updateTeamMember(editingId, {
        username: editForm.username,
        team_id: editForm.team_id,
        github_username: editForm.github_username,
        asana_id: editForm.asana_id,
        freshdesk_agent: editForm.freshdesk_agent,
      });
      setEditingId(null);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update team member');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="loading-state">Loading team members…</div>;

  function MemberForm({
    form,
    onChange,
    onSubmit,
    onCancel,
    submitLabel,
  }: {
    form: CreateTeamMemberPayload;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    submitLabel: string;
  }) {
    return (
      <form className="admin-inline-form admin-member-form" onSubmit={onSubmit}>
        <div className="admin-form-grid">
          <div className="form-group">
            <label className="form-label">
              Username <span aria-hidden="true">*</span>
            </label>
            <input
              className="form-input"
              name="username"
              value={form.username}
              onChange={onChange}
              required
              autoComplete="off"
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              Team <span aria-hidden="true">*</span>
            </label>
            <select
              className="form-input"
              name="team_id"
              value={form.team_id}
              onChange={onChange}
              required
            >
              <option value="">— Select a team —</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">GitHub Username</label>
            <input
              className="form-input"
              name="github_username"
              value={form.github_username}
              onChange={onChange}
              placeholder="e.g. octocat"
              autoComplete="off"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Freshdesk Agent Name</label>
            <input
              className="form-input"
              name="freshdesk_agent"
              value={form.freshdesk_agent}
              onChange={onChange}
              placeholder="e.g. Jane Smith"
              autoComplete="off"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Asana Assignee Name</label>
            <input
              className="form-input"
              name="asana_id"
              value={form.asana_id}
              onChange={onChange}
              placeholder="e.g. Jane Smith"
              autoComplete="off"
            />
          </div>
        </div>
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : submitLabel}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-section-header">
        <span className="admin-section-count">
          {members.length} member{members.length !== 1 ? 's' : ''}
        </span>
        <button
          className={`btn ${adding ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => {
            setAdding(!adding);
            setEditingId(null);
          }}
        >
          {adding ? 'Cancel' : '+ Add Team Member'}
        </button>
      </div>

      {error && <div className="form-error">{error}</div>}

      {adding && (
        <MemberForm
          form={addForm}
          onChange={handleAddChange}
          onSubmit={submitAdd}
          onCancel={() => setAdding(false)}
          submitLabel="Add Team Member"
        />
      )}

      {members.length === 0 ? (
        <div className="empty-state">No team members yet.</div>
      ) : (
        <div className="table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Team</th>
                <th>GitHub</th>
                <th>Freshdesk</th>
                <th>Asana</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pagedMembers.map((m) => (
                <Fragment key={m.id}>
                  <tr className="member-row">
                    <td>
                      <span className="member-name">{m.user_name}</span>
                    </td>
                    <td>
                      <span className="member-team-badge">{m.team_name}</span>
                    </td>
                    <td className="admin-fk-cell">{m.github_fk ?? <span className="admin-empty">—</span>}</td>
                    <td className="admin-fk-cell">{m.freshdesk_fk ?? <span className="admin-empty">—</span>}</td>
                    <td className="admin-fk-cell">{m.asana_fk ?? <span className="admin-empty">—</span>}</td>
                    <td className="admin-actions-cell">
                      <button
                        className="btn btn-secondary btn--sm"
                        onClick={() => editingId === m.id ? setEditingId(null) : startEdit(m)}
                      >
                        {editingId === m.id ? 'Cancel' : 'Edit'}
                      </button>
                    </td>
                  </tr>
                  {editingId === m.id && (
                    <tr className="expansion-row">
                      <td colSpan={6}>
                        <div className="expanded-panel">
                          <MemberForm
                            form={editForm}
                            onChange={handleEditChange}
                            onSubmit={submitEdit}
                            onCancel={() => setEditingId(null)}
                            submitLabel="Save Changes"
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

// ─── Sprints ──────────────────────────────────────────────────────────────────

const EMPTY_SPRINT: CreateSprintPayload = {
  team_id: '',
  friendly_name: '',
  start_date: '',
  end_date: '',
};

function SprintsPanel() {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [addForm, setAddForm] = useState<CreateSprintPayload>(EMPTY_SPRINT);
  const [editForm, setEditForm] = useState<CreateSprintPayload>(EMPTY_SPRINT);

  function reload() {
    setError(null);
    setLoading(true);
    Promise.all([api.getSprints(), api.getTeams()])
      .then(([s, t]) => {
        setSprints(s);
        setTeams(t);
      })
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
  }, []);

  const { page, setPage, totalPages, paged: pagedSprints } = usePagination(sprints);

  function handleAddChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setAddForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleEditChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createSprint(addForm);
      setAdding(false);
      setAddForm(EMPTY_SPRINT);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create sprint');
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(s: Sprint) {
    setEditingId(s.id);
    setEditForm({
      team_id: s.team_id,
      friendly_name: s.friendly_name ?? '',
      start_date: s.start_date,
      end_date: s.end_date,
    });
    setAdding(false);
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setSubmitting(true);
    try {
      await api.updateSprint(editingId, {
        team_id: editForm.team_id,
        friendly_name: editForm.friendly_name,
        start_date: editForm.start_date,
        end_date: editForm.end_date,
      });
      setEditingId(null);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update sprint');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="loading-state">Loading sprints…</div>;

  function SprintForm({
    form,
    onChange,
    onSubmit,
    onCancel,
    submitLabel,
  }: {
    form: CreateSprintPayload;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    submitLabel: string;
  }) {
    return (
      <form className="admin-inline-form" onSubmit={onSubmit}>
        <div className="admin-form-grid">
          <div className="form-group">
            <label className="form-label">
              Team <span aria-hidden="true">*</span>
            </label>
            <select
              className="form-input"
              name="team_id"
              value={form.team_id}
              onChange={onChange}
              required
            >
              <option value="">— Select a team —</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Friendly Name</label>
            <input
              className="form-input"
              name="friendly_name"
              value={form.friendly_name}
              onChange={onChange}
              placeholder="e.g. Q3 Sprint 1"
              autoComplete="off"
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              Start Date <span aria-hidden="true">*</span>
            </label>
            <input
              className="form-input"
              type="date"
              name="start_date"
              value={form.start_date}
              onChange={onChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              End Date <span aria-hidden="true">*</span>
            </label>
            <input
              className="form-input"
              type="date"
              name="end_date"
              value={form.end_date}
              onChange={onChange}
              required
              min={form.start_date || undefined}
            />
          </div>
        </div>
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : submitLabel}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-section-header">
        <span className="admin-section-count">
          {sprints.length} sprint{sprints.length !== 1 ? 's' : ''}
        </span>
        <button
          className={`btn ${adding ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => {
            setAdding(!adding);
            setEditingId(null);
          }}
        >
          {adding ? 'Cancel' : '+ Add Sprint'}
        </button>
      </div>

      {error && <div className="form-error">{error}</div>}

      {adding && (
        <SprintForm
          form={addForm}
          onChange={handleAddChange}
          onSubmit={submitAdd}
          onCancel={() => setAdding(false)}
          submitLabel="Add Sprint"
        />
      )}

      {sprints.length === 0 ? (
        <div className="empty-state">No sprints yet.</div>
      ) : (
        <div className="table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Team</th>
                <th>Name</th>
                <th>Start</th>
                <th>End</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pagedSprints.map((s) => (
                <Fragment key={s.id}>
                  <tr className="member-row">
                    <td>
                      <span className="member-team-badge">{s.team_name}</span>
                    </td>
                    <td>{s.friendly_name ?? <span className="admin-empty">Unnamed</span>}</td>
                    <td className="admin-date-cell">{s.start_date}</td>
                    <td className="admin-date-cell">{s.end_date}</td>
                    <td className="admin-actions-cell">
                      <button
                        className="btn btn-secondary btn--sm"
                        onClick={() => editingId === s.id ? setEditingId(null) : startEdit(s)}
                      >
                        {editingId === s.id ? 'Cancel' : 'Edit'}
                      </button>
                    </td>
                  </tr>
                  {editingId === s.id && (
                    <tr className="expansion-row">
                      <td colSpan={5}>
                        <div className="expanded-panel">
                          <SprintForm
                            form={editForm}
                            onChange={handleEditChange}
                            onSubmit={submitEdit}
                            onCancel={() => setEditingId(null)}
                            submitLabel="Save Changes"
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

// ─── Maintenance ──────────────────────────────────────────────────────────────

const EMPTY_SHIFT: CreateMaintenanceShiftPayload = {
  team_id: '',
  team_member_id: '',
  start_date: '',
  end_date: '',
};

function MaintenancePanel() {
  const [shifts, setShifts] = useState<MaintenanceShiftRecord[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [addForm, setAddForm] = useState<CreateMaintenanceShiftPayload>(EMPTY_SHIFT);
  const [editForm, setEditForm] = useState<CreateMaintenanceShiftPayload>(EMPTY_SHIFT);
  const [addMembers, setAddMembers] = useState<TeamMemberOption[]>([]);
  const [editMembers, setEditMembers] = useState<TeamMemberOption[]>([]);

  function reload() {
    setError(null);
    setLoading(true);
    Promise.all([api.getMaintenanceShifts(), api.getTeams()])
      .then(([s, t]) => {
        setShifts(s);
        setTeams(t);
      })
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
  }, []);

  useEffect(() => {
    if (!addForm.team_id) {
      setAddMembers([]);
      return;
    }
    api
      .getTeamMembersByTeam(addForm.team_id)
      .then(setAddMembers)
      .catch(() => setError('Failed to load team members'));
  }, [addForm.team_id]);

  useEffect(() => {
    if (!editForm.team_id) {
      setEditMembers([]);
      return;
    }
    api
      .getTeamMembersByTeam(editForm.team_id)
      .then(setEditMembers)
      .catch(() => setError('Failed to load team members'));
  }, [editForm.team_id]);

  const { page, setPage, totalPages, paged: pagedShifts } = usePagination(shifts);

  function handleAddChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setAddForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'team_id' ? { team_member_id: '' } : {}),
    }));
  }

  function handleEditChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'team_id' ? { team_member_id: '' } : {}),
    }));
  }

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createMaintenanceShift(addForm);
      setAdding(false);
      setAddForm(EMPTY_SHIFT);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create maintenance shift');
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(shift: MaintenanceShiftRecord) {
    setEditingId(shift.id);
    setEditForm({
      team_id: shift.team_id,
      team_member_id: shift.team_member_id,
      start_date: shift.start_date,
      end_date: shift.end_date,
    });
    setAdding(false);
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setSubmitting(true);
    try {
      await api.updateMaintenanceShift(editingId, {
        team_member_id: editForm.team_member_id,
        start_date: editForm.start_date,
        end_date: editForm.end_date,
      });
      setEditingId(null);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update maintenance shift');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="loading-state">Loading maintenance shifts…</div>;

  function ShiftForm({
    form,
    members,
    onChange,
    onSubmit,
    onCancel,
    submitLabel,
  }: {
    form: CreateMaintenanceShiftPayload;
    members: TeamMemberOption[];
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    submitLabel: string;
  }) {
    return (
      <form className="admin-inline-form" onSubmit={onSubmit}>
        <div className="admin-form-grid">
          <div className="form-group">
            <label className="form-label">
              Team <span aria-hidden="true">*</span>
            </label>
            <select
              className="form-input"
              name="team_id"
              value={form.team_id}
              onChange={onChange}
              required
            >
              <option value="">— Select a team —</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">
              Team Member <span aria-hidden="true">*</span>
            </label>
            <select
              className="form-input"
              name="team_member_id"
              value={form.team_member_id}
              onChange={onChange}
              required
              disabled={!form.team_id}
            >
              <option value="">
                {!form.team_id ? '— Select a team first —' : '— Select a team member —'}
              </option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">
              Start Date <span aria-hidden="true">*</span>
            </label>
            <input
              className="form-input"
              type="date"
              name="start_date"
              value={form.start_date}
              onChange={onChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              End Date <span aria-hidden="true">*</span>
            </label>
            <input
              className="form-input"
              type="date"
              name="end_date"
              value={form.end_date}
              onChange={onChange}
              required
              min={form.start_date || undefined}
            />
          </div>
        </div>
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : submitLabel}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-section-header">
        <span className="admin-section-count">
          {shifts.length} shift{shifts.length !== 1 ? 's' : ''}
        </span>
        <button
          className={`btn ${adding ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => {
            setAdding(!adding);
            setEditingId(null);
          }}
        >
          {adding ? 'Cancel' : '+ Add Shift'}
        </button>
      </div>

      {error && <div className="form-error">{error}</div>}

      {adding && (
        <ShiftForm
          form={addForm}
          members={addMembers}
          onChange={handleAddChange}
          onSubmit={submitAdd}
          onCancel={() => setAdding(false)}
          submitLabel="Add Shift"
        />
      )}

      {shifts.length === 0 ? (
        <div className="empty-state">No maintenance shifts yet.</div>
      ) : (
        <div className="table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Team</th>
                <th>Start</th>
                <th>End</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pagedShifts.map((shift) => (
                <Fragment key={shift.id}>
                  <tr className="member-row">
                    <td>
                      <span className="member-name">{shift.user_name}</span>
                    </td>
                    <td>
                      <span className="member-team-badge">{shift.team_name}</span>
                    </td>
                    <td className="admin-date-cell">{shift.start_date}</td>
                    <td className="admin-date-cell">{shift.end_date}</td>
                    <td className="admin-actions-cell">
                      <button
                        className="btn btn-secondary btn--sm"
                        onClick={() =>
                          editingId === shift.id ? setEditingId(null) : startEdit(shift)
                        }
                      >
                        {editingId === shift.id ? 'Cancel' : 'Edit'}
                      </button>
                    </td>
                  </tr>
                  {editingId === shift.id && (
                    <tr className="expansion-row">
                      <td colSpan={5}>
                        <div className="expanded-panel">
                          <ShiftForm
                            form={editForm}
                            members={editMembers}
                            onChange={handleEditChange}
                            onSubmit={submitEdit}
                            onCancel={() => setEditingId(null)}
                            submitLabel="Save Changes"
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

// ─── Admin page ───────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string }[] = [
  { key: 'teams', label: 'Teams' },
  { key: 'members', label: 'Team Members' },
  { key: 'sprints', label: 'Sprints' },
  { key: 'maintenance', label: 'Maintenance' },
];

export default function Admin() {
  const [tab, setTab] = useState<Tab>('teams');

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Admin</h1>
        <p className="page-subtitle">Manage teams, members, sprints, and maintenance periods.</p>
      </div>

      <div className="tab-toggle">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            className={`tab-button${tab === key ? ' active' : ''}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'teams' && <TeamsPanel />}
      {tab === 'members' && <TeamMembersPanel />}
      {tab === 'sprints' && <SprintsPanel />}
      {tab === 'maintenance' && <MaintenancePanel />}
    </div>
  );
}
