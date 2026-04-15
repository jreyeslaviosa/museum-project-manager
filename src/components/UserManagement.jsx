import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { getUsers, updateUser, getAllowlist, addToAllowlist, removeFromAllowlist } from '../utils/storage';
import { USER_ROLES } from '../utils/constants';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [allowlist, setAllowlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  useEffect(() => {
    Promise.all([getUsers(), getAllowlist()])
      .then(([u, a]) => { setUsers(u); setAllowlist(a); })
      .catch(() => setError('Failed to load users. Please check your connection and try again.'))
      .finally(() => setLoading(false));
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    if (allowlist.some(a => a.email.toLowerCase() === email)) {
      showToast('Email already on the list');
      return;
    }
    await addToAllowlist({ id: uuidv4(), email, addedAt: new Date().toISOString() });
    setAllowlist(await getAllowlist());
    setInviteEmail('');
    showToast('Email added to allowed list');
  };

  const handleRemoveFromAllowlist = async (id) => {
    await removeFromAllowlist(id);
    setAllowlist(await getAllowlist());
    setDeleteConfirm(null);
    showToast('Email removed from allowed list');
  };

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
          Manage team member roles and control who can access the app.
        </p>

        {/* Allowed Emails */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3 style={{ margin: 0 }}>Allowed Emails</h3>
          </div>
          <p style={{ color: 'var(--gray)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Only people on this list can sign in.{' '}
            {allowlist.length === 0 && <strong>The list is empty, so everyone can sign in. Add an email to enable the restriction.</strong>}
          </p>

          <form onSubmit={handleInvite} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Enter email address..."
              required
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary btn-small">Add</button>
          </form>

          {allowlist.length > 0 && (
            <div style={{ display: 'grid', gap: '0.25rem' }}>
              {allowlist.sort((a, b) => a.email.localeCompare(b.email)).map(entry => {
                const hasAccount = users.some(u => u.email?.toLowerCase() === entry.email.toLowerCase());
                return (
                  <div
                    key={entry.id}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '0.5rem 0.75rem', background: 'var(--light)', borderRadius: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.9rem' }}>{entry.email}</span>
                      {hasAccount ? (
                        <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--success)' }}>Signed up</span>
                      ) : (
                        <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--gray)' }}>Pending</span>
                      )}
                    </div>
                    <button
                      className="icon-btn"
                      onClick={() => setDeleteConfirm(entry)}
                      style={{ fontSize: '0.8rem' }}
                    >
                      x
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

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

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Remove Email</h2>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>x</button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p style={{ marginBottom: '0.5rem' }}>
                Remove <strong>{deleteConfirm.email}</strong> from the allowed list?
              </p>
              <p style={{ color: 'var(--gray)', fontSize: '0.85rem' }}>They will not be able to sign in anymore.</p>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-outline" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={() => handleRemoveFromAllowlist(deleteConfirm.id)}>Remove</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default UserManagement;
