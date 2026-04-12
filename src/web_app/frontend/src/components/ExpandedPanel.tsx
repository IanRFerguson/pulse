import type { MetricCategory, TeamMemberSummary } from '../types';
import GitHubPanel from './data_sources/github';
import AsanaPanel from './data_sources/asana';
import FreshdeskPanel from './data_sources/freshdesk';

interface Props {
  category: MetricCategory;
  member: TeamMemberSummary;
}

export default function ExpandedPanel({ category, member }: Props) {
  switch (category) {
    case 'github':
      return <GitHubPanel member={member} />;
    case 'freshdesk':
      return <FreshdeskPanel member={member} />;
    case 'asana':
      return <AsanaPanel member={member} />;
    default:
      return (
        <div className="expanded-panel">
          <p className="expanded-empty">No data available.</p>
        </div>
      );
  }
}
