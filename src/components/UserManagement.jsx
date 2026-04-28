import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { getUsers, createUser, updateUser, deleteUser, addToAllowlist, getAllowlist, removeFromAllowlist } from '../utils/storage';
import { USER_ROLES } from '../utils/constants';
import { useUser } from '../utils/UserContext';

function UserManagement() {
  const { loadTeamMembers } = useUser();
  const [users, setUsers] = useState([]);
  const [allowlist, setAllowlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'builder',
  });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const refreshData = async () => {
    const [u, a] = await Promise.all([getUsers(), getAllowlist()]);
    setUsers(u);
    setAllowlist(a);
    await loadTeamMembers();
  };

  useEffect(() => {
    Promise.all([getUsers(), getAllowlist()])
      .then(([u, a]) => { setUsers(u); setAllowlist(a); })
      .catch(() => setError('Failed to load users. Please check your connection and try again.'))
      .finally(() => setLoading(false));
  }, []);

  const resetForm = () => {
    setForm({ firstName: '', lastName: '', email: '', role: 'builder' });
  };

  const openAdd = () => {
    setEditingUser(null);
    resetForm();
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      role: user.role || 'builder',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = form.email.trim().toLowerCase();
    const displayName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();

    if (editingUser) {
      // Update existing user
      await updateUser(editingUser.id, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        name: displayName,
        email,
        role: form.role,
      });
      // Update allowlist email if changed
      if (editingUser.email?.toLowerCase() !== email) {
        const existing = allowlist.find(a => a.email.toLowerCase() === editingUser.email?.toLowerCase());
        if (existing) await removeFromAllowlist(existing.id);
        if (!allowlist.some(a => a.email.toLowerCase() === email)) {
          await addToAllowlist({ id: uuidv4(), email, addedAt: new Date().toISOString() });
        }
      }
      showToast('Team member updated');
    } else {
      // Check if email already exists
      if (users.some(u => u.email?.toLowerCase() === email)) {
        showToast('A user with this email already exists');
        return;
      }
      // Create user profile (will be linked to Firebase UID on first login)
      const newUser = {
        id: uuidv4(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        name: displayName,
        email,
        role: form.role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await createUser(newUser);
      // Add to allowlist
      if (!allowlist.some(a => a.email.toLowerCase() === email)) {
        await addToAllowlist({ id: uuidv4(), email, addedAt: new Date().toISOString() });
      }
      showToast('Team member added');
    }

    await refreshData();
    setShowModal(false);
    resetForm();
    setEditingUser(null);
  };

  const handleDelete = async (user) => {
    // Remove user profile
    await deleteUser(user.id);
    // Remove from allowlist
    const entry = allowlist.find(a => a.email?.toLowerCase() === user.email?.toLowerCase());
    if (entry) await removeFromAllowlist(entry.id);
    await refreshData();
    setDeleteConfirm(null);
    showToast('Team member removed');
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

  const getDisplayName = (user) => {
    if (user.firstName || user.lastName) return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return user.name || user.email?.split('@')[0] || '';
  };

  const hasSignedIn = (user) => !!user.uid;

  return (
    <div className="app">
      <header className="header">
        <Link to="/"><h1>Museum Project Manager</h1></Link>
        <button className="btn btn-primary btn-small" onClick={openAdd}>
          + Add Team Member
        </button>
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
            Add team members to grant them access. Only people listed here can sign in.
          </p>

          {/* Role Summary */}
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

          {/* Team Members */}
          <div className="card">
            {users.length === 0 ? (
              <div className="empty-state">
                <h3>No team members yet</h3>
                <p>Click "+ Add Team Member" to add someone to the team.</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Added</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b))).map(user => (
                      <tr key={user.id}>
                        <td><strong>{getDisplayName(user)}</strong></td>
                        <td style={{ fontSize: '0.9rem', color: 'var(--gray)' }}>{user.email}</td>
                        <td>
                          <span style={{
                            padding: '0.25rem 0.6rem', borderRadius: '4px',
                            fontSize: '0.8rem', fontWeight: 500,
                            ...getRoleStyle(user.role)
                          }}>
                            {USER_ROLES[user.role]?.label || user.role}
                          </span>
                        </td>
                        <td>
                          {hasSignedIn(user) ? (
                            <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 500 }}>Active</span>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--gray)', fontWeight: 500 }}>Pending</span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>{formatDate(user.createdAt)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                            <button className="icon-btn" onClick={() => openEdit(user)}>Edit</button>
                            <button className="icon-btn" onClick={() => setDeleteConfirm(user)}>x</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2>{editingUser ? 'Edit Team Member' : 'Add Team Member'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>x</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ padding: '0 1.5rem 1.5rem', display: 'grid', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>First Name *</label>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={e => setForm({ ...form, firstName: e.target.value })}
                      placeholder="First name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name *</label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={e => setForm({ ...form, lastName: e.target.value })}
                      placeholder="Last name"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="email@example.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Role</label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                    {Object.values(USER_ROLES).map(role => (
                      <option key={role.id} value={role.id}>{role.label} — {role.description}</option>
                    ))}
                  </select>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">
                    {editingUser ? 'Save Changes' : 'Add Member'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Remove Team Member</h2>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>x</button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p style={{ marginBottom: '0.5rem' }}>
                Remove <strong>{getDisplayName(deleteConfirm)}</strong> ({deleteConfirm.email})?
              </p>
              <p style={{ color: 'var(--gray)', fontSize: '0.85rem' }}>They will lose access to the app.</p>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-outline" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>Remove</button>
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
