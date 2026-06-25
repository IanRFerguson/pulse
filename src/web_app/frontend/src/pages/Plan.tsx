import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Team } from '../types';

interface PlanMember {
    id: string;
    name: string;
    // TODO: pull from sprint metrics averages endpoint once available
    avg_points_per_work_day: number;
    on_time_pct: number;
}

const STUB_AVG_POINTS = 2.5;
const STUB_ON_TIME_PCT = 0.8;

export default function Plan() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [members, setMembers] = useState<PlanMember[]>([]);
    const [workingDays, setWorkingDays] = useState<Record<string, number>>({});
    const [loadingTeams, setLoadingTeams] = useState(true);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.getTeams()
            .then(setTeams)
            .catch(() => setError('Failed to load teams'))
            .finally(() => setLoadingTeams(false));
    }, []);

    useEffect(() => {
        if (!selectedTeamId) {
            setMembers([]);
            setWorkingDays({});
            return;
        }
        setLoadingMembers(true);
        setError(null);
        api.getTeamMembersByTeam(selectedTeamId)
            .then((raw) => {
                const planMembers: PlanMember[] = raw.map((m) => ({
                    id: m.id,
                    name: m.name,
                    avg_points_per_work_day: STUB_AVG_POINTS,
                    on_time_pct: STUB_ON_TIME_PCT,
                }));
                setMembers(planMembers);
                const days: Record<string, number> = {};
                raw.forEach((m) => { days[m.id] = 10; });
                setWorkingDays(days);
            })
            .catch(() => setError('Failed to load team members'))
            .finally(() => setLoadingMembers(false));
    }, [selectedTeamId]);

    const totalEstimated = members.reduce((sum, m) => {
        const days = workingDays[m.id] ?? 10;
        return sum + days * m.avg_points_per_work_day;
    }, 0);

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">Sprint Planner</h1>
                <p className="page-subtitle">
                    Estimate sprint capacity based on each team member's historical velocity and available working days.
                </p>
            </div>

            {error && <div className="form-error">{error}</div>}

            <div className="form-group" style={{ maxWidth: '320px', marginBottom: '2rem' }}>
                <label className="form-label">Team</label>
                <select
                    className="form-input"
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    disabled={loadingTeams}
                >
                    <option value="">— Select a team —</option>
                    {teams.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>
            </div>

            {selectedTeamId && (
                loadingMembers ? (
                    <div className="loading-state">Loading members…</div>
                ) : members.length === 0 ? (
                    <div className="empty-state">No active members for this team.</div>
                ) : (
                    <div className="table-wrapper">
                        <table className="dashboard-table">
                            <thead>
                                <tr>
                                    <th>Team Member</th>
                                    <th>On-Time %</th>
                                    <th>Avg Pts / Day</th>
                                    <th>Working Days</th>
                                    <th>Estimated Points</th>
                                </tr>
                            </thead>
                            <tbody>
                                {members.map((m) => {
                                    const days = workingDays[m.id] ?? 10;
                                    const estimated = +(days * m.avg_points_per_work_day).toFixed(1);
                                    return (
                                        <tr key={m.id}>
                                            <td>{m.name}</td>
                                            <td className="plan-stat">
                                                {(m.on_time_pct * 100).toFixed(0)}%
                                            </td>
                                            <td className="plan-stat">{m.avg_points_per_work_day.toFixed(1)}</td>
                                            <td>
                                                <input
                                                    type="number"
                                                    className="form-input plan-days-input"
                                                    min={0}
                                                    max={30}
                                                    value={days}
                                                    onChange={(e) =>
                                                        setWorkingDays((prev) => ({
                                                            ...prev,
                                                            [m.id]: parseInt(e.target.value, 10) || 0,
                                                        }))
                                                    }
                                                />
                                            </td>
                                            <td className="plan-estimated">{estimated}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr className="plan-total-row">
                                    <td colSpan={4}>Team Total</td>
                                    <td className="plan-estimated">{totalEstimated.toFixed(1)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )
            )}
        </div>
    );
}
