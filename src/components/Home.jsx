import { Link } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../utils/firebase'

function Home() {
  const handleLogout = () => {
    signOut(auth)
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Museum Project Manager</h1>
        <button className="btn btn-outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }} onClick={handleLogout}>
          Sign Out
        </button>
      </header>
      <div className="home-page">
        <div className="home-options">
          <Link to="/dashboard" className="home-card">
            <h2>Project Dashboard</h2>
            <p>Manage exhibitions, installations, and project timelines</p>
          </Link>
          <Link to="/inventory" className="home-card">
            <h2>Inventory</h2>
            <p>Track equipment, materials, and asset locations</p>
          </Link>
          <Link to="/consumables" className="home-card">
            <h2>Consumables</h2>
            <p>Request workshop supplies like wood, paint, screws, and more</p>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Home
