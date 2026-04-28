import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { getInventory, updateInventoryItem } from '../../utils/storage';
import { INVENTORY_CATEGORIES } from '../../utils/constants';

function EquipmentTab({ project, onUpdate, teamMemberNames: TEAM_MEMBERS = [] }) {
  const [newArtistItem, setNewArtistItem] = useState({ name: '', quantity: 1, notes: '' });
  const [newMuseumItem, setNewMuseumItem] = useState({ name: '', quantity: 1, notes: '' });
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState({ name: '', quantity: 1, notes: '' });
  const [inventory, setInventory] = useState([]);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [selectedInventoryItems, setSelectedInventoryItems] = useState([]);
  const [checkoutPerson, setCheckoutPerson] = useState('');
  const [assignmentType, setAssignmentType] = useState('reserved'); // 'reserved' or 'in-use'
  const [checkoutDate, setCheckoutDate] = useState('');
  const [returnDate, setReturnDate] = useState('');

  useEffect(() => {
    getInventory().then(setInventory);
  }, []);

  const artistItems = project.artistProviding || [];
  const museumItems = project.museumProviding || [];

  const addArtistItem = (e) => {
    e.preventDefault();
    if (!newArtistItem.name.trim()) return;
    onUpdate({
      artistProviding: [...artistItems, {
        id: uuidv4(),
        name: newArtistItem.name.trim(),
        quantity: parseInt(newArtistItem.quantity) || 1,
        notes: newArtistItem.notes.trim()
      }]
    });
    setNewArtistItem({ name: '', quantity: 1, notes: '' });
  };

  const addMuseumItem = (e) => {
    e.preventDefault();
    if (!newMuseumItem.name.trim()) return;
    onUpdate({
      museumProviding: [...museumItems, {
        id: uuidv4(),
        name: newMuseumItem.name.trim(),
        quantity: parseInt(newMuseumItem.quantity) || 1,
        notes: newMuseumItem.notes.trim()
      }]
    });
    setNewMuseumItem({ name: '', quantity: 1, notes: '' });
  };

  const removeArtistItem = (id) => {
    onUpdate({
      artistProviding: artistItems.filter(item => item.id !== id)
    });
  };

  const removeMuseumItem = (id) => {
    onUpdate({
      museumProviding: museumItems.filter(item => item.id !== id)
    });
  };

  const startEditing = (id, item) => {
    setEditingId(id);
    setEditValue({ name: item.name, quantity: item.quantity || 1, notes: item.notes || '' });
  };

  const saveEdit = (type) => {
    if (!editValue.name.trim()) return;

    const updates = {
      name: editValue.name.trim(),
      quantity: parseInt(editValue.quantity) || 1,
      notes: editValue.notes.trim()
    };

    if (type === 'artist') {
      onUpdate({
        artistProviding: artistItems.map(item =>
          item.id === editingId ? { ...item, ...updates } : item
        )
      });
    } else {
      onUpdate({
        museumProviding: museumItems.map(item =>
          item.id === editingId ? { ...item, ...updates } : item
        )
      });
    }
    setEditingId(null);
    setEditValue({ name: '', quantity: 1, notes: '' });
  };

  const moveItem = (id, from, to) => {
    const sourceList = from === 'artist' ? artistItems : museumItems;
    const item = sourceList.find(i => i.id === id);

    if (from === 'artist') {
      onUpdate({
        artistProviding: artistItems.filter(i => i.id !== id),
        museumProviding: [...museumItems, item]
      });
    } else {
      onUpdate({
        museumProviding: museumItems.filter(i => i.id !== id),
        artistProviding: [...artistItems, item]
      });
    }
  };

  // Get inventory items assigned to this project (reserved or in-use)
  const projectInventoryItems = inventory.filter(
    item => item.currentCheckout?.projectId === project.id
  );

  // Get available inventory items
  const availableInventory = inventory.filter(
    item => item.status === 'available'
  );

  // Get items assigned to other projects (reserved or in-use) with their dates
  const assignedToOthersInventory = inventory.filter(
    item => (item.status === 'reserved' || item.status === 'in-use') &&
            item.currentCheckout?.projectId !== project.id
  );

  const getCategoryLabel = (categoryId) => {
    const cat = INVENTORY_CATEGORIES.find(c => c.id === categoryId);
    return cat ? cat.label : categoryId;
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Check if an item will be available before our opening date
  const willBeAvailable = (item) => {
    if (!project.openingDate || !item.currentCheckout?.expectedReturn) return false;
    return new Date(item.currentCheckout.expectedReturn) < new Date(project.openingDate);
  };

  const handleAssignInventory = async () => {
    if (selectedInventoryItems.length === 0 || !checkoutPerson) {
      alert('Please select items and a team member');
      return;
    }

    for (const itemId of selectedInventoryItems) {
      const item = inventory.find(i => i.id === itemId);
      if (item) {
        const checkoutData = {
          projectId: project.id,
          projectName: project.title,
          checkedOutBy: checkoutPerson,
          checkedOutAt: checkoutDate || new Date().toISOString(),
          expectedReturn: returnDate || project.closingDate || null,
          assignmentType: assignmentType,
          notes: assignmentType === 'reserved' ? 'Reserved via Equipment tab' : 'Checked out via Equipment tab'
        };

        await updateInventoryItem(item.id, {
          status: assignmentType,
          currentCheckout: checkoutData,
          quantityAvailable: Math.max(0, (item.quantityAvailable || item.quantity) - 1)
        });
      }
    }

    setInventory(await getInventory());
    setSelectedInventoryItems([]);
    setCheckoutPerson('');
    setAssignmentType('reserved');
    setCheckoutDate('');
    setReturnDate('');
    setShowInventoryModal(false);
  };

  const handleChangeStatus = async (item, newStatus) => {
    await updateInventoryItem(item.id, {
      status: newStatus,
      currentCheckout: {
        ...item.currentCheckout,
        assignmentType: newStatus,
        statusChangedAt: new Date().toISOString()
      }
    });
    setInventory(await getInventory());
  };

  const handleCancelReservation = async (item) => {
    if (!window.confirm(`Cancel reservation for "${item.name}"?`)) return;

    await updateInventoryItem(item.id, {
      status: 'available',
      currentCheckout: null,
      quantityAvailable: Math.min(item.quantity, (item.quantityAvailable || 0) + 1)
    });

    setInventory(await getInventory());
  };

  const handleReturnInventoryItem = async (item) => {
    if (!window.confirm(`Return "${item.name}" to inventory?`)) return;

    const historyEntry = {
      ...item.currentCheckout,
      returnedBy: 'Equipment Tab',
      returnedAt: new Date().toISOString(),
      conditionOnReturn: item.condition,
      notes: 'Returned from Equipment tab'
    };

    await updateInventoryItem(item.id, {
      status: 'available',
      currentCheckout: null,
      checkoutHistory: [...(item.checkoutHistory || []), historyEntry],
      quantityAvailable: Math.min(item.quantity, (item.quantityAvailable || 0) + 1)
    });

    setInventory(await getInventory());
  };

  const renderItem = (item, type) => {
    const isEditing = editingId === item.id;

    return (
      <div key={item.id} className="equipment-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.25rem' }}>
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <input
                type="text"
                value={editValue.name}
                onChange={(e) => setEditValue(prev => ({ ...prev, name: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEdit(type);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                placeholder="Item name"
                autoFocus
                style={{ flex: 1, padding: '0.25rem 0.5rem', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.85rem' }}
              />
              <input
                type="number"
                value={editValue.quantity}
                onChange={(e) => setEditValue(prev => ({ ...prev, quantity: e.target.value }))}
                min="1"
                style={{ width: '60px', padding: '0.25rem 0.5rem', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.85rem' }}
              />
            </div>
            <input
              type="text"
              value={editValue.notes}
              onChange={(e) => setEditValue(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Notes (e.g., 4 kilos of clay, 30m LED strips)"
              style={{ padding: '0.25rem 0.5rem', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.8rem' }}
            />
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button className="btn btn-small btn-primary" onClick={() => saveEdit(type)}>Save</button>
              <button className="btn btn-small btn-outline" onClick={() => setEditingId(null)}>Cancel</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontWeight: 500 }}>
                {item.name}
                {(item.quantity || 1) > 1 && (
                  <span style={{ color: 'var(--gray)', fontWeight: 400, marginLeft: '0.4rem' }}>
                    x{item.quantity}
                  </span>
                )}
              </span>
              {item.notes && (
                <div style={{ fontSize: '0.75rem', color: 'var(--gray)', marginTop: '0.15rem' }}>
                  {item.notes}
                </div>
              )}
            </div>
            <div className="actions">
              <button
                className="icon-btn"
                onClick={() => startEditing(item.id, item)}
                title="Edit"
              >
                Edit
              </button>
              <button
                className="icon-btn"
                onClick={() => moveItem(item.id, type, type === 'artist' ? 'museum' : 'artist')}
                title={`Move to ${type === 'artist' ? 'Museum' : 'Artist'}`}
              >
                Move
              </button>
              <button
                className="icon-btn"
                onClick={() => type === 'artist' ? removeArtistItem(item.id) : removeMuseumItem(item.id)}
                title="Remove"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Project Dates Banner */}
      {(project.openingDate || project.closingDate || project.deinstallDate) && (
        <div className="card" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            {project.openingDate && (
              <div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Opening Date</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{formatDate(project.openingDate)}</div>
              </div>
            )}
            {project.closingDate && (
              <div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Closing Date</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{formatDate(project.closingDate)}</div>
              </div>
            )}
            {project.deinstallDate && (
              <div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Deinstall Date</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{formatDate(project.deinstallDate)}</div>
              </div>
            )}
            {project.openingDate && (
              <div style={{ marginLeft: 'auto' }}>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Equipment Needed By</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                  {(() => {
                    const days = Math.ceil((new Date(project.openingDate) - new Date()) / (1000 * 60 * 60 * 24));
                    if (days < 0) return 'Already opened';
                    if (days === 0) return 'Today!';
                    return `${days} days`;
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2>Equipment Lists</h2>
        </div>
        <p style={{ color: 'var(--gray)', marginBottom: '1.5rem' }}>
          Track what equipment the artist is providing vs. what the museum needs to supply.
        </p>

        <div className="equipment-section">
          {/* Artist Providing */}
          <div className="equipment-list">
            <h4>Artist Providing ({artistItems.length})</h4>

            {artistItems.length === 0 ? (
              <p style={{ color: 'var(--gray)', fontSize: '0.9rem', fontStyle: 'italic', padding: '0.5rem 0' }}>
                No items added yet
              </p>
            ) : (
              artistItems.map(item => renderItem(item, 'artist'))
            )}

            <form onSubmit={addArtistItem} style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <input
                  type="text"
                  placeholder="Item name..."
                  value={newArtistItem.name}
                  onChange={(e) => setNewArtistItem(prev => ({ ...prev, name: e.target.value }))}
                  style={{ flex: 1, padding: '0.4rem 0.6rem', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.85rem' }}
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={newArtistItem.quantity}
                  onChange={(e) => setNewArtistItem(prev => ({ ...prev, quantity: e.target.value }))}
                  min="1"
                  style={{ width: '60px', padding: '0.4rem 0.6rem', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.85rem' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <input
                  type="text"
                  placeholder="Notes (optional)"
                  value={newArtistItem.notes}
                  onChange={(e) => setNewArtistItem(prev => ({ ...prev, notes: e.target.value }))}
                  style={{ flex: 1, padding: '0.4rem 0.6rem', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.8rem' }}
                />
                <button type="submit" className="btn btn-small btn-primary">Add</button>
              </div>
            </form>
          </div>

          {/* Museum Providing */}
          <div className="equipment-list">
            <h4>Museum Providing ({museumItems.length})</h4>

            {museumItems.length === 0 ? (
              <p style={{ color: 'var(--gray)', fontSize: '0.9rem', fontStyle: 'italic', padding: '0.5rem 0' }}>
                No items added yet
              </p>
            ) : (
              museumItems.map(item => renderItem(item, 'museum'))
            )}

            <form onSubmit={addMuseumItem} style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <input
                  type="text"
                  placeholder="Item name..."
                  value={newMuseumItem.name}
                  onChange={(e) => setNewMuseumItem(prev => ({ ...prev, name: e.target.value }))}
                  style={{ flex: 1, padding: '0.4rem 0.6rem', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.85rem' }}
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={newMuseumItem.quantity}
                  onChange={(e) => setNewMuseumItem(prev => ({ ...prev, quantity: e.target.value }))}
                  min="1"
                  style={{ width: '60px', padding: '0.4rem 0.6rem', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.85rem' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <input
                  type="text"
                  placeholder="Notes (optional)"
                  value={newMuseumItem.notes}
                  onChange={(e) => setNewMuseumItem(prev => ({ ...prev, notes: e.target.value }))}
                  style={{ flex: 1, padding: '0.4rem 0.6rem', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.8rem' }}
                />
                <button type="submit" className="btn btn-small btn-primary">Add</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="card">
        <div className="card-header">
          <h3>Equipment Summary</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: '#e8f4fd', borderRadius: '8px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{artistItems.length}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Items from Artist</div>
          </div>
          <div style={{ padding: '1rem', background: '#fef3e8', borderRadius: '8px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{museumItems.length}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Items from Museum</div>
          </div>
          <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '8px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{projectInventoryItems.length}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>From Inventory</div>
          </div>
        </div>
      </div>

      {/* Inventory Items */}
      <div className="card">
        <div className="card-header">
          <h3>Assigned Inventory Items ({projectInventoryItems.length})</h3>
          <button
            className="btn btn-small btn-primary"
            onClick={() => setShowInventoryModal(true)}
          >
            + Assign from Inventory
          </button>
        </div>

        {projectInventoryItems.length === 0 ? (
          <p style={{ color: 'var(--gray)', fontStyle: 'italic' }}>
            No inventory items assigned to this project.{' '}
            <Link to="/inventory" style={{ color: 'var(--secondary)' }}>
              Browse inventory
            </Link>
          </p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Assigned By</th>
                  <th>Dates</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projectInventoryItems.map(item => (
                  <tr key={item.id}>
                    <td>
                      <Link
                        to={`/inventory/${item.id}`}
                        style={{ color: 'var(--secondary)', textDecoration: 'none', fontWeight: 500 }}
                      >
                        {item.name}
                      </Link>
                      {item.serialNumber && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>
                          S/N: {item.serialNumber}
                        </div>
                      )}
                    </td>
                    <td>{getCategoryLabel(item.category)}</td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        background: item.status === 'reserved' ? '#ede9fe' : '#dbeafe',
                        color: item.status === 'reserved' ? '#7c3aed' : '#1e40af'
                      }}>
                        {item.status === 'reserved' ? 'Reserved' : 'In Use'}
                      </span>
                    </td>
                    <td>{item.currentCheckout?.checkedOutBy || '-'}</td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>
                        <div>
                          <span style={{ color: 'var(--gray)' }}>From:</span>{' '}
                          {item.currentCheckout?.checkedOutAt
                            ? formatDate(item.currentCheckout.checkedOutAt)
                            : '-'}
                        </div>
                        <div>
                          <span style={{ color: 'var(--gray)' }}>To:</span>{' '}
                          {item.currentCheckout?.expectedReturn
                            ? formatDate(item.currentCheckout.expectedReturn)
                            : '-'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {item.status === 'reserved' && (
                          <>
                            <button
                              className="btn btn-small btn-primary"
                              onClick={() => handleChangeStatus(item, 'in-use')}
                              title="Mark as In Use"
                            >
                              Start Use
                            </button>
                            <button
                              className="btn btn-small btn-outline"
                              onClick={() => handleCancelReservation(item)}
                              title="Cancel Reservation"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {item.status === 'in-use' && (
                          <button
                            className="btn btn-small btn-success"
                            onClick={() => handleReturnInventoryItem(item)}
                          >
                            Return
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign from Inventory Modal */}
      {showInventoryModal && (
        <div className="modal-overlay" onClick={() => setShowInventoryModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3>Assign Inventory Items</h3>
              <button className="icon-btn" onClick={() => setShowInventoryModal(false)}>x</button>
            </div>

            {/* Project dates context */}
            {project.openingDate && (
              <div style={{
                padding: '0.75rem 1rem',
                background: '#f0f9ff',
                borderRadius: '6px',
                marginBottom: '1rem',
                fontSize: '0.9rem'
              }}>
                <strong>Project Opens:</strong> {formatDate(project.openingDate)}
                {project.closingDate && (
                  <span style={{ marginLeft: '1rem' }}>
                    <strong>Closes:</strong> {formatDate(project.closingDate)}
                  </span>
                )}
              </div>
            )}

            {/* Assignment Type */}
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Assignment Type</label>
              <div style={{ display: 'flex', gap: '0', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setAssignmentType('reserved')}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    border: 'none',
                    background: assignmentType === 'reserved' ? '#8b5cf6' : 'white',
                    color: assignmentType === 'reserved' ? 'white' : 'var(--dark)',
                    cursor: 'pointer',
                    fontWeight: 500,
                    fontSize: '0.9rem',
                    borderRight: '1px solid var(--border)'
                  }}
                >
                  Reserve for Later
                </button>
                <button
                  type="button"
                  onClick={() => setAssignmentType('in-use')}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    border: 'none',
                    background: assignmentType === 'in-use' ? '#3b82f6' : 'white',
                    color: assignmentType === 'in-use' ? 'white' : 'var(--dark)',
                    cursor: 'pointer',
                    fontWeight: 500,
                    fontSize: '0.9rem'
                  }}
                >
                  Check Out Now
                </button>
              </div>
            </div>

            {/* Dates */}
            <div className="form-row">
              <div className="form-group">
                <label>{assignmentType === 'reserved' ? 'Reservation Start' : 'Checkout Date'}</label>
                <input
                  type="date"
                  value={checkoutDate}
                  onChange={e => setCheckoutDate(e.target.value)}
                />
                <small style={{ color: 'var(--gray)', fontSize: '0.8rem' }}>
                  Leave blank for today
                </small>
              </div>
              <div className="form-group">
                <label>Expected Return</label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={e => setReturnDate(e.target.value)}
                />
                <small style={{ color: 'var(--gray)', fontSize: '0.8rem' }}>
                  {project.closingDate ? `Project closes: ${formatDate(project.closingDate)}` : 'When should items be returned?'}
                </small>
              </div>
            </div>

            <div className="form-group">
              <label>Assigned By *</label>
              <select
                value={checkoutPerson}
                onChange={e => setCheckoutPerson(e.target.value)}
              >
                <option value="">Select team member...</option>
                {TEAM_MEMBERS.map(member => (
                  <option key={member} value={member}>{member}</option>
                ))}
              </select>
            </div>

            {/* Available Items Section */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontWeight: 500, marginBottom: '0.5rem', display: 'block', color: '#10b981' }}>
                Available Now ({availableInventory.length})
              </label>
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '6px' }}>
                {availableInventory.length === 0 ? (
                  <p style={{ padding: '1rem', color: 'var(--gray)', textAlign: 'center' }}>
                    No available inventory items.{' '}
                    <Link to="/inventory" style={{ color: 'var(--secondary)' }}>
                      Add items to inventory
                    </Link>
                  </p>
                ) : (
                  availableInventory.map(item => (
                    <label
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        background: selectedInventoryItems.includes(item.id) ? '#f0f9ff' : 'transparent'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedInventoryItems.includes(item.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedInventoryItems([...selectedInventoryItems, item.id]);
                          } else {
                            setSelectedInventoryItems(selectedInventoryItems.filter(id => id !== item.id));
                          }
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500 }}>{item.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>
                          {getCategoryLabel(item.category)}
                          {item.serialNumber && ` | S/N: ${item.serialNumber}`}
                          {item.location && ` | ${item.location}`}
                        </div>
                      </div>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        background: '#d1fae5',
                        color: '#065f46',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 500
                      }}>
                        Available
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Assigned to Other Projects Section */}
            {assignedToOthersInventory.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontWeight: 500, marginBottom: '0.5rem', display: 'block', color: '#6b7280' }}>
                  Assigned to Other Projects ({assignedToOthersInventory.length})
                </label>
                <p style={{ fontSize: '0.85rem', color: 'var(--gray)', marginBottom: '0.5rem' }}>
                  These items are reserved or in use. Check return dates for availability.
                </p>
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '6px', background: '#f8fafc' }}>
                  {assignedToOthersInventory.map(item => {
                    const available = willBeAvailable(item);
                    return (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.75rem 1rem',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {item.name}
                            {available && (
                              <span style={{
                                padding: '0.15rem 0.4rem',
                                background: '#fef3c7',
                                color: '#92400e',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: 500
                              }}>
                                Available before opening
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>
                            {getCategoryLabel(item.category)}
                            {item.serialNumber && ` | S/N: ${item.serialNumber}`}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{
                            padding: '0.25rem 0.5rem',
                            background: item.status === 'reserved' ? '#ede9fe' : '#dbeafe',
                            color: item.status === 'reserved' ? '#7c3aed' : '#1e40af',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 500
                          }}>
                            {item.status === 'reserved' ? 'Reserved' : 'In Use'}: {item.currentCheckout?.projectName || 'Unknown'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray)', marginTop: '0.25rem' }}>
                            {item.currentCheckout?.checkedOutAt && (
                              <span>{formatDate(item.currentCheckout.checkedOutAt)}</span>
                            )}
                            {item.currentCheckout?.expectedReturn && (
                              <span> - {formatDate(item.currentCheckout.expectedReturn)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button
                className="btn btn-outline"
                onClick={() => {
                  setShowInventoryModal(false);
                  setSelectedInventoryItems([]);
                  setCheckoutPerson('');
                  setAssignmentType('reserved');
                  setCheckoutDate('');
                  setReturnDate('');
                }}
              >
                Cancel
              </button>
              <button
                className={`btn ${assignmentType === 'reserved' ? 'btn-primary' : 'btn-success'}`}
                style={assignmentType === 'reserved' ? { background: '#8b5cf6' } : {}}
                onClick={handleAssignInventory}
                disabled={selectedInventoryItems.length === 0 || !checkoutPerson}
              >
                {assignmentType === 'reserved' ? 'Reserve' : 'Check Out'} {selectedInventoryItems.length} Item{selectedInventoryItems.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EquipmentTab;
