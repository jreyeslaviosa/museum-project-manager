import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Home from './components/Home'
import Dashboard from './components/Dashboard'
import ProjectDetail from './components/ProjectDetail'
import NewProject from './components/NewProject'
import Inventory from './components/Inventory'
import InventoryDetail from './components/inventory/InventoryDetail'
import './App.css'

function App() {
  const [authenticated, setAuthenticated] = useState(
    () => sessionStorage.getItem('authenticated') === 'true'
  )

  if (!authenticated) {
    return (
      <div className="app">
        <Login onLogin={() => setAuthenticated(true)} />
      </div>
    )
  }

  return (
    <BrowserRouter basename="/museum-project-manager">
      <div className="app">
        <Routes>
          <Route path="/" element={<Home onLogout={() => setAuthenticated(false)} />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/project/new" element={<NewProject />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/inventory/:id" element={<InventoryDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
