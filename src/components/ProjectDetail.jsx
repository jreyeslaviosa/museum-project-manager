import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProject, updateProject } from '../utils/storage';
import { useUser } from '../utils/UserContext';
import { TEAM_MEMBERS } from '../utils/constants';

// Tab Components
import OverviewTab from './tabs/OverviewTab';
import TechRiderTab from './tabs/TechRiderTab';
import EquipmentTab from './tabs/EquipmentTab';
import InstallationTab from './tabs/InstallationTab';
import BOMTab from './tabs/BOMTab';
import TasksTab from './tabs/TasksTab';
import MaintenanceTab from './tabs/MaintenanceTab';
import FilesTab from './tabs/FilesTab';
import ActivityTab from './tabs/ActivityTab';
import FullViewTab from './tabs/FullViewTab';

const ADMIN_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'tech-rider', label: 'Tech Rider' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'installation', label: 'Installation' },
  { id: 'bom', label: 'BOM & Budget' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'files', label: 'Files' },
  { id: 'activity', label: 'Activity' },
  { id: 'full-view', label: 'Full View' }
];

const BUILDER_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'tasks', label: 'My Tasks' },
  { id: 'files', label: 'Files' },
  { id: 'activity', label: 'Activity' },
  { id: 'full-view', label: 'Full View' }
];

function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isBuilder, userProfile } = useUser();
  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const tabs = isBuilder ? BUILDER_TABS : ADMIN_TABS;

  // Warn on browser close/refresh while saving
  useEffect(() => {
    if (!saving) return;
    const handler = (e) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [saving]);

  useEffect(() => {
    setActiveTab('overview');
  }, [isBuilder]);

  useEffect(() => {
    getProject(id)
      .then(data => {
        if (!data) {
          navigate('/');
          return;
        }
        setProject(data);
      })
      .catch(() => setError('Failed to load project. Please check your connection and try again.'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const logActivity = (existingLog, entries) => {
    const log = existingLog || [];
    const newEntries = entries.map(e => ({
      ...e,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      timestamp: new Date().toISOString(),
      user: userProfile?.name || 'Unknown'
    }));
    return [...log, ...newEntries];
  };

  const detectChanges = (updates) => {
    const entries = [];

    if (updates.status && updates.status !== project.status) {
      const labels = { planning: 'Planning', 'in-progress': 'In Progress', installed: 'Installed', complete: 'Complete' };
      entries.push({ type: 'status', message: `Status changed to ${labels[updates.status] || updates.status}` });
    }

    if (updates.tasks) {
      const oldTasks = project.tasks || [];
      const newTasks = updates.tasks;
      if (newTasks.length > oldTasks.length) {
        const added = newTasks.filter(nt => !oldTasks.find(ot => ot.id === nt.id));
        added.forEach(t => entries.push({ type: 'task', message: `Task added: ${t.title}` }));
      }
      newTasks.forEach(nt => {
        const ot = oldTasks.find(o => o.id === nt.id);
        if (ot && !ot.completed && nt.completed) {
          entries.push({ type: 'task', message: `Task completed: ${nt.title}` });
        }
      });
    }

    if (updates.maintenanceLog) {
      const oldLog = project.maintenanceLog || [];
      const newLog = updates.maintenanceLog;
      if (newLog.length > oldLog.length) {
        const added = newLog.filter(n => !oldLog.find(o => o.id === n.id));
        added.forEach(m => entries.push({ type: 'maintenance', message: `Maintenance reported: ${m.title || m.issue}` }));
      }
      newLog.forEach(n => {
        const o = oldLog.find(x => x.id === n.id);
        if (o && !o.resolved && n.resolved) {
          entries.push({ type: 'maintenance', message: `Maintenance resolved: ${n.title || n.issue}` });
        }
      });
    }

    if (updates.bomList) {
      const oldBom = project.bomList || [];
      const newBom = updates.bomList;
      if (newBom.length > oldBom.length) {
        const added = newBom.filter(n => !oldBom.find(o => o.id === n.id));
        added.forEach(b => entries.push({ type: 'bom', message: `BOM item added: ${b.name}` }));
      }
    }

    if (updates.files) {
      const oldFiles = project.files || [];
      const newFiles = updates.files;
      if (newFiles.length > oldFiles.length) {
        const added = newFiles.filter(n => !oldFiles.find(o => o.id === n.id));
        added.forEach(f => entries.push({ type: 'file', message: `File linked: ${f.label}` }));
      }
      if (newFiles.length < oldFiles.length) {
        entries.push({ type: 'file', message: 'File link removed' });
      }
    }

    return entries;
  };

  const handleUpdate = async (updates) => {
    setSaving(true);
    try {
      const changes = detectChanges(updates);
      const finalUpdates = { ...updates, updatedAt: new Date().toISOString() };
      if (changes.length > 0) {
        finalUpdates.activityLog = logActivity(project.activityLog, changes);
      }
      const updated = await updateProject(id, finalUpdates);
      setProject(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch {
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="app"><header className="header"><Link to="/"><h1>Museum Project Manager</h1></Link></header><div className="container" style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray)' }}>Loading project...</div></div>;
  }

  if (error) {
    return <div className="app"><header className="header"><Link to="/"><h1>Museum Project Manager</h1></Link></header><div className="container" style={{ textAlign: 'center', padding: '3rem' }}><p style={{ color: 'var(--accent)', marginBottom: '1rem' }}>{error}</p><button className="btn btn-outline" onClick={() => window.location.reload()}>Retry</button></div></div>;
  }

  if (!project) return null;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab project={project} onUpdate={handleUpdate} readOnly={isBuilder} />;
      case 'tech-rider':
        return <TechRiderTab project={project} onUpdate={handleUpdate} />;
      case 'equipment':
        return <EquipmentTab project={project} onUpdate={handleUpdate} />;
      case 'installation':
        return <InstallationTab project={project} onUpdate={handleUpdate} />;
      case 'bom':
        return <BOMTab project={project} onUpdate={handleUpdate} />;
      case 'tasks':
        return <TasksTab project={project} onUpdate={handleUpdate} readOnly={isBuilder} currentUserName={userProfile?.name} />;
      case 'maintenance':
        return <MaintenanceTab project={project} onUpdate={handleUpdate} />;
      case 'files':
        return <FilesTab project={project} onUpdate={handleUpdate} readOnly={isBuilder} />;
      case 'activity':
        return <ActivityTab project={project} />;
      case 'full-view':
        return <FullViewTab project={project} />;
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
        {saveSuccess && !saving && <span style={{ fontSize: '0.9rem', color: '#86efac' }}>Changes saved</span>}
      </header>

      <div className="container">
        <button className="back-link" onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}>← Back</button>

        <div className="project-header">
          <div>
            <h1>{project.title || 'Untitled Project'}</h1>
            <p className="artist-name">{project.artistName || 'No artist specified'}</p>
            {project.createdBy && (
              <p style={{ fontSize: '0.85rem', color: 'var(--gray)', margin: '0.25rem 0 0' }}>
                Created by: {project.createdBy}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {isAdmin ? (
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
            ) : (
              <span style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: `2px solid ${getStatusColor(project.status)}`,
                fontWeight: 500
              }}>
                {project.status === 'in-progress' ? 'In Progress' : project.status ? project.status.charAt(0).toUpperCase() + project.status.slice(1) : 'Planning'}
              </span>
            )}
          </div>
        </div>

        <div className="tabs">
          {tabs.map(tab => (
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
