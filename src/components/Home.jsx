import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../utils/firebase'
import { useUser } from '../utils/UserContext'
import { getProjects, getInventory, getConsumables } from '../utils/storage'

function Home() {
  const { userProfile, isAdmin, isPurchasing, isBuilder } = useUser()
  const [search, setSearch] = useState('')
  const [results, setResults] = useState(null)
  const [allData, setAllData] = useState({ projects: [], inventory: [], consumables: [] })
  const [dataLoaded, setDataLoaded] = useState(false)
  const inputRef = useRef(null)

  const handleLogout = () => {
    signOut(auth)
  }

  // Load data on first search focus
  const loadData = async () => {
    if (dataLoaded) return
    const [projects, inventory, consumables] = await Promise.all([
      getProjects(),
      isAdmin ? getInventory() : Promise.resolve([]),
      getConsumables()
    ])
    setAllData({ projects, inventory, consumables })
    setDataLoaded(true)
  }

  useEffect(() => {
    if (!search.trim()) {
      setResults(null)
      return
    }

    const q = search.toLowerCase()

    const matchedProjects = allData.projects.filter(p =>
      p.title?.toLowerCase().includes(q) ||
      p.artistName?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.projectManager?.toLowerCase().includes(q) ||
      p.technicalLead?.toLowerCase().includes(q)
    ).slice(0, 5)

    const matchedInventory = allData.inventory.filter(i =>
      i.name?.toLowerCase().includes(q) ||
      i.description?.toLowerCase().includes(q) ||
      i.serialNumber?.toLowerCase().includes(q) ||
      i.location?.toLowerCase().includes(q)
    ).slice(0, 5)

    const matchedConsumables = allData.consumables.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.store?.toLowerCase().includes(q) ||
      c.requestedBy?.toLowerCase().includes(q) ||
      c.notes?.toLowerCase().includes(q)
    ).slice(0, 5)

    setResults({
      projects: matchedProjects,
      inventory: matchedInventory,
      consumables: matchedConsumables,
      total: matchedProjects.length + matchedInventory.length + matchedConsumables.length
    })
  }, [search, allData])

  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending': return { background: '#fef3c7', color: '#92400e' }
      case 'ordered': return { background: '#dbeafe', color: '#1e40af' }
      case 'received': return { background: '#d1fae5', color: '#065f46' }
      default: return { background: 'var(--light)', color: 'var(--gray)' }
    }
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
        {/* Search Bar */}
        <div style={{ maxWidth: '500px', margin: '0 auto 2rem', width: '100%', padding: '0 1rem' }}>
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={loadData}
            placeholder="Search projects, inventory, consumables..."
            style={{
              width: '100%', padding: '0.75rem 1rem', border: '2px solid var(--border)',
              borderRadius: '8px', fontSize: '0.95rem', background: 'white'
            }}
          />

          {/* Search Results */}
          {results && (
            <div style={{
              background: 'white', border: '1px solid var(--border)', borderRadius: '8px',
              marginTop: '0.5rem', maxHeight: '400px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              {results.total === 0 ? (
                <div style={{ padding: '1rem', color: 'var(--gray)', textAlign: 'center' }}>
                  No results for "{search}"
                </div>
              ) : (
                <>
                  {results.projects.length > 0 && (
                    <div>
                      <div style={{ padding: '0.5rem 1rem', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--gray)', background: 'var(--light)' }}>
                        Projects ({results.projects.length})
                      </div>
                      {results.projects.map(p => (
                        <Link key={p.id} to={`/project/${p.id}`} style={{ display: 'block', padding: '0.6rem 1rem', textDecoration: 'none', color: 'inherit', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ fontWeight: 500 }}>{p.title}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>{p.artistName} {p.projectManager ? `· PM: ${p.projectManager}` : ''}</div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {results.inventory.length > 0 && (
                    <div>
                      <div style={{ padding: '0.5rem 1rem', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--gray)', background: 'var(--light)' }}>
                        Inventory ({results.inventory.length})
                      </div>
                      {results.inventory.map(i => (
                        <Link key={i.id} to={`/inventory/${i.id}`} style={{ display: 'block', padding: '0.6rem 1rem', textDecoration: 'none', color: 'inherit', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ fontWeight: 500 }}>{i.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>{i.location || 'No location'} {i.serialNumber ? `· S/N: ${i.serialNumber}` : ''}</div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {results.consumables.length > 0 && (
                    <div>
                      <div style={{ padding: '0.5rem 1rem', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--gray)', background: 'var(--light)' }}>
                        Consumables ({results.consumables.length})
                      </div>
                      {results.consumables.map(c => (
                        <Link key={c.id} to="/consumables" style={{ display: 'block', padding: '0.6rem 1rem', textDecoration: 'none', color: 'inherit', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 500 }}>{c.name}</span>
                            <span style={{ ...getStatusStyle(c.status), padding: '0.1rem 0.4rem', borderRadius: '3px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>{c.status}</span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>{c.requestedBy ? `By: ${c.requestedBy}` : ''} {c.store ? `· ${c.store}` : ''}</div>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

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
