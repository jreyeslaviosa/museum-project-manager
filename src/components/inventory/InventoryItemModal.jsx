import { useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { INVENTORY_CATEGORIES, CONDITION_OPTIONS } from '../../utils/constants';
import { createEmptyInventoryItem } from '../../utils/storage';

function InventoryItemModal({ item, onSave, onClose }) {
  const isEditing = !!item;
  const [formData, setFormData] = useState(item || createEmptyInventoryItem());
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const calculateDepreciation = (purchaseCost, purchaseDate, depreciationYears) => {
    if (!purchaseCost || !purchaseDate || !depreciationYears) return purchaseCost || 0;
    const yearsSincePurchase = (new Date() - new Date(purchaseDate)) / (1000 * 60 * 60 * 24 * 365);
    const annualDepreciation = purchaseCost / depreciationYears;
    const currentValue = purchaseCost - (annualDepreciation * yearsSincePurchase);
    return Math.max(0, Math.round(currentValue * 100) / 100);
  };

  const handleChange = (field, value) => {
    const updates = { [field]: value };

    // Auto-calculate current value when relevant fields change
    if (['purchaseCost', 'purchaseDate', 'depreciationYears'].includes(field)) {
      const cost = field === 'purchaseCost' ? value : formData.purchaseCost;
      const date = field === 'purchaseDate' ? value : formData.purchaseDate;
      const years = field === 'depreciationYears' ? value : formData.depreciationYears;
      updates.currentValue = calculateDepreciation(cost, date, years);
    }

    // Auto-update quantityAvailable when quantity changes
    if (field === 'quantity') {
      const checkedOut = formData.quantity - formData.quantityAvailable;
      updates.quantityAvailable = Math.max(0, value - checkedOut);
    }

    setFormData({ ...formData, ...updates });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = (files) => {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const photo = {
          id: uuidv4(),
          name: file.name,
          data: e.target.result,
          uploadedAt: new Date().toISOString()
        };
        setFormData(prev => ({
          ...prev,
          photos: [...prev.photos, photo]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (photoId) => {
    setFormData({
      ...formData,
      photos: formData.photos.filter(p => p.id !== photoId)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter an item name');
      return;
    }

    const itemToSave = {
      ...formData,
      id: formData.id || uuidv4(),
      createdAt: formData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(itemToSave);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal inventory-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEditing ? 'Edit Item' : 'Add New Item'}</h3>
          <button className="icon-btn" onClick={onClose}>x</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Info Section */}
          <div className="form-section">
            <h4>Basic Information</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => handleChange('name', e.target.value)}
                  placeholder="e.g., Panasonic PT-RZ120"
                  required
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={e => handleChange('category', e.target.value)}
                >
                  {INVENTORY_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={e => handleChange('description', e.target.value)}
                placeholder="Brief description of the item..."
                rows={2}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Serial Number</label>
                <input
                  type="text"
                  value={formData.serialNumber}
                  onChange={e => handleChange('serialNumber', e.target.value)}
                  placeholder="S/N"
                />
              </div>
              <div className="form-group">
                <label>Barcode</label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={e => handleChange('barcode', e.target.value)}
                  placeholder="For QR/barcode scanning"
                />
              </div>
            </div>
          </div>

          {/* Status & Location Section */}
          <div className="form-section">
            <h4>Status & Location</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Condition</label>
                <select
                  value={formData.condition}
                  onChange={e => handleChange('condition', e.target.value)}
                >
                  {CONDITION_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={e => handleChange('status', e.target.value)}
                >
                  <option value="available">Available</option>
                  <option value="checked-out">Checked Out</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Storage Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={e => handleChange('location', e.target.value)}
                  placeholder="e.g., Storage Room A, Shelf 3"
                />
              </div>
              <div className="form-group">
                <label>Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={e => handleChange('quantity', parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
          </div>

          {/* Purchase & Financial Section */}
          <div className="form-section">
            <h4>Purchase & Financial</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Purchase Date</label>
                <input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={e => handleChange('purchaseDate', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Purchase Cost ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.purchaseCost}
                  onChange={e => handleChange('purchaseCost', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Vendor</label>
                <input
                  type="text"
                  value={formData.vendor}
                  onChange={e => handleChange('vendor', e.target.value)}
                  placeholder="e.g., B&H Photo"
                />
              </div>
              <div className="form-group">
                <label>Warranty Expiration</label>
                <input
                  type="date"
                  value={formData.warrantyExpiration}
                  onChange={e => handleChange('warrantyExpiration', e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Depreciation Years</label>
                <input
                  type="number"
                  min="1"
                  value={formData.depreciationYears}
                  onChange={e => handleChange('depreciationYears', parseInt(e.target.value) || 5)}
                />
              </div>
              <div className="form-group">
                <label>Current Value ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.currentValue}
                  onChange={e => handleChange('currentValue', parseFloat(e.target.value) || 0)}
                />
                <small style={{ color: 'var(--gray)', fontSize: '0.8rem' }}>
                  Auto-calculated from depreciation
                </small>
              </div>
            </div>
          </div>

          {/* Maintenance Section */}
          <div className="form-section">
            <h4>Maintenance</h4>
            <div className="form-group">
              <label>Maintenance Schedule</label>
              <input
                type="text"
                value={formData.maintenanceSchedule}
                onChange={e => handleChange('maintenanceSchedule', e.target.value)}
                placeholder="e.g., Annual calibration, Quarterly cleaning"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Last Maintenance</label>
                <input
                  type="date"
                  value={formData.lastMaintenanceDate}
                  onChange={e => handleChange('lastMaintenanceDate', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Next Maintenance</label>
                <input
                  type="date"
                  value={formData.nextMaintenanceDate}
                  onChange={e => handleChange('nextMaintenanceDate', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Photos Section */}
          <div className="form-section">
            <h4>Photos</h4>
            <div
              className={`file-upload ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={e => handleFiles(e.target.files)}
              />
              <p>Drop images here or click to upload</p>
            </div>

            {formData.photos.length > 0 && (
              <div className="image-gallery" style={{ marginTop: '1rem' }}>
                {formData.photos.map(photo => (
                  <div key={photo.id} className="image-item">
                    <img src={photo.data} alt={photo.name} />
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => removePhoto(photo.id)}
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div className="form-section">
            <h4>Notes</h4>
            <div className="form-group">
              <textarea
                value={formData.notes}
                onChange={e => handleChange('notes', e.target.value)}
                placeholder="Additional notes about this item..."
                rows={3}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditing ? 'Save Changes' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InventoryItemModal;
