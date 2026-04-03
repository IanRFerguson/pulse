import { Link, useLocation } from 'react-router-dom';
import type { ThemeConfig } from '../types';

interface Props {
  theme: ThemeConfig | null;
}

export default function NavBar({ theme }: Props) {
  const location = useLocation();
  const companyName = theme?.company?.name ?? 'Pulse';
  const logoUrl = theme?.company?.logo_url ?? null;

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        {logoUrl ? (
          <img src={logoUrl} alt={companyName} className="navbar-logo" />
        ) : (
          <span className="navbar-logo-placeholder" aria-hidden="true">{companyName[0]}</span>
        )}
        <span className="navbar-name">{companyName}</span>
      </div>

      <div className="navbar-links">
        <Link
          to="/"
          className={`nav-link${location.pathname === '/' ? ' active' : ''}`}
        >
          Dashboard
        </Link>
        <Link
          to="/add-member"
          className={`nav-link${location.pathname === '/add-member' ? ' active' : ''}`}
        >
          Add Team Member
        </Link>
      </div>
    </nav>
  );
}
