import { Fragment, useEffect, useState } from 'react';
import { api } from '../../api';
import type {
    CreateTeamMemberPayload,
    Team,
    TeamMemberDetail,
} from '../../types';
import { usePagination, Pagination } from './CustomPagination';

const EMPTY_MEMBER: CreateTeamMemberPayload = {
    username: '',
    team_id: '',
    github_username: '',
    asana_id: '',
    freshdesk_agent: '',
};

export function TeamMembersPanel() {
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