import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUsers, updateUser } from '../utils/storage';
import { USER_ROLES } from '../utils/constants';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch(() => setError('Failed to load users. Please check your connection and try again.'))
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    await updateUser(userId, { role: newRole });
    setUsers(await getUsers());
  };

  const getRoleStyle = (role) => {
    switch (role) {
      case 'admin': return { background: '#dbeafe', color: '#1e40af' };
      case 'purchasing': return { background: '#ede9fe', color: '#6d28d9' };
      case 'builder': return { background: '#fef3c7', color: '#92400e' };
      default: return { background: 'var(--light)', color: 'var(--gray)' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  return (
    <div className="app">
      <header className="header">
        <Link to="/"><h1>Museum Project Manager</h1></Link>
      </header>

      <div className="container">
        <Link to="/" className="back-link">← Back to Home</Link>

        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray)' }}>Loading team data...</div>
        )}
        {error && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--accent)', marginBottom: '1rem' }}>{error}</p>
            <button className="btn btn-outline" onClick={() => window.location.reload()}>Retry</button>
          </div>
        )}
        {!loading && !error && <>
        <h2 style={{ marginBottom: '0.5rem' }}>Team Management</h2>
        <p style={{ color: 'var(--gray)', marginBottom: '1.5rem' }}>
          Manage team member roles. Users are created automatically when they first log in.
        </p>

        <div className="card">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {Object.values(USER_ROLES).map(role => (
              <div key={role.id} style={{
                padding: '0.75rem 1rem', borderRadius: '6px',
                ...getRoleStyle(role.id)
              }}>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{role.label}</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{role.description}</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.25rem', marginTop: '0.5rem' }}>
                  {users.filter(u => u.role === role.id).length}
                </div>
              </div>
            ))}
          </div>

          {users.length === 0 ? (
            <div className="empty-state">
              <h3>No users yet</h3>
              <p>Users will appear here after they log in for the first time.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.sort((a, b) => (a.name || '').localeCompare(b.name || '')).map(user => (
                    <tr key={user.id}>
                      <td><strong>{user.name}</strong></td>
                      <td style={{ fontSize: '0.9rem', color: 'var(--gray)' }}>{user.email}</td>
                      <td>
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          style={{
                            border: 'none', cursor: 'pointer',
                            padding: '0.3rem 0.6rem', borderRadius: '4px',
                            fontSize: '0.85rem', fontWeight: 500,
                            ...getRoleStyle(user.role)
                          }}
                        >
                          {Object.values(USER_ROLES).map(role => (
                            <option key={role.id} value={role.id}>{role.label}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>{formatDate(user.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </>}
      </div>
    </div>
  );
}

export default UserManagement;
