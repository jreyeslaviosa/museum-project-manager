import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getInventoryItem, updateInventoryItem, deleteInventoryItem, getProjects } from '../../utils/storage';
import { INVENTORY_CATEGORIES, CONDITION_OPTIONS, INVENTORY_STATUS_OPTIONS } from '../../utils/constants';
import { useUser } from '../../utils/UserContext';
import InventoryItemModal from './InventoryItemModal';
import CheckoutModal from './CheckoutModal';

function InventoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile, teamMemberNames } = useUser();
  const [item, setItem] = useState(null);
  const [projects, setProjects] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const inventoryItem = await getInventoryItem(id);
        if (!inventoryItem) {
          navigate('/inventory');
          return;
        }
        setItem(inventoryItem);
        setProjects(await getProjects());
      } catch {
        setError('Failed to load item. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, navigate]);

  if (loading) {
    return <div className="app"><header className="header"><Link to="/"><h1>Museum Project Manager</h1></Link></header><div className="container" style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray)' }}>Loading item...</div></div>;
  }

  if (error) {
    return <div className="app"><header className="header"><Link to="/"><h1>Museum Project Manager</h1></Link></header><div className="container" style={{ textAlign: 'center', padding: '3rem' }}><p style={{ color: 'var(--accent)', marginBottom: '1rem' }}>{error}</p><button className="btn btn-outline" onClick={() => window.location.reload()}>Retry</button></div></div>;
  }

  if (!item) return null;

  const handleSave = async (updatedItem) => {
    const withUser = { ...updatedItem, updatedBy: userProfile?.name || 'Unknown' };
    await updateInventoryItem(id, withUser);
    setItem({ ...item, ...withUser });
    setShowEditModal(false);
  };

  const handleDelete = async () => {
    await deleteInventoryItem(id);
    navigate('/inventory');
  };

  const handleCheckout = async (checkoutData, assignmentType) => {
    const updatedItem = {
      ...item,
      status: assignmentType || 'in-use',
      currentCheckout: checkoutData,
      quantityAvailable: Math.max(0, (item.quantityAvailable || item.quantity) - 1)
    };
    await updateInventoryItem(id, updatedItem);
    setItem(updatedItem);
    setShowCheckoutModal(false);
  };

  const handleReturn = async (returnData) => {
    const historyEntry = {
      ...item.currentCheckout,
      ...returnData
    };

    const updatedItem = {
      ...item,
      status: 'available',
      condition: returnData.conditionOnReturn,
      currentCheckout: null,
      checkoutHistory: [...(item.checkoutHistory || []), historyEntry],
      quantityAvailable: Math.min(item.quantity, (item.quantityAvailable || 0) + 1)
    };
    await updateInventoryItem(id, updatedItem);
    setItem(updatedItem);
    setShowCheckoutModal(false);
  };

  const handleStartUse = async () => {
    const updatedItem = {
      ...item,
      status: 'in-use',
      currentCheckout: {
        ...item.currentCheckout,
        assignmentType: 'in-use',
        statusChangedAt: new Date().toISOString()
      }
    };
    await updateInventoryItem(id, updatedItem);
    setItem(updatedItem);
    setShowCheckoutModal(false);
  };

  const handleCancelReservation = async () => {
    if (!window.confirm(`Cancel reservation for "${item.name}"?`)) return;

    const updatedItem = {
      ...item,
      status: 'available',
      currentCheckout: null,
      quantityAvailable: Math.min(item.quantity, (item.quantityAvailable || 0) + 1)
    };
    await updateInventoryItem(id, updatedItem);
    setItem(updatedItem);
    setShowCheckoutModal(false);
  };

  const getCategoryInfo = () => {
    const cat = INVENTORY_CATEGORIES.find(c => c.id === item.category);
    return cat || { label: item.category };
  };

  const getConditionInfo = () => {
    return CONDITION_OPTIONS.find(c => c.id === item.condition) || { label: item.condition, color: '#6b7280' };
  };

  const getStatusInfo = () => {
    return INVENTORY_STATUS_OPTIONS.find(s => s.id === item.status) || { label: item.status, color: '#6b7280' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const category = getCategoryInfo();
  const condition = getConditionInfo();
  const status = getStatusInfo();

  return (
    <div className="app">
      <header className="header">
        <Link to="/"><h1>Museum Project Manager</h1></Link>
        <Link to="/inventory" className="btn btn-outline btn-small" style={{ color: 'white', borderColor: 'white' }}>
          Back to Inventory
        </Link>
      </header>

      <div className="container">
        <button className="back-link" onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/inventory')} style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}>
          &larr; Back
        </button>

        <div className="inventory-detail-header">
          <div>
            <h1>{item.name}</h1>
            <div className="item-meta">
              <span className="category-badge">{category.label}</span>
              <span className="status-badge" style={{ background: `${status.color}20`, color: status.color }}>
                {status.label}
              </span>
              <span className="condition-badge" style={{ background: `${condition.color}20`, color: condition.color }}>
                {condition.label}
              </span>
            </div>
          </div>
          <div className="detail-actions">
            {item.status === 'available' && (
              <button className="btn btn-primary" onClick={() => setShowCheckoutModal(true)}>
                Assign
              </button>
            )}
            {item.status === 'reserved' && (
              <button
                className="btn"
                style={{ background: '#8b5cf6', color: 'white' }}
                onClick={() => setShowCheckoutModal(true)}
              >
                Manage Reservation
              </button>
            )}
            {item.status === 'in-use' && (
              <button className="btn btn-success" onClick={() => setShowCheckoutModal(true)}>
                Return Item
              </button>
            )}
            <button className="btn btn-outline" onClick={() => setShowEditModal(true)}>
              Edit
            </button>
            <button className="btn btn-danger" onClick={() => setShowDeleteConfirm(true)}>
              Delete
            </button>
          </div>
        </div>

        <div className="detail-grid">
          {/* Main Info Card */}
          <div className="card">
            <div className="card-header">
              <h3>Details</h3>
            </div>
            <div className="detail-list">
              <div className="detail-row">
                <span className="detail-label">Serial Number</span>
                <span className="detail-value">{item.serialNumber || '-'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Barcode</span>
                <span className="detail-value">{item.barcode || '-'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Location</span>
                <span className="detail-value">{item.location || '-'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Quantity</span>
                <span className="detail-value">
                  {item.quantityAvailable || item.quantity} / {item.quantity} available
                </span>
              </div>
              {item.description && (
                <div className="detail-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span className="detail-label">Description</span>
                  <span className="detail-value" style={{ marginTop: '0.5rem' }}>{item.description}</span>
                </div>
              )}
            </div>
          </div>

          {/* Financial Info Card */}
          <div className="card">
            <div className="card-header">
              <h3>Financial</h3>
            </div>
            <div className="detail-list">
              <div className="detail-row">
                <span className="detail-label">Purchase Date</span>
                <span className="detail-value">{formatDate(item.purchaseDate)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Purchase Cost</span>
                <span className="detail-value">${(item.purchaseCost || 0).toLocaleString()}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Current Value</span>
                <span className="detail-value" style={{ fontWeight: 'bold', color: 'var(--success)' }}>
                  ${(item.currentValue || item.purchaseCost || 0).toLocaleString()}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Vendor</span>
                <span className="detail-value">{item.vendor || '-'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Warranty Expires</span>
                <span className="detail-value">{formatDate(item.warrantyExpiration)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Depreciation</span>
                <span className="detail-value">{item.depreciationYears || 5} years</span>
              </div>
            </div>
          </div>

          {/* Maintenance Card */}
          <div className="card">
            <div className="card-header">
              <h3>Maintenance</h3>
            </div>
            <div className="detail-list">
              <div className="detail-row">
                <span className="detail-label">Schedule</span>
                <span className="detail-value">{item.maintenanceSchedule || 'Not specified'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Last Maintenance</span>
                <span className="detail-value">{formatDate(item.lastMaintenanceDate)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Next Maintenance</span>
                <span className="detail-value">
                  {item.nextMaintenanceDate ? (
                    <span style={{
                      color: new Date(item.nextMaintenanceDate) <= new Date() ? 'var(--accent)' : 'inherit'
                    }}>
                      {formatDate(item.nextMaintenanceDate)}
                      {new Date(item.nextMaintenanceDate) <= new Date() && ' (Overdue)'}
                    </span>
                  ) : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Current Assignment Card */}
          {(item.status === 'reserved' || item.status === 'in-use') && item.currentCheckout && (
            <div className="card" style={{
              borderLeft: `4px solid ${item.status === 'reserved' ? '#8b5cf6' : '#3b82f6'}`
            }}>
              <div className="card-header">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {item.status === 'reserved' ? 'Currently Reserved' : 'Currently In Use'}
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    background: item.status === 'reserved' ? '#ede9fe' : '#dbeafe',
                    color: item.status === 'reserved' ? '#8b5cf6' : '#3b82f6',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 500
                  }}>
                    {item.status === 'reserved' ? 'Reserved' : 'In Use'}
                  </span>
                </h3>
              </div>
              <div className="detail-list">
                <div className="detail-row">
                  <span className="detail-label">Project</span>
                  <span className="detail-value">
                    <Link
                      to={`/project/${item.currentCheckout.projectId}`}
                      style={{ color: 'var(--secondary)' }}
                    >
                      {item.currentCheckout.projectName}
                    </Link>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">{item.status === 'reserved' ? 'Reserved By' : 'Checked Out By'}</span>
                  <span className="detail-value">{item.currentCheckout.checkedOutBy}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">{item.status === 'reserved' ? 'Reserved From' : 'Checked Out At'}</span>
                  <span className="detail-value">{formatDateTime(item.currentCheckout.checkedOutAt)}</span>
                </div>
                {item.currentCheckout.expectedReturn && (
                  <div className="detail-row">
                    <span className="detail-label">Expected Return</span>
                    <span className="detail-value">{formatDate(item.currentCheckout.expectedReturn)}</span>
                  </div>
                )}
                {item.currentCheckout.notes && (
                  <div className="detail-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span className="detail-label">Notes</span>
                    <span className="detail-value" style={{ marginTop: '0.25rem', fontStyle: 'italic' }}>
                      {item.currentCheckout.notes}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Photos */}
        {item.photos && item.photos.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h3>Photos ({item.photos.length})</h3>
            </div>
            <div className="image-gallery">
              {item.photos.map(photo => (
                <div key={photo.id} className="image-item">
                  <img src={photo.data} alt={photo.name} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {item.notes && (
          <div className="card">
            <div className="card-header">
              <h3>Notes</h3>
            </div>
            <p style={{ whiteSpace: 'pre-wrap' }}>{item.notes}</p>
          </div>
        )}

        {/* Checkout History */}
        <div className="card">
          <div className="card-header">
            <h3>Checkout History ({(item.checkoutHistory || []).length})</h3>
          </div>
          {(!item.checkoutHistory || item.checkoutHistory.length === 0) ? (
            <p style={{ color: 'var(--gray)', fontStyle: 'italic' }}>No checkout history</p>
          ) : (
            <div className="history-timeline">
              {[...item.checkoutHistory].reverse().map((entry, index) => (
                <div key={index} className="history-entry">
                  <div className="history-marker"></div>
                  <div className="history-content">
                    <div className="history-header">
                      <Link
                        to={`/project/${entry.projectId}`}
                        style={{ fontWeight: 500, color: 'var(--secondary)', textDecoration: 'none' }}
                      >
                        {entry.projectName}
                      </Link>
                      <span className="history-dates">
                        {formatDate(entry.checkedOutAt)} - {formatDate(entry.returnedAt)}
                      </span>
                    </div>
                    <div className="history-details">
                      <span>Out: {entry.checkedOutBy}</span>
                      <span>Return: {entry.returnedBy}</span>
                      <span style={{
                        color: CONDITION_OPTIONS.find(c => c.id === entry.conditionOnReturn)?.color
                      }}>
                        Condition: {entry.conditionOnReturn}
                      </span>
                    </div>
                    {entry.notes && (
                      <div className="history-notes">{entry.notes}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="card" style={{ background: 'var(--light)' }}>
          <div style={{ display: 'flex', gap: '2rem', fontSize: '0.85rem', color: 'var(--gray)', flexWrap: 'wrap' }}>
            <span>Created: {formatDateTime(item.createdAt)}{item.createdBy ? ` by ${item.createdBy}` : ''}</span>
            <span>Updated: {formatDateTime(item.updatedAt)}{item.updatedBy ? ` by ${item.updatedBy}` : ''}</span>
          </div>
        </div>
      </div>

      {showEditModal && (
        <InventoryItemModal
          item={item}
          onSave={handleSave}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {showCheckoutModal && (
        <CheckoutModal
          item={item}
          projects={projects}
          onCheckout={handleCheckout}
          onReturn={handleReturn}
          onStartUse={handleStartUse}
          onCancelReservation={handleCancelReservation}
          onClose={() => setShowCheckoutModal(false)}
          teamMemberNames={teamMemberNames}
        />
      )}

      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Delete Item</h2>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>×</button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p style={{ marginBottom: '0.5rem' }}>
                Are you sure you want to delete <strong>{item.name}</strong>?
              </p>
              <p style={{ color: 'var(--accent)', fontSize: '0.9rem' }}>
                This action cannot be undone. All item data and checkout history will be permanently removed.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                <button className="btn btn-danger" onClick={handleDelete}>Delete Item</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryDetail;
