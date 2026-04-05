import { TEAM_MEMBERS, INVENTORY_CATEGORIES } from '../../utils/constants';

const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'in-progress': return 'In Progress';
    case 'installed': return 'Installed';
    case 'maintenance': return 'Maintenance';
    default: return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Planning';
  }
};

const getCategoryLabel = (categoryId) => {
  const cat = INVENTORY_CATEGORIES.find(c => c.id === categoryId);
  return cat ? cat.label : categoryId;
};

function FullViewTab({ project }) {
  const artistItems = project.artistProviding || [];
  const museumItems = project.museumProviding || [];
  const bomList = project.bomList || [];
  const tasks = project.tasks || [];
  const maintenanceLog = project.maintenanceLog || [];
  const completedTasks = tasks.filter(t => t.completed);
  const pendingTasks = tasks.filter(t => !t.completed);

  const sectionStyle = {
    marginBottom: '1.5rem',
    paddingBottom: '1.5rem',
    borderBottom: '1px solid var(--border)'
  };

  const labelStyle = {
    fontSize: '0.7rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    color: 'var(--gray)',
    marginBottom: '0.25rem'
  };

  return (
    <div className="card">
      {/* Header */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{project.title || 'Untitled Project'}</h2>
        <p style={{ color: 'var(--gray)', fontSize: '0.9rem' }}>{project.artistName || 'No artist specified'}</p>
        <span style={{
          display: 'inline-block',
          marginTop: '0.5rem',
          padding: '0.2rem 0.6rem',
          borderRadius: '2px',
          fontSize: '0.7rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          background: 'var(--light)',
          color: 'var(--dark)'
        }}>
          {getStatusLabel(project.status)}
        </span>
      </div>

      {/* Team & Dates */}
      <div style={sectionStyle}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <div style={labelStyle}>Project Manager</div>
            <div>{project.projectManager || '-'}</div>
          </div>
          <div>
            <div style={labelStyle}>Technical Lead</div>
            <div>{project.technicalLead || '-'}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
          {project.installDate && (
            <div>
              <div style={labelStyle}>Install</div>
              <div>{formatDate(project.installDate)}</div>
            </div>
          )}
          {project.openingDate && (
            <div>
              <div style={labelStyle}>Opening</div>
              <div>{formatDate(project.openingDate)}</div>
            </div>
          )}
          {project.closingDate && (
            <div>
              <div style={labelStyle}>Closing</div>
              <div>{formatDate(project.closingDate)}</div>
            </div>
          )}
          {project.deinstallDate && (
            <div>
              <div style={labelStyle}>De-install</div>
              <div>{formatDate(project.deinstallDate)}</div>
            </div>
          )}
        </div>

        {project.budget > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div style={labelStyle}>Budget</div>
            <div style={{ fontWeight: 600 }}>
              ${project.budget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      {project.description && (
        <div style={sectionStyle}>
          <div style={{ ...labelStyle, marginBottom: '0.5rem' }}>Description</div>
          <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem', lineHeight: 1.6 }}>{project.description}</p>
        </div>
      )}

      {/* Tech Rider */}
      {project.techRider && (
        <div style={sectionStyle}>
          <div style={{ ...labelStyle, marginBottom: '0.5rem' }}>Tech Rider</div>
          <div style={{ fontSize: '0.85rem' }}>
            {project.techRider.name} ({(project.techRider.size / 1024).toFixed(1)} KB)
          </div>
        </div>
      )}

      {/* Equipment */}
      {(artistItems.length > 0 || museumItems.length > 0) && (
        <div style={sectionStyle}>
          <div style={{ ...labelStyle, marginBottom: '0.75rem' }}>Equipment</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {artistItems.length > 0 && (
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Artist Providing ({artistItems.length})
                </div>
                {artistItems.map(item => (
                  <div key={item.id} style={{ padding: '0.3rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                    <span>{item.name}</span>
                    {(item.quantity || 1) > 1 && (
                      <span style={{ color: 'var(--gray)', marginLeft: '0.4rem' }}>x{item.quantity}</span>
                    )}
                    {item.notes && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>{item.notes}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {museumItems.length > 0 && (
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Museum Providing ({museumItems.length})
                </div>
                {museumItems.map(item => (
                  <div key={item.id} style={{ padding: '0.3rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                    <span>{item.name}</span>
                    {(item.quantity || 1) > 1 && (
                      <span style={{ color: 'var(--gray)', marginLeft: '0.4rem' }}>x{item.quantity}</span>
                    )}
                    {item.notes && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>{item.notes}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Installation Plan */}
      {project.installationPlan && (
        <div style={sectionStyle}>
          <div style={{ ...labelStyle, marginBottom: '0.5rem' }}>Installation Plan</div>
          <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem', lineHeight: 1.6 }}>{project.installationPlan}</p>
        </div>
      )}

      {/* Installation Images */}
      {(project.installationImages || []).length > 0 && (
        <div style={sectionStyle}>
          <div style={{ ...labelStyle, marginBottom: '0.5rem' }}>
            Installation Images ({project.installationImages.length})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.5rem' }}>
            {project.installationImages.map(img => (
              <div key={img.id} style={{ borderRadius: '4px', overflow: 'hidden', aspectRatio: '4/3' }}>
                <img src={img.data} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BOM */}
      {bomList.length > 0 && (
        <div style={sectionStyle}>
          <div style={{ ...labelStyle, marginBottom: '0.5rem' }}>
            Bill of Materials ({bomList.length})
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Supplier</th>
                  <th>Status</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                {bomList.map(item => (
                  <tr key={item.id}>
                    <td>
                      {item.name}
                      {item.notes && <div style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>{item.notes}</div>}
                    </td>
                    <td>{item.quantity} {item.unit || ''}</td>
                    <td>{item.supplier || '-'}</td>
                    <td>
                      <span className={`bom-status ${item.status}`}>
                        {item.status === 'in-stock' ? 'In Stock' : item.status === 'to-buy' ? 'To Buy' : item.status === 'ordered' ? 'Ordered' : item.status}
                      </span>
                    </td>
                    <td>{item.cost ? `$${(item.cost * item.quantity).toFixed(2)}` : '-'}</td>
                  </tr>
                ))}
              </tbody>
              {bomList.some(i => i.cost) && (
                <tfoot>
                  <tr>
                    <td colSpan="4" style={{ fontWeight: 600, textAlign: 'right' }}>Total</td>
                    <td style={{ fontWeight: 600 }}>
                      ${bomList.reduce((sum, i) => sum + (i.cost ? i.cost * i.quantity : 0), 0).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Tasks */}
      {tasks.length > 0 && (
        <div style={sectionStyle}>
          <div style={{ ...labelStyle, marginBottom: '0.5rem' }}>
            Tasks ({completedTasks.length}/{tasks.length} completed)
          </div>
          <div className="progress-bar" style={{ height: '6px', marginBottom: '0.75rem' }}>
            <div className="progress-fill" style={{ width: `${tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0}%` }} />
          </div>

          {pendingTasks.length > 0 && (
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>Pending</div>
              {pendingTasks.map(task => (
                <div key={task.id} style={{ padding: '0.3rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>
                    {task.isMilestone && <span style={{ color: '#f59e0b', marginRight: '0.3rem' }}>*</span>}
                    {task.title}
                  </span>
                  <span style={{ color: 'var(--gray)', fontSize: '0.8rem' }}>
                    {task.assignees?.join(', ') || task.assignee || ''}
                    {task.dueDate && ` | ${formatDate(task.dueDate)}`}
                  </span>
                </div>
              ))}
            </div>
          )}

          {completedTasks.length > 0 && (
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--gray)' }}>Completed</div>
              {completedTasks.map(task => (
                <div key={task.id} style={{ padding: '0.3rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem', opacity: 0.5 }}>
                  <span style={{ textDecoration: 'line-through' }}>{task.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Maintenance */}
      {maintenanceLog.length > 0 && (
        <div style={sectionStyle}>
          <div style={{ ...labelStyle, marginBottom: '0.5rem' }}>
            Maintenance Log ({maintenanceLog.filter(m => !m.resolved).length} open)
          </div>
          {maintenanceLog.map(entry => (
            <div key={entry.id} style={{
              padding: '0.5rem 0',
              borderBottom: '1px solid var(--border)',
              fontSize: '0.85rem',
              opacity: entry.resolved ? 0.5 : 1
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 500 }}>{entry.title || entry.issue}</span>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: entry.resolved ? 'var(--success)' : 'var(--accent)'
                }}>
                  {entry.resolved ? 'Resolved' : 'Open'}
                </span>
              </div>
              {entry.description && (
                <div style={{ color: 'var(--gray)', fontSize: '0.8rem', marginTop: '0.15rem' }}>{entry.description}</div>
              )}
              {entry.reportedAt && (
                <div style={{ color: 'var(--gray)', fontSize: '0.75rem', marginTop: '0.15rem' }}>
                  Reported: {formatDate(entry.reportedAt)}
                  {entry.resolvedAt && ` | Resolved: ${formatDate(entry.resolvedAt)}`}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Notes */}
      {project.notes && (
        <div>
          <div style={{ ...labelStyle, marginBottom: '0.5rem' }}>Notes</div>
          <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem', lineHeight: 1.6 }}>{project.notes}</p>
        </div>
      )}
    </div>
  );
}

export default FullViewTab;
