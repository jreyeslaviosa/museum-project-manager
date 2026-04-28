import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProjects, deleteProject } from '../utils/storage';
import { useUser } from '../utils/UserContext';

function Dashboard() {
  const { isAdmin, isBuilder, userProfile, teamMemberNames: TEAM_MEMBERS } = useUser();
  const [projects, setProjects] = useState([]);
  const [activeView, setActiveView] = useState('overview');
  const [projectFilter, setProjectFilter] = useState('active');
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [expandedMembers, setExpandedMembers] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch(() => setError('Failed to load projects. Please check your connection and try again.'))
      .finally(() => setLoading(false));
  }, []);

  const handleDeleteClick = (e, project) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirm(project);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    await deleteProject(deleteConfirm.id);
    setProjects(await getProjects());
    setDeleteConfirm(null);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'planning': return 'status-planning';
      case 'in-progress': return 'status-in-progress';
      case 'installed': return 'status-installed';
      case 'complete': return 'status-complete';
      case 'maintenance': return 'status-maintenance';
      default: return 'status-planning';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'in-progress': return 'In Progress';
      case 'installed': return 'Installed';
      case 'maintenance': return 'Maintenance';
      default: return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Planning';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getAssignees = (task) => {
    if (task.assignees && task.assignees.length > 0) return task.assignees;
    if (task.assignee) return [task.assignee];
    return [];
  };

  // Calculate stats
  const stats = {
    total: projects.length,
    planning: projects.filter(p => p.status === 'planning').length,
    inProgress: projects.filter(p => p.status === 'in-progress').length,
    installed: projects.filter(p => p.status === 'installed').length,
    complete: projects.filter(p => p.status === 'complete').length,
  };

  // Get all upcoming milestones across projects
  const upcomingMilestones = projects.flatMap(project =>
    (project.tasks || [])
      .filter(t => t.isMilestone && !t.completed)
      .map(t => ({ ...t, projectTitle: project.title, projectId: project.id }))
  ).sort((a, b) => {
    if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  }).slice(0, 10);

  // Get all items to buy across projects
  const itemsToBuy = projects.flatMap(project =>
    (project.bomList || [])
      .filter(item => item.status === 'to-buy')
      .map(item => ({ ...item, projectTitle: project.title, projectId: project.id }))
  );

  // Get team workload
  const teamWorkload = {};
  TEAM_MEMBERS.forEach(member => {
    teamWorkload[member] = { active: 0, completed: 0, tasks: [] };
  });

  projects.forEach(project => {
    (project.tasks || []).forEach(task => {
      const assignees = getAssignees(task);
      assignees.forEach(person => {
        if (teamWorkload[person]) {
          if (task.completed) {
            teamWorkload[person].completed++;
          } else {
            teamWorkload[person].active++;
            teamWorkload[person].tasks.push({
              ...task,
              projectTitle: project.title,
              projectId: project.id
            });
          }
        }
      });
    });
  });

  // Sort each member's tasks by due date
  Object.values(teamWorkload).forEach(w => {
    w.tasks.sort((a, b) => {
      if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    });
  });

  // Get overdue tasks
  const overdueTasks = projects.flatMap(project =>
    (project.tasks || [])
      .filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date())
      .map(t => ({ ...t, projectTitle: project.title, projectId: project.id }))
  );

  // Get upcoming deadlines (next 14 days)
  const twoWeeksFromNow = new Date();
  twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

  const upcomingDeadlines = projects.flatMap(project =>
    (project.tasks || [])
      .filter(t => !t.completed && t.dueDate && new Date(t.dueDate) <= twoWeeksFromNow && new Date(t.dueDate) >= new Date())
      .map(t => ({ ...t, projectTitle: project.title, projectId: project.id }))
  ).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  // Get exhibitions opening soon
  const upcomingOpenings = projects
    .filter(p => p.openingDate && new Date(p.openingDate) >= new Date())
    .sort((a, b) => new Date(a.openingDate) - new Date(b.openingDate))
    .slice(0, 5);

  // Get active installations (installed status)
  const activeInstallations = projects.filter(p => p.status === 'installed');

  const getProjectProgress = (project) => {
    const tasks = project.tasks || [];
    if (tasks.length === 0) return 0;
    return Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100);
  };

  const getDaysUntil = (dateString) => {
    if (!dateString) return null;
    const diff = new Date(dateString) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="app">
      <header className="header">
        <Link to="/"><h1>Museum Project Manager</h1></Link>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {isAdmin && (
            <Link to="/inventory" className="btn btn-outline btn-small" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
              Inventory
            </Link>
          )}
          {isAdmin && <>
            <Link to="/project/new" className="btn btn-primary btn-small">
              + New Project
            </Link>
            <Link to="/project/new?existing=true" className="btn btn-outline btn-small" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
              Register Existing
            </Link>
          </>}
        </div>
      </header>

      <div className="container">
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray)' }}>
            Loading projects...
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--accent)', marginBottom: '1rem' }}>{error}</p>
            <button className="btn btn-outline" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && <>
        {/* View Tabs - admin only */}
        {isAdmin && (
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '2rem',
            borderBottom: '2px solid var(--border)',
            paddingBottom: '0.5rem',
            overflowX: 'auto'
          }}>
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'active', label: 'Active Installations', count: activeInstallations.length },
              { id: 'team', label: 'Team Workload' },
              { id: 'calendar', label: 'Calendar' },
              { id: 'shopping', label: 'Shopping List', count: itemsToBuy.length }
            ].map(view => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                style={{
                  padding: '0.75rem 1.25rem',
                  border: 'none',
                  background: activeView === view.id ? 'var(--secondary)' : 'transparent',
                  color: activeView === view.id ? 'white' : 'var(--dark)',
                  borderRadius: '6px 6px 0 0',
                  cursor: 'pointer',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.95rem',
                  whiteSpace: 'nowrap'
                }}
              >
                {view.label}
                {view.count > 0 && (
                  <span style={{
                    background: activeView === view.id ? 'rgba(255,255,255,0.2)' : 'var(--accent)',
                    color: 'white',
                    padding: '0.1rem 0.5rem',
                    borderRadius: '10px',
                    fontSize: '0.8rem'
                  }}>
                    {view.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Overview Tab */}
        {activeView === 'overview' && (
          <>
            {/* Stats Cards - admin only */}
            {isAdmin && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
              }}>
                <div className="card" style={{ textAlign: 'center', margin: 0 }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.total}</div>
                  <div style={{ color: 'var(--gray)' }}>Total Projects</div>
                </div>
                <div className="card" style={{ textAlign: 'center', margin: 0, borderTop: '4px solid #f59e0b' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f59e0b' }}>{stats.planning}</div>
                  <div style={{ color: 'var(--gray)' }}>Planning</div>
                </div>
                <div className="card" style={{ textAlign: 'center', margin: 0, borderTop: '4px solid #3b82f6' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#3b82f6' }}>{stats.inProgress}</div>
                  <div style={{ color: 'var(--gray)' }}>In Progress</div>
                </div>
                <div className="card" style={{ textAlign: 'center', margin: 0, borderTop: '4px solid #8b5cf6' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#8b5cf6' }}>{stats.installed}</div>
                  <div style={{ color: 'var(--gray)' }}>Installed</div>
                </div>
                <div className="card" style={{ textAlign: 'center', margin: 0, borderTop: '4px solid #10b981' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981' }}>{stats.complete}</div>
                  <div style={{ color: 'var(--gray)' }}>Complete</div>
                </div>
              </div>
            )}

            {/* Alerts Section - admin only */}
            {isAdmin && (overdueTasks.length > 0 || upcomingOpenings.length > 0) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {overdueTasks.length > 0 && (
                  <div className="card" style={{ margin: 0, borderLeft: '4px solid var(--accent)' }}>
                    <h3 style={{ color: 'var(--accent)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      Overdue Tasks ({overdueTasks.length})
                    </h3>
                    {overdueTasks.slice(0, 5).map(task => (
                      <Link
                        key={task.id}
                        to={`/project/${task.projectId}`}
                        style={{
                          display: 'block',
                          padding: '0.5rem',
                          marginBottom: '0.5rem',
                          background: '#fef2f2',
                          borderRadius: '4px',
                          textDecoration: 'none',
                          color: 'inherit'
                        }}
                      >
                        <div style={{ fontWeight: 500 }}>{task.title}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>
                          {task.projectTitle} • Due {formatDate(task.dueDate)}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {upcomingOpenings.length > 0 && (
                  <div className="card" style={{ margin: 0, borderLeft: '4px solid #8b5cf6' }}>
                    <h3 style={{ color: '#8b5cf6', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      Upcoming Openings
                    </h3>
                    {upcomingOpenings.map(project => {
                      const days = getDaysUntil(project.openingDate);
                      return (
                        <Link
                          key={project.id}
                          to={`/project/${project.id}`}
                          style={{
                            display: 'block',
                            padding: '0.5rem',
                            marginBottom: '0.5rem',
                            background: '#f5f3ff',
                            borderRadius: '4px',
                            textDecoration: 'none',
                            color: 'inherit'
                          }}
                        >
                          <div style={{ fontWeight: 500 }}>{project.title}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>
                            Opens {formatDate(project.openingDate)} ({days} days)
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* My Tasks - for everyone */}
            {userProfile?.name && (() => {
              const myTasks = projects.flatMap(project =>
                (project.tasks || [])
                  .filter(t => !t.completed && (
                    (t.assignees && t.assignees.some(a => a.toLowerCase() === userProfile.name.toLowerCase())) ||
                    t.assignee?.toLowerCase() === userProfile.name.toLowerCase()
                  ))
                  .map(t => ({ ...t, projectTitle: project.title, projectId: project.id }))
              ).sort((a, b) => {
                if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
                if (a.dueDate) return -1;
                if (b.dueDate) return 1;
                return 0;
              });

              return (
                <div className="card" style={{ marginBottom: '2rem' }}>
                  <div className="card-header">
                    <h2>My Tasks ({myTasks.length})</h2>
                  </div>
                  {myTasks.length === 0 ? (
                    <p style={{ color: 'var(--gray)' }}>No tasks assigned to you right now.</p>
                  ) : (
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                      {myTasks.map(task => {
                        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
                        return (
                          <Link
                            key={task.id}
                            to={`/project/${task.projectId}`}
                            style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              padding: '0.75rem 1rem', borderRadius: '6px', textDecoration: 'none', color: 'inherit',
                              background: isOverdue ? '#fef2f2' : 'var(--light)',
                              borderLeft: task.priority === 'high' ? '4px solid #ef4444' : task.isMilestone ? '4px solid #f59e0b' : '4px solid var(--secondary)'
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 500 }}>
                                {task.isMilestone && <span style={{ color: '#f59e0b', marginRight: '0.3rem' }}>M</span>}
                                {task.title}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>
                                {task.projectTitle}
                                {task.priority === 'high' && <span style={{ color: '#ef4444', marginLeft: '0.5rem' }}>HIGH</span>}
                              </div>
                            </div>
                            {task.dueDate && (
                              <span style={{
                                fontSize: '0.8rem', fontWeight: 500, whiteSpace: 'nowrap',
                                color: isOverdue ? 'var(--accent)' : 'var(--gray)'
                              }}>
                                {isOverdue ? 'Overdue: ' : ''}{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Projects Grid */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2>{isAdmin ? 'All Projects' : 'Projects'}</h2>
              <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--light)', borderRadius: '6px', padding: '0.2rem' }}>
                {[
                  { id: 'active', label: 'Active' },
                  { id: 'complete', label: 'Completed' },
                  { id: 'all', label: 'All' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setProjectFilter(f.id)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      border: 'none',
                      borderRadius: '4px',
                      background: projectFilter === f.id ? 'var(--secondary)' : 'transparent',
                      color: projectFilter === f.id ? 'white' : 'var(--dark)',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 500
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {(() => {
              const filteredProjects = projectFilter === 'active'
                ? projects.filter(p => p.status !== 'complete')
                : projectFilter === 'complete'
                  ? projects.filter(p => p.status === 'complete')
                  : projects;

              return filteredProjects.length === 0 ? (
                <div className="empty-state">
                  <h3>{projectFilter === 'complete' ? 'No completed projects' : projectFilter === 'active' ? 'No active projects' : 'No projects yet'}</h3>
                  <p>{isAdmin && projectFilter !== 'complete' ? 'Create your first exhibition project to get started.' : projectFilter === 'complete' ? 'Completed projects will appear here.' : 'No projects have been created yet.'}</p>
                  {isAdmin && projectFilter !== 'complete' && (
                    <Link to="/project/new" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                      + New Project
                    </Link>
                  )}
                </div>
              ) : (
                <div className="projects-grid">
                  {filteredProjects.map(project => {
                  const progress = getProjectProgress(project);
                  const daysToOpening = project.openingDate ? getDaysUntil(project.openingDate) : null;

                  return (
                    <Link to={`/project/${project.id}`} key={project.id} className="project-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3>{project.title || 'Untitled Project'}</h3>
                        {isAdmin && (
                          <button
                            onClick={(e) => handleDeleteClick(e, project)}
                            className="icon-btn"
                            title="Delete project"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <p className="artist">{project.artistName || 'No artist specified'}</p>

                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        <span className={`status ${getStatusClass(project.status)}`}>
                          {getStatusLabel(project.status)}
                        </span>
                        {daysToOpening !== null && daysToOpening >= 0 && (
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            background: daysToOpening <= 7 ? '#fef2f2' : '#f5f3ff',
                            color: daysToOpening <= 7 ? 'var(--accent)' : '#8b5cf6'
                          }}>
                            Opens in {daysToOpening} days
                          </span>
                        )}
                      </div>

                      {/* Progress Circle */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                        <div style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '50%',
                          background: `conic-gradient(var(--success) ${progress * 3.6}deg, var(--light) 0deg)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                          }}>
                            {progress}%
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>
                            {(project.tasks || []).filter(t => t.completed).length} of {(project.tasks || []).length} tasks
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>
                            PM: {project.projectManager || 'TBD'}
                          </div>
                          {project.createdBy && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>
                              Created by: {project.createdBy}
                            </div>
                          )}
                        </div>
                      </div>

                      {(project.tasks || []).filter(t => t.isMilestone && !t.completed).length > 0 && (
                        <div style={{ fontSize: '0.8rem', color: '#f59e0b', marginTop: '0.5rem' }}>
                          {(project.tasks || []).filter(t => t.isMilestone && !t.completed).length} milestone(s) pending
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
              );
            })()}

            {/* Upcoming Milestones - admin only */}
            {isAdmin && upcomingMilestones.length > 0 && (
              <div className="card" style={{ marginTop: '2rem' }}>
                <div className="card-header">
                  <h3>Upcoming Milestones</h3>
                </div>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {upcomingMilestones.map(milestone => (
                    <Link
                      key={milestone.id}
                      to={`/project/${milestone.projectId}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem',
                        background: '#fffbeb',
                        borderRadius: '6px',
                        borderLeft: '4px solid #f59e0b',
                        textDecoration: 'none',
                        color: 'inherit'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 500 }}>{milestone.title}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>
                          {milestone.projectTitle}
                        </div>
                      </div>
                      {milestone.dueDate && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>
                          {formatDate(milestone.dueDate)}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Active Installations Tab - admin only */}
        {isAdmin && activeView === 'active' && (
          <div className="card">
            <div className="card-header">
              <h2>Active Installations</h2>
            </div>
            <p style={{ color: 'var(--gray)', marginBottom: '1.5rem' }}>
              Currently installed exhibitions that may need maintenance or monitoring
            </p>

            {activeInstallations.length === 0 ? (
              <div className="empty-state">
                <p>No active installations. Mark a project as "Installed" to see it here.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {activeInstallations.map(project => {
                  const maintenanceTasks = (project.maintenanceLog || []);
                  const openIssues = maintenanceTasks.filter(m => !m.resolved).length;

                  return (
                    <Link
                      key={project.id}
                      to={`/project/${project.id}`}
                      style={{
                        display: 'block',
                        padding: '1.5rem',
                        background: 'var(--light)',
                        borderRadius: '8px',
                        borderLeft: openIssues > 0 ? '4px solid var(--accent)' : '4px solid var(--success)',
                        textDecoration: 'none',
                        color: 'inherit'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div>
                          <h3 style={{ marginBottom: '0.25rem' }}>{project.title}</h3>
                          <p style={{ color: 'var(--gray)', fontSize: '0.9rem' }}>{project.artistName}</p>
                        </div>
                        {openIssues > 0 && (
                          <span style={{
                            background: 'var(--accent)',
                            color: 'white',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: 500
                          }}>
                            {openIssues} open issue(s)
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '2rem', fontSize: '0.85rem', color: 'var(--gray)' }}>
                        {project.openingDate && (
                          <span>Opened: {formatDate(project.openingDate)}</span>
                        )}
                        {project.closingDate && (
                          <span>Closes: {formatDate(project.closingDate)}</span>
                        )}
                        {project.technicalLead && (
                          <span>Tech Lead: {project.technicalLead}</span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Team Workload Tab - admin only */}
        {isAdmin && activeView === 'team' && (
          <div className="card">
            <div className="card-header">
              <h2>Team Workload</h2>
            </div>
            <p style={{ color: 'var(--gray)', marginBottom: '1.5rem' }}>
              Click on a team member to see their active tasks across all projects.
            </p>

            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {TEAM_MEMBERS.map(member => {
                const workload = teamWorkload[member];
                const total = workload.active + workload.completed;
                const percentage = total > 0 ? Math.round((workload.completed / total) * 100) : 0;
                const isExpanded = expandedMembers[member];

                // Group tasks by project
                const tasksByProject = {};
                workload.tasks.forEach(t => {
                  if (!tasksByProject[t.projectId]) {
                    tasksByProject[t.projectId] = { title: t.projectTitle, id: t.projectId, tasks: [] };
                  }
                  tasksByProject[t.projectId].tasks.push(t);
                });

                return (
                  <div
                    key={member}
                    style={{
                      background: 'var(--light)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      borderLeft: workload.active > 5 ? '4px solid var(--accent)' : workload.active > 0 ? '4px solid var(--secondary)' : '4px solid var(--border)'
                    }}
                  >
                    <div
                      onClick={() => setExpandedMembers(prev => ({ ...prev, [member]: !prev[member] }))}
                      style={{
                        padding: '1rem',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                          <span style={{ color: 'var(--gray)', fontSize: '0.7rem', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>&#9654;</span>
                          {member}
                          {workload.active === 0 && (
                            <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--success)' }}>Available</span>
                          )}
                          {workload.active > 5 && (
                            <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--accent)' }}>Heavy load</span>
                          )}
                        </h4>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--secondary)', fontWeight: 500 }}>
                            {workload.active} active
                          </span>
                          <span style={{ color: 'var(--success)' }}>
                            {workload.completed} done
                          </span>
                          <span style={{ color: 'var(--gray)' }}>
                            {Object.keys(tasksByProject).length} project{Object.keys(tasksByProject).length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <div className="progress-bar" style={{ height: '6px' }}>
                        <div className="progress-fill" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>

                    {isExpanded && workload.tasks.length > 0 && (
                      <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid var(--border)' }}>
                        {Object.values(tasksByProject).map(group => (
                          <div key={group.id} style={{ marginTop: '0.75rem' }}>
                            <Link
                              to={`/project/${group.id}`}
                              style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--secondary)', textDecoration: 'none' }}
                            >
                              {group.title}
                            </Link>
                            {group.tasks.map(task => {
                              const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
                              return (
                                <div key={task.id} style={{
                                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                  padding: '0.35rem 0', borderBottom: '1px solid var(--border)',
                                  fontSize: '0.85rem'
                                }}>
                                  <span>
                                    {task.isMilestone && <span style={{ color: '#f59e0b', marginRight: '0.3rem', fontWeight: 600 }}>M</span>}
                                    {task.priority === 'high' && <span style={{ color: '#ef4444', marginRight: '0.3rem', fontWeight: 600 }}>!</span>}
                                    {task.title}
                                  </span>
                                  {task.dueDate && (
                                    <span style={{
                                      fontSize: '0.75rem', fontWeight: 500, whiteSpace: 'nowrap', marginLeft: '0.5rem',
                                      color: isOverdue ? 'var(--accent)' : 'var(--gray)'
                                    }}>
                                      {isOverdue ? 'Overdue: ' : ''}{formatDate(task.dueDate)}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    )}

                    {isExpanded && workload.tasks.length === 0 && (
                      <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid var(--border)' }}>
                        <p style={{ color: 'var(--gray)', fontSize: '0.85rem', marginTop: '0.75rem' }}>No active tasks assigned.</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Calendar/Upcoming Tab - admin only */}
        {isAdmin && activeView === 'calendar' && (() => {
          const today = new Date();
          const [calMonth, setCalMonth] = [calendarMonth, setCalendarMonth];
          const year = calMonth.getFullYear();
          const month = calMonth.getMonth();
          const firstDay = new Date(year, month, 1).getDay();
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const monthLabel = calMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

          // Collect all events for this month
          const calEvents = [];
          projects.forEach(p => {
            const dates = [
              { date: p.installDate, label: 'Install', project: p, color: '#3b82f6' },
              { date: p.openingDate, label: 'Opening', project: p, color: '#8b5cf6' },
              { date: p.closingDate, label: 'Closing', project: p, color: '#ef4444' },
              { date: p.deinstallDate, label: 'De-install', project: p, color: '#6b7280' },
            ];
            dates.forEach(d => {
              if (d.date) {
                const dt = new Date(d.date);
                if (dt.getMonth() === month && dt.getFullYear() === year) {
                  calEvents.push({ ...d, day: dt.getDate() });
                }
              }
            });
            (p.tasks || []).filter(t => !t.completed && t.dueDate).forEach(t => {
              const dt = new Date(t.dueDate);
              if (dt.getMonth() === month && dt.getFullYear() === year) {
                calEvents.push({ date: t.dueDate, label: t.title, project: p, color: t.isMilestone ? '#f59e0b' : '#10b981', day: dt.getDate(), isTask: true });
              }
            });
          });

          const cells = [];
          for (let i = 0; i < firstDay; i++) cells.push(null);
          for (let d = 1; d <= daysInMonth; d++) cells.push(d);

          return (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <button className="btn btn-outline btn-small" onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}>Prev</button>
                <h2 style={{ margin: 0 }}>{monthLabel}</h2>
                <button className="btn btn-outline btn-small" onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}>Next</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} style={{ padding: '0.5rem', background: 'var(--light)', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray)' }}>{d}</div>
                ))}
                {cells.map((day, idx) => {
                  const dayEvents = day ? calEvents.filter(e => e.day === day) : [];
                  const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                  return (
                    <div key={idx} style={{
                      padding: '0.4rem',
                      background: 'white',
                      minHeight: '80px',
                      fontSize: '0.8rem'
                    }}>
                      {day && (
                        <>
                          <div style={{
                            fontWeight: isToday ? 700 : 400,
                            color: isToday ? 'white' : 'var(--dark)',
                            background: isToday ? 'var(--secondary)' : 'transparent',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '0.2rem',
                            fontSize: '0.75rem'
                          }}>
                            {day}
                          </div>
                          {dayEvents.slice(0, 3).map((ev, i) => (
                            <Link
                              key={i}
                              to={`/project/${ev.project.id}`}
                              style={{
                                display: 'block',
                                padding: '0.1rem 0.25rem',
                                marginBottom: '1px',
                                borderRadius: '2px',
                                fontSize: '0.65rem',
                                lineHeight: 1.3,
                                background: ev.color + '18',
                                color: ev.color,
                                fontWeight: 500,
                                textDecoration: 'none',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                textOverflow: 'ellipsis'
                              }}
                              title={`${ev.label} - ${ev.project.title}`}
                            >
                              {ev.isTask ? ev.label : `${ev.label}: ${ev.project.title}`}
                            </Link>
                          ))}
                          {dayEvents.length > 3 && (
                            <div style={{ fontSize: '0.6rem', color: 'var(--gray)' }}>+{dayEvents.length - 3} more</div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
                {[
                  { label: 'Install', color: '#3b82f6' },
                  { label: 'Opening', color: '#8b5cf6' },
                  { label: 'Closing', color: '#ef4444' },
                  { label: 'De-install', color: '#6b7280' },
                  { label: 'Milestone', color: '#f59e0b' },
                  { label: 'Task Due', color: '#10b981' },
                ].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: l.color }} />
                    <span style={{ color: 'var(--gray)' }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Shopping List Tab - admin only */}
        {isAdmin && activeView === 'shopping' && (
          <div className="card">
            <div className="card-header">
              <h2>Shopping List</h2>
            </div>
            <p style={{ color: 'var(--gray)', marginBottom: '1.5rem' }}>
              All BOM items marked "To Buy" across all projects
            </p>

            {itemsToBuy.length === 0 ? (
              <div className="empty-state">
                <p>No items to buy. All BOM items are in stock or ordered.</p>
              </div>
            ) : (
              <>
                <div style={{
                  padding: '1rem',
                  background: '#fef3c7',
                  borderRadius: '8px',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontWeight: 500 }}>
                    {itemsToBuy.length} items to purchase
                  </span>
                  <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                    Est. Total: ${itemsToBuy.reduce((sum, item) => sum + (item.cost ? item.cost * item.quantity : 0), 0).toFixed(2)}
                  </span>
                </div>

                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Project</th>
                        <th>Requested By</th>
                        <th>Qty</th>
                        <th>Supplier</th>
                        <th>Est. Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemsToBuy.map(item => (
                        <tr key={item.id}>
                          <td>
                            <Link to={`/project/${item.projectId}`} style={{ textDecoration: 'none', color: 'var(--secondary)' }}>
                              {item.name}
                            </Link>
                            {item.notes && (
                              <div style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>{item.notes}</div>
                            )}
                          </td>
                          <td style={{ fontSize: '0.9rem' }}>{item.projectTitle}</td>
                          <td>{item.requestedBy || '—'}</td>
                          <td>{item.quantity} {item.unit}</td>
                          <td>{item.supplier || '—'}</td>
                          <td>{item.cost ? `$${(item.cost * item.quantity).toFixed(2)}` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
        </>}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Delete Project</h2>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>×</button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p style={{ marginBottom: '0.5rem' }}>
                Are you sure you want to delete <strong>{deleteConfirm.title}</strong>?
              </p>
              <p style={{ color: 'var(--accent)', fontSize: '0.9rem' }}>
                This action cannot be undone. All project data, tasks, and files will be permanently removed.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-outline" onClick={() => setDeleteConfirm(null)}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={handleDeleteConfirm}>
                  Delete Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
