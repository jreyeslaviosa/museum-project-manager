import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { createProject, createEmptyProject, getRooms } from '../utils/storage';
import { PROJECT_TEMPLATES } from '../utils/constants';
import { useUser } from '../utils/UserContext';

const SITE_OPTIONS = [
  { id: 'dania-beach', label: 'Dania Beach' },
  { id: 'detroit-museum', label: 'Detroit - Museum' },
  { id: 'detroit-church', label: 'Detroit - Church' },
  { id: 'off-site', label: 'Off-site' },
];

function NewProject() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isExisting = searchParams.get('existing') === 'true';
  const { userProfile, teamMemberNames: TEAM_MEMBERS } = useUser();
  const [selectedTemplate, setSelectedTemplate] = useState('blank');
  const [rooms, setRooms] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    artistName: '',
    projectManager: '',
    technicalLead: '',
    site: '',
    room: '',
    customLocation: '',
  });

  useEffect(() => {
    getRooms().then(setRooms);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const template = PROJECT_TEMPLATES.find(t => t.id === selectedTemplate);
    const templateData = template?.data || {};

    // Generate unique IDs for template items
    const withIds = (items) => items?.map(item => ({ ...item, id: uuidv4() })) || [];

    // Build location from site + room/custom
    const siteLabel = SITE_OPTIONS.find(s => s.id === formData.site)?.label || '';
    const roomOrCustom = formData.room || formData.customLocation || '';
    const location = roomOrCustom ? `${siteLabel} — ${roomOrCustom}` : siteLabel;

    const newProject = {
      ...createEmptyProject(),
      title: formData.title,
      artistName: formData.artistName,
      projectManager: formData.projectManager,
      technicalLead: formData.technicalLead,
      site: formData.site,
      room: formData.room,
      location,
      id: uuidv4(),
      status: isExisting ? 'installed' : 'planning',
      createdBy: userProfile?.name || 'Unknown',
      museumProviding: withIds(templateData.museumProviding),
      artistProviding: withIds(templateData.artistProviding),
      tasks: withIds(templateData.tasks),
      bomList: withIds(templateData.bomList),
    };

    await createProject(newProject);
    navigate(`/project/${newProject.id}`);
  };

  const currentTemplate = PROJECT_TEMPLATES.find(t => t.id === selectedTemplate);
  const templateData = currentTemplate?.data || {};

  return (
    <div className="app">
      <header className="header">
        <Link to="/"><h1>Museum Project Manager</h1></Link>
      </header>

      <div className="container">
        <Link to="/dashboard" className="back-link">← Back to Projects</Link>

        <div className="card" style={{ maxWidth: '600px' }}>
          <div className="card-header">
            <h2>{isExisting ? 'Register Existing Installation' : 'Create New Project'}</h2>
            {isExisting && (
              <p style={{ color: 'var(--gray)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                Register an installation that's already in place so you can track maintenance.
              </p>
            )}
          </div>

          {/* Template Selector — only for new projects */}
          {!isExisting && <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Start from a template
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.5rem' }}>
              {PROJECT_TEMPLATES.map(template => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedTemplate(template.id)}
                  style={{
                    padding: '0.75rem',
                    border: selectedTemplate === template.id ? '2px solid var(--secondary)' : '2px solid var(--border)',
                    borderRadius: '8px',
                    background: selectedTemplate === template.id ? 'rgba(44, 62, 80, 0.05)' : 'white',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.2rem' }}>
                    {template.label}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray)', lineHeight: 1.3 }}>
                    {template.description}
                  </div>
                </button>
              ))}
            </div>

            {/* Template Preview */}
            {selectedTemplate !== 'blank' && (
              <div style={{
                marginTop: '0.75rem',
                padding: '0.75rem',
                background: 'var(--light)',
                borderRadius: '6px',
                fontSize: '0.8rem',
                color: 'var(--gray)'
              }}>
                <span style={{ fontWeight: 600, color: 'var(--dark)' }}>Includes: </span>
                {(templateData.tasks || []).length > 0 && (
                  <span>{templateData.tasks.length} tasks</span>
                )}
                {(templateData.museumProviding || []).length > 0 && (
                  <span> · {templateData.museumProviding.length} equipment items</span>
                )}
                {(templateData.bomList || []).length > 0 && (
                  <span> · {templateData.bomList.length} BOM items</span>
                )}
              </div>
            )}
          </div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Project Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Light Installation - Summer 2024"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="artistName">Artist Name</label>
              <input
                type="text"
                id="artistName"
                name="artistName"
                value={formData.artistName}
                onChange={handleChange}
                placeholder="Artist or collective name"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="site">Site *</label>
                <select
                  id="site"
                  name="site"
                  value={formData.site}
                  onChange={(e) => setFormData(prev => ({ ...prev, site: e.target.value, room: '' }))}
                  required
                >
                  <option value="">Select site...</option>
                  {SITE_OPTIONS.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="room">Room</label>
                {formData.site && formData.site !== 'off-site' ? (
                  <select
                    id="room"
                    name="room"
                    value={formData.room}
                    onChange={handleChange}
                  >
                    <option value="">Select room (optional)...</option>
                    {rooms
                      .filter(r => {
                        const siteLabel = SITE_OPTIONS.find(s => s.id === formData.site)?.label;
                        return r.location === siteLabel;
                      })
                      .map(r => (
                        <option key={r.id} value={r.name}>{r.name} ({r.floor})</option>
                      ))
                    }
                  </select>
                ) : (
                  <input
                    type="text"
                    id="customLocation"
                    name="customLocation"
                    value={formData.customLocation}
                    onChange={handleChange}
                    placeholder={formData.site === 'off-site' ? 'e.g., Client venue, Festival grounds' : 'Select a site first'}
                    disabled={!formData.site}
                  />
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="projectManager">Project Manager</label>
                <select
                  id="projectManager"
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
                <label htmlFor="technicalLead">Technical Lead</label>
                <select
                  id="technicalLead"
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

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="submit" className="btn btn-primary">
                {isExisting ? 'Register Installation' : 'Create Project'}
              </button>
              <Link to="/dashboard" className="btn btn-outline">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default NewProject;
