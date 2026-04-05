import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProject, updateProject } from '../utils/storage';

// Tab Components
import OverviewTab from './tabs/OverviewTab';
import TechRiderTab from './tabs/TechRiderTab';
import EquipmentTab from './tabs/EquipmentTab';
import InstallationTab from './tabs/InstallationTab';
import BOMTab from './tabs/BOMTab';
import TasksTab from './tabs/TasksTab';
import MaintenanceTab from './tabs/MaintenanceTab';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'tech-rider', label: 'Tech Rider' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'installation', label: 'Installation' },
  { id: 'bom', label: 'BOM & Budget' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'maintenance', label: 'Maintenance' }
];

function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProject(id).then(data => {
      if (!data) {
        navigate('/');
        return;
      }
      setProject(data);
    });
  }, [id, navigate]);

  const handleUpdate = async (updates) => {
    setSaving(true);
    const updated = await updateProject(id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    setProject(updated);
    setTimeout(() => setSaving(false), 500);
  };

  if (!project) {
    return <div className="container">Loading...</div>;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab project={project} onUpdate={handleUpdate} />;
      case 'tech-rider':
        return <TechRiderTab project={project} onUpdate={handleUpdate} />;
      case 'equipment':
        return <EquipmentTab project={project} onUpdate={handleUpdate} />;
      case 'installation':
        return <InstallationTab project={project} onUpdate={handleUpdate} />;
      case 'bom':
        return <BOMTab project={project} onUpdate={handleUpdate} />;
      case 'tasks':
        return <TasksTab project={project} onUpdate={handleUpdate} />;
      case 'maintenance':
        return <MaintenanceTab project={project} onUpdate={handleUpdate} />;
      default:
        return <OverviewTab project={project} onUpdate={handleUpdate} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'planning': return '#f59e0b';
      case 'in-progress': return '#3b82f6';
      case 'installed': return '#8b5cf6';
      case 'complete': return '#10b981';
      default: return '#6b7280';
    }
  };

  // Count open maintenance issues
  const openIssues = (project.maintenanceLog || []).filter(m => !m.resolved).length;

  return (
    <div className="app">
      <header className="header">
        <Link to="/"><h1>Museum Project Manager</h1></Link>
        {saving && <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>Saving...</span>}
      </header>

      <div className="container">
        <Link to="/dashboard" className="back-link">← Back to Projects</Link>

        <div className="project-header">
          <div>
            <h1>{project.title || 'Untitled Project'}</h1>
            <p className="artist-name">{project.artistName || 'No artist specified'}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select
              value={project.status}
              onChange={(e) => handleUpdate({ status: e.target.value })}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: `2px solid ${getStatusColor(project.status)}`,
                background: 'white',
                fontWeight: 500
              }}
            >
              <option value="planning">Planning</option>
              <option value="in-progress">In Progress</option>
              <option value="installed">Installed</option>
              <option value="complete">Complete</option>
            </select>
          </div>
        </div>

        <div className="tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              style={{ position: 'relative' }}
            >
              {tab.label}
              {tab.id === 'maintenance' && openIssues > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  background: 'var(--accent)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  fontSize: '0.7rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {openIssues}
                </span>
              )}
            </button>
          ))}
        </div>

        {renderTabContent()}
      </div>
    </div>
  );
}

export default ProjectDetail;
