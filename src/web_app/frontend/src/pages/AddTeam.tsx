import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { CreateTeamPayload } from '../types';

const EMPTY_FORM: CreateTeamPayload = {
    name: '',
};

export default function AddTeamMember() {
    const navigate = useNavigate();
    const [form, setForm] = useState<CreateTeamPayload>(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const firstFieldRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        firstFieldRef.current?.focus();
    }, []);

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await api.createTeam(form);
            navigate('/', { state: { success: `${form.name} added successfully.` } });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create team');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="page-container page-container--narrow">
            <div className="page-header">
                <h1 className="page-title">Add Team</h1>
                <p className="page-subtitle">Register a new team.</p>
            </div>

            <form className="form-card" onSubmit={handleSubmit} noValidate>
                {error && <div className="form-error">{error}</div>}

                <fieldset className="form-section">
                    <legend className="form-section__title">Team Details</legend>

                    <div className="form-group">
                        <label htmlFor="name" className="form-label">
                            Team Name <span aria-hidden="true">*</span>
                        </label>
                        <input
                            ref={firstFieldRef}
                            id="name"
                            name="name"
                            type="text"
                            className="form-input"
                            value={form.name}
                            onChange={handleChange}
                            required
                            autoComplete="off"
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
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? 'Saving…' : 'Add Team'}
                    </button>
                </div>
            </form>
        </div>
    );
}
