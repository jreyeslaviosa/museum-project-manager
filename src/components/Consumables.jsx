import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { getConsumables, createConsumable, updateConsumable, deleteConsumable } from '../utils/storage';
import { CONSUMABLE_PRESETS, SUGGESTED_STORES, CONSUMABLE_UNITS } from '../utils/constants';
import { useUser } from '../utils/UserContext';

function Consumables() {
  const { isAdmin, userProfile, teamMemberNames: TEAM_MEMBERS } = useUser();
  const [items, setItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const nameInputRef = useRef(null);

  // Quick-add state
  const [quickName, setQuickName] = useState('');
  const [quickQty, setQuickQty] = useState(1);
  const [quickUnit, setQuickUnit] = useState('pcs');
  const [quickPerson, setQuickPerson] = useState(userProfile?.name || '');
  const [quickStore, setQuickStore] = useState('');
  const [quickNotes, setQuickNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit modal state
  const [editForm, setEditForm] = useState({
    name: '', quantity: 1, unit: 'pcs', status: 'pending',
    store: '', customStore: '', cost: '', notes: '', requestedBy: '',
  });

  useEffect(() => {
    getConsumables()
      .then(setItems)
      .catch(() => setError('Failed to load consumables. Please check your connection and try again.'))
      .finally(() => setLoading(false));
  }, []);

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickName.trim()) return;

    const newItem = {
      id: uuidv4(),
      name: quickName.trim(),
      quantity: parseInt(quickQty) || 1,
      unit: quickUnit,
      status: 'pending',
      store: quickStore,
      cost: null,
      notes: quickNotes.trim(),
      requestedBy: quickPerson,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await createConsumable(newItem);
    setItems(await getConsumables());
    setQuickName('');
    setQuickQty(1);
    setQuickUnit('pcs');
    setQuickStore('');
    setQuickNotes('');
    setShowNotes(false);
    nameInputRef.current?.focus();
  };

  const handleDelete = async (id) => {
    await deleteConsumable(id);
    setItems(await getConsumables());
    setDeleteConfirm(null);
  };

  const handleStatusChange = async (id, status) => {
    const updates = { status };
    if (status === 'ordered') {
      updates.purchaseDate = new Date().toISOString().split('T')[0];
    }
    if (status === 'received') {
      updates.receivedDate = new Date().toISOString().split('T')[0];
    }
    await updateConsumable(id, updates);
    setItems(await getConsumables());
  };

  const handleReorder = async (item) => {
    const newItem = {
      id: uuidv4(),
      name: item.name,
      quantity: item.quantity,
      unit: item.unit || 'pcs',
      status: 'pending',
      store: item.store || '',
      cost: null,
      notes: item.notes || '',
      requestedBy: item.requestedBy || '',
      trackingLink: null,
      purchaseDate: null,
      deliveryDate: null,
      receivedDate: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await createConsumable(newItem);
    setItems(await getConsumables());
  };

  const startEdit = (item) => {
    const storeIsPreset = SUGGESTED_STORES.includes(item.store);
    setEditForm({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit || 'pcs',
      status: item.status,
      store: storeIsPreset ? item.store : '',
      customStore: storeIsPreset ? '' : (item.store || ''),
      cost: item.cost || '',
      notes: item.notes || '',
      requestedBy: item.requestedBy || '',
      purchaseDate: item.purchaseDate || '',
      deliveryDate: item.deliveryDate || '',
      trackingLink: item.trackingLink || '',
    });
    setEditingItem(item);
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) return;

    const store = editForm.store || editForm.customStore;

    await updateConsumable(editingItem.id, {
      name: editForm.name.trim(),
      quantity: parseInt(editForm.quantity) || 1,
      unit: editForm.unit,
      status: editForm.status,
      store: store.trim(),
      cost: editForm.cost ? parseFloat(editForm.cost) : null,
      notes: editForm.notes.trim(),
      requestedBy: editForm.requestedBy,
      purchaseDate: editForm.purchaseDate || null,
      deliveryDate: editForm.deliveryDate || null,
      trackingLink: editForm.trackingLink.trim() || null,
    });
    setItems(await getConsumables());
    setEditingItem(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'store' && value) updated.customStore = '';
      return updated;
    });
  };

  const filteredItems = items
    .filter(item => filter === 'all' || item.status === filter)
    .filter(item =>
      !search || item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.store && item.store.toLowerCase().includes(search.toLowerCase())) ||
      (item.requestedBy && item.requestedBy.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      const order = { pending: 0, ordered: 1, received: 2 };
      return (order[a.status] ?? 3) - (order[b.status] ?? 3);
    });

  const pendingCount = items.filter(i => i.status === 'pending').length;
  const orderedCount = items.filter(i => i.status === 'ordered').length;
  const totalCost = items
    .filter(i => i.status !== 'received')
    .reduce((sum, i) => sum + (i.cost ? i.cost * i.quantity : 0), 0);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending': return { background: '#fef3c7', color: '#92400e' };
      case 'ordered': return { background: '#dbeafe', color: '#1e40af' };
      case 'received': return { background: '#d1fae5', color: '#065f46' };
      default: return { background: 'var(--light)', color: 'var(--gray)' };
    }
  };

  return (
    <div className="app">
      <header className="header">
        <Link to="/"><h1>Museum Project Manager</h1></Link>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {isAdmin && (
            <>
              <Link to="/dashboard" className="btn btn-outline btn-small" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
                Dashboard
              </Link>
              <Link to="/inventory" className="btn btn-outline btn-small" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
                Inventory
              </Link>
            </>
          )}
        </div>
      </header>

      <div className="container">
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray)' }}>Loading consumables...</div>
        )}
        {error && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--accent)', marginBottom: '1rem' }}>{error}</p>
            <button className="btn btn-outline" onClick={() => window.location.reload()}>Retry</button>
          </div>
        )}
        {!loading && !error && <>
        {/* Quick Add Bar */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--gray)' }}>
            Quick Request
          </div>
          <form onSubmit={handleQuickAdd}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  placeholder="Item name — type or pick from suggestions"
                  list="consumable-presets"
                  style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.85rem' }}
                />
                <datalist id="consumable-presets">
                  {CONSUMABLE_PRESETS.map(p => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </div>
              <button type="submit" className="btn btn-primary" disabled={!quickName.trim()}>
                Add
              </button>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <input
                  type="number"
                  value={quickQty}
                  onChange={(e) => setQuickQty(e.target.value)}
                  min="1"
                  style={{ width: '55px', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.85rem', textAlign: 'center' }}
                />
                <select
                  value={quickUnit}
                  onChange={(e) => setQuickUnit(e.target.value)}
                  style={{ padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.85rem', background: 'var(--white)' }}
                >
                  {CONSUMABLE_UNITS.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              <select
                value={quickStore}
                onChange={(e) => setQuickStore(e.target.value)}
                style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.85rem', background: 'var(--white)' }}
              >
                <option value="">Store...</option>
                {SUGGESTED_STORES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select
                value={quickPerson}
                onChange={(e) => setQuickPerson(e.target.value)}
                style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.85rem', background: 'var(--white)' }}
              >
                <option value="">Requested by...</option>
                {TEAM_MEMBERS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowNotes(!showNotes)}
                style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
              >
                {showNotes ? 'Hide notes' : '+ Notes'}
              </button>
            </div>
            {showNotes && (
              <input
                type="text"
                value={quickNotes}
                onChange={(e) => setQuickNotes(e.target.value)}
                placeholder="Brand, size, color, urgency..."
                style={{ width: '100%', marginTop: '0.5rem', padding: '0.6rem 0.75rem', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.85rem' }}
              />
            )}
          </form>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div className="stat-card" style={{ borderTop: '3px solid #f59e0b' }}>
            <div className="stat-value" style={{ color: '#f59e0b' }}>{pendingCount}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card" style={{ borderTop: '3px solid #3b82f6' }}>
            <div className="stat-value" style={{ color: '#3b82f6' }}>{orderedCount}</div>
            <div className="stat-label">Ordered</div>
          </div>
          <div className="stat-card" style={{ borderTop: '3px solid var(--success)' }}>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{items.filter(i => i.status === 'received').length}</div>
            <div className="stat-label">Received</div>
          </div>
          <div className="stat-card" style={{ borderTop: '3px solid #5b4a8a' }}>
            <div className="stat-value" style={{ color: '#5b4a8a', fontSize: '1.25rem' }}>${totalCost.toFixed(2)}</div>
            <div className="stat-label">Outstanding Cost</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Consumables</h2>
          </div>

          {/* Filters */}
          <div className="inventory-filters" style={{ marginBottom: '1rem' }}>
            <div className="search-box">
              <input
                type="text"
                placeholder="Search items, stores, people..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All ({items.length})</option>
              <option value="pending">Pending ({pendingCount})</option>
              <option value="ordered">Ordered ({orderedCount})</option>
              <option value="received">Received ({items.filter(i => i.status === 'received').length})</option>
            </select>
          </div>

          {filteredItems.length === 0 ? (
            <div className="empty-state">
              <h3>No items</h3>
              <p>{items.length === 0 ? 'Use the quick request bar above to add items.' : 'No items match your filter.'}</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Store</th>
                    <th>Requested By</th>
                    <th>Status</th>
                    <th>Cost</th>
                    {isAdmin && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.name}</strong>
                        {item.notes && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>{item.notes}</div>
                        )}
                      </td>
                      <td>{item.quantity} {item.unit}</td>
                      <td>{item.store || '-'}</td>
                      <td>{item.requestedBy || '-'}</td>
                      <td>
                        {isAdmin ? (
                          <select
                            value={item.status}
                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                            style={{
                              border: 'none', cursor: 'pointer',
                              padding: '0.2rem 0.5rem', borderRadius: '2px',
                              fontSize: '0.7rem', fontWeight: 600,
                              textTransform: 'uppercase', letterSpacing: '0.03em',
                              ...getStatusStyle(item.status)
                            }}
                          >
                            <option value="pending">Pending</option>
                            <option value="ordered">Ordered</option>
                            <option value="received">Received</option>
                          </select>
                        ) : (
                          <span style={{
                            padding: '0.2rem 0.5rem', borderRadius: '2px',
                            fontSize: '0.7rem', fontWeight: 600,
                            textTransform: 'uppercase', letterSpacing: '0.03em',
                            ...getStatusStyle(item.status)
                          }}>
                            {item.status}
                          </span>
                        )}
                      </td>
                      <td>{item.cost ? `$${(item.cost * item.quantity).toFixed(2)}` : '-'}</td>
                      {isAdmin && (
                        <td>
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            {item.status === 'received' && (
                              <button className="icon-btn" onClick={() => handleReorder(item)} title="Request again">Reorder</button>
                            )}
                            <button className="icon-btn" onClick={() => startEdit(item)}>Edit</button>
                            <button className="icon-btn" onClick={() => setDeleteConfirm(item)}>Delete</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </>}
      </div>

      {/* Edit Modal (full details) */}
      {editingItem && (
        <div className="modal-overlay" onClick={() => setEditingItem(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h3>Edit Item</h3>
              <button className="icon-btn" onClick={() => setEditingItem(null)}>x</button>
            </div>

            <form onSubmit={handleEditSave}>
              <div className="form-group">
                <label>Item Name *</label>
                <input type="text" name="name" value={editForm.name} onChange={handleEditChange} required />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Quantity</label>
                  <input type="number" name="quantity" value={editForm.quantity} onChange={handleEditChange} min="1" />
                </div>
                <div className="form-group">
                  <label>Unit</label>
                  <select name="unit" value={editForm.unit} onChange={handleEditChange}>
                    {CONSUMABLE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Est. Cost ($)</label>
                  <input type="number" name="cost" value={editForm.cost} onChange={handleEditChange} placeholder="0.00" min="0" step="0.01" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Store</label>
                  <select name="store" value={editForm.store} onChange={handleEditChange}>
                    <option value="">Other / custom</option>
                    {SUGGESTED_STORES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {!editForm.store && (
                    <input
                      type="text"
                      name="customStore"
                      value={editForm.customStore}
                      onChange={handleEditChange}
                      placeholder="Type store name..."
                      style={{ marginTop: '0.4rem' }}
                    />
                  )}
                </div>
                <div className="form-group">
                  <label>Requested By</label>
                  <select name="requestedBy" value={editForm.requestedBy} onChange={handleEditChange}>
                    <option value="">Select...</option>
                    {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select name="status" value={editForm.status} onChange={handleEditChange}>
                  <option value="pending">Pending</option>
                  <option value="ordered">Ordered</option>
                  <option value="received">Received</option>
                </select>
              </div>

              {(editForm.status === 'ordered' || editForm.status === 'received') && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Purchase Date</label>
                      <input type="date" name="purchaseDate" value={editForm.purchaseDate} onChange={handleEditChange} />
                    </div>
                    <div className="form-group">
                      <label>Expected Delivery</label>
                      <input type="date" name="deliveryDate" value={editForm.deliveryDate} onChange={handleEditChange} min={editForm.purchaseDate || undefined} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Order Link / Tracking</label>
                    <input type="text" name="trackingLink" value={editForm.trackingLink} onChange={handleEditChange} placeholder="Paste URL or tracking number..." />
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Notes</label>
                <textarea name="notes" value={editForm.notes} onChange={handleEditChange} placeholder="Brand, size, color, urgency..." rows={2} />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setEditingItem(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Delete Consumable</h2>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>×</button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p style={{ marginBottom: '0.5rem' }}>
                Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
              </p>
              <p style={{ color: 'var(--accent)', fontSize: '0.9rem' }}>
                This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-outline" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Consumables;
