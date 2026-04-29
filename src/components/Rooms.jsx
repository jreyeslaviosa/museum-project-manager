import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { getRooms, createRoom, updateRoom, deleteRoom, getProjects } from '../utils/storage';
import { useUser } from '../utils/UserContext';

const LOCATIONS = {
  'Dania Beach': ['Ground Floor', '2nd Floor', 'Backyard'],
  'Detroit - Museum': ['Basement', 'Ground Floor', '2nd Floor', 'Roof'],
  'Detroit - Church': ['Ground Floor', '2nd Floor'],
};
const LOCATION_NAMES = Object.keys(LOCATIONS);
const ALL_FLOORS = [...new Set(Object.values(LOCATIONS).flat())];
const ROOM_TYPES = ['Gallery', 'Workshop', 'Storage', 'Office', 'Lobby', 'Hallway', 'Loading Dock', 'Outdoor', 'Other'];

function Rooms() {
  const { isAdmin } = useUser();
  const [rooms, setRooms] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterFloor, setFilterFloor] = useState('all');
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    name: '',
    location: '',
    floor: '',
    type: 'Gallery',
    lengthFt: '',
    widthFt: '',
    heightFt: '',
    powerOutlets: '',
    maxLoadLbs: '',
    hasWifi: false,
    hasAC: false,
    hasDimmer: false,
    notes: '',
  });

  useEffect(() => {
    Promise.all([getRooms(), getProjects()])
      .then(([r, p]) => { setRooms(r); setProjects(p); })
      .catch(() => setError('Failed to load rooms. Please check your connection and try again.'))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  const resetForm = () => {
    setForm({
      name: '', location: '', floor: '', type: 'Gallery',
      lengthFt: '', widthFt: '', heightFt: '',
      powerOutlets: '', maxLoadLbs: '',
      hasWifi: false, hasAC: false, hasDimmer: false, notes: '',
    });
  };

  const openAdd = () => {
    setEditingRoom(null);
    resetForm();
    setShowModal(true);
  };

  const openEdit = (room) => {
    setEditingRoom(room);
    setForm({
      name: room.name || '',
      location: room.location || '',
      floor: room.floor || '',
      type: room.type || 'Gallery',
      lengthFt: room.lengthFt || '',
      widthFt: room.widthFt || '',
      heightFt: room.heightFt || '',
      powerOutlets: room.powerOutlets || '',
      maxLoadLbs: room.maxLoadLbs || '',
      hasWifi: room.hasWifi || false,
      hasAC: room.hasAC || false,
      hasDimmer: room.hasDimmer || false,
      notes: room.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingRoom) {
      await updateRoom(editingRoom.id, form);
      showToast('Room updated');
    } else {
      await createRoom({
        ...form,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      showToast('Room added');
    }
    setRooms(await getRooms());
    setShowModal(false);
    setEditingRoom(null);
    resetForm();
  };

  const handleDelete = async (id) => {
    await deleteRoom(id);
    setRooms(await getRooms());
    setDeleteConfirm(null);
    showToast('Room deleted');
  };

  // Get floor options based on selected location in form
  const getFloorsForLocation = (loc) => LOCATIONS[loc] || ALL_FLOORS;

  // Filter rooms
  const filtered = rooms.filter(r => {
    if (filterLocation !== 'all' && r.location !== filterLocation) return false;
    if (filterFloor !== 'all' && r.floor !== filterFloor) return false;
    return true;
  }).sort((a, b) => {
    // Sort by location, then floor, then name
    if (a.location !== b.location) return (a.location || '').localeCompare(b.location || '');
    const floorsA = LOCATIONS[a.location] || ALL_FLOORS;
    const floorsB = LOCATIONS[b.location] || ALL_FLOORS;
    if (a.floor !== b.floor) return floorsA.indexOf(a.floor) - floorsB.indexOf(b.floor);
    return (a.name || '').localeCompare(b.name || '');
  });

  // Find projects assigned to a room
  const getProjectsForRoom = (roomName) => {
    return projects.filter(p =>
      p.location?.toLowerCase() === roomName?.toLowerCase() ||
      p.room?.toLowerCase() === roomName?.toLowerCase()
    );
  };

  const formatDimensions = (room) => {
    const parts = [];
    if (room.lengthFt && room.widthFt) {
      parts.push(`${room.lengthFt} x ${room.widthFt} ft`);
      if (room.heightFt) parts[0] = `${room.lengthFt} x ${room.widthFt} x ${room.heightFt} ft`;
    }
    return parts.length > 0 ? parts[0] : null;
  };

  const getArea = (room) => {
    if (room.lengthFt && room.widthFt) {
      return Math.round(parseFloat(room.lengthFt) * parseFloat(room.widthFt));
    }
    return null;
  };

  return (
    <div className="app">
      <header className="header">
        <Link to="/"><h1>Museum Project Manager</h1></Link>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/dashboard" className="btn btn-outline btn-small" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
            Dashboard
          </Link>
          {isAdmin && (
            <button className="btn btn-primary btn-small" onClick={openAdd}>
              + Add Room
            </button>
          )}
        </div>
      </header>

      <div className="container">
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray)' }}>Loading rooms...</div>
        )}
        {error && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--accent)', marginBottom: '1rem' }}>{error}</p>
            <button className="btn btn-outline" onClick={() => window.location.reload()}>Retry</button>
          </div>
        )}
        {!loading && !error && <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2>Rooms & Spaces</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                value={filterLocation}
                onChange={e => { setFilterLocation(e.target.value); setFilterFloor('all'); }}
                style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
              >
                <option value="all">All Locations</option>
                {LOCATION_NAMES.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
              <select
                value={filterFloor}
                onChange={e => setFilterFloor(e.target.value)}
                style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
              >
                <option value="all">All Floors</option>
                {(filterLocation !== 'all' ? getFloorsForLocation(filterLocation) : ALL_FLOORS).map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div className="stat-card">
              <div className="stat-value">{rooms.length}</div>
              <div className="stat-label">Total Rooms</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{LOCATION_NAMES.length}</div>
              <div className="stat-label">Locations</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {rooms.reduce((sum, r) => sum + (getArea(r) || 0), 0).toLocaleString()}
              </div>
              <div className="stat-label">Total sq ft</div>
            </div>
          </div>

          {/* Room Cards */}
          {filtered.length === 0 ? (
            <div className="empty-state">
              <h3>No rooms added yet</h3>
              <p>{isAdmin ? 'Click "+ Add Room" to start documenting your spaces.' : 'Rooms will appear here once added by an admin.'}</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {filtered.map(room => {
                const dims = formatDimensions(room);
                const area = getArea(room);
                const roomProjects = getProjectsForRoom(room.name);

                return (
                  <div key={room.id} className="card" style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <h3 style={{ marginBottom: '0.25rem' }}>{room.name}</h3>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {room.location && (
                            <span style={{ fontSize: '0.8rem', padding: '0.15rem 0.5rem', background: '#dbeafe', color: '#1e40af', borderRadius: '4px', fontWeight: 500 }}>
                              {room.location}
                            </span>
                          )}
                          {room.floor && (
                            <span style={{ fontSize: '0.8rem', padding: '0.15rem 0.5rem', background: '#f3e8ff', color: '#7c3aed', borderRadius: '4px', fontWeight: 500 }}>
                              {room.floor}
                            </span>
                          )}
                          {room.type && (
                            <span style={{ fontSize: '0.8rem', padding: '0.15rem 0.5rem', background: 'var(--light)', color: 'var(--gray)', borderRadius: '4px', fontWeight: 500 }}>
                              {room.type}
                            </span>
                          )}
                        </div>
                      </div>
                      {isAdmin && (
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button className="icon-btn" onClick={() => openEdit(room)} title="Edit">Edit</button>
                          <button className="icon-btn" onClick={() => setDeleteConfirm(room)} title="Delete">x</button>
                        </div>
                      )}
                    </div>

                    {/* Dimensions */}
                    {dims && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--dark)' }}>
                          {dims}
                          {area && <span style={{ color: 'var(--gray)', marginLeft: '0.5rem' }}>({area.toLocaleString()} sq ft)</span>}
                        </div>
                      </div>
                    )}

                    {/* Features */}
                    {(room.hasWifi || room.hasAC || room.hasDimmer || room.powerOutlets || room.maxLoadLbs) && (
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                        {room.hasWifi && <span style={{ padding: '0.15rem 0.4rem', background: '#ecfdf5', color: '#059669', borderRadius: '3px' }}>WiFi</span>}
                        {room.hasAC && <span style={{ padding: '0.15rem 0.4rem', background: '#ecfdf5', color: '#059669', borderRadius: '3px' }}>A/C</span>}
                        {room.hasDimmer && <span style={{ padding: '0.15rem 0.4rem', background: '#ecfdf5', color: '#059669', borderRadius: '3px' }}>Dimmer</span>}
                        {room.powerOutlets && <span style={{ padding: '0.15rem 0.4rem', background: '#fef3c7', color: '#92400e', borderRadius: '3px' }}>{room.powerOutlets} outlets</span>}
                        {room.maxLoadLbs && <span style={{ padding: '0.15rem 0.4rem', background: '#fef3c7', color: '#92400e', borderRadius: '3px' }}>Max {room.maxLoadLbs} lbs</span>}
                      </div>
                    )}

                    {/* Notes */}
                    {room.notes && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--gray)', marginBottom: '0.5rem' }}>{room.notes}</p>
                    )}

                    {/* Current projects in this room */}
                    {roomProjects.length > 0 && (
                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--gray)', marginBottom: '0.25rem' }}>
                          Current Projects
                        </div>
                        {roomProjects.map(p => (
                          <Link
                            key={p.id}
                            to={`/project/${p.id}`}
                            style={{ display: 'block', fontSize: '0.85rem', color: 'var(--secondary)', textDecoration: 'none', padding: '0.15rem 0' }}
                          >
                            {p.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>{editingRoom ? 'Edit Room' : 'Add Room'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>x</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ padding: '0 1.5rem 1.5rem', display: 'grid', gap: '1rem' }}>
                <div className="form-group">
                  <label>Room Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Gallery A, Workshop 2"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Location *</label>
                    <select
                      value={form.location}
                      onChange={e => setForm({ ...form, location: e.target.value, floor: '' })}
                      required
                    >
                      <option value="">Select...</option>
                      {LOCATION_NAMES.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Floor *</label>
                    <select
                      value={form.floor}
                      onChange={e => setForm({ ...form, floor: e.target.value })}
                      required
                      disabled={!form.location}
                    >
                      <option value="">Select...</option>
                      {getFloorsForLocation(form.location).map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Room Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    {ROOM_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Dimensions (ft)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                    <input
                      type="number"
                      value={form.lengthFt}
                      onChange={e => setForm({ ...form, lengthFt: e.target.value })}
                      placeholder="Length"
                      min="0"
                      step="0.1"
                    />
                    <input
                      type="number"
                      value={form.widthFt}
                      onChange={e => setForm({ ...form, widthFt: e.target.value })}
                      placeholder="Width"
                      min="0"
                      step="0.1"
                    />
                    <input
                      type="number"
                      value={form.heightFt}
                      onChange={e => setForm({ ...form, heightFt: e.target.value })}
                      placeholder="Height"
                      min="0"
                      step="0.1"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Power Outlets</label>
                    <input
                      type="number"
                      value={form.powerOutlets}
                      onChange={e => setForm({ ...form, powerOutlets: e.target.value })}
                      placeholder="Count"
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Max Load (lbs)</label>
                    <input
                      type="number"
                      value={form.maxLoadLbs}
                      onChange={e => setForm({ ...form, maxLoadLbs: e.target.value })}
                      placeholder="Floor load"
                      min="0"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.hasWifi} onChange={e => setForm({ ...form, hasWifi: e.target.checked })} />
                    WiFi
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.hasAC} onChange={e => setForm({ ...form, hasAC: e.target.checked })} />
                    A/C
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.hasDimmer} onChange={e => setForm({ ...form, hasDimmer: e.target.checked })} />
                    Dimmer
                  </label>
                </div>

                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    placeholder="Access info, restrictions, special features..."
                    rows={3}
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingRoom ? 'Save Changes' : 'Add Room'}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Delete Room</h2>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>x</button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p style={{ marginBottom: '0.5rem' }}>
                Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
              </p>
              <p style={{ color: 'var(--accent)', fontSize: '0.9rem' }}>This action cannot be undone.</p>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-outline" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>Delete Room</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default Rooms;
