import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { getConsumables, createConsumable, updateConsumable, getProjects } from '../utils/storage';
import { SUGGESTED_STORES } from '../utils/constants';

function Purchasing() {
  const [consumables, setConsumables] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeView, setActiveView] = useState('pending');

  useEffect(() => {
    getConsumables().then(setConsumables);
    getProjects().then(setProjects);
  }, []);

  const handleStatusChange = async (id, status) => {
    const updates = { status };
    if (status === 'ordered') updates.purchaseDate = new Date().toISOString().split('T')[0];
    if (status === 'received') updates.receivedDate = new Date().toISOString().split('T')[0];
    await updateConsumable(id, updates);
    setConsumables(await getConsumables());
  };

  const handleDeliveryDateUpdate = async (id, deliveryDate) => {
    await updateConsumable(id, { deliveryDate: deliveryDate || null });
    setConsumables(await getConsumables());
  };

  const handleTrackingUpdate = async (id, trackingLink) => {
    await updateConsumable(id, { trackingLink: trackingLink.trim() || null });
    setConsumables(await getConsumables());
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
    setConsumables(await getConsumables());
  };

  const handleCostUpdate = async (id, cost) => {
    await updateConsumable(id, { cost: cost ? parseFloat(cost) : null });
    setConsumables(await getConsumables());
  };

  const handleStoreUpdate = async (id, store) => {
    await updateConsumable(id, { store });
    setConsumables(await getConsumables());
  };

  // Consumable stats
  const pendingConsumables = consumables.filter(c => c.status === 'pending');
  const orderedConsumables = consumables.filter(c => c.status === 'ordered');
  const receivedConsumables = consumables.filter(c => c.status === 'received');

  // BOM items to buy across all projects
  const bomItemsToBuy = projects.flatMap(project =>
    (project.bomList || [])
      .filter(item => item.status === 'to-buy')
      .map(item => ({ ...item, projectTitle: project.title, projectId: project.id }))
  );

  const totalConsumableCost = consumables
    .filter(c => c.status !== 'received')
    .reduce((sum, c) => sum + (c.cost ? c.cost * c.quantity : 0), 0);

  const totalBomCost = bomItemsToBuy
    .reduce((sum, item) => sum + (item.cost ? item.cost * item.quantity : 0), 0);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending': return { background: '#fef3c7', color: '#92400e' };
      case 'ordered': return { background: '#dbeafe', color: '#1e40af' };
      case 'received': return { background: '#d1fae5', color: '#065f46' };
      case 'to-buy': return { background: '#fef3c7', color: '#92400e' };
      default: return { background: 'var(--light)', color: 'var(--gray)' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric'
    });
  };

  return (
    <div className="app">
      <header className="header">
        <Link to="/"><h1>Museum Project Manager</h1></Link>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/consumables" className="btn btn-outline btn-small" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
            Consumables
          </Link>
          <Link to="/dashboard" className="btn btn-outline btn-small" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
            Dashboard
          </Link>
        </div>
      </header>

      <div className="container">
        <h2 style={{ marginBottom: '1.5rem' }}>Purchasing Dashboard</h2>

        {/* Summary Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div className="stat-card" style={{ borderTop: '3px solid #f59e0b' }}>
            <div className="stat-value" style={{ color: '#f59e0b' }}>{pendingConsumables.length}</div>
            <div className="stat-label">Pending Consumables</div>
          </div>
          <div className="stat-card" style={{ borderTop: '3px solid #3b82f6' }}>
            <div className="stat-value" style={{ color: '#3b82f6' }}>{orderedConsumables.length}</div>
            <div className="stat-label">Ordered</div>
          </div>
          <div className="stat-card" style={{ borderTop: '3px solid #8b5cf6' }}>
            <div className="stat-value" style={{ color: '#8b5cf6' }}>{bomItemsToBuy.length}</div>
            <div className="stat-label">BOM Items to Buy</div>
          </div>
          <div className="stat-card" style={{ borderTop: '3px solid #5b4a8a' }}>
            <div className="stat-value" style={{ color: '#5b4a8a', fontSize: '1.25rem' }}>
              ${(totalConsumableCost + totalBomCost).toFixed(2)}
            </div>
            <div className="stat-label">Total Outstanding</div>
          </div>
        </div>

        {/* View Tabs */}
        <div style={{
          display: 'flex', gap: '0.5rem', marginBottom: '1.5rem',
          borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem'
        }}>
          {[
            { id: 'pending', label: 'Needs Ordering', count: pendingConsumables.length + bomItemsToBuy.length },
            { id: 'ordered', label: 'Ordered', count: orderedConsumables.length },
            { id: 'bom', label: 'Project Shopping Lists', count: bomItemsToBuy.length },
            { id: 'received', label: 'Received', count: receivedConsumables.length },
          ].map(view => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              style={{
                padding: '0.75rem 1.25rem', border: 'none',
                background: activeView === view.id ? 'var(--secondary)' : 'transparent',
                color: activeView === view.id ? 'white' : 'var(--dark)',
                borderRadius: '6px 6px 0 0', cursor: 'pointer', fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                fontSize: '0.95rem', whiteSpace: 'nowrap'
              }}
            >
              {view.label}
              {view.count > 0 && (
                <span style={{
                  background: activeView === view.id ? 'rgba(255,255,255,0.2)' : 'var(--accent)',
                  color: 'white', padding: '0.1rem 0.5rem', borderRadius: '10px', fontSize: '0.8rem'
                }}>
                  {view.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Needs Ordering Tab */}
        {activeView === 'pending' && (
          <div className="card">
            <div className="card-header">
              <h3>Items That Need Ordering</h3>
            </div>

            {pendingConsumables.length === 0 && bomItemsToBuy.length === 0 ? (
              <div className="empty-state">
                <p>All caught up! No pending items.</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Source</th>
                      <th>Requested By</th>
                      <th>Qty</th>
                      <th>Store</th>
                      <th>Cost</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingConsumables.map(item => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.name}</strong>
                          {item.notes && <div style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>{item.notes}</div>}
                        </td>
                        <td><span style={{ fontSize: '0.75rem', ...getStatusStyle('pending'), padding: '0.15rem 0.4rem', borderRadius: '3px' }}>Consumable</span></td>
                        <td>{item.requestedBy || '-'}</td>
                        <td>{item.quantity} {item.unit}</td>
                        <td>
                          <select
                            value={SUGGESTED_STORES.includes(item.store) ? item.store : ''}
                            onChange={(e) => handleStoreUpdate(item.id, e.target.value)}
                            style={{ fontSize: '0.85rem', padding: '0.2rem', border: '1px solid var(--border)', borderRadius: '3px' }}
                          >
                            <option value="">-</option>
                            {SUGGESTED_STORES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            defaultValue={item.cost || ''}
                            onBlur={(e) => handleCostUpdate(item.id, e.target.value)}
                            placeholder="$"
                            min="0"
                            step="0.01"
                            style={{ width: '70px', fontSize: '0.85rem', padding: '0.2rem', border: '1px solid var(--border)', borderRadius: '3px' }}
                          />
                        </td>
                        <td>
                          <button
                            className="btn btn-primary btn-small"
                            onClick={() => handleStatusChange(item.id, 'ordered')}
                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                          >
                            Mark Ordered
                          </button>
                        </td>
                      </tr>
                    ))}
                    {bomItemsToBuy.map(item => (
                      <tr key={item.id} style={{ background: '#faf5ff' }}>
                        <td>
                          <strong>{item.name}</strong>
                          {item.notes && <div style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>{item.notes}</div>}
                        </td>
                        <td>
                          <Link to={`/project/${item.projectId}`} style={{ fontSize: '0.75rem', color: '#8b5cf6', textDecoration: 'none' }}>
                            {item.projectTitle}
                          </Link>
                        </td>
                        <td>{item.requestedBy || '-'}</td>
                        <td>{item.quantity} {item.unit}</td>
                        <td>{item.supplier || '-'}</td>
                        <td>{item.cost ? `$${(item.cost * item.quantity).toFixed(2)}` : '-'}</td>
                        <td>
                          <span style={{ fontSize: '0.75rem', ...getStatusStyle('to-buy'), padding: '0.2rem 0.5rem', borderRadius: '3px', fontWeight: 600 }}>
                            To Buy
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Ordered Tab */}
        {activeView === 'ordered' && (
          <div className="card">
            <div className="card-header">
              <h3>Ordered Items</h3>
            </div>

            {orderedConsumables.length === 0 ? (
              <div className="empty-state">
                <p>No items currently on order.</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Store</th>
                      <th>Cost</th>
                      <th>Purchased</th>
                      <th>Expected Delivery</th>
                      <th>Tracking</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderedConsumables.map(item => {
                      const isLate = item.deliveryDate && new Date(item.deliveryDate) < new Date();
                      return (
                        <tr key={item.id} style={isLate ? { background: '#fef2f2' } : {}}>
                          <td>
                            <strong>{item.name}</strong>
                            {item.notes && <div style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>{item.notes}</div>}
                            {item.trackingLink && (
                              <div style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
                                {item.trackingLink.startsWith('http') ? (
                                  <a href={item.trackingLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--secondary)' }}>
                                    Track order
                                  </a>
                                ) : (
                                  <span style={{ color: 'var(--gray)' }}>Tracking: {item.trackingLink}</span>
                                )}
                              </div>
                            )}
                          </td>
                          <td>{item.quantity} {item.unit}</td>
                          <td>{item.store || '-'}</td>
                          <td>{item.cost ? `$${(item.cost * item.quantity).toFixed(2)}` : '-'}</td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>{formatDate(item.purchaseDate)}</td>
                          <td>
                            <input
                              type="date"
                              defaultValue={item.deliveryDate || ''}
                              onBlur={(e) => handleDeliveryDateUpdate(item.id, e.target.value)}
                              min={item.purchaseDate || undefined}
                              style={{ fontSize: '0.85rem', padding: '0.2rem', border: '1px solid var(--border)', borderRadius: '3px' }}
                            />
                            {isLate && <div style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 600 }}>OVERDUE</div>}
                          </td>
                          <td>
                            <input
                              type="text"
                              defaultValue={item.trackingLink || ''}
                              onBlur={(e) => handleTrackingUpdate(item.id, e.target.value)}
                              placeholder="URL or tracking #"
                              style={{ fontSize: '0.8rem', padding: '0.2rem 0.4rem', border: '1px solid var(--border)', borderRadius: '3px', width: '140px' }}
                            />
                          </td>
                          <td>
                            <button
                              className="btn btn-primary btn-small"
                              onClick={() => handleStatusChange(item.id, 'received')}
                              style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', background: 'var(--success)' }}
                            >
                              Mark Received
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* BOM Shopping Lists Tab */}
        {activeView === 'bom' && (
          <div className="card">
            <div className="card-header">
              <h3>Project Shopping Lists (BOM)</h3>
            </div>
            <p style={{ color: 'var(--gray)', marginBottom: '1rem', fontSize: '0.9rem' }}>
              All BOM items marked "To Buy" across all projects
            </p>

            {bomItemsToBuy.length === 0 ? (
              <div className="empty-state">
                <p>No BOM items to purchase.</p>
              </div>
            ) : (
              <>
                <div style={{
                  padding: '0.75rem 1rem', background: '#fef3c7', borderRadius: '6px',
                  marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <span style={{ fontWeight: 500 }}>{bomItemsToBuy.length} items to purchase</span>
                  <span style={{ fontWeight: 'bold' }}>Est. Total: ${totalBomCost.toFixed(2)}</span>
                </div>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Project</th>
                        <th>Requested By</th>
                        <th>Qty</th>
                        <th>Supplier</th>
                        <th>Est. Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bomItemsToBuy.map(item => (
                        <tr key={item.id}>
                          <td>
                            <strong>{item.name}</strong>
                            {item.notes && <div style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>{item.notes}</div>}
                          </td>
                          <td>
                            <Link to={`/project/${item.projectId}`} style={{ color: 'var(--secondary)', textDecoration: 'none' }}>
                              {item.projectTitle}
                            </Link>
                          </td>
                          <td>{item.requestedBy || '-'}</td>
                          <td>{item.quantity} {item.unit}</td>
                          <td>{item.supplier || '-'}</td>
                          <td>{item.cost ? `$${(item.cost * item.quantity).toFixed(2)}` : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* Received Tab */}
        {activeView === 'received' && (
          <div className="card">
            <div className="card-header">
              <h3>Received Items</h3>
            </div>

            {receivedConsumables.length === 0 ? (
              <div className="empty-state">
                <p>No received items yet.</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Store</th>
                      <th>Cost</th>
                      <th>Purchased</th>
                      <th>Received</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {receivedConsumables.map(item => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.name}</strong>
                          {item.notes && <div style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>{item.notes}</div>}
                        </td>
                        <td>{item.quantity} {item.unit}</td>
                        <td>{item.store || '-'}</td>
                        <td>{item.cost ? `$${(item.cost * item.quantity).toFixed(2)}` : '-'}</td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>{formatDate(item.purchaseDate)}</td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>{formatDate(item.receivedDate)}</td>
                        <td>
                          <button
                            className="btn btn-outline btn-small"
                            onClick={() => handleReorder(item)}
                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                          >
                            Reorder
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Purchasing;
