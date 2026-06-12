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
          to="/admin"
          className={`nav-link${location.pathname.startsWith('/admin') ? ' active' : ''}`}
        >
          Manage
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
