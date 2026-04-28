import { useState } from 'react';
function CheckoutModal({ item, projects, onCheckout, onReturn, onClose, onStartUse, onCancelReservation, teamMemberNames: TEAM_MEMBERS = [] }) {
  const isAssigned = (item.status === 'reserved' || item.status === 'in-use') && item.currentCheckout;
  const isReserved = item.status === 'reserved';
  const isInUse = item.status === 'in-use';

  const [assignmentType, setAssignmentType] = useState('reserved');
  const [formData, setFormData] = useState({
    projectId: '',
    checkedOutBy: '',
    checkoutDate: '',
    expectedReturn: '',
    notes: ''
  });
  const [returnData, setReturnData] = useState({
    returnedBy: '',
    conditionOnReturn: item.condition,
    notes: ''
  });

  const activeProjects = projects.filter(p =>
    p.status === 'planning' || p.status === 'in-progress' || p.status === 'installed'
  );

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleAssign = (e) => {
    e.preventDefault();
    if (!formData.projectId || !formData.checkedOutBy) {
      alert('Please select a project and team member');
      return;
    }
    const selectedProject = projects.find(p => p.id === formData.projectId);
    onCheckout({
      projectId: formData.projectId,
      projectName: selectedProject?.title || 'Unknown Project',
      checkedOutBy: formData.checkedOutBy,
      checkedOutAt: formData.checkoutDate || new Date().toISOString(),
      expectedReturn: formData.expectedReturn || null,
      assignmentType: assignmentType,
      notes: formData.notes
    }, assignmentType);
  };

  const handleReturn = (e) => {
    e.preventDefault();
    if (!returnData.returnedBy) {
      alert('Please select who is returning the item');
      return;
    }
    onReturn({
      returnedBy: returnData.returnedBy,
      returnedAt: new Date().toISOString(),
      conditionOnReturn: returnData.conditionOnReturn,
      notes: returnData.notes
    });
  };

  const handleStartUse = () => {
    if (onStartUse) {
      onStartUse();
    }
  };

  const handleCancel = () => {
    if (onCancelReservation) {
      onCancelReservation();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px' }}>
        <div className="modal-header">
          <h3>
            {!isAssigned && 'Assign Item'}
            {isReserved && 'Manage Reservation'}
            {isInUse && 'Return Item'}
          </h3>
          <button className="icon-btn" onClick={onClose}>x</button>
        </div>

        {/* Item Info */}
        <div style={{
          padding: '1rem',
          background: 'var(--light)',
          borderRadius: '8px',
          marginBottom: '1.5rem'
        }}>
          <h4 style={{ marginBottom: '0.25rem' }}>{item.name}</h4>
          <p style={{ fontSize: '0.9rem', color: 'var(--gray)' }}>
            {item.serialNumber && `S/N: ${item.serialNumber} | `}
            Location: {item.location || 'Not specified'}
          </p>
        </div>

        {/* Reserved State */}
        {isReserved && (
          <>
            <div style={{
              padding: '1rem',
              background: '#ede9fe',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  background: '#8b5cf6',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 500
                }}>
                  Reserved
                </span>
                <span style={{ fontWeight: 500 }}>{item.currentCheckout.projectName}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--gray)', marginBottom: '0.5rem' }}>
                Reserved by {item.currentCheckout.checkedOutBy}
              </div>
              <div style={{ fontSize: '0.85rem', display: 'flex', gap: '1rem' }}>
                <span>
                  <strong>From:</strong> {formatDate(item.currentCheckout.checkedOutAt)}
                </span>
                {item.currentCheckout.expectedReturn && (
                  <span>
                    <strong>Until:</strong> {formatDate(item.currentCheckout.expectedReturn)}
                  </span>
                )}
              </div>
              {item.currentCheckout.notes && (
                <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', fontStyle: 'italic' }}>
                  Notes: {item.currentCheckout.notes}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexDirection: 'column' }}>
              <button
                className="btn btn-primary"
                style={{ background: '#3b82f6', width: '100%' }}
                onClick={handleStartUse}
              >
                Start Using (Mark as In Use)
              </button>
              <button
                className="btn btn-outline"
                style={{ width: '100%', color: 'var(--accent)', borderColor: 'var(--accent)' }}
                onClick={handleCancel}
              >
                Cancel Reservation
              </button>
              <button
                className="btn btn-outline"
                style={{ width: '100%' }}
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </>
        )}

        {/* In Use State - Return Form */}
        {isInUse && (
          <>
            <div style={{
              padding: '1rem',
              background: '#dbeafe',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  background: '#3b82f6',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 500
                }}>
                  In Use
                </span>
                <span style={{ fontWeight: 500 }}>{item.currentCheckout.projectName}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--gray)', marginBottom: '0.5rem' }}>
                Checked out by {item.currentCheckout.checkedOutBy}
              </div>
              <div style={{ fontSize: '0.85rem', display: 'flex', gap: '1rem' }}>
                <span>
                  <strong>Since:</strong> {formatDate(item.currentCheckout.checkedOutAt)}
                </span>
                {item.currentCheckout.expectedReturn && (
                  <span>
                    <strong>Expected Return:</strong> {formatDate(item.currentCheckout.expectedReturn)}
                  </span>
                )}
              </div>
            </div>

            <form onSubmit={handleReturn}>
              <div className="form-group">
                <label>Returned By *</label>
                <select
                  value={returnData.returnedBy}
                  onChange={e => setReturnData({ ...returnData, returnedBy: e.target.value })}
                  required
                >
                  <option value="">Select team member...</option>
                  {TEAM_MEMBERS.map(member => (
                    <option key={member} value={member}>{member}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Condition on Return</label>
                <select
                  value={returnData.conditionOnReturn}
                  onChange={e => setReturnData({ ...returnData, conditionOnReturn: e.target.value })}
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="needs-repair">Needs Repair</option>
                  <option value="out-of-service">Out of Service</option>
                </select>
              </div>

              <div className="form-group">
                <label>Return Notes</label>
                <textarea
                  value={returnData.notes}
                  onChange={e => setReturnData({ ...returnData, notes: e.target.value })}
                  placeholder="Any issues or notes about the item..."
                  rows={3}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success">
                  Return Item
                </button>
              </div>
            </form>
          </>
        )}

        {/* Available State - Assignment Form */}
        {!isAssigned && (
          <form onSubmit={handleAssign}>
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

            <div className="form-group">
              <label>Project *</label>
              <select
                value={formData.projectId}
                onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                required
              >
                <option value="">Select a project...</option>
                {activeProjects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.title} ({project.artistName || 'No artist'})
                  </option>
                ))}
              </select>
              {activeProjects.length === 0 && (
                <p style={{ fontSize: '0.85rem', color: 'var(--accent)', marginTop: '0.5rem' }}>
                  No active projects available. Create a project first.
                </p>
              )}
            </div>

            <div className="form-group">
              <label>Assigned By *</label>
              <select
                value={formData.checkedOutBy}
                onChange={e => setFormData({ ...formData, checkedOutBy: e.target.value })}
                required
              >
                <option value="">Select team member...</option>
                {TEAM_MEMBERS.map(member => (
                  <option key={member} value={member}>{member}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{assignmentType === 'reserved' ? 'Reservation Start' : 'Checkout Date'}</label>
                <input
                  type="date"
                  value={formData.checkoutDate}
                  onChange={e => setFormData({ ...formData, checkoutDate: e.target.value })}
                />
                <small style={{ color: 'var(--gray)', fontSize: '0.8rem' }}>
                  Leave blank for today
                </small>
              </div>
              <div className="form-group">
                <label>Expected Return</label>
                <input
                  type="date"
                  value={formData.expectedReturn}
                  onChange={e => setFormData({ ...formData, expectedReturn: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any special instructions or notes..."
                rows={2}
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className={`btn ${assignmentType === 'reserved' ? 'btn-primary' : 'btn-success'}`}
                style={assignmentType === 'reserved' ? { background: '#8b5cf6' } : {}}
                disabled={activeProjects.length === 0}
              >
                {assignmentType === 'reserved' ? 'Reserve' : 'Check Out'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default CheckoutModal;
