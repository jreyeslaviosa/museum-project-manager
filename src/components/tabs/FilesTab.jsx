import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

const FILE_CATEGORIES = [
  'Floor Plan',
  'Contract',
  'Artist Agreement',
  'Vendor Quote',
  'Reference Image',
  'Drawing',
  'Spec Sheet',
  'Other'
];

function FilesTab({ project, onUpdate, readOnly }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ label: '', url: '', category: 'Other', notes: '' });

  const files = project.files || [];

  const handleSave = () => {
    if (!form.label.trim() || !form.url.trim()) return;

    let updated;
    if (editingId) {
      updated = files.map(f => f.id === editingId ? { ...f, ...form, updatedAt: new Date().toISOString() } : f);
    } else {
      updated = [...files, { ...form, id: uuidv4(), createdAt: new Date().toISOString() }];
    }

    onUpdate({ files: updated });
    setForm({ label: '', url: '', category: 'Other', notes: '' });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (file) => {
    setForm({ label: file.label, url: file.url, category: file.category || 'Other', notes: file.notes || '' });
    setEditingId(file.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Remove this file link?')) return;
    onUpdate({ files: files.filter(f => f.id !== id) });
  };

  const grouped = FILE_CATEGORIES.reduce((acc, cat) => {
    const items = files.filter(f => (f.category || 'Other') === cat);
    if (items.length > 0) acc.push({ category: cat, items });
    return acc;
  }, []);

  return (
    <div className="card">
      <div className="card-header">
        <h2>Files & Links ({files.length})</h2>
        {!readOnly && (
          <button
            className="btn btn-primary btn-small"
            onClick={() => { setShowForm(true); setEditingId(null); setForm({ label: '', url: '', category: 'Other', notes: '' }); }}
          >
            + Add Link
          </button>
        )}
      </div>

      <p style={{ color: 'var(--gray)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        Add links to files on Google Drive, Dropbox, or any URL.
      </p>

      {showForm && (
        <div style={{ padding: '1rem', background: 'var(--light)', borderRadius: '8px', marginBottom: '1.5rem' }}>
          <div className="form-group">
            <label>Label *</label>
            <input
              type="text"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="e.g., Gallery A Floor Plan"
            />
          </div>
          <div className="form-group">
            <label>URL *</label>
            <input
              type="url"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://drive.google.com/..."
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {FILE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional notes"
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary btn-small" onClick={handleSave}>
              {editingId ? 'Update' : 'Add'}
            </button>
            <button className="btn btn-outline btn-small" onClick={() => { setShowForm(false); setEditingId(null); }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {files.length === 0 && !showForm ? (
        <div className="empty-state">
          <p>No files linked yet.{!readOnly ? ' Add links to floor plans, contracts, reference images, and more.' : ''}</p>
        </div>
      ) : (
        <div>
          {grouped.map(group => (
            <div key={group.category} style={{ marginBottom: '1.25rem' }}>
              <div style={{
                fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.03em', color: 'var(--gray)', marginBottom: '0.5rem'
              }}>
                {group.category} ({group.items.length})
              </div>
              {group.items.map(file => (
                <div key={file.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.6rem 0', borderBottom: '1px solid var(--border)'
                }}>
                  <div>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontWeight: 500, color: 'var(--secondary)', textDecoration: 'none' }}
                    >
                      {file.label}
                    </a>
                    {file.notes && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>{file.notes}</div>
                    )}
                  </div>
                  {!readOnly && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-outline btn-small" onClick={() => handleEdit(file)}>Edit</button>
                      <button className="btn btn-outline btn-small" style={{ color: 'var(--accent)' }} onClick={() => handleDelete(file.id)}>Remove</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FilesTab;
