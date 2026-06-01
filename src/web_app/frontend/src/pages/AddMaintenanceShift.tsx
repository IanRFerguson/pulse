import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { CreateMaintenanceShiftPayload, Team, TeamMemberOption } from '../types';

const EMPTY_FORM: CreateMaintenanceShiftPayload = {
    team_id: '',
    team_member_id: '',
    start_date: '',
    end_date: '',
};

export default function AddMaintenanceShift() {
    const navigate = useNavigate();
    const [teams, setTeams] = useState<Team[]>([]);
    const [teamsLoading, setTeamsLoading] = useState(true);
    const [teamMembers, setTeamMembers] = useState<TeamMemberOption[]>([]);
    const [teamMembersLoading, setTeamMembersLoading] = useState(false);
    const [form, setForm] = useState<CreateMaintenanceShiftPayload>(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const firstFieldRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        api
            .getTeams()
            .then(setTeams)
            .catch(() => setError('Failed to load teams'))
            .finally(() => setTeamsLoading(false));
    }, []);

    useEffect(() => {
        if (!form.team_id) {
            setTeamMembers([]);
            return;
        }
        setTeamMembersLoading(true);
        setTeamMembers([]);
        api
            .getTeamMembersByTeam(form.team_id)
            .then(setTeamMembers)
            .catch(() => setError('Failed to load team members'))
            .finally(() => setTeamMembersLoading(false));
    }, [form.team_id]);

    useEffect(() => {
        firstFieldRef.current?.focus();
    }, []);

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: value,
            ...(name === 'team_id' ? { team_member_id: '' } : {}),
        }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await api.createMaintenanceShift(form);
            navigate('/', {
                state: { success: `New shift added successfully.` },
            });
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Failed to create maintenance shift',
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="page-container page-container--narrow">
            <div className="page-header">
                <h1 className="page-title">Add Maintenance Shift</h1>
                <p className="page-subtitle">
                    Register a new maintenance shift and assign a team member.
                </p>
            </div>

            <form className="form-card" onSubmit={handleSubmit} noValidate>
                {error && <div className="form-error">{error}</div>}

                <fieldset className="form-section">
                    <legend className="form-section__title">Shift Details</legend>

                    <div className="form-group">
                        <label htmlFor="team_id" className="form-label">
                            Team <span aria-hidden="true">*</span>
                        </label>
                        <select
                            id="team_id"
                            name="team_id"
                            className="form-input"
                            value={form.team_id}
                            onChange={handleChange}
                            required
                            disabled={teamsLoading}
                        >
                            <option value="">
                                {teamsLoading ? 'Loading teams…' : '— Select a team —'}
                            </option>
                            {teams.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="team_member_id" className="form-label">
                            Username <span aria-hidden="true">*</span>
                        </label>
                        <select
                            id="team_member_id"
                            name="team_member_id"
                            className="form-input"
                            value={form.team_member_id}
                            onChange={handleChange}
                            required
                            disabled={!form.team_id || teamMembersLoading}
                        >
                            <option value="">
                                {!form.team_id
                                    ? '— Select a team first —'
                                    : teamMembersLoading
                                        ? 'Loading team members…'
                                        : '— Select a team member —'}
                            </option>
                            {teamMembers.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="start_date" className="form-label">
                            Start Date <span aria-hidden="true">*</span>
                        </label>
                        <input
                            ref={firstFieldRef}
                            type="date"
                            id="start_date"
                            name="start_date"
                            className="form-input"
                            value={form.start_date}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="end_date" className="form-label">
                            End Date <span aria-hidden="true">*</span>
                        </label>
                        <input
                            type="date"
                            id="end_date"
                            name="end_date"
                            className="form-input"
                            value={form.end_date}
                            onChange={handleChange}
                            required
                            min={form.start_date || undefined}
                        />
                    </div>

                </fieldset>

                <div className="form-actions">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => navigate('/')}
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={submitting}
                    >
                        {submitting ? 'Saving…' : 'Add Maintenance Shift'}
                    </button>
                </div>
            </form>
        </div>
    );
}
