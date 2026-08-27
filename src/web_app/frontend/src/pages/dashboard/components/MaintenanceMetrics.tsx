import { useState } from 'react';
import type { MaintenanceMetric } from '../../../types';

// Configure pagination: change this value to adjust rows per page
const ROWS_PER_PAGE = 8;

interface Props {
    metrics: MaintenanceMetric[];
}

export default function MaintenanceMetrics({ metrics }: Props) {
    const [currentPage, setCurrentPage] = useState(1);

    // Filter to shifts that have already started (exclude future shifts)
    const todayStr = new Date().toISOString().slice(0, 10);
    const pastMetrics = metrics.filter((m) => m.start_date <= todayStr);

    // Pagination calculations
    const totalPages = Math.ceil(pastMetrics.length / ROWS_PER_PAGE);
    const startIdx = (currentPage - 1) * ROWS_PER_PAGE;
    const endIdx = startIdx + ROWS_PER_PAGE;
    const paginatedMetrics = pastMetrics.slice(startIdx, endIdx);

    if (pastMetrics.length === 0) {
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
                        <th>Opened</th>
                        <th>Closed</th>
                        <th>Passed Off</th>
                    </tr>
                </thead>
                <tbody>
                    {paginatedMetrics.map((metric) => (
                        <tr key={metric.shift_id}>
                            <td>{metric.user_name}</td>
                            <td>
                                {metric.start_date} - {metric.end_date}
                            </td>
                            <td>{metric.opened_during_shift_count}</td>
                            <td>{metric.closed_during_shift_count}</td>
                            <td>{metric.passed_off_ticket_count}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        style={{ padding: '0.5rem 1rem', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                    >
                        Previous
                    </button>
                    <span>
                        Page {currentPage} of {totalPages} ({pastMetrics.length} total rows)
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        style={{ padding: '0.5rem 1rem', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
