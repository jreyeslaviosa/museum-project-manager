import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getInventory, saveInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem, getProjects } from '../utils/storage';
import { INVENTORY_CATEGORIES } from '../utils/constants';
import InventoryStats from './inventory/InventoryStats';
import InventoryList from './inventory/InventoryList';
import InventoryItemModal from './inventory/InventoryItemModal';
import CheckoutModal from './inventory/CheckoutModal';
import ImportModal from './inventory/ImportModal';

function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [checkoutItem, setCheckoutItem] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    getInventory().then(setInventory);
    getProjects().then(setProjects);
  }, []);

  const handleSaveItem = async (item) => {
    if (editingItem) {
      await updateInventoryItem(item.id, item);
    } else {
      await createInventoryItem(item);
    }
    setInventory(await getInventory());
    setShowAddModal(false);
    setEditingItem(null);
  };

  const handleDeleteItem = async (id) => {
    await deleteInventoryItem(id);
    setInventory(await getInventory());
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setShowAddModal(true);
  };

  const handleCheckout = async (checkoutData, assignmentType) => {
    const updatedItem = {
      ...checkoutItem,
      status: assignmentType || 'in-use',
      currentCheckout: checkoutData,
      quantityAvailable: Math.max(0, (checkoutItem.quantityAvailable || checkoutItem.quantity) - 1)
    };
    await updateInventoryItem(checkoutItem.id, updatedItem);
    setInventory(await getInventory());
    setCheckoutItem(null);
  };

  const handleReturn = async (returnData) => {
    const historyEntry = {
      ...checkoutItem.currentCheckout,
      ...returnData
    };

    const updatedItem = {
      ...checkoutItem,
      status: 'available',
      condition: returnData.conditionOnReturn,
      currentCheckout: null,
      checkoutHistory: [...(checkoutItem.checkoutHistory || []), historyEntry],
      quantityAvailable: Math.min(checkoutItem.quantity, (checkoutItem.quantityAvailable || 0) + 1)
    };
    await updateInventoryItem(checkoutItem.id, updatedItem);
    setInventory(await getInventory());
    setCheckoutItem(null);
  };

  const handleStartUse = async () => {
    const updatedItem = {
      ...checkoutItem,
      status: 'in-use',
      currentCheckout: {
        ...checkoutItem.currentCheckout,
        assignmentType: 'in-use',
        statusChangedAt: new Date().toISOString()
      }
    };
    await updateInventoryItem(checkoutItem.id, updatedItem);
    setInventory(await getInventory());
    setCheckoutItem(null);
  };

  const handleCancelReservation = async () => {
    if (!window.confirm(`Cancel reservation for "${checkoutItem.name}"?`)) return;

    const updatedItem = {
      ...checkoutItem,
      status: 'available',
      currentCheckout: null,
      quantityAvailable: Math.min(checkoutItem.quantity, (checkoutItem.quantityAvailable || 0) + 1)
    };
    await updateInventoryItem(checkoutItem.id, updatedItem);
    setInventory(await getInventory());
    setCheckoutItem(null);
  };

  const handleImport = async (importedItems) => {
    const currentInventory = await getInventory();
    const existingIds = new Set(currentInventory.map(i => i.id));

    importedItems.forEach(item => {
      if (existingIds.has(item.id)) {
        // Update existing
        const index = currentInventory.findIndex(i => i.id === item.id);
        if (index !== -1) {
          currentInventory[index] = item;
        }
      } else {
        // Add new
        currentInventory.push(item);
      }
    });

    await saveInventory(currentInventory);
    setInventory(currentInventory);
  };

  // Filter by category
  const filteredInventory = activeCategory === 'all'
    ? inventory
    : inventory.filter(item => item.category === activeCategory);

  // Count items by category
  const getCategoryCount = (categoryId) => {
    return inventory.filter(item => item.category === categoryId).length;
  };

  return (
    <div className="app">
      <header className="header">
        <Link to="/"><h1>Museum Project Manager</h1></Link>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/dashboard" className="btn btn-outline btn-small" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
            Dashboard
          </Link>
          <button className="btn btn-primary btn-small" onClick={() => setShowAddModal(true)}>
            + Add Item
          </button>
        </div>
      </header>

      <div className="inventory-layout">
        {/* Category Sidebar */}
        <aside className="inventory-sidebar">
          <div className="sidebar-header">Categories</div>
          <nav className="sidebar-nav">
            <button
              className={`sidebar-item ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              <span>All Items</span>
              <span className="sidebar-count">{inventory.length}</span>
            </button>
            {INVENTORY_CATEGORIES.map(cat => {
              const count = getCategoryCount(cat.id);
              return (
                <button
                  key={cat.id}
                  className={`sidebar-item ${activeCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  <span>{cat.label}</span>
                  <span className="sidebar-count">{count}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="inventory-main">
          <InventoryStats inventory={inventory} />

          <div className="card">
            <div className="card-header">
              <h2>
                {activeCategory === 'all' ? 'All Items' :
                  INVENTORY_CATEGORIES.find(c => c.id === activeCategory)?.label || activeCategory}
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-outline btn-small"
                  onClick={() => setShowImportModal(true)}
                >
                  Import CSV
                </button>
              </div>
            </div>

            <InventoryList
              inventory={filteredInventory}
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
              onCheckout={setCheckoutItem}
            />
          </div>
        </main>
      </div>

      {/* Modals */}
      {showAddModal && (
        <InventoryItemModal
          item={editingItem}
          onSave={handleSaveItem}
          onClose={() => {
            setShowAddModal(false);
            setEditingItem(null);
          }}
        />
      )}

      {checkoutItem && (
        <CheckoutModal
          item={checkoutItem}
          projects={projects}
          onCheckout={handleCheckout}
          onReturn={handleReturn}
          onStartUse={handleStartUse}
          onCancelReservation={handleCancelReservation}
          onClose={() => setCheckoutItem(null)}
        />
      )}

      {showImportModal && (
        <ImportModal
          existingInventory={inventory}
          onImport={handleImport}
          onClose={() => setShowImportModal(false)}
        />
      )}
    </div>
  );
}

export default Inventory;
