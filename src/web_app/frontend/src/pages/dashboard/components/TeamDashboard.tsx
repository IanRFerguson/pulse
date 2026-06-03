import TeamMemberRow from '../../../components/TeamMemberRow';
import type { ActiveExpansion, MetricCategory, TeamMemberSummary } from '../../../types';

interface Props {
    members: TeamMemberSummary[];
    activeExpansion: ActiveExpansion | null;
    onBadgeClick: (memberId: string, category: MetricCategory) => void;
}

export default function TeamDashboard({ members, activeExpansion, onBadgeClick }: Props) {
    if (members.length === 0) {
        return (
            <div className="empty-state">
                <p>No team members yet.</p>
                <a href="/add-member" className="btn btn-primary">
                    Add the first one
                </a>
            </div>
        );
    }

    return (
        <div className="table-wrapper">
            <table className="dashboard-table">
                <thead>
                    <tr>
                        <th>Team Member</th>
                        <th>GitHub PRs</th>
                        <th>Freshdesk Tickets</th>
                        <th>Asana Tasks</th>
                    </tr>
                </thead>
                <tbody>
                    {members.map((member) => (
                        <TeamMemberRow
                            key={member.id}
                            member={member}
                            activeExpansion={
                                activeExpansion?.memberId === member.id
                                    ? activeExpansion
                                    : null
                            }
                            onBadgeClick={onBadgeClick}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
