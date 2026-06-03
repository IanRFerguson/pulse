import type { MaintenanceMetric } from '../../../types';

interface Props {
    metrics: MaintenanceMetric[];
}

export default function MaintenanceMetrics({ metrics }: Props) {
    if (metrics.length === 0) {
        return (
            <div className="empty-state">
                <p>No maintenance shift data available.</p>
            </div>
        );
    }

    return (
        <div className="table-wrapper">
            <table className="dashboard-table">
                <thead>
                    <tr>
                        <th>Team Member</th>
                        <th>Shift Period</th>
                        <th>Inherited</th>
                        <th>Opened</th>
                        <th>Closed</th>
                        <th>Passed Off</th>
                    </tr>
                </thead>
                <tbody>
                    {metrics.map((metric) => (
                        <tr key={metric.shift_id}>
                            <td>{metric.user_name}</td>
                            <td>
                                {new Date(metric.start_date).toLocaleDateString()} - {new Date(metric.end_date).toLocaleDateString()}
                            </td>
                            <td>{metric.inherited_ticket_count}</td>
                            <td>{metric.opened_during_shift_count}</td>
                            <td>{metric.closed_during_shift_count}</td>
                            <td>{metric.passed_off_ticket_count}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
