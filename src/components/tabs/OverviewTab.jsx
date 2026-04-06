import { useState } from 'react';
import { TEAM_MEMBERS } from '../../utils/constants';
import ImageLightbox from '../ImageLightbox';

const getAssignees = (task) => {
  if (task.assignees && task.assignees.length > 0) return task.assignees;
  if (task.assignee) return [task.assignee];
  return [];
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

function CollapsibleSection({ title, count, defaultOpen, children }) {
  const [open, setOpen] = useState(defaultOpen || false);

  return (
    <div className="card" style={{ marginBottom: '0' }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: 'pointer', padding: '0.75rem 0', userSelect: 'none'
        }}
      >
        <h3 style={{ margin: 0, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: 'var(--gray)', fontSize: '0.8rem', transition: 'transform 0.2s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>&#9654;</span>
          {title}
          {count !== undefined && (
            <span style={{ fontSize: '0.75rem', color: 'var(--gray)', fontWeight: 400 }}>({count})</span>
          )}
        </h3>
      </div>
      {open && <div style={{ paddingBottom: '0.5rem' }}>{children}</div>}
    </div>
  );
}

function OverviewTab({ project, onUpdate, readOnly }) {
  const [editing, setEditing] = useState(false);
  const [lightbox, setLightbox] = useState(null);
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
    onUpdate({ ...formData, budget: formData.budget ? parseFloat(formData.budget) : 0 });
    setEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      title: project.title || '', artistName: project.artistName || '',
      projectManager: project.projectManager || '', technicalLead: project.technicalLead || '',
      description: project.description || '', notes: project.notes || '',
      installDate: project.installDate || '', openingDate: project.openingDate || '',
      closingDate: project.closingDate || '', deinstallDate: project.deinstallDate || '',
      budget: project.budget || ''
    });
    setEditing(false);
  };

  const techFiles = project.techRiderFiles || (project.techRider ? [project.techRider] : []);
  const imageFiles = techFiles.filter(f => f.type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(f.name));
  const docFiles = techFiles.filter(f => !f.type?.startsWith('image/') && !/\.(jpg|jpeg|png|gif|svg|webp)$/i.test(f.name));
  const artistItems = project.artistProviding || [];
  const museumItems = project.museumProviding || [];
  const bomList = project.bomList || [];
  const tasks = project.tasks || [];
  const completedTasks = tasks.filter(t => t.completed);
  const pendingTasks = tasks.filter(t => !t.completed);
  const maintenanceLog = project.maintenanceLog || [];
  const installImages = project.installationImages || [];
  const bomTotal = bomList.reduce((sum, i) => sum + (i.cost ? i.cost * i.quantity : 0), 0);

  if (editing) {
    return (
      <div className="card">
        <div className="card-header">
          <h2>Edit Project Details</h2>
        </div>

        <div className="form-group">
          <label>Project Title</label>
          <input type="text" name="title" value={formData.title} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Artist Name</label>
          <input type="text" name="artistName" value={formData.artistName} onChange={handleChange} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Project Manager</label>
            <select name="projectManager" value={formData.projectManager} onChange={handleChange}>
              <option value="">Select...</option>
              {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Technical Lead</label>
            <select name="technicalLead" value={formData.technicalLead} onChange={handleChange}>
              <option value="">Select...</option>
              {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Work Description</label>
          <textarea name="description" value={formData.description} onChange={handleChange}
            placeholder="Describe the artwork, concept, and any important details..." rows={6} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Install Date</label>
            <input type="date" name="installDate" value={formData.installDate} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Opening Date</label>
            <input type="date" name="openingDate" value={formData.openingDate} onChange={handleChange} min={formData.installDate || undefined} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Closing Date</label>
            <input type="date" name="closingDate" value={formData.closingDate} onChange={handleChange} min={formData.openingDate || undefined} />
          </div>
          <div className="form-group">
            <label>De-install Date</label>
            <input type="date" name="deinstallDate" value={formData.deinstallDate} onChange={handleChange} min={formData.closingDate || undefined} />
          </div>
        </div>

        <div className="form-group">
          <label>Budget ($)</label>
          <input type="number" name="budget" value={formData.budget} onChange={handleChange} placeholder="Allocated budget" min="0" step="0.01" />
        </div>

        <div className="form-group">
          <label>Additional Notes</label>
          <textarea name="notes" value={formData.notes} onChange={handleChange}
            placeholder="Any other notes, considerations, or reminders..." rows={4} />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
          <button className="btn btn-outline" onClick={handleCancel}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Project Details - always visible */}
      <div className="card">
        <div className="card-header">
          <h2>Project Details</h2>
          {!readOnly && (
            <button className="btn btn-outline btn-small" onClick={() => setEditing(true)}>Edit</button>
          )}
        </div>

        <div className="form-row" style={{ marginBottom: '1rem' }}>
          <div>
            <label style={{ fontWeight: 500, color: 'var(--gray)', fontSize: '0.85rem' }}>Project Manager</label>
            <p style={{ marginTop: '0.25rem' }}>{project.projectManager || '—'}</p>
          </div>
          <div>
            <label style={{ fontWeight: 500, color: 'var(--gray)', fontSize: '0.85rem' }}>Technical Lead</label>
            <p style={{ marginTop: '0.25rem' }}>{project.technicalLead || '—'}</p>
          </div>
        </div>

        {(project.installDate || project.openingDate || project.closingDate || project.deinstallDate) && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '0.75rem', padding: '0.75rem', background: 'var(--light)', borderRadius: '8px', marginBottom: '1rem'
          }}>
            {project.installDate && <div><label style={{ fontWeight: 500, color: 'var(--gray)', fontSize: '0.8rem' }}>Install</label><p style={{ marginTop: '0.15rem', fontWeight: 500, color: '#3b82f6' }}>{formatDate(project.installDate)}</p></div>}
            {project.openingDate && <div><label style={{ fontWeight: 500, color: 'var(--gray)', fontSize: '0.8rem' }}>Opening</label><p style={{ marginTop: '0.15rem', fontWeight: 500, color: 'var(--success)' }}>{formatDate(project.openingDate)}</p></div>}
            {project.closingDate && <div><label style={{ fontWeight: 500, color: 'var(--gray)', fontSize: '0.8rem' }}>Closing</label><p style={{ marginTop: '0.15rem', fontWeight: 500 }}>{formatDate(project.closingDate)}</p></div>}
            {project.deinstallDate && <div><label style={{ fontWeight: 500, color: 'var(--gray)', fontSize: '0.8rem' }}>De-install</label><p style={{ marginTop: '0.15rem', fontWeight: 500, color: 'var(--accent)' }}>{formatDate(project.deinstallDate)}</p></div>}
          </div>
        )}

        {project.budget > 0 && (
          <div style={{ padding: '0.75rem', background: '#f0fdf4', borderRadius: '8px', borderLeft: '4px solid var(--success)', marginBottom: '1rem' }}>
            <label style={{ fontWeight: 500, color: 'var(--gray)', fontSize: '0.8rem' }}>Budget</label>
            <p style={{ marginTop: '0.15rem', fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--success)' }}>
              ${project.budget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              {bomTotal > 0 && (
                <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--gray)', marginLeft: '0.75rem' }}>
                  BOM spent: ${bomTotal.toFixed(2)} | Remaining: ${(project.budget - bomTotal).toFixed(2)}
                </span>
              )}
            </p>
          </div>
        )}

        {project.description && (
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ fontWeight: 500, color: 'var(--gray)', fontSize: '0.8rem' }}>Description</label>
            <p style={{ whiteSpace: 'pre-wrap', marginTop: '0.25rem', fontSize: '0.9rem', lineHeight: 1.5 }}>{project.description}</p>
          </div>
        )}

        {project.notes && (
          <div>
            <label style={{ fontWeight: 500, color: 'var(--gray)', fontSize: '0.8rem' }}>Notes</label>
            <p style={{ whiteSpace: 'pre-wrap', marginTop: '0.25rem', fontSize: '0.9rem', lineHeight: 1.5 }}>{project.notes}</p>
          </div>
        )}
      </div>

      {/* Tech Rider */}
      <CollapsibleSection title="Tech Rider" count={techFiles.length}>
        {techFiles.length === 0 ? (
          <p style={{ color: 'var(--gray)', fontSize: '0.85rem' }}>No tech rider files uploaded yet.</p>
        ) : (
          <>
            {docFiles.map(f => (
              <div key={f.id || f.name} style={{ padding: '0.4rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                {f.name} {f.size ? `(${(f.size / 1024).toFixed(1)} KB)` : ''}
              </div>
            ))}
            {imageFiles.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem', marginTop: '0.5rem' }}>
                {imageFiles.map((img, idx) => (
                  <div key={img.id || img.name} style={{ borderRadius: '4px', overflow: 'hidden', aspectRatio: '4/3', cursor: 'pointer' }} onClick={() => setLightbox({ images: imageFiles, index: idx })}>
                    <img src={img.data} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CollapsibleSection>

      {/* Equipment */}
      <CollapsibleSection title="Equipment" count={artistItems.length + museumItems.length}>
        {artistItems.length === 0 && museumItems.length === 0 ? (
          <p style={{ color: 'var(--gray)', fontSize: '0.85rem' }}>No equipment listed yet.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {artistItems.length > 0 && (
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>Artist Providing ({artistItems.length})</div>
                {artistItems.map(item => (
                  <div key={item.id} style={{ padding: '0.25rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                    {item.name}{(item.quantity || 1) > 1 && <span style={{ color: 'var(--gray)' }}> x{item.quantity}</span>}
                    {item.notes && <div style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>{item.notes}</div>}
                  </div>
                ))}
              </div>
            )}
            {museumItems.length > 0 && (
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>Museum Providing ({museumItems.length})</div>
                {museumItems.map(item => (
                  <div key={item.id} style={{ padding: '0.25rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                    {item.name}{(item.quantity || 1) > 1 && <span style={{ color: 'var(--gray)' }}> x{item.quantity}</span>}
                    {item.notes && <div style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>{item.notes}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CollapsibleSection>

      {/* Installation */}
      <CollapsibleSection title="Installation" count={installImages.length > 0 ? `${installImages.length} images` : undefined}>
        {!project.installationPlan && installImages.length === 0 ? (
          <p style={{ color: 'var(--gray)', fontSize: '0.85rem' }}>No installation plan added yet.</p>
        ) : (
          <>
            {project.installationPlan && (
              <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '0.75rem' }}>{project.installationPlan}</p>
            )}
            {installImages.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem' }}>
                {installImages.map((img, idx) => (
                  <div key={img.id} style={{ borderRadius: '4px', overflow: 'hidden', aspectRatio: '4/3', cursor: 'pointer' }} onClick={() => setLightbox({ images: installImages, index: idx })}>
                    <img src={img.data} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CollapsibleSection>

      {/* BOM & Budget */}
      <CollapsibleSection title="BOM & Budget" count={bomList.length}>
        {bomList.length === 0 ? (
          <p style={{ color: 'var(--gray)', fontSize: '0.85rem' }}>No BOM items added yet.</p>
        ) : (
          <>
            {bomTotal > 0 && (
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                <span>Total: <strong>${bomTotal.toFixed(2)}</strong></span>
                <span>To Buy: <strong>{bomList.filter(i => i.status === 'to-buy').length}</strong></span>
                <span>Ordered: <strong>{bomList.filter(i => i.status === 'ordered').length}</strong></span>
                <span>In Stock: <strong>{bomList.filter(i => i.status === 'in-stock').length}</strong></span>
              </div>
            )}
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Item</th><th>Qty</th><th>Status</th><th>Cost</th></tr>
                </thead>
                <tbody>
                  {bomList.map(item => (
                    <tr key={item.id}>
                      <td>{item.name}{item.notes && <div style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>{item.notes}</div>}</td>
                      <td>{item.quantity} {item.unit || ''}</td>
                      <td><span className={`bom-status ${item.status}`}>{item.status === 'in-stock' ? 'In Stock' : item.status === 'to-buy' ? 'To Buy' : item.status === 'ordered' ? 'Ordered' : item.status}</span></td>
                      <td>{item.cost ? `$${(item.cost * item.quantity).toFixed(2)}` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CollapsibleSection>

      {/* Tasks */}
      <CollapsibleSection title="Tasks" count={`${completedTasks.length}/${tasks.length}`}>
        {tasks.length === 0 ? (
          <p style={{ color: 'var(--gray)', fontSize: '0.85rem' }}>No tasks added yet.</p>
        ) : (
          <>
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                <span>Progress</span>
                <span style={{ fontWeight: 600, color: 'var(--success)' }}>{Math.round((completedTasks.length / tasks.length) * 100)}%</span>
              </div>
              <div className="progress-bar" style={{ height: '8px' }}>
                <div className="progress-fill" style={{ width: `${(completedTasks.length / tasks.length) * 100}%` }} />
              </div>
            </div>

            {pendingTasks.length > 0 && (
              <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Pending ({pendingTasks.length})</div>
                {pendingTasks.slice(0, 8).map(task => (
                  <div key={task.id} style={{ padding: '0.3rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>
                      {task.isMilestone && <span style={{ color: '#f59e0b', marginRight: '0.3rem', fontWeight: 600 }}>M</span>}
                      {task.title}
                    </span>
                    <span style={{ color: 'var(--gray)', fontSize: '0.8rem', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
                      {getAssignees(task).join(', ') || ''}
                      {task.dueDate && ` | ${formatDate(task.dueDate)}`}
                    </span>
                  </div>
                ))}
                {pendingTasks.length > 8 && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray)', padding: '0.3rem 0' }}>+{pendingTasks.length - 8} more tasks</div>
                )}
              </div>
            )}
          </>
        )}
      </CollapsibleSection>

      {/* Maintenance */}
      {maintenanceLog.length > 0 && (
        <CollapsibleSection title="Maintenance" count={`${maintenanceLog.filter(m => !m.resolved).length} open`}>
          {maintenanceLog.filter(m => !m.resolved).map(entry => (
            <div key={entry.id} style={{ padding: '0.4rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 500 }}>{entry.title || entry.issue}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase' }}>Open</span>
              </div>
              {entry.description && <div style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>{entry.description}</div>}
            </div>
          ))}
          {maintenanceLog.filter(m => m.resolved).length > 0 && (
            <div style={{ fontSize: '0.8rem', color: 'var(--gray)', padding: '0.3rem 0' }}>
              {maintenanceLog.filter(m => m.resolved).length} resolved issue(s)
            </div>
          )}
        </CollapsibleSection>
      )}

      {lightbox && (
        <ImageLightbox images={lightbox.images} initialIndex={lightbox.index} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}

export default OverviewTab;
