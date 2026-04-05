import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { TEAM_MEMBERS } from '../../utils/constants';

function BOMTab({ project, onUpdate }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    quantity: 1,
    unit: 'pcs',
    status: 'in-stock',
    supplier: '',
    cost: '',
    notes: '',
    requestedBy: ''
  });

  const bomList = project.bomList || [];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      quantity: 1,
      unit: 'pcs',
      status: 'in-stock',
      supplier: '',
      cost: '',
      notes: '',
      requestedBy: ''
    });
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const newItem = {
      id: uuidv4(),
      ...formData,
      quantity: parseInt(formData.quantity) || 1,
      cost: formData.cost ? parseFloat(formData.cost) : null
    };

    onUpdate({ bomList: [...bomList, newItem] });
    resetForm();
    setShowAddModal(false);
  };

  const handleEdit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const updated = bomList.map(item =>
      item.id === editingItem.id
        ? {
            ...item,
            ...formData,
            quantity: parseInt(formData.quantity) || 1,
            cost: formData.cost ? parseFloat(formData.cost) : null
          }
        : item
    );

    onUpdate({ bomList: updated });
    resetForm();
    setEditingItem(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Remove this item from the BOM?')) {
      onUpdate({ bomList: bomList.filter(item => item.id !== id) });
    }
  };

  const startEdit = (item) => {
    setFormData({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit || 'pcs',
      status: item.status,
      supplier: item.supplier || '',
      cost: item.cost || '',
      notes: item.notes || '',
      requestedBy: item.requestedBy || ''
    });
    setEditingItem(item);
  };

  const updateStatus = (id, status) => {
    const updated = bomList.map(item =>
      item.id === id ? { ...item, status } : item
    );
    onUpdate({ bomList: updated });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'in-stock': return 'in-stock';
      case 'to-buy': return 'to-buy';
      case 'ordered': return 'ordered';
      default: return '';
    }
  };

  const totalCost = bomList.reduce((sum, item) => {
    return sum + (item.cost ? item.cost * item.quantity : 0);
  }, 0);

  const itemsToBuy = bomList.filter(item => item.status === 'to-buy').length;
  const itemsOrdered = bomList.filter(item => item.status === 'ordered').length;

  const renderModal = (isEdit) => (
    <div className="modal-overlay" onClick={() => { resetForm(); setShowAddModal(false); setEditingItem(null); }}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit BOM Item' : 'Add BOM Item'}</h3>
          <button
            className="icon-btn"
            onClick={() => { resetForm(); setShowAddModal(false); setEditingItem(null); }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={isEdit ? handleEdit : handleAdd}>
          <div className="form-group">
            <label>Item Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., HDMI Cable 10m"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Quantity</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="1"
              />
            </div>
            <div className="form-group">
              <label>Unit</label>
              <select name="unit" value={formData.unit} onChange={handleChange}>
                <option value="pcs">pcs</option>
                <option value="m">meters</option>
                <option value="ft">feet</option>
                <option value="kg">kg</option>
                <option value="set">set</option>
                <option value="roll">roll</option>
                <option value="box">box</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Status</label>
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="in-stock">In Stock</option>
              <option value="to-buy">To Buy</option>
              <option value="ordered">Ordered</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Supplier</label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                placeholder="Supplier name"
              />
            </div>
            <div className="form-group">
              <label>Unit Cost ($)</label>
              <input
                type="number"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Requested By</label>
            <select name="requestedBy" value={formData.requestedBy} onChange={handleChange}>
              <option value="">Select...</option>
              {TEAM_MEMBERS.map(member => (
                <option key={member} value={member}>{member}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional notes..."
              rows={2}
            />
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
              {isEdit ? 'Save Changes' : 'Add Item'}
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
          <h2>Bill of Materials</h2>
          <button className="btn btn-primary btn-small" onClick={() => setShowAddModal(true)}>
            + Add Item
          </button>
        </div>

        {/* Budget Tracking */}
        {project.budget > 0 && (
          <div style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            background: totalCost > project.budget ? '#fef2f2' : '#f0fdf4',
            borderRadius: '8px',
            border: `1px solid ${totalCost > project.budget ? 'var(--accent)' : 'var(--success)'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontWeight: 500 }}>Budget Tracking</span>
              <span style={{
                fontWeight: 'bold',
                color: totalCost > project.budget ? 'var(--accent)' : 'var(--success)'
              }}>
                {totalCost > project.budget ? 'Over Budget!' : 'Within Budget'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Allocated</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                  ${project.budget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Estimated Spend</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                  ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Remaining</div>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: (project.budget - totalCost) >= 0 ? 'var(--success)' : 'var(--accent)'
                }}>
                  ${(project.budget - totalCost).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
            <div className="progress-bar" style={{ marginTop: '0.75rem', height: '8px' }}>
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min((totalCost / project.budget) * 100, 100)}%`,
                  background: totalCost > project.budget ? 'var(--accent)' : 'var(--success)'
                }}
              />
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--gray)', marginTop: '0.25rem', textAlign: 'right' }}>
              {Math.round((totalCost / project.budget) * 100)}% of budget used
            </div>
          </div>
        )}

        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ padding: '0.75rem', background: 'var(--light)', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{bomList.length}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>Total Items</div>
          </div>
          <div style={{ padding: '0.75rem', background: '#fef3c7', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{itemsToBuy}</div>
            <div style={{ fontSize: '0.8rem', color: '#92400e' }}>To Buy</div>
          </div>
          <div style={{ padding: '0.75rem', background: '#dbeafe', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{itemsOrdered}</div>
            <div style={{ fontSize: '0.8rem', color: '#1e40af' }}>Ordered</div>
          </div>
          <div style={{ padding: '0.75rem', background: '#d1fae5', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>${totalCost.toFixed(2)}</div>
            <div style={{ fontSize: '0.8rem', color: '#065f46' }}>Est. Cost</div>
          </div>
        </div>

        {bomList.length === 0 ? (
          <div className="empty-state">
            <p>No items in the BOM yet. Click "Add Item" to get started.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Status</th>
                  <th>Requested By</th>
                  <th>Supplier</th>
                  <th>Unit Cost</th>
                  <th>Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bomList.map(item => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name}</strong>
                      {item.notes && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>{item.notes}</div>
                      )}
                    </td>
                    <td>{item.quantity} {item.unit}</td>
                    <td>
                      <select
                        value={item.status}
                        onChange={(e) => updateStatus(item.id, e.target.value)}
                        className={`bom-status ${getStatusClass(item.status)}`}
                        style={{ border: 'none', cursor: 'pointer' }}
                      >
                        <option value="in-stock">In Stock</option>
                        <option value="to-buy">To Buy</option>
                        <option value="ordered">Ordered</option>
                      </select>
                    </td>
                    <td>{item.requestedBy || '—'}</td>
                    <td>{item.supplier || '—'}</td>
                    <td>{item.cost ? `$${item.cost.toFixed(2)}` : '—'}</td>
                    <td>{item.cost ? `$${(item.cost * item.quantity).toFixed(2)}` : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button className="icon-btn" onClick={() => startEdit(item)} title="Edit">
                          Edit
                        </button>
                        <button className="icon-btn" onClick={() => handleDelete(item.id)} title="Delete">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Items to Buy List */}
      {itemsToBuy > 0 && (
        <div className="card">
          <div className="card-header">
            <h3>Shopping List (To Buy)</h3>
          </div>
          <ul style={{ paddingLeft: '1.5rem' }}>
            {bomList
              .filter(item => item.status === 'to-buy')
              .map(item => (
                <li key={item.id} style={{ marginBottom: '0.5rem' }}>
                  <strong>{item.name}</strong> — {item.quantity} {item.unit}
                  {item.supplier && <span style={{ color: 'var(--gray)' }}> (from {item.supplier})</span>}
                  {item.requestedBy && <span style={{ color: 'var(--gray)' }}> — requested by {item.requestedBy}</span>}
                </li>
              ))
            }
          </ul>
        </div>
      )}

      {showAddModal && renderModal(false)}
      {editingItem && renderModal(true)}
    </div>
  );
}

export default BOMTab;
