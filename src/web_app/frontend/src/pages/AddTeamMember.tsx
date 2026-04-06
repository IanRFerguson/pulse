import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { CreateTeamMemberPayload, Team } from '../types';

const EMPTY_FORM: CreateTeamMemberPayload = {
  username: '',
  email: '',
  team_id: '',
  github_username: '',
  asana_id: '',
  freshdesk_agent: '',
};

export default function AddTeamMember() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [form, setForm] = useState<CreateTeamMemberPayload>(EMPTY_FORM);
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
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.createTeamMember(form);
      navigate('/', { state: { success: `${form.username} added successfully.` } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team member');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-container page-container--narrow">
      <div className="page-header">
        <h1 className="page-title">Add Team Member</h1>
        <p className="page-subtitle">Register a new member and link their platform accounts.</p>
      </div>

      <form className="form-card" onSubmit={handleSubmit} noValidate>
        {error && <div className="form-error">{error}</div>}

        <fieldset className="form-section">
          <legend className="form-section__title">Account Details</legend>

          <div className="form-group">
            <label htmlFor="username" className="form-label">
              Username <span aria-hidden="true">*</span>
            </label>
            <input
              ref={firstFieldRef}
              id="username"
              name="username"
              type="text"
              className="form-input"
              value={form.username}
              onChange={handleChange}
              required
              autoComplete="off"
            />
          </div>

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
        </fieldset>

        <fieldset className="form-section">
          <legend className="form-section__title">Platform Integrations</legend>
          <p className="form-section__hint">
            Link this member's accounts so their activity can be tracked.
          </p>

          <div className="form-group">
            <label htmlFor="github_username" className="form-label">
              GitHub Username
            </label>
            <input
              id="github_username"
              name="github_username"
              type="text"
              className="form-input"
              value={form.github_username}
              onChange={handleChange}
              placeholder="e.g. octocat"
            />
          </div>

          <div className="form-group">
            <label htmlFor="freshdesk_agent" className="form-label">
              Freshdesk Agent Name
            </label>
            <input
              id="freshdesk_agent"
              name="freshdesk_agent"
              type="text"
              className="form-input"
              value={form.freshdesk_agent}
              onChange={handleChange}
              placeholder="e.g. Jane Smith"
            />
          </div>

          <div className="form-group">
            <label htmlFor="asana_id" className="form-label">
              Asana Assignee Name
            </label>
            <input
              id="asana_id"
              name="asana_id"
              type="text"
              className="form-input"
              value={form.asana_id}
              onChange={handleChange}
              placeholder="e.g. Jane Smith"
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
            {submitting ? 'Saving…' : 'Add Team Member'}
          </button>
        </div>
      </form>
    </div>
  );
}
