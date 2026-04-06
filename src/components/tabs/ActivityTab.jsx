const formatDate = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

const getTypeStyle = (type) => {
  switch (type) {
    case 'status': return { background: '#dbeafe', color: '#1e40af' };
    case 'task': return { background: '#d1fae5', color: '#065f46' };
    case 'maintenance': return { background: '#fef3c7', color: '#92400e' };
    case 'bom': return { background: '#ede9fe', color: '#5b21b6' };
    case 'file': return { background: '#e0e7ff', color: '#3730a3' };
    default: return { background: 'var(--light)', color: 'var(--gray)' };
  }
};

function ActivityTab({ project }) {
  const activity = (project.activityLog || []).slice().reverse();

  return (
    <div className="card">
      <div className="card-header">
        <h2>Activity Log ({activity.length})</h2>
      </div>

      <p style={{ color: 'var(--gray)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        Automatically recorded changes to this project.
      </p>

      {activity.length === 0 ? (
        <div className="empty-state">
          <p>No activity recorded yet. Changes to status, tasks, maintenance, and files will appear here.</p>
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
          {/* Timeline line */}
          <div style={{
            position: 'absolute', left: '5px', top: '8px', bottom: '8px',
            width: '2px', background: 'var(--border)'
          }} />

          {activity.map((entry, idx) => (
            <div key={entry.id || idx} style={{
              position: 'relative', paddingBottom: '1.25rem',
              paddingLeft: '1rem'
            }}>
              {/* Dot */}
              <div style={{
                position: 'absolute', left: '-1.5rem', top: '6px',
                width: '12px', height: '12px', borderRadius: '50%',
                background: getTypeStyle(entry.type).background,
                border: `2px solid ${getTypeStyle(entry.type).color}`
              }} />

              <div style={{ fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 500 }}>{entry.message}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray)', marginTop: '0.15rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <span>{formatDate(entry.timestamp)}</span>
                {entry.user && <span>by {entry.user}</span>}
                <span style={{
                  ...getTypeStyle(entry.type),
                  padding: '0.05rem 0.35rem',
                  borderRadius: '3px',
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}>
                  {entry.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ActivityTab;
