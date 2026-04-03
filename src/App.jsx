import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import ProjectDetail from './components/ProjectDetail'
import NewProject from './components/NewProject'
import Inventory from './components/Inventory'
import InventoryDetail from './components/inventory/InventoryDetail'
import './App.css'

function App() {
  return (
    <BrowserRouter basename="/museum-project-manager">
      <div className="app">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/project/new" element={<NewProject />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/inventory/:id" element={<InventoryDetail />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
