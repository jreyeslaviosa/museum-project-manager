import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
function MaintenanceTab({ project, onUpdate, teamMemberNames: TEAM_MEMBERS = [] }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filter, setFilter] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assignee: '',
    type: 'issue'
  });

  const maintenanceLog = project.maintenanceLog || [];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      assignee: '',
      type: 'issue'
    });
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const newItem = {
      id: uuidv4(),
      ...formData,
      resolved: false,
      createdAt: new Date().toISOString(),
      resolvedAt: null
    };

    onUpdate({ maintenanceLog: [...maintenanceLog, newItem] });
    resetForm();
    setShowAddModal(false);
  };

  const handleEdit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const updated = maintenanceLog.map(item =>
      item.id === editingItem.id
        ? { ...item, ...formData }
        : item
    );

    onUpdate({ maintenanceLog: updated });
    resetForm();
    setEditingItem(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this item?')) {
      onUpdate({ maintenanceLog: maintenanceLog.filter(item => item.id !== id) });
    }
  };

  const toggleResolved = (id) => {
    const updated = maintenanceLog.map(item => {
      if (item.id === id) {
        const nowResolved = !item.resolved;
        return {
          ...item,
          resolved: nowResolved,
          resolvedAt: nowResolved ? new Date().toISOString() : null
        };
      }
      return item;
    });
    onUpdate({ maintenanceLog: updated });
  };

  const startEdit = (item) => {
    setFormData({
      title: item.title,
      description: item.description || '',
      priority: item.priority || 'medium',
      assignee: item.assignee || '',
      type: item.type || 'issue'
    });
    setEditingItem(item);
  };

  const filteredItems = maintenanceLog.filter(item => {
    if (filter === 'open') return !item.resolved;
    if (filter === 'resolved') return item.resolved;
    return true;
  }).sort((a, b) => {
    if (!a.resolved && b.resolved) return -1;
    if (a.resolved && !b.resolved) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const openCount = maintenanceLog.filter(m => !m.resolved).length;
  const resolvedCount = maintenanceLog.filter(m => m.resolved).length;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return 'var(--gray)';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'issue': return 'Issue';
      case 'repair': return 'Repair';
      case 'inspection': return 'Inspection';
      case 'cleaning': return 'Cleaning';
      case 'other': return 'Other';
      default: return 'Log';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderModal = (isEdit) => (
    <div className="modal-overlay" onClick={() => { resetForm(); setShowAddModal(false); setEditingItem(null); }}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Item' : 'Log Maintenance Issue'}</h3>
          <button
            className="icon-btn"
            onClick={() => { resetForm(); setShowAddModal(false); setEditingItem(null); }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={isEdit ? handleEdit : handleAdd}>
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Brief description of the issue"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Type</label>
              <select name="type" value={formData.type} onChange={handleChange}>
                <option value="issue">Issue/Problem</option>
                <option value="repair">Repair</option>
                <option value="inspection">Inspection</option>
                <option value="cleaning">Cleaning</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select name="priority" value={formData.priority} onChange={handleChange}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Detailed description, steps to reproduce, etc."
              rows={4}
            />
          </div>

          <div className="form-group">
            <label>Assigned To</label>
            <select name="assignee" value={formData.assignee} onChange={handleChange}>
              <option value="">Unassigned</option>
              {TEAM_MEMBERS.map(member => (
                <option key={member} value={member}>{member}</option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => { resetForm(); setShowAddModal(false); setEditingItem(null); }}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isEdit ? 'Save Changes' : 'Log Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>Maintenance Log</h2>
          <button className="btn btn-primary btn-small" onClick={() => setShowAddModal(true)}>
            + Log Issue
          </button>
        </div>

        <p style={{ color: 'var(--gray)', marginBottom: '1.5rem' }}>
          Track issues, repairs, and maintenance tasks for this installation
        </p>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{
            flex: 1,
            padding: '1rem',
            background: openCount > 0 ? '#fef2f2' : 'var(--light)',
            borderRadius: '8px',
            textAlign: 'center',
            borderLeft: `4px solid ${openCount > 0 ? 'var(--accent)' : 'var(--success)'}`
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: openCount > 0 ? 'var(--accent)' : 'var(--success)' }}>
              {openCount}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Open Issues</div>
          </div>
          <div style={{
            flex: 1,
            padding: '1rem',
            background: '#f0fdf4',
            borderRadius: '8px',
            textAlign: 'center',
            borderLeft: '4px solid var(--success)'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>
              {resolvedCount}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Resolved</div>
          </div>
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {['all', 'open', 'resolved'].map(f => (
            <button
              key={f}
              className={`btn btn-small ${filter === f ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'open' && openCount > 0 && ` (${openCount})`}
            </button>
          ))}
        </div>

        {/* List */}
        {filteredItems.length === 0 ? (
          <div className="empty-state">
            <p>
              {filter === 'all'
                ? 'No maintenance items logged yet. Use "Report Issue" to track problems that need attention.'
                : filter === 'open'
                ? 'No open issues. All clear.'
                : 'No resolved items.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {filteredItems.map(item => (
              <div
                key={item.id}
                style={{
                  padding: '1rem',
                  background: item.resolved ? '#f8fafc' : 'white',
                  borderRadius: '8px',
                  border: `1px solid ${item.resolved ? 'var(--border)' : getPriorityColor(item.priority)}`,
                  borderLeft: `4px solid ${item.resolved ? 'var(--success)' : getPriorityColor(item.priority)}`,
                  opacity: item.resolved ? 0.7 : 1
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1 }}>
                    <input
                      type="checkbox"
                      checked={item.resolved}
                      onChange={() => toggleResolved(item.id)}
                      style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }}
                    />
                    <div>
                      <h4 style={{
                        fontSize: '1rem',
                        textDecoration: item.resolved ? 'line-through' : 'none',
                        color: item.resolved ? 'var(--gray)' : 'var(--dark)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        {item.title}
                      </h4>
                      {item.description && (
                        <p style={{ fontSize: '0.9rem', color: 'var(--gray)', marginTop: '0.5rem' }}>
                          {item.description}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                        <span style={{ color: getPriorityColor(item.priority), fontWeight: 500 }}>
                          {item.priority.toUpperCase()}
                        </span>
                        {item.assignee && (
                          <span style={{ color: 'var(--gray)' }}>
                            {item.assignee}
                          </span>
                        )}
                        <span style={{ color: 'var(--gray)' }}>
                          Created {formatDate(item.createdAt)}
                        </span>
                        {item.resolved && item.resolvedAt && (
                          <span style={{ color: 'var(--success)' }}>
                            ✓ Resolved {formatDateTime(item.resolvedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button className="icon-btn" onClick={() => startEdit(item)} title="Edit">
                      Edit
                    </button>
                    <button className="icon-btn" onClick={() => handleDelete(item.id)} title="Delete">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Maintenance History */}
      {resolvedCount > 0 && (
        <div className="card">
          <div className="card-header">
            <h3>Resolution History</h3>
          </div>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {maintenanceLog
              .filter(m => m.resolved)
              .sort((a, b) => new Date(b.resolvedAt) - new Date(a.resolvedAt))
              .slice(0, 10)
              .map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: '#f0fdf4',
                    borderRadius: '6px'
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 500 }}>{item.title}</span>
                    {item.assignee && (
                      <span style={{ color: 'var(--gray)', marginLeft: '0.5rem', fontSize: '0.85rem' }}>
                        — {item.assignee}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>
                    {formatDateTime(item.resolvedAt)}
                  </span>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {showAddModal && renderModal(false)}
      {editingItem && renderModal(true)}
    </div>
  );
}

export default MaintenanceTab;
