import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import NavBar from './components/NavBar'
import { useTheme } from './hooks/useTheme'
import AddTeamMember from './pages/AddTeamMember'
import Dashboard from './pages/Dashboard'

export default function App() {
  const theme = useTheme()

  return (
    <BrowserRouter>
      <NavBar theme={theme} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add-member" element={<AddTeamMember />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
