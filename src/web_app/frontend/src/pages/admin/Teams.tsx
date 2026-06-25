import { Fragment, useEffect, useState } from 'react';
import { api } from '../../api';
import type {
    CreateTeamPayload,
    Team,
} from '../../types';
import { usePagination, Pagination } from './CustomPagination';

const EMPTY_TEAM: CreateTeamPayload = { name: '' };

export function TeamsPanel() {
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