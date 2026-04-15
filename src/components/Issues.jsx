import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { getIssues, createIssue, updateIssue, deleteIssue, getRooms } from '../utils/storage';
import { TEAM_MEMBERS } from '../utils/constants';
import { useUser } from '../utils/UserContext';

const URGENCY_OPTIONS = [
  { id: 'low', label: 'Low', color: '#6b7280' },
  { id: 'medium', label: 'Medium', color: '#f59e0b' },
  { id: 'high', label: 'High', color: '#ef4444' },
  { id: 'critical', label: 'Critical', color: '#991b1b' },
];

const STATUS_OPTIONS = [
  { id: 'open', label: 'Open', color: '#ef4444' },
  { id: 'in-progress', label: 'In Progress', color: '#3b82f6' },
  { id: 'resolved', label: 'Resolved', color: '#10b981' },
];

function Issues() {
  const { isAdmin, userProfile } = useUser();
  const [issues, setIssues] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('open');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const [editingIssue, setEditingIssue] = useState(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    room: '',
    customLocation: '',
    urgency: 'medium',
    assignedTo: '',
  });

  useEffect(() => {
    Promise.all([getIssues(), getRooms()])
      .then(([i, r]) => { setIssues(i); setRooms(r); })
      .catch(() => setError('Failed to load issues. Please check your connection and try again.'))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const resetForm = () => {
    setForm({
      title: '', description: '', room: '', customLocation: '',
      urgency: 'medium', assignedTo: '',
    });
  };

  const openReport = () => {
    setEditingIssue(null);
    resetForm();
    setShowModal(true);
  };

  const openEdit = (issue) => {
    setEditingIssue(issue);
    setForm({
      title: issue.title || '',
      description: issue.description || '',
      room: issue.room || '',
      customLocation: issue.customLocation || '',
      urgency: issue.urgency || 'medium',
      assignedTo: issue.assignedTo || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const location = form.room || form.customLocation || '';

    if (editingIssue) {
      await updateIssue(editingIssue.id, { ...form, location });
      showToast('Issue updated');
    } else {
      await createIssue({
        ...form,
        location,
        id: uuidv4(),
        status: 'open',
        reportedBy: userProfile?.name || 'Unknown',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      showToast('Issue reported');
    }
    setIssues(await getIssues());
    setShowModal(false);
    resetForm();
    setEditingIssue(null);
  };

  const handleStatusChange = async (id, status) => {
    const updates = { status };
    if (status === 'resolved') {
      updates.resolvedAt = new Date().toISOString();
      updates.resolvedBy = userProfile?.name || 'Unknown';
    }
    await updateIssue(id, updates);
    setIssues(await getIssues());
    showToast(status === 'resolved' ? 'Issue resolved' : 'Status updated');
  };

  const handleDelete = async (id) => {
    await deleteIssue(id);
    setIssues(await getIssues());
    setDeleteConfirm(null);
    showToast('Issue deleted');
  };

  const filtered = issues
    .filter(i => {
      if (filter === 'open') return i.status !== 'resolved';
      if (filter === 'resolved') return i.status === 'resolved';
      return true;
    })
    .sort((a, b) => {
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (a.status !== 'resolved' && b.status !== 'resolved') {
        const ua = urgencyOrder[a.urgency] ?? 2;
        const ub = urgencyOrder[b.urgency] ?? 2;
        if (ua !== ub) return ua - ub;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const openCount = issues.filter(i => i.status === 'open').length;
  const inProgressCount = issues.filter(i => i.status === 'in-progress').length;

  const getUrgency = (id) => URGENCY_OPTIONS.find(u => u.id === id) || URGENCY_OPTIONS[1];
  const getStatus = (id) => STATUS_OPTIONS.find(s => s.id === id) || STATUS_OPTIONS[0];

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="app">
      <header className="header">
        <Link to="/"><h1>Museum Project Manager</h1></Link>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/dashboard" className="btn btn-outline btn-small" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
            Dashboard
          </Link>
          <button className="btn btn-primary btn-small" onClick={openReport}>
            Report Issue
          </button>
        </div>
      </header>

      <div className="container">
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray)' }}>Loading issues...</div>
        )}
        {error && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--accent)', marginBottom: '1rem' }}>{error}</p>
            <button className="btn btn-outline" onClick={() => window.location.reload()}>Retry</button>
          </div>
        )}
        {!loading && !error && <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2>Maintenance Issues</h2>
            <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--light)', borderRadius: '6px', padding: '0.2rem' }}>
              {[
                { id: 'open', label: `Active (${openCount + inProgressCount})` },
                { id: 'resolved', label: 'Resolved' },
                { id: 'all', label: 'All' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  style={{
                    padding: '0.35rem 0.75rem', border: 'none', borderRadius: '4px',
                    background: filter === f.id ? 'var(--secondary)' : 'transparent',
                    color: filter === f.id ? 'white' : 'var(--dark)',
                    cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500,
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <h3>{filter === 'resolved' ? 'No resolved issues' : 'No open issues'}</h3>
              <p>{filter !== 'resolved' ? 'All clear. Use "Report Issue" when something needs attention.' : 'Resolved issues will appear here.'}</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {filtered.map(issue => {
                const urgency = getUrgency(issue.urgency);
                const status = getStatus(issue.status);
                return (
                  <div
                    key={issue.id}
                    className="card"
                    style={{
                      borderLeft: `4px solid ${urgency.color}`,
                      opacity: issue.status === 'resolved' ? 0.7 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                          <h3 style={{ margin: 0, fontSize: '1rem' }}>{issue.title}</h3>
                          <span style={{
                            padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                            background: `${urgency.color}15`, color: urgency.color,
                          }}>
                            {urgency.label}
                          </span>
                          <span style={{
                            padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 500,
                            background: `${status.color}15`, color: status.color,
                          }}>
                            {status.label}
                          </span>
                        </div>

                        {issue.description && (
                          <p style={{ fontSize: '0.85rem', color: 'var(--gray)', margin: '0.4rem 0' }}>{issue.description}</p>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--gray)', marginTop: '0.4rem' }}>
                          {(issue.room || issue.location || issue.customLocation) && (
                            <span>Location: {issue.room || issue.location || issue.customLocation}</span>
                          )}
                          <span>Reported by {issue.reportedBy} on {formatDate(issue.createdAt)}</span>
                          {issue.assignedTo && <span>Assigned to: {issue.assignedTo}</span>}
                          {issue.resolvedBy && <span>Resolved by {issue.resolvedBy} on {formatDate(issue.resolvedAt)}</span>}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                        {issue.status === 'open' && isAdmin && (
                          <button
                            className="btn btn-small"
                            style={{ background: '#3b82f6', color: 'white', fontSize: '0.75rem' }}
                            onClick={() => handleStatusChange(issue.id, 'in-progress')}
                          >
                            Start
                          </button>
                        )}
                        {issue.status === 'in-progress' && (
                          <button
                            className="btn btn-small btn-success"
                            style={{ fontSize: '0.75rem' }}
                            onClick={() => handleStatusChange(issue.id, 'resolved')}
                          >
                            Resolve
                          </button>
                        )}
                        {isAdmin && (
                          <>
                            <button className="icon-btn" onClick={() => openEdit(issue)}>Edit</button>
                            <button className="icon-btn" onClick={() => setDeleteConfirm(issue)}>x</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>}
      </div>

      {/* Report / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>{editingIssue ? 'Edit Issue' : 'Report Issue'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>x</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ padding: '0 1.5rem 1.5rem', display: 'grid', gap: '1rem' }}>
                <div className="form-group">
                  <label>What's the problem? *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g., Light fixture flickering in Gallery A"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Details</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Additional details, when it started, what you've tried..."
                    rows={3}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Room</label>
                    <select value={form.room} onChange={e => setForm({ ...form, room: e.target.value })}>
                      <option value="">Select a room...</option>
                      {rooms.map(r => (
                        <option key={r.id} value={r.name}>{r.name}{r.location ? ` (${r.location})` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Or type location</label>
                    <input
                      type="text"
                      value={form.customLocation}
                      onChange={e => setForm({ ...form, customLocation: e.target.value })}
                      placeholder="e.g., Parking lot"
                      disabled={!!form.room}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Urgency</label>
                    <select value={form.urgency} onChange={e => setForm({ ...form, urgency: e.target.value })}>
                      {URGENCY_OPTIONS.map(u => (
                        <option key={u.id} value={u.id}>{u.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Assign to</label>
                    <select value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
                      <option value="">Unassigned</option>
                      {TEAM_MEMBERS.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingIssue ? 'Save Changes' : 'Report Issue'}</button>
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
              <h2>Delete Issue</h2>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>x</button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p style={{ marginBottom: '0.5rem' }}>
                Are you sure you want to delete <strong>{deleteConfirm.title}</strong>?
              </p>
              <p style={{ color: 'var(--accent)', fontSize: '0.9rem' }}>This action cannot be undone.</p>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-outline" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default Issues;
