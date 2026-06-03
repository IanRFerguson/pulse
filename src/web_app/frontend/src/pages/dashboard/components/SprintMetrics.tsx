import type { SprintMetric } from '../../../types';

interface Props {
    metrics: SprintMetric[];
    byTeam: boolean;
    averages: boolean;
    onByTeamChange: (value: boolean) => void;
    onAveragesChange: (value: boolean) => void;
}

// This map informs which columns to show based on the selected options (byTeam and averages).
const sprintMetricsMap = {
    "average_metrics_by_team": {
        "Team Name": "team_name",
        "Avg Points/Sprint": "avg_sprint_points",
        "Avg Tasks Aassigned/Sprint": "avg_tasks_assigned"
    },
    "all_metrics_by_team": {
        "Team Name": "team_name",
        "Sprint": "sprint_period_name",
        "Period": (metric: SprintMetric) => `${new Date(metric.start_date).toLocaleDateString()} - ${new Date(metric.end_date).toLocaleDateString()}`,
        "Total Points": "total_sprint_points",
        "Total Tasks": "total_tasks_assigned",
        "On Time %": "average_on_time_completion_rate",
    },
    "average_metrics_by_member": {
        "Team Name": "team_name",
        "Team Member": "user_name",
        "Avg Points/Sprint": "avg_sprint_points",
        "On Time %": "avg_tasks_completed_on_time"
    },
    "all_metrics_by_member": {
        "Team Member": "user_name",
        "Sprint": "sprint_period_name",
        "Period": (metric: SprintMetric) => `${new Date(metric.start_date).toLocaleDateString()} - ${new Date(metric.end_date).toLocaleDateString()}`,
        "Total Points": "total_sprint_points",
        "Total Tasks": "total_tasks_assigned",
        "On Time %": "on_time_completion_rate",
    },
}

function formatValue(value: any, columnName: string) {
    if (value === null || value === undefined) return '-';
    if (columnName === 'On Time %') {
        return `${(value * 100).toFixed(1)}%`;
    }
    if (columnName.toLowerCase().includes("avg") || columnName.toLowerCase().includes("points") || columnName.toLowerCase().includes("tasks")) {
        return (value * 1).toFixed(2);
    }
    return value;
}

export default function SprintMetrics({
    metrics,
    byTeam,
    averages,
    onByTeamChange,
    onAveragesChange,
}: Props) {
    // Compute the map key based on current state
    const mapKey = `${averages ? 'average' : 'all'}_metrics_by_${byTeam ? 'team' : 'member'}` as keyof typeof sprintMetricsMap;
    const columnConfig = sprintMetricsMap[mapKey];
    const columns = Object.keys(columnConfig);

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
                                {columns.map(col => (
                                    <th key={col}>{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {metrics.map((metric, idx) => (
                                <tr key={`${metric.sprint_period_id}-${metric.user_name}-${idx}`}>
                                    {columns.map(col => {
                                        const accessor = columnConfig[col as keyof typeof columnConfig] as string | ((metric: SprintMetric) => string);
                                        const value = typeof accessor === 'function'
                                            ? accessor(metric)
                                            : metric[accessor as keyof SprintMetric];
                                        return <td key={col}>{formatValue(value, col)}</td>;
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    );
}
