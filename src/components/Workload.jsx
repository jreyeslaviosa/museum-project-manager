import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProjects } from '../utils/storage';
import { useUser } from '../utils/UserContext';

function Workload() {
  const { userProfile, teamMemberNames: TEAM_MEMBERS } = useUser();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedMember, setExpandedMember] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch(() => setError('Failed to load projects. Please check your connection and try again.'))
      .finally(() => setLoading(false));
  }, []);

  const getAssignees = (task) => {
    if (task.assignees && task.assignees.length > 0) return task.assignees;
    if (task.assignee) return [task.assignee];
    return [];
  };

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Build workload data
  const teamWorkload = {};
  TEAM_MEMBERS.forEach(member => {
    teamWorkload[member] = { active: 0, completed: 0, overdue: 0, tasks: [] };
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
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
            if (isOverdue) teamWorkload[person].overdue++;
            teamWorkload[person].tasks.push({
              ...task,
              projectTitle: project.title,
              projectId: project.id,
              isOverdue,
            });
          }
        }
      });
    });
  });

  // Sort tasks by due date
  Object.values(teamWorkload).forEach(w => {
    w.tasks.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    });
  });

  // Filter members
  const members = TEAM_MEMBERS.filter(member => {
    const w = teamWorkload[member];
    if (filter === 'busy') return w.active > 0;
    if (filter === 'available') return w.active === 0;
    if (filter === 'overdue') return w.overdue > 0;
    return true;
  });

  // Summary stats
  const totalActive = Object.values(teamWorkload).reduce((sum, w) => sum + w.active, 0);
  const totalOverdue = Object.values(teamWorkload).reduce((sum, w) => sum + w.overdue, 0);
  const availableCount = TEAM_MEMBERS.filter(m => teamWorkload[m].active === 0).length;
  const maxActive = Math.max(...Object.values(teamWorkload).map(w => w.active), 1);

  const toggleMember = (member) => {
    setExpandedMember(prev => prev === member ? null : member);
  };

  // Group tasks by project for expanded view
  const getTasksByProject = (tasks) => {
    const groups = {};
    tasks.forEach(t => {
      if (!groups[t.projectId]) {
        groups[t.projectId] = { title: t.projectTitle, id: t.projectId, tasks: [] };
      }
      groups[t.projectId].tasks.push(t);
    });
    return Object.values(groups);
  };

  return (
    <div className="app">
      <header className="header">
        <Link to="/"><h1>Museum Project Manager</h1></Link>
        <Link to="/dashboard" className="btn btn-outline btn-small" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
          Dashboard
        </Link>
      </header>

      <div className="container">
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray)' }}>Loading team data...</div>
        )}
        {error && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--accent)', marginBottom: '1rem' }}>{error}</p>
            <button className="btn btn-outline" onClick={() => window.location.reload()}>Retry</button>
          </div>
        )}
        {!loading && !error && <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h2 style={{ margin: 0 }}>Team Workload</h2>
            <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--light)', borderRadius: '6px', padding: '0.2rem' }}>
              {[
                { id: 'all', label: `All (${TEAM_MEMBERS.length})` },
                { id: 'busy', label: 'Busy' },
                { id: 'available', label: 'Available' },
                { id: 'overdue', label: 'Overdue' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  style={{
                    padding: '0.35rem 0.75rem', border: 'none', borderRadius: '4px',
                    background: filter === f.id ? 'var(--secondary)' : 'transparent',
                    color: filter === f.id ? 'white' : 'var(--dark)',
                    cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500,
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--dark)' }}>{TEAM_MEMBERS.length}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>Team Members</div>
            </div>
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--secondary)' }}>{totalActive}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>Active Tasks</div>
            </div>
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: totalOverdue > 0 ? 'var(--accent)' : 'var(--success)' }}>{totalOverdue}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>Overdue</div>
            </div>
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>{availableCount}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>Available</div>
            </div>
          </div>

          {/* Team Members */}
          {members.length === 0 ? (
            <div className="empty-state">
              <h3>No team members match this filter</h3>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {members.map(member => {
                const w = teamWorkload[member];
                const total = w.active + w.completed;
                const isExpanded = expandedMember === member;
                const isCurrentUser = userProfile?.name === member;
                const barWidth = maxActive > 0 ? (w.active / maxActive) * 100 : 0;
                const tasksByProject = getTasksByProject(w.tasks);

                return (
                  <div
                    key={member}
                    style={{
                      background: 'white',
                      border: isCurrentUser ? '2px solid var(--secondary)' : '1px solid var(--border)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      onClick={() => toggleMember(member)}
                      style={{
                        padding: '0.85rem 1rem',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      {/* Name row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{
                            color: 'var(--gray)', fontSize: '0.65rem',
                            transition: 'transform 0.2s',
                            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                            display: 'inline-block',
                          }}>&#9654;</span>
                          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{member}</span>
                          {isCurrentUser && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--secondary)', fontWeight: 500 }}>you</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                          {w.overdue > 0 && (
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)' }}>
                              {w.overdue} overdue
                            </span>
                          )}
                          {w.active === 0 ? (
                            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--success)' }}>Available</span>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>
                              {w.active} active &middot; {w.completed} done
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bar */}
                      <div style={{
                        height: '4px',
                        background: 'var(--light)',
                        borderRadius: '2px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${barWidth}%`,
                          borderRadius: '2px',
                          transition: 'width 0.3s ease',
                          background: w.overdue > 0 ? 'var(--accent)' : w.active > 5 ? '#f59e0b' : w.active > 0 ? 'var(--secondary)' : 'var(--border)',
                        }} />
                      </div>
                    </div>

                    {/* Expanded task list */}
                    {isExpanded && (
                      <div style={{ borderTop: '1px solid var(--border)' }}>
                        {w.tasks.length === 0 ? (
                          <div style={{ padding: '1rem', color: 'var(--gray)', fontSize: '0.85rem' }}>
                            No active tasks assigned.
                          </div>
                        ) : (
                          <div style={{ padding: '0.5rem 0' }}>
                            {tasksByProject.map(group => (
                              <div key={group.id} style={{ padding: '0.25rem 1rem 0.5rem' }}>
                                <Link
                                  to={`/project/${group.id}`}
                                  style={{
                                    fontSize: '0.75rem', fontWeight: 600, color: 'var(--secondary)',
                                    textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.02em',
                                  }}
                                >
                                  {group.title}
                                </Link>
                                {group.tasks.map(task => (
                                  <div
                                    key={task.id}
                                    style={{
                                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                      padding: '0.4rem 0',
                                      borderBottom: '1px solid var(--light)',
                                      fontSize: '0.85rem',
                                    }}
                                  >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                      {task.priority === 'high' && (
                                        <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.8rem' }}>!</span>
                                      )}
                                      {task.isMilestone && (
                                        <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.75rem' }}>M</span>
                                      )}
                                      <span style={{ color: task.isOverdue ? 'var(--accent)' : 'var(--dark)' }}>
                                        {task.title}
                                      </span>
                                    </span>
                                    {task.dueDate && (
                                      <span style={{
                                        fontSize: '0.75rem', fontWeight: 500, whiteSpace: 'nowrap', marginLeft: '0.75rem',
                                        color: task.isOverdue ? 'var(--accent)' : 'var(--gray)',
                                      }}>
                                        {task.isOverdue ? 'Overdue ' : ''}{formatDate(task.dueDate)}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>}
      </div>
    </div>
  );
}

export default Workload;
