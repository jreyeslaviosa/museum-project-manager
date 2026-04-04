import { Link } from 'react-router-dom'

function Home({ onLogout }) {
  const handleLogout = () => {
    sessionStorage.removeItem('authenticated')
    onLogout()
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
        </div>
      </div>
    </div>
  )
}

export default Home
