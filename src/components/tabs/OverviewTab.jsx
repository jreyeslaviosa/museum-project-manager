import { useState } from 'react';
import { TEAM_MEMBERS } from '../../utils/constants';

// Helper to get assignees from task (handles both old and new format)
const getAssignees = (task) => {
  if (task.assignees && task.assignees.length > 0) {
    return task.assignees;
  }
  if (task.assignee) {
    return [task.assignee];
  }
  return [];
};

function OverviewTab({ project, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: project.title || '',
    artistName: project.artistName || '',
    projectManager: project.projectManager || '',
    technicalLead: project.technicalLead || '',
    description: project.description || '',
    notes: project.notes || '',
    installDate: project.installDate || '',
    openingDate: project.openingDate || '',
    closingDate: project.closingDate || '',
    deinstallDate: project.deinstallDate || '',
    budget: project.budget || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      // Clear dates that would violate ordering
      if (name === 'installDate' && value) {
        if (updated.openingDate && updated.openingDate < value) updated.openingDate = '';
        if (updated.closingDate && updated.closingDate < value) updated.closingDate = '';
        if (updated.deinstallDate && updated.deinstallDate < value) updated.deinstallDate = '';
      }
      if (name === 'openingDate' && value) {
        if (updated.closingDate && updated.closingDate < value) updated.closingDate = '';
        if (updated.deinstallDate && updated.deinstallDate < value) updated.deinstallDate = '';
      }
      if (name === 'closingDate' && value) {
        if (updated.deinstallDate && updated.deinstallDate < value) updated.deinstallDate = '';
      }
      return updated;
    });
  };

  const handleSave = () => {
    onUpdate({
      ...formData,
      budget: formData.budget ? parseFloat(formData.budget) : 0
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      title: project.title || '',
      artistName: project.artistName || '',
      projectManager: project.projectManager || '',
      technicalLead: project.technicalLead || '',
      description: project.description || '',
      notes: project.notes || '',
      installDate: project.installDate || '',
      openingDate: project.openingDate || '',
      closingDate: project.closingDate || '',
      deinstallDate: project.deinstallDate || '',
      budget: project.budget || ''
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="card">
        <div className="card-header">
          <h2>Edit Project Details</h2>
        </div>

        <div className="form-group">
          <label>Project Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Artist Name</label>
          <input
            type="text"
            name="artistName"
            value={formData.artistName}
            onChange={handleChange}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Project Manager</label>
            <select
              name="projectManager"
              value={formData.projectManager}
              onChange={handleChange}
            >
              <option value="">Select...</option>
              {TEAM_MEMBERS.map(member => (
                <option key={member} value={member}>{member}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Technical Lead</label>
            <select
              name="technicalLead"
              value={formData.technicalLead}
              onChange={handleChange}
            >
              <option value="">Select...</option>
              {TEAM_MEMBERS.map(member => (
                <option key={member} value={member}>{member}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Work Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the artwork, concept, and any important details..."
            rows={6}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Install Date</label>
            <input
              type="date"
              name="installDate"
              value={formData.installDate}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Opening Date</label>
            <input
              type="date"
              name="openingDate"
              value={formData.openingDate}
              onChange={handleChange}
              min={formData.installDate || undefined}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Closing Date</label>
            <input
              type="date"
              name="closingDate"
              value={formData.closingDate}
              onChange={handleChange}
              min={formData.openingDate || undefined}
            />
          </div>
          <div className="form-group">
            <label>De-install Date</label>
            <input
              type="date"
              name="deinstallDate"
              value={formData.deinstallDate}
              onChange={handleChange}
              min={formData.closingDate || undefined}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Budget ($)</label>
          <input
            type="number"
            name="budget"
            value={formData.budget}
            onChange={handleChange}
            placeholder="Allocated budget"
            min="0"
            step="0.01"
          />
        </div>

        <div className="form-group">
          <label>Additional Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Any other notes, considerations, or reminders..."
            rows={4}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          <button className="btn btn-primary" onClick={handleSave}>
            Save Changes
          </button>
          <button className="btn btn-outline" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>Project Details</h2>
          <button className="btn btn-outline btn-small" onClick={() => setEditing(true)}>
            Edit
          </button>
        </div>

        <div className="form-row" style={{ marginBottom: '1.5rem' }}>
          <div>
            <label style={{ fontWeight: 500, color: 'var(--gray)', fontSize: '0.85rem' }}>
              Project Manager
            </label>
            <p style={{ marginTop: '0.25rem' }}>{project.projectManager || '—'}</p>
          </div>
          <div>
            <label style={{ fontWeight: 500, color: 'var(--gray)', fontSize: '0.85rem' }}>
              Technical Lead
            </label>
            <p style={{ marginTop: '0.25rem' }}>{project.technicalLead || '—'}</p>
          </div>
        </div>

        {/* Exhibition Dates */}
        {(project.installDate || project.openingDate || project.closingDate || project.deinstallDate) && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem',
            padding: '1rem',
            background: 'var(--light)',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            {project.installDate && (
              <div>
                <label style={{ fontWeight: 500, color: 'var(--gray)', fontSize: '0.85rem' }}>
                  Install Date
                </label>
                <p style={{ marginTop: '0.25rem', fontWeight: 500, color: '#3b82f6' }}>
                  {new Date(project.installDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            )}
            {project.openingDate && (
              <div>
                <label style={{ fontWeight: 500, color: 'var(--gray)', fontSize: '0.85rem' }}>
                  Opening Date
                </label>
                <p style={{ marginTop: '0.25rem', fontWeight: 500, color: 'var(--success)' }}>
                  {new Date(project.openingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            )}
            {project.closingDate && (
              <div>
                <label style={{ fontWeight: 500, color: 'var(--gray)', fontSize: '0.85rem' }}>
                  Closing Date
                </label>
                <p style={{ marginTop: '0.25rem', fontWeight: 500 }}>
                  {new Date(project.closingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            )}
            {project.deinstallDate && (
              <div>
                <label style={{ fontWeight: 500, color: 'var(--gray)', fontSize: '0.85rem' }}>
                  De-install Date
                </label>
                <p style={{ marginTop: '0.25rem', fontWeight: 500, color: 'var(--accent)' }}>
                  {new Date(project.deinstallDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Budget */}
        {project.budget > 0 && (
          <div style={{
            padding: '1rem',
            background: '#f0fdf4',
            borderRadius: '8px',
            borderLeft: '4px solid var(--success)'
          }}>
            <label style={{ fontWeight: 500, color: 'var(--gray)', fontSize: '0.85rem' }}>
              Allocated Budget
            </label>
            <p style={{ marginTop: '0.25rem', fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--success)' }}>
              ${project.budget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Work Description</h2>
        </div>
        {project.description ? (
          <p style={{ whiteSpace: 'pre-wrap' }}>{project.description}</p>
        ) : (
          <p style={{ color: 'var(--gray)', fontStyle: 'italic' }}>
            No description added yet. Click "Edit" to add one.
          </p>
        )}
      </div>

      {project.notes && (
        <div className="card">
          <div className="card-header">
            <h2>Additional Notes</h2>
          </div>
          <p style={{ whiteSpace: 'pre-wrap' }}>{project.notes}</p>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2>Project Summary</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--light)', borderRadius: '8px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
              {(project.artistProviding?.length || 0) + (project.museumProviding?.length || 0)}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Equipment Items</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--light)', borderRadius: '8px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
              {project.bomList?.length || 0}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>BOM Items</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--light)', borderRadius: '8px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
              {project.tasks?.filter(t => t.completed).length || 0}/{project.tasks?.length || 0}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Tasks Done</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--light)', borderRadius: '8px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
              {project.installationImages?.length || 0}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Images</div>
          </div>
        </div>
      </div>

      {/* Team Progress */}
      {project.tasks && project.tasks.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2>Team Progress</h2>
          </div>

          {/* Overall Progress */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 500 }}>Overall Completion</span>
              <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>
                {Math.round((project.tasks.filter(t => t.completed).length / project.tasks.length) * 100)}%
              </span>
            </div>
            <div className="progress-bar" style={{ height: '12px' }}>
              <div
                className="progress-fill"
                style={{
                  width: `${(project.tasks.filter(t => t.completed).length / project.tasks.length) * 100}%`
                }}
              />
            </div>
          </div>

          {/* By Person */}
          <div>
            {(() => {
              const byAssignee = {};

              // Initialize all team members
              TEAM_MEMBERS.forEach(member => {
                byAssignee[member] = { total: 0, completed: 0 };
              });
              byAssignee['Unassigned'] = { total: 0, completed: 0 };

              // Count tasks per person
              project.tasks.forEach(task => {
                const assignees = getAssignees(task);
                if (assignees.length === 0) {
                  byAssignee['Unassigned'].total++;
                  if (task.completed) byAssignee['Unassigned'].completed++;
                } else {
                  assignees.forEach(person => {
                    if (byAssignee[person]) {
                      byAssignee[person].total++;
                      if (task.completed) byAssignee[person].completed++;
                    }
                  });
                }
              });

              // Filter out people with no tasks
              const activeAssignees = Object.entries(byAssignee)
                .filter(([_, stats]) => stats.total > 0);

              return activeAssignees.map(([assignee, stats]) => {
                const percentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
                return (
                  <div key={assignee} style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.9rem' }}>{assignee}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>
                        {stats.completed}/{stats.total} ({percentage}%)
                      </span>
                    </div>
                    <div className="progress-bar" style={{ height: '6px' }}>
                      <div className="progress-fill" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {project.tasks && project.tasks.filter(t => t.completed && t.completedAt).length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2>Recent Activity</h2>
          </div>
          {project.tasks
            .filter(t => t.completed && t.completedAt)
            .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
            .slice(0, 5)
            .map(task => {
              const assignees = getAssignees(task);
              return (
                <div
                  key={task.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.5rem 0',
                    borderBottom: '1px solid var(--border)'
                  }}
                >
                  <span style={{ color: 'var(--success)', fontSize: '1.1rem' }}>✓</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem' }}>{task.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>
                      {assignees.length > 0 ? `${assignees.join(', ')} • ` : ''}
                      {new Date(task.completedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          }
        </div>
      )}
    </div>
  );
}

export default OverviewTab;
