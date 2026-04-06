import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProjects, deleteProject } from '../utils/storage';
import { TEAM_MEMBERS } from '../utils/constants';
import { useUser } from '../utils/UserContext';

function Dashboard() {
  const { isAdmin, isBuilder, userProfile } = useUser();
  const [projects, setProjects] = useState([]);
  const [activeView, setActiveView] = useState('overview');

  useEffect(() => {
    getProjects().then(setProjects);
  }, []);

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this project?')) {
      await deleteProject(id);
      setProjects(await getProjects());
    }
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
    teamWorkload[member] = { active: 0, completed: 0 };
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
          }
        }
      });
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
          {isAdmin && (
            <Link to="/project/new" className="btn btn-primary btn-small">
              + New Project
            </Link>
          )}
        </div>
      </header>

      <div className="container">
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
              { id: 'calendar', label: 'Upcoming' },
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

            {/* My Tasks - for builders */}
            {isBuilder && userProfile?.name && (() => {
              const myTasks = projects.flatMap(project =>
                (project.tasks || [])
                  .filter(t => !t.completed && (
                    (t.assignees && t.assignees.includes(userProfile.name)) ||
                    t.assignee === userProfile.name
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
            <div className="card-header" style={{ border: 'none', padding: 0, marginBottom: '1rem' }}>
              <h2>{isAdmin ? 'All Projects' : 'Projects'}</h2>
            </div>

            {projects.length === 0 ? (
              <div className="empty-state">
                <h3>No projects yet</h3>
                <p>{isAdmin ? 'Create your first exhibition project to get started.' : 'No projects have been created yet.'}</p>
                {isAdmin && (
                  <Link to="/project/new" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                    + New Project
                  </Link>
                )}
              </div>
            ) : (
              <div className="projects-grid">
                {projects.map(project => {
                  const progress = getProjectProgress(project);
                  const daysToOpening = project.openingDate ? getDaysUntil(project.openingDate) : null;

                  return (
                    <Link to={`/project/${project.id}`} key={project.id} className="project-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3>{project.title || 'Untitled Project'}</h3>
                        {isAdmin && (
                          <button
                            onClick={(e) => handleDelete(e, project.id)}
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
            )}

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
              Active tasks assigned to each team member across all projects
            </p>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {TEAM_MEMBERS.map(member => {
                const workload = teamWorkload[member];
                const total = workload.active + workload.completed;
                const percentage = total > 0 ? Math.round((workload.completed / total) * 100) : 0;

                return (
                  <div
                    key={member}
                    style={{
                      padding: '1rem',
                      background: 'var(--light)',
                      borderRadius: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {member}
                      </h4>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem' }}>
                        <span style={{ color: 'var(--secondary)', fontWeight: 500 }}>
                          {workload.active} active
                        </span>
                        <span style={{ color: 'var(--success)' }}>
                          {workload.completed} done
                        </span>
                      </div>
                    </div>
                    <div className="progress-bar" style={{ height: '8px' }}>
                      <div className="progress-fill" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Calendar/Upcoming Tab - admin only */}
        {isAdmin && activeView === 'calendar' && (
          <div className="card">
            <div className="card-header">
              <h2>Upcoming Deadlines</h2>
            </div>
            <p style={{ color: 'var(--gray)', marginBottom: '1.5rem' }}>
              Tasks and milestones due in the next 14 days
            </p>

            {upcomingDeadlines.length === 0 ? (
              <div className="empty-state">
                <p>No upcoming deadlines in the next 14 days.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {upcomingDeadlines.map(task => {
                  const days = getDaysUntil(task.dueDate);
                  return (
                    <Link
                      key={task.id}
                      to={`/project/${task.projectId}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem 1rem',
                        background: task.isMilestone ? '#fffbeb' : 'var(--light)',
                        borderRadius: '6px',
                        borderLeft: task.isMilestone ? '4px solid #f59e0b' : '4px solid var(--secondary)',
                        textDecoration: 'none',
                        color: 'inherit'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {task.title}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>
                          {task.projectTitle}
                          {getAssignees(task).length > 0 && ` • ${getAssignees(task).join(', ')}`}
                        </div>
                      </div>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        background: days <= 3 ? '#fef2f2' : days <= 7 ? '#fef3c7' : '#f0fdf4',
                        color: days <= 3 ? 'var(--accent)' : days <= 7 ? '#92400e' : 'var(--success)'
                      }}>
                        {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days} days`}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

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
      </div>
    </div>
  );
}

export default Dashboard;
