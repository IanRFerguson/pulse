import { Fragment, useEffect, useState } from 'react';
import { api } from '../../api';
import type {
    CreateSprintPayload,
    Sprint,
    SprintMember,
    Team,
} from '../../types';
import { usePagination, Pagination } from './CustomPagination';

const EMPTY_SPRINT: CreateSprintPayload = {
    team_id: '',
    friendly_name: '',
    start_date: '',
    end_date: '',
};

export function SprintsPanel() {
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [membersSprintId, setMembersSprintId] = useState<string | null>(null);
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

    function toggleMembers(id: string) {
        setMembersSprintId((prev) => (prev === id ? null : id));
        setEditingId(null);
    }

    function startEdit(s: Sprint) {
        setMembersSprintId(null);
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
                                        <td>
                                            <button
                                                className="admin-name-link"
                                                onClick={() => toggleMembers(s.id)}
                                                title="View / edit sprint members"
                                            >
                                                {s.friendly_name ?? <span className="admin-empty">Unnamed</span>}
                                            </button>
                                        </td>
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
                                    {membersSprintId === s.id && (
                                        <tr className="expansion-row">
                                            <td colSpan={5}>
                                                <div className="expanded-panel">
                                                    <SprintMembersPanel sprintId={s.id} />
                                                </div>
                                            </td>
                                        </tr>
                                    )}
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

function SprintMembersPanel({ sprintId }: { sprintId: string }) {
    const [members, setMembers] = useState<SprintMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [edits, setEdits] = useState<Record<string, { working_days: number; is_on_maintenance: boolean }>>({});
    const [saving, setSaving] = useState<string | null>(null);

    useEffect(() => {
        api.getSprintMembers(sprintId)
            .then((data) => {
                setMembers(data);
                const initial: Record<string, { working_days: number; is_on_maintenance: boolean }> = {};
                data.forEach((m) => {
                    initial[m.team_member_id] = { working_days: m.working_days, is_on_maintenance: m.is_on_maintenance };
                });
                setEdits(initial);
            })
            .catch(() => setError('Failed to load sprint members'))
            .finally(() => setLoading(false));
    }, [sprintId]);

    async function save(m: SprintMember) {
        const edit = edits[m.team_member_id];
        if (!edit) return;
        setSaving(m.team_member_id);
        try {
            const { id } = await api.upsertSprintMember(sprintId, m.team_member_id, edit);
            setMembers((prev) =>
                prev.map((x) => x.team_member_id === m.team_member_id ? { ...x, id, ...edit } : x)
            );
        } catch {
            setError('Failed to save');
        } finally {
            setSaving(null);
        }
    }

    if (loading) return <div className="loading-state">Loading members…</div>;
    if (error) return <div className="form-error">{error}</div>;
    if (members.length === 0) return <div className="empty-state">No active team members found.</div>;

    return (
        <table className="dashboard-table">
            <thead>
                <tr>
                    <th>Team Member</th>
                    <th>Working Days</th>
                    <th>On Maintenance</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                {members.map((m) => {
                    const edit = edits[m.team_member_id] ?? { working_days: m.working_days, is_on_maintenance: m.is_on_maintenance };
                    const isSaving = saving === m.team_member_id;
                    const isDirty = edit.working_days !== m.working_days || edit.is_on_maintenance !== m.is_on_maintenance;
                    return (
                        <tr key={m.team_member_id}>
                            <td>{m.user_name}</td>
                            <td>
                                <input
                                    type="number"
                                    className="form-input"
                                    style={{ width: '80px' }}
                                    min={0}
                                    value={edit.working_days}
                                    onChange={(e) =>
                                        setEdits((prev) => ({
                                            ...prev,
                                            [m.team_member_id]: { ...edit, working_days: parseInt(e.target.value) || 0 },
                                        }))
                                    }
                                />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                                <input
                                    type="checkbox"
                                    checked={edit.is_on_maintenance}
                                    onChange={(e) =>
                                        setEdits((prev) => ({
                                            ...prev,
                                            [m.team_member_id]: { ...edit, is_on_maintenance: e.target.checked },
                                        }))
                                    }
                                />
                            </td>
                            <td className="admin-actions-cell">
                                <button
                                    className="btn btn-primary btn--sm"
                                    disabled={isSaving || !isDirty}
                                    onClick={() => save(m)}
                                >
                                    {isSaving ? 'Saving…' : 'Save'}
                                </button>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}