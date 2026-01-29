import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { createProject, createEmptyProject } from '../utils/storage';
import { TEAM_MEMBERS } from '../utils/constants';

function NewProject() {
  const navigate = useNavigate();
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

  const handleSubmit = (e) => {
    e.preventDefault();

    const newProject = {
      ...createEmptyProject(),
      ...formData,
      id: uuidv4()
    };

    createProject(newProject);
    navigate(`/project/${newProject.id}`);
  };

  return (
    <div className="app">
      <header className="header">
        <Link to="/"><h1>Museum Project Manager</h1></Link>
      </header>

      <div className="container">
        <Link to="/" className="back-link">← Back to Projects</Link>

        <div className="card" style={{ maxWidth: '600px' }}>
          <div className="card-header">
            <h2>Create New Project</h2>
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
              <Link to="/" className="btn btn-outline">
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
