import { useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { INVENTORY_CATEGORIES, CONDITION_OPTIONS } from '../../utils/constants';

const CSV_COLUMNS = [
  { key: 'madId', label: 'MAD ID' },
  { key: 'toolId', label: 'Tool ID' },
  { key: 'name', label: 'Name', required: true },
  { key: 'category', label: 'Category' },
  { key: 'serialNumber', label: 'Serial Number' },
  { key: 'barcode', label: 'Barcode' },
  { key: 'condition', label: 'Condition' },
  { key: 'status', label: 'Status' },
  { key: 'location', label: 'Location' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'purchaseDate', label: 'Purchase Date' },
  { key: 'purchaseCost', label: 'Purchase Cost' },
  { key: 'vendor', label: 'Vendor' },
  { key: 'warrantyExpiration', label: 'Warranty Expiration' },
  { key: 'description', label: 'Description' },
  { key: 'notes', label: 'Notes' }
];

function ImportModal({ existingInventory, onImport, onClose }) {
  const [step, setStep] = useState('upload'); // upload, mapping, preview, complete
  const [csvData, setCsvData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [duplicateHandling, setDuplicateHandling] = useState('skip'); // skip, update, create
  const [previewData, setPreviewData] = useState([]);
  const [importStats, setImportStats] = useState({ created: 0, updated: 0, skipped: 0 });
  const fileInputRef = useRef(null);

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return { headers: [], data: [] };

    // Parse header row
    const headers = parseCSVLine(lines[0]);

    // Parse data rows
    const data = lines.slice(1).map(line => {
      const values = parseCSVLine(line);
      const row = {};
      headers.forEach((header, i) => {
        row[header] = values[i] || '';
      });
      return row;
    });

    return { headers, data };
  };

  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const { headers, data } = parseCSV(event.target.result);
      setHeaders(headers);
      setCsvData(data);

      // Auto-map columns based on header names
      const autoMapping = {};
      headers.forEach(header => {
        const normalizedHeader = header.toLowerCase().replace(/[^a-z]/g, '');
        CSV_COLUMNS.forEach(col => {
          const normalizedCol = col.key.toLowerCase();
          if (normalizedHeader === normalizedCol ||
            normalizedHeader.includes(normalizedCol) ||
            normalizedCol.includes(normalizedHeader)) {
            autoMapping[col.key] = header;
          }
        });
      });
      setColumnMapping(autoMapping);
      setStep('mapping');
    };
    reader.readAsText(file);
  };

  const handleMappingChange = (csvKey, csvHeader) => {
    setColumnMapping({ ...columnMapping, [csvKey]: csvHeader });
  };

  const processImport = () => {
    const processed = csvData.map(row => {
      const item = {
        id: uuidv4(),
        name: row[columnMapping.name] || '',
        category: normalizeCategory(row[columnMapping.category]),
        serialNumber: row[columnMapping.serialNumber] || '',
        barcode: row[columnMapping.barcode] || '',
        condition: normalizeCondition(row[columnMapping.condition]),
        status: normalizeStatus(row[columnMapping.status]),
        location: row[columnMapping.location] || '',
        quantity: parseInt(row[columnMapping.quantity]) || 1,
        quantityAvailable: parseInt(row[columnMapping.quantity]) || 1,
        purchaseDate: row[columnMapping.purchaseDate] || '',
        purchaseCost: parseFloat(row[columnMapping.purchaseCost]) || 0,
        vendor: row[columnMapping.vendor] || '',
        warrantyExpiration: row[columnMapping.warrantyExpiration] || '',
        description: row[columnMapping.description] || '',
        notes: row[columnMapping.notes] || '',
        depreciationYears: 5,
        currentValue: parseFloat(row[columnMapping.purchaseCost]) || 0,
        photos: [],
        currentCheckout: null,
        checkoutHistory: [],
        maintenanceSchedule: '',
        lastMaintenanceDate: '',
        nextMaintenanceDate: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Check for duplicates by serial number or name+category
      const duplicate = existingInventory.find(existing =>
        (item.serialNumber && existing.serialNumber === item.serialNumber) ||
        (existing.name === item.name && existing.category === item.category)
      );

      return { item, duplicate, action: duplicate ? duplicateHandling : 'create' };
    }).filter(p => p.item.name); // Filter out rows without names

    setPreviewData(processed);
    setStep('preview');
  };

  const normalizeCategory = (value) => {
    if (!value) return 'other';
    const normalized = value.toLowerCase().replace(/[^a-z-]/g, '');
    const match = INVENTORY_CATEGORIES.find(cat =>
      cat.id === normalized || cat.label.toLowerCase() === value.toLowerCase()
    );
    return match ? match.id : 'other';
  };

  const normalizeCondition = (value) => {
    if (!value) return 'good';
    const normalized = value.toLowerCase().replace(/[^a-z-]/g, '');
    const match = CONDITION_OPTIONS.find(opt =>
      opt.id === normalized || opt.label.toLowerCase() === value.toLowerCase()
    );
    return match ? match.id : 'good';
  };

  const normalizeStatus = (value) => {
    if (!value) return 'available';
    const normalized = value.toLowerCase().replace(/[^a-z-]/g, '');
    const validStatuses = ['available', 'checked-out', 'maintenance', 'retired'];
    return validStatuses.includes(normalized) ? normalized : 'available';
  };

  const executeImport = () => {
    const stats = { created: 0, updated: 0, skipped: 0 };
    const itemsToImport = [];

    previewData.forEach(({ item, duplicate, action }) => {
      if (action === 'skip' && duplicate) {
        stats.skipped++;
      } else if (action === 'update' && duplicate) {
        itemsToImport.push({ ...duplicate, ...item, id: duplicate.id });
        stats.updated++;
      } else {
        itemsToImport.push(item);
        stats.created++;
      }
    });

    setImportStats(stats);
    onImport(itemsToImport);
    setStep('complete');
  };

  const exportInventory = () => {
    const headers = CSV_COLUMNS.map(col => col.label);
    const rows = existingInventory.map(item =>
      CSV_COLUMNS.map(col => {
        const value = item[col.key];
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      })
    );

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal import-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {step === 'upload' && 'Import Inventory from CSV'}
            {step === 'mapping' && 'Map Columns'}
            {step === 'preview' && 'Preview Import'}
            {step === 'complete' && 'Import Complete'}
          </h3>
          <button className="icon-btn" onClick={onClose}>x</button>
        </div>

        {step === 'upload' && (
          <>
            <div
              className="file-upload"
              onClick={() => fileInputRef.current?.click()}
              style={{ marginBottom: '1.5rem' }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
              />
              <p>Click to select a CSV file or drag and drop</p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.5rem' }}>Expected CSV Format:</h4>
              <code style={{
                display: 'block',
                padding: '1rem',
                background: 'var(--light)',
                borderRadius: '4px',
                fontSize: '0.8rem',
                overflowX: 'auto',
                whiteSpace: 'pre'
              }}>
                name,category,serialNumber,condition,location,quantity,purchaseDate,purchaseCost,vendor,notes
              </code>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <h4 style={{ marginBottom: '0.5rem' }}>Or Export Current Inventory</h4>
              <button className="btn btn-outline" onClick={exportInventory}>
                Export to CSV
              </button>
            </div>
          </>
        )}

        {step === 'mapping' && (
          <>
            <p style={{ color: 'var(--gray)', marginBottom: '1rem' }}>
              Found {csvData.length} rows. Map CSV columns to inventory fields:
            </p>

            <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '1rem' }}>
              {CSV_COLUMNS.map(col => (
                <div key={col.key} className="form-row" style={{ marginBottom: '0.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontWeight: col.required ? 'bold' : 'normal' }}>
                      {col.label} {col.required && '*'}
                    </label>
                  </div>
                  <div style={{ flex: 2 }}>
                    <select
                      value={columnMapping[col.key] || ''}
                      onChange={e => handleMappingChange(col.key, e.target.value)}
                      style={{ width: '100%', padding: '0.5rem' }}
                    >
                      <option value="">-- Select Column --</option>
                      {headers.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div className="form-group">
              <label>Duplicate Handling (by Serial Number or Name+Category)</label>
              <select
                value={duplicateHandling}
                onChange={e => setDuplicateHandling(e.target.value)}
              >
                <option value="skip">Skip duplicates</option>
                <option value="update">Update existing items</option>
                <option value="create">Create new items anyway</option>
              </select>
            </div>

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setStep('upload')}>
                Back
              </button>
              <button
                className="btn btn-primary"
                onClick={processImport}
                disabled={!columnMapping.name}
              >
                Preview Import
              </button>
            </div>
          </>
        )}

        {step === 'preview' && (
          <>
            <p style={{ color: 'var(--gray)', marginBottom: '1rem' }}>
              Preview of {previewData.length} items to import:
            </p>

            <div className="table-container" style={{ maxHeight: '400px', marginBottom: '1rem' }}>
              <table>
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Serial #</th>
                    <th>Condition</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.slice(0, 50).map((row, i) => (
                    <tr key={i}>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          background: row.action === 'create' ? '#d1fae5' :
                            row.action === 'update' ? '#dbeafe' : '#f3f4f6',
                          color: row.action === 'create' ? '#065f46' :
                            row.action === 'update' ? '#1e40af' : '#6b7280'
                        }}>
                          {row.action === 'create' ? 'Create' :
                            row.action === 'update' ? 'Update' : 'Skip'}
                        </span>
                      </td>
                      <td>{row.item.name}</td>
                      <td>{row.item.category}</td>
                      <td>{row.item.serialNumber || '-'}</td>
                      <td>{row.item.condition}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewData.length > 50 && (
                <p style={{ textAlign: 'center', padding: '0.5rem', color: 'var(--gray)' }}>
                  ... and {previewData.length - 50} more items
                </p>
              )}
            </div>

            <div style={{
              padding: '1rem',
              background: 'var(--light)',
              borderRadius: '8px',
              marginBottom: '1rem'
            }}>
              <strong>Summary:</strong>
              <span style={{ marginLeft: '1rem', color: '#065f46' }}>
                {previewData.filter(p => p.action === 'create').length} new
              </span>
              <span style={{ marginLeft: '1rem', color: '#1e40af' }}>
                {previewData.filter(p => p.action === 'update').length} updates
              </span>
              <span style={{ marginLeft: '1rem', color: '#6b7280' }}>
                {previewData.filter(p => p.action === 'skip').length} skipped
              </span>
            </div>

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setStep('mapping')}>
                Back
              </button>
              <button className="btn btn-success" onClick={executeImport}>
                Import {previewData.filter(p => p.action !== 'skip').length} Items
              </button>
            </div>
          </>
        )}

        {step === 'complete' && (
          <>
            <div style={{
              textAlign: 'center',
              padding: '2rem'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>Success</div>
              <h3 style={{ marginBottom: '1.5rem' }}>Import Complete!</h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ padding: '1rem', background: '#d1fae5', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#065f46' }}>
                    {importStats.created}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#065f46' }}>Created</div>
                </div>
                <div style={{ padding: '1rem', background: '#dbeafe', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e40af' }}>
                    {importStats.updated}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#1e40af' }}>Updated</div>
                </div>
                <div style={{ padding: '1rem', background: '#f3f4f6', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#6b7280' }}>
                    {importStats.skipped}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Skipped</div>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-primary" onClick={onClose}>
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ImportModal;
