import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { createProject, createEmptyProject } from '../utils/storage';
import { TEAM_MEMBERS, PROJECT_TEMPLATES } from '../utils/constants';
import { useUser } from '../utils/UserContext';

function NewProject() {
  const navigate = useNavigate();
  const { userProfile } = useUser();
  const [selectedTemplate, setSelectedTemplate] = useState('blank');
  const [formData, setFormData] = useState({
    title: '',
    artistName: '',
    projectManager: '',
    technicalLead: '',
    status: 'planning'
  });

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

    const newProject = {
      ...createEmptyProject(),
      ...formData,
      id: uuidv4(),
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
            <h2>Create New Project</h2>
          </div>

          {/* Template Selector */}
          <div style={{ marginBottom: '1.5rem' }}>
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
          </div>

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

            <div className="form-group">
              <label htmlFor="status">Initial Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="planning">Planning</option>
                <option value="in-progress">In Progress</option>
                <option value="complete">Complete</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="submit" className="btn btn-primary">
                Create Project
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
