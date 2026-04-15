import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { UserProvider, useUser } from './utils/UserContext'
import Login from './components/Login'
import Home from './components/Home'
import Dashboard from './components/Dashboard'
import ProjectDetail from './components/ProjectDetail'
import NewProject from './components/NewProject'
import Inventory from './components/Inventory'
import InventoryDetail from './components/inventory/InventoryDetail'
import Consumables from './components/Consumables'
import Purchasing from './components/Purchasing'
import UserManagement from './components/UserManagement'
import Rooms from './components/Rooms'
import './App.css'

function AppRoutes() {
  const { user, loading, isAdmin, isPurchasing } = useUser()

  if (loading) {
    return (
      <div className="app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: 'var(--gray)' }}>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="app">
        <Login />
      </div>
    )
  }

  return (
    <BrowserRouter basename="/museum-project-manager">
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          {isAdmin && <Route path="/project/new" element={<NewProject />} />}
          <Route path="/project/:id" element={<ProjectDetail />} />
          {isAdmin && <Route path="/inventory" element={<Inventory />} />}
          {isAdmin && <Route path="/inventory/:id" element={<InventoryDetail />} />}
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/consumables" element={<Consumables />} />
          {(isAdmin || isPurchasing) && <Route path="/purchasing" element={<Purchasing />} />}
          {isAdmin && <Route path="/users" element={<UserManagement />} />}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

function App() {
  return (
    <UserProvider>
      <AppRoutes />
    </UserProvider>
  )
}

export default App
