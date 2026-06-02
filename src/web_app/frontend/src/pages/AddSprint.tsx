import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { CreateSprintPayload, Team } from '../types';

const EMPTY_FORM: CreateSprintPayload = {
    team_id: '',
    friendly_name: '',
    start_date: '',
    end_date: '',
};

export default function AddSprint() {
    const navigate = useNavigate();
    const [teams, setTeams] = useState<Team[]>([]);
    const [teamsLoading, setTeamsLoading] = useState(true);
    const [form, setForm] = useState<CreateSprintPayload>({
        ...EMPTY_FORM,
        friendly_name: '',
    });
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
        firstFieldRef.current?.focus();
    }, []);

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await api.createSprint(form);
            navigate('/', {
                state: { success: `New sprint added successfully.` },
            });
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Failed to create sprint',
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="page-container page-container--narrow">
            <div className="page-header">
                <h1 className="page-title">Add Sprint</h1>
                <p className="page-subtitle">
                    Register a new sprint and assign a team.
                </p>
            </div>

            <form className="form-card" onSubmit={handleSubmit} noValidate>
                {error && <div className="form-error">{error}</div>}

                <fieldset className="form-section">
                    <legend className="form-section__title">Sprint Details</legend>

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
                        <label htmlFor="friendly_name" className="form-label">
                            Friendly Name
                        </label>
                        <input
                            type="text"
                            id="friendly_name"
                            name="friendly_name"
                            className="form-input"
                            value={form.friendly_name}
                            onChange={handleChange}
                            placeholder="E.g. 'Q3 Sprint 1'"
                        />
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
                        {submitting ? 'Saving…' : 'Add Sprint'}
                    </button>
                </div>
            </form>
        </div>
    );
}
