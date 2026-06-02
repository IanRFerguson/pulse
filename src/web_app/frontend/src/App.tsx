import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './index.css';
import NavBar from './components/NavBar';
import { useDarkMode } from './hooks/useDarkMode';
import { useTheme } from './hooks/useTheme';
import AddTeamMember from './pages/AddTeamMember';
import Dashboard from './pages/Dashboard';
import AddTeam from './pages/AddTeam';
import AddMaintenanceShift from './pages/AddMaintenanceShift';
import AddSprint from './pages/AddSprint';

export default function App() {
  const theme = useTheme();
  const { isDark, toggleDark } = useDarkMode();

  return (
    <BrowserRouter>
      <NavBar theme={theme} isDark={isDark} toggleDark={toggleDark} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard theme={theme} />} />
          <Route path="/add-team" element={<AddTeam />} />
          <Route path="/add-member" element={<AddTeamMember />} />
          <Route path="/add-sprint" element={<AddSprint />} />
          <Route path="/add-shift" element={<AddMaintenanceShift />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
