import type { SprintMetric } from '../../../types';

interface Props {
    metrics: SprintMetric[];
    byTeam: boolean;
    averages: boolean;
    onByTeamChange: (value: boolean) => void;
    onAveragesChange: (value: boolean) => void;
}

export default function SprintMetrics({
    metrics,
    byTeam,
    averages,
    onByTeamChange,
    onAveragesChange,
}: Props) {
    return (
        <>
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                        type="checkbox"
                        checked={byTeam}
                        onChange={(e) => onByTeamChange(e.target.checked)}
                    />
                    By Team
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                        type="checkbox"
                        checked={averages}
                        onChange={(e) => onAveragesChange(e.target.checked)}
                    />
                    Averages
                </label>
            </div>
            <div className="table-wrapper">
                {metrics.length === 0 ? (
                    <div className="empty-state">
                        <p>No sprint performance data available.</p>
                    </div>
                ) : (
                    <table className="dashboard-table">
                        <thead>
                            <tr>
                                <th>Team</th>
                                <th>Team Member</th>
                                <th>Sprint</th>
                                <th>Period</th>
                                <th>Total Points</th>
                                <th>Total Tasks</th>
                                <th>Avg Points/Task</th>
                            </tr>
                        </thead>
                        <tbody>
                            {metrics.map((metric, idx) => (
                                <tr key={`${metric.sprint_period_id}-${metric.user_name}-${idx}`}>
                                    <td>{metric.team_name}</td>
                                    <td>{metric.user_name}</td>
                                    <td>{metric.sprint_period_name}</td>
                                    <td>
                                        {new Date(metric.start_date).toLocaleDateString()} - {new Date(metric.end_date).toLocaleDateString()}
                                    </td>
                                    <td>{metric.total_sprint_points ?? '-'}</td>
                                    <td>{metric.total_tasks_assigned ?? '-'}</td>
                                    <td>{metric.average_points_per_task ?? '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    );
}
