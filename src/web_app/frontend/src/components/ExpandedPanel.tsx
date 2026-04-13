import type { MetricCategory, TeamMemberSummary } from '../types';
import GitHubPanel from './data_sources/GithubData';
import AsanaPanel from './data_sources/AsanaData';
import FreshdeskPanel from './data_sources/FreshdeskData';

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
