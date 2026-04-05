import { Link } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../utils/firebase'
import { useUser } from '../utils/UserContext'

function Home() {
  const { userProfile, isAdmin, isPurchasing, isBuilder } = useUser()

  const handleLogout = () => {
    signOut(auth)
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Museum Project Manager</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
            {userProfile?.name}
          </span>
          <button className="btn btn-outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }} onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </header>
      <div className="home-page">
        <div className="home-options">
          {isAdmin && (
            <Link to="/dashboard" className="home-card">
              <h2>Project Dashboard</h2>
              <p>Manage exhibitions, installations, and project timelines</p>
            </Link>
          )}
          {isBuilder && (
            <Link to="/dashboard" className="home-card">
              <h2>Projects</h2>
              <p>View exhibition details and project information</p>
            </Link>
          )}
          {isAdmin && (
            <Link to="/inventory" className="home-card">
              <h2>Inventory</h2>
              <p>Track equipment, materials, and asset locations</p>
            </Link>
          )}
          <Link to="/consumables" className="home-card">
            <h2>Consumables</h2>
            <p>Request workshop supplies like wood, paint, screws, and more</p>
          </Link>
          {(isAdmin || isPurchasing) && (
            <Link to="/purchasing" className="home-card">
              <h2>Purchasing</h2>
              <p>View all pending requests, consumables, and shopping lists</p>
            </Link>
          )}
          {isAdmin && (
            <Link to="/users" className="home-card">
              <h2>Team Management</h2>
              <p>Manage team member roles and permissions</p>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default Home
