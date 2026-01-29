function InventoryStats({ inventory }) {
  const stats = {
    total: inventory.length,
    available: inventory.filter(item => item.status === 'available').length,
    reserved: inventory.filter(item => item.status === 'reserved').length,
    inUse: inventory.filter(item => item.status === 'in-use').length,
    maintenance: inventory.filter(item => item.status === 'maintenance').length,
    needsRepair: inventory.filter(item => item.condition === 'needs-repair').length,
    totalValue: inventory.reduce((sum, item) => sum + (item.currentValue || item.purchaseCost || 0), 0),
    totalQuantity: inventory.reduce((sum, item) => sum + (item.quantity || 1), 0),
    availableQuantity: inventory.reduce((sum, item) => sum + (item.quantityAvailable || item.quantity || 1), 0)
  };

  // Find items due for maintenance soon (within 30 days)
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const maintenanceDue = inventory.filter(item =>
    item.nextMaintenanceDate && new Date(item.nextMaintenanceDate) <= thirtyDaysFromNow
  ).length;

  return (
    <div className="inventory-stats">
      <div className="stat-card">
        <div className="stat-value">{stats.total}</div>
        <div className="stat-label">Total Items</div>
        <div className="stat-detail">{stats.totalQuantity} units</div>
      </div>
      <div className="stat-card stat-available">
        <div className="stat-value">{stats.available}</div>
        <div className="stat-label">Available</div>
        <div className="stat-detail">{stats.availableQuantity} units ready</div>
      </div>
      <div className="stat-card" style={{ borderTop: '4px solid #8b5cf6' }}>
        <div className="stat-value" style={{ color: '#8b5cf6' }}>{stats.reserved}</div>
        <div className="stat-label">Reserved</div>
        <div className="stat-detail">Booked for projects</div>
      </div>
      <div className="stat-card stat-checked-out">
        <div className="stat-value">{stats.inUse}</div>
        <div className="stat-label">In Use</div>
        <div className="stat-detail">Currently checked out</div>
      </div>
      <div className="stat-card stat-maintenance">
        <div className="stat-value">{maintenanceDue}</div>
        <div className="stat-label">Maintenance Due</div>
        <div className="stat-detail">Within 30 days</div>
      </div>
      <div className="stat-card stat-value-card">
        <div className="stat-value">${stats.totalValue.toLocaleString()}</div>
        <div className="stat-label">Total Value</div>
        <div className="stat-detail">Current inventory value</div>
      </div>
    </div>
  );
}

export default InventoryStats;
