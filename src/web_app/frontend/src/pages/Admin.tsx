import { MaintenancePanel } from './admin/Maintenance';
import { SprintsPanel } from './admin/Sprints';
import { TeamMembersPanel } from './admin/TeamMembers';
import { TeamsPanel } from './admin/Teams';
import { useState } from 'react';

type Tab = 'teams' | 'members' | 'sprints' | 'maintenance';


const TABS: { key: Tab; label: string }[] = [
  { key: 'teams', label: 'Teams' },
  { key: 'members', label: 'Team Members' },
  { key: 'sprints', label: 'Sprints' },
  { key: 'maintenance', label: 'Maintenance' },
];

export default function Admin() {
  const [tab, setTab] = useState<Tab>('teams');

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Admin</h1>
        <p className="page-subtitle">Manage teams, members, sprints, and maintenance periods.</p>
      </div>

      <div className="tab-toggle">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            className={`tab-button${tab === key ? ' active' : ''}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'teams' && <TeamsPanel />}
      {tab === 'members' && <TeamMembersPanel />}
      {tab === 'sprints' && <SprintsPanel />}
      {tab === 'maintenance' && <MaintenancePanel />}
    </div>
  );
}
