import { Link, useLocation } from 'react-router-dom';
import type { ThemeConfig } from '../types';

interface Props {
  theme: ThemeConfig | null;
  isDark: boolean;
  toggleDark: () => void;
}

export default function NavBar({ theme, isDark, toggleDark }: Props) {
  const location = useLocation();
  const companyName = theme?.company?.name ?? 'Pulse';
  const logoUrl = theme?.company?.logo_url ?? null;

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        {logoUrl ? (
          <img src={logoUrl} alt={companyName} className="navbar-logo" />
        ) : (
          <span className="navbar-logo-placeholder" aria-hidden="true">
            {companyName[0]}
          </span>
        )}
        <span className="navbar-name">{companyName}</span>
      </Link>

      <div className="navbar-links">
        <Link
          to="/add-team"
          className={`nav-link${location.pathname === '/add-team' ? ' active' : ''}`}
        >
          Add Team
        </Link>
        <Link
          to="/add-member"
          className={`nav-link${location.pathname === '/add-member' ? ' active' : ''}`}
        >
          Add Team Member
        </Link>
        <Link
          to="/add-shift"
          className={`nav-link${location.pathname === '/add-shift' ? ' active' : ''}`}
        >
          Add Maintenance Shift
        </Link>
        <Link
          to="/add-sprint"
          className={`nav-link${location.pathname === '/add-sprint' ? ' active' : ''}`}
        >
          Add Sprint
        </Link>
        <button
          className="theme-toggle"
          onClick={toggleDark}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>
    </nav>
  );
}
