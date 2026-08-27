import { Fragment, useState, useEffect } from 'react';
import { api } from '../../api';
import type {
    CreateMaintenanceShiftPayload,
    MaintenanceShiftRecord,
    Team,
    TeamMemberOption,
} from '../../types';
import { usePagination, Pagination } from './CustomPagination';

const EMPTY_SHIFT: CreateMaintenanceShiftPayload = {
    team_id: '',
    team_member_id: '',
    start_date: '',
    end_date: '',
};

export function MaintenancePanel() {
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