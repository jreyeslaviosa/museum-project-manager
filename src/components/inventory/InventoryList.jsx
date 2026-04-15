import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { INVENTORY_CATEGORIES, CONDITION_OPTIONS, INVENTORY_STATUS_OPTIONS } from '../../utils/constants';

function InventoryList({ inventory, onEdit, onDelete, onCheckout }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const filteredAndSorted = useMemo(() => {
    let result = [...inventory];

    // Apply filters
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item =>
        item.name.toLowerCase().includes(term) ||
        item.serialNumber?.toLowerCase().includes(term) ||
        item.barcode?.toLowerCase().includes(term) ||
        item.location?.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term)
      );
    }

    if (categoryFilter !== 'all') {
      result = result.filter(item => item.category === categoryFilter);
    }

    if (statusFilter !== 'all') {
      result = result.filter(item => item.status === statusFilter);
    }

    if (conditionFilter !== 'all') {
      result = result.filter(item => item.condition === conditionFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle numeric fields
      if (['purchaseCost', 'currentValue', 'quantity'].includes(sortField)) {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      } else {
        aVal = String(aVal || '').toLowerCase();
        bVal = String(bVal || '').toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [inventory, searchTerm, categoryFilter, statusFilter, conditionFilter, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getCategoryLabel = (categoryId) => {
    const category = INVENTORY_CATEGORIES.find(c => c.id === categoryId);
    return category ? category.label : categoryId;
  };

  const getConditionBadge = (condition) => {
    const opt = CONDITION_OPTIONS.find(c => c.id === condition);
    return (
      <span style={{
        padding: '0.25rem 0.5rem',
        borderRadius: '4px',
        fontSize: '0.8rem',
        fontWeight: 500,
        background: `${opt?.color}20`,
        color: opt?.color || 'var(--gray)'
      }}>
        {opt?.label || condition}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const opt = INVENTORY_STATUS_OPTIONS.find(s => s.id === status);
    return (
      <span style={{
        padding: '0.25rem 0.5rem',
        borderRadius: '4px',
        fontSize: '0.8rem',
        fontWeight: 500,
        background: `${opt?.color}20`,
        color: opt?.color || 'var(--gray)'
      }}>
        {opt?.label || status}
      </span>
    );
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return <span style={{ marginLeft: '0.25rem' }}>{sortDirection === 'asc' ? '▲' : '▼'}</span>;
  };

  return (
    <div>
      {/* Filters */}
      <div className="inventory-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name, serial #, barcode, location..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          {INVENTORY_STATUS_OPTIONS.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </select>

        <select
          value={conditionFilter}
          onChange={e => setConditionFilter(e.target.value)}
        >
          <option value="all">All Conditions</option>
          {CONDITION_OPTIONS.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          {INVENTORY_CATEGORIES.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <div style={{ marginBottom: '1rem', color: 'var(--gray)', fontSize: '0.9rem' }}>
        Showing {filteredAndSorted.length} of {inventory.length} items
      </div>

      {/* Table */}
      {filteredAndSorted.length === 0 ? (
        <div className="empty-state">
          <h3>No items found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="inventory-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                  Name <SortIcon field="name" />
                </th>
                <th onClick={() => handleSort('category')} style={{ cursor: 'pointer' }}>
                  Category <SortIcon field="category" />
                </th>
                <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                  Status <SortIcon field="status" />
                </th>
                <th onClick={() => handleSort('condition')} style={{ cursor: 'pointer' }}>
                  Condition <SortIcon field="condition" />
                </th>
                <th onClick={() => handleSort('location')} style={{ cursor: 'pointer' }}>
                  Location <SortIcon field="location" />
                </th>
                <th onClick={() => handleSort('currentValue')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                  Value <SortIcon field="currentValue" />
                </th>
                <th onClick={() => handleSort('createdBy')} style={{ cursor: 'pointer' }}>
                  Added By <SortIcon field="createdBy" />
                </th>
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.map(item => (
                <tr key={item.id}>
                  <td>
                    <Link
                      to={`/inventory/${item.id}`}
                      style={{ textDecoration: 'none', color: 'var(--secondary)', fontWeight: 500 }}
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
                    {getStatusBadge(item.status)}
                    {(item.status === 'reserved' || item.status === 'in-use') && item.currentCheckout && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray)', marginTop: '0.25rem' }}>
                        {item.currentCheckout.projectName}
                        {item.currentCheckout.expectedReturn && (
                          <span> (until {new Date(item.currentCheckout.expectedReturn).toLocaleDateString()})</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td>{getConditionBadge(item.condition)}</td>
                  <td>{item.location || '-'}</td>
                  <td style={{ textAlign: 'right' }}>
                    ${(item.currentValue || item.purchaseCost || 0).toLocaleString()}
                  </td>
                  <td>
                    {item.createdBy && (
                      <div style={{ fontSize: '0.85rem' }}>{item.createdBy}</div>
                    )}
                    {item.updatedBy && item.updatedBy !== item.createdBy && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>Edited: {item.updatedBy}</div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {item.status === 'available' && (
                        <button
                          className="btn btn-small btn-primary"
                          onClick={() => onCheckout(item)}
                          title="Reserve or Check out"
                        >
                          Assign
                        </button>
                      )}
                      {item.status === 'reserved' && (
                        <button
                          className="btn btn-small"
                          style={{ background: '#8b5cf6', color: 'white' }}
                          onClick={() => onCheckout(item)}
                          title="Manage reservation"
                        >
                          Manage
                        </button>
                      )}
                      {item.status === 'in-use' && (
                        <button
                          className="btn btn-small btn-success"
                          onClick={() => onCheckout(item)}
                          title="Return"
                        >
                          Return
                        </button>
                      )}
                      <button
                        className="icon-btn"
                        onClick={() => onEdit(item)}
                        title="Edit"
                      >
                        Edit
                      </button>
                      <button
                        className="icon-btn"
                        onClick={() => setDeleteConfirm(item)}
                        title="Delete"
                      >
                        x
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Delete Item</h2>
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
                <button className="btn btn-danger" onClick={() => { onDelete(deleteConfirm.id); setDeleteConfirm(null); }}>Delete Item</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryList;
