import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { TEAM_MEMBERS } from '../../utils/constants';

function TasksTab({ project, onUpdate }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filter, setFilter] = useState('all');
  const [filterByPerson, setFilterByPerson] = useState('');
  const [activeView, setActiveView] = useState('tasks'); // 'tasks', 'milestones', 'history'
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignees: [],
    priority: 'medium',
    dueDate: '',
    isMilestone: false
  });

  const tasks = project.tasks || [];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const toggleAssignee = (member) => {
    setFormData(prev => ({
      ...prev,
      assignees: prev.assignees.includes(member)
        ? prev.assignees.filter(a => a !== member)
        : [...prev.assignees, member]
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      assignees: [],
      priority: 'medium',
      dueDate: '',
      isMilestone: false
    });
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const newTask = {
      id: uuidv4(),
      ...formData,
      completed: false,
      createdAt: new Date().toISOString()
    };

    onUpdate({ tasks: [...tasks, newTask] });
    resetForm();
    setShowAddModal(false);
  };

  const handleEdit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const updated = tasks.map(task =>
      task.id === editingTask.id
        ? { ...task, ...formData }
        : task
    );

    onUpdate({ tasks: updated });
    resetForm();
    setEditingTask(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this task?')) {
      onUpdate({ tasks: tasks.filter(task => task.id !== id) });
    }
  };

  const toggleComplete = (id) => {
    const updated = tasks.map(task => {
      if (task.id === id) {
        const nowCompleted = !task.completed;
        return {
          ...task,
          completed: nowCompleted,
          completedAt: nowCompleted ? new Date().toISOString() : null
        };
      }
      return task;
    });
    onUpdate({ tasks: updated });
  };

  const startEdit = (task) => {
    let assignees = task.assignees || [];
    if (!assignees.length && task.assignee) {
      assignees = [task.assignee];
    }

    setFormData({
      title: task.title,
      description: task.description || '',
      assignees: assignees,
      priority: task.priority || 'medium',
      dueDate: task.dueDate || '',
      isMilestone: task.isMilestone || false
    });
    setEditingTask(task);
  };

  const getAssignees = (task) => {
    if (task.assignees && task.assignees.length > 0) {
      return task.assignees;
    }
    if (task.assignee) {
      return [task.assignee];
    }
    return [];
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'active' && task.completed) return false;
    if (filter === 'completed' && !task.completed) return false;
    if (filter === 'milestones' && !task.isMilestone) return false;

    if (filterByPerson) {
      const assignees = getAssignees(task);
      if (!assignees.includes(filterByPerson)) return false;
    }

    return true;
  });

  const milestones = tasks.filter(t => t.isMilestone);
  const completedTasks = tasks.filter(t => t.completed && t.completedAt)
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
  const completedCount = tasks.filter(t => t.completed).length;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return 'var(--gray)';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOverdue = (dateString) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date() && new Date(dateString).toDateString() !== new Date().toDateString();
  };

  const renderModal = (isEdit) => (
    <div className="modal-overlay" onClick={() => { resetForm(); setShowAddModal(false); setEditingTask(null); }}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Task' : 'Add Task'}</h3>
          <button
            className="icon-btn"
            onClick={() => { resetForm(); setShowAddModal(false); setEditingTask(null); }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={isEdit ? handleEdit : handleAdd}>
          <div className="form-group">
            <label>Task Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="What needs to be done?"
              required
            />
          </div>

          {/* Milestone Toggle */}
          <div className="form-group">
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer',
              padding: '0.75rem',
              background: formData.isMilestone ? '#fef3c7' : 'var(--light)',
              borderRadius: '6px',
              border: formData.isMilestone ? '2px solid #f59e0b' : '2px solid transparent'
            }}>
              <input
                type="checkbox"
                name="isMilestone"
                checked={formData.isMilestone}
                onChange={handleChange}
                style={{ width: '18px', height: '18px' }}
              />
              <span>
                <strong style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Mark as Milestone
                </strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>
                  Milestones are key project checkpoints visible to the whole team
                </span>
              </span>
            </label>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Additional details..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Assign To (select one or more)</label>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              padding: '0.75rem',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              background: 'var(--light)'
            }}>
              {TEAM_MEMBERS.map(member => (
                <button
                  key={member}
                  type="button"
                  onClick={() => toggleAssignee(member)}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: '20px',
                    border: formData.assignees.includes(member)
                      ? '2px solid var(--secondary)'
                      : '2px solid var(--border)',
                    background: formData.assignees.includes(member)
                      ? 'var(--secondary)'
                      : 'var(--white)',
                    color: formData.assignees.includes(member)
                      ? 'var(--white)'
                      : 'var(--dark)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    transition: 'all 0.2s'
                  }}
                >
                  {formData.assignees.includes(member) && '✓ '}{member}
                </button>
              ))}
            </div>
            {formData.assignees.length > 0 && (
              <div style={{ fontSize: '0.85rem', color: 'var(--gray)', marginTop: '0.5rem' }}>
                Selected: {formData.assignees.join(', ')}
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Priority</label>
              <select name="priority" value={formData.priority} onChange={handleChange}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => { resetForm(); setShowAddModal(false); setEditingTask(null); }}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isEdit ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderTaskItem = (task) => {
    const assignees = getAssignees(task);
    return (
      <div
        key={task.id}
        className={`task-item ${task.completed ? 'completed' : ''}`}
        style={{
          borderLeft: task.isMilestone ? '4px solid #f59e0b' : undefined,
          background: task.isMilestone && !task.completed ? '#fffbeb' : undefined
        }}
      >
        <input
          type="checkbox"
          className="task-checkbox"
          checked={task.completed}
          onChange={() => toggleComplete(task.id)}
        />
        <div className="task-content">
          <h4 style={{
            textDecoration: task.completed ? 'line-through' : 'none',
            color: task.completed ? 'var(--gray)' : 'var(--dark)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {task.isMilestone && <span title="Milestone" style={{ color: '#f59e0b', fontWeight: 600 }}>M</span>}
            {task.title}
          </h4>
          {task.description && (
            <p style={{ fontSize: '0.85rem', color: 'var(--gray)', marginTop: '0.25rem' }}>
              {task.description}
            </p>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {assignees.length > 0 && (
              <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                {assignees.map(person => (
                  <span
                    key={person}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.2rem 0.5rem',
                      background: 'var(--light)',
                      borderRadius: '12px',
                      fontSize: '0.8rem'
                    }}
                  >
                    {person}
                  </span>
                ))}
              </div>
            )}
            {task.priority && (
              <span style={{
                fontSize: '0.8rem',
                color: getPriorityColor(task.priority),
                fontWeight: 500
              }}>
                {task.priority.toUpperCase()}
              </span>
            )}
            {task.dueDate && (
              <span style={{
                fontSize: '0.8rem',
                color: isOverdue(task.dueDate) && !task.completed ? 'var(--accent)' : 'var(--gray)'
              }}>
                {formatDate(task.dueDate)}
                {isOverdue(task.dueDate) && !task.completed && ' (overdue)'}
              </span>
            )}
            {task.completed && task.completedAt && (
              <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>
                ✓ Completed {formatDate(task.completedAt)}
              </span>
            )}
          </div>
        </div>
        <div className="task-actions">
          <button className="icon-btn" onClick={() => startEdit(task)} title="Edit">
            Edit
          </button>
          <button className="icon-btn" onClick={() => handleDelete(task.id)} title="Delete">
            Delete
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* View Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        borderBottom: '2px solid var(--border)',
        paddingBottom: '0.5rem'
      }}>
        {[
          { id: 'tasks', label: 'All Tasks' },
          { id: 'milestones', label: 'Milestones', count: milestones.length },
          { id: 'history', label: 'Activity History', count: completedTasks.length }
        ].map(view => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id)}
            style={{
              padding: '0.75rem 1rem',
              border: 'none',
              background: activeView === view.id ? 'var(--secondary)' : 'transparent',
              color: activeView === view.id ? 'white' : 'var(--dark)',
              borderRadius: '6px 6px 0 0',
              cursor: 'pointer',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {view.label}
            {view.count !== undefined && (
              <span style={{
                background: activeView === view.id ? 'rgba(255,255,255,0.2)' : 'var(--light)',
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

      {/* Tasks View */}
      {activeView === 'tasks' && (
        <>
          <div className="card">
            <div className="card-header">
              <h2>Tasks - Who Is Doing What</h2>
              <button className="btn btn-primary btn-small" onClick={() => setShowAddModal(true)}>
                + Add Task
              </button>
            </div>

            {/* Progress */}
            {tasks.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--gray)' }}>
                    {completedCount} of {tasks.length} tasks completed
                  </span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                    {Math.round((completedCount / tasks.length) * 100)}%
                  </span>
                </div>
                <div className="progress-bar" style={{ height: '10px' }}>
                  <div
                    className="progress-fill"
                    style={{ width: `${(completedCount / tasks.length) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Filters */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['all', 'active', 'completed', 'milestones'].map(f => (
                  <button
                    key={f}
                    className={`btn btn-small ${filter === f ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setFilter(f)}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Filter by person:</span>
                <select
                  value={filterByPerson}
                  onChange={(e) => setFilterByPerson(e.target.value)}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: '4px',
                    border: '1px solid var(--border)',
                    fontSize: '0.85rem'
                  }}
                >
                  <option value="">Everyone</option>
                  {TEAM_MEMBERS.map(member => (
                    <option key={member} value={member}>{member}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Task List */}
            {filteredTasks.length === 0 ? (
              <div className="empty-state">
                <p>
                  {filter === 'all' && !filterByPerson
                    ? 'No tasks yet. Click "Add Task" to create one.'
                    : 'No matching tasks found.'}
                </p>
              </div>
            ) : (
              <div>
                {filteredTasks.map(task => renderTaskItem(task))}
              </div>
            )}
          </div>

          {/* Progress by Person */}
          {tasks.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3>Progress by Person</h3>
              </div>
              {(() => {
                const byAssignee = {};
                TEAM_MEMBERS.forEach(member => {
                  byAssignee[member] = [];
                });
                byAssignee['Unassigned'] = [];

                tasks.forEach(task => {
                  const assignees = getAssignees(task);
                  if (assignees.length === 0) {
                    byAssignee['Unassigned'].push(task);
                  } else {
                    assignees.forEach(person => {
                      if (byAssignee[person]) {
                        byAssignee[person].push(task);
                      }
                    });
                  }
                });

                const activeAssignees = Object.entries(byAssignee)
                  .filter(([_, tasks]) => tasks.length > 0);

                return activeAssignees.map(([assignee, assigneeTasks]) => {
                  const completed = assigneeTasks.filter(t => t.completed).length;
                  const total = assigneeTasks.length;
                  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

                  return (
                    <div key={assignee} style={{ marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <h4 style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {assignee}
                        </h4>
                        <span style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>
                          {completed}/{total} done ({percentage}%)
                        </span>
                      </div>
                      <div className="progress-bar" style={{ height: '6px', marginBottom: '0.75rem' }}>
                        <div className="progress-fill" style={{ width: `${percentage}%` }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {assigneeTasks.map(task => (
                          <div
                            key={task.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              fontSize: '0.9rem',
                              padding: '0.25rem 0',
                              color: task.completed ? 'var(--gray)' : 'inherit'
                            }}
                          >
                            <span style={{ color: task.completed ? 'var(--success)' : 'var(--border)' }}>
                              {task.completed ? '✓' : '○'}
                            </span>
                            <span style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>
                              {task.title}
                            </span>
                            {task.completed && task.completedAt && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--gray)', marginLeft: 'auto' }}>
                                {formatDate(task.completedAt)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </>
      )}

      {/* Milestones View */}
      {activeView === 'milestones' && (
        <div className="card">
          <div className="card-header">
            <h2>Project Milestones</h2>
            <button className="btn btn-primary btn-small" onClick={() => {
              setFormData(prev => ({ ...prev, isMilestone: true }));
              setShowAddModal(true);
            }}>
              + Add Milestone
            </button>
          </div>

          <p style={{ color: 'var(--gray)', marginBottom: '1.5rem' }}>
            Key checkpoints and achievements for this project
          </p>

          {milestones.length === 0 ? (
            <div className="empty-state">
              <p>No milestones yet. Add important project checkpoints to track major progress.</p>
            </div>
          ) : (
            <div style={{ position: 'relative', paddingLeft: '2rem' }}>
              {/* Timeline line */}
              <div style={{
                position: 'absolute',
                left: '0.5rem',
                top: 0,
                bottom: 0,
                width: '2px',
                background: 'var(--border)'
              }} />

              {milestones
                .sort((a, b) => {
                  if (a.completed && !b.completed) return -1;
                  if (!a.completed && b.completed) return 1;
                  if (a.completed && b.completed) {
                    return new Date(b.completedAt) - new Date(a.completedAt);
                  }
                  if (a.dueDate && b.dueDate) {
                    return new Date(a.dueDate) - new Date(b.dueDate);
                  }
                  return 0;
                })
                .map(milestone => {
                  const assignees = getAssignees(milestone);
                  return (
                    <div
                      key={milestone.id}
                      style={{
                        position: 'relative',
                        marginBottom: '1.5rem',
                        paddingLeft: '1.5rem'
                      }}
                    >
                      {/* Timeline dot */}
                      <div style={{
                        position: 'absolute',
                        left: '-1.75rem',
                        top: '0.25rem',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: milestone.completed ? 'var(--success)' : '#f59e0b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '0.7rem'
                      }}>
                        {milestone.completed ? '✓' : '●'}
                      </div>

                      <div style={{
                        background: milestone.completed ? '#f0fdf4' : '#fffbeb',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: `2px solid ${milestone.completed ? 'var(--success)' : '#f59e0b'}`
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <h4 style={{
                            fontSize: '1rem',
                            textDecoration: milestone.completed ? 'line-through' : 'none',
                            color: milestone.completed ? 'var(--gray)' : 'var(--dark)'
                          }}>
                            {milestone.title}
                          </h4>
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <button className="icon-btn" onClick={() => toggleComplete(milestone.id)}>
                              {milestone.completed ? 'Undo' : 'Done'}
                            </button>
                            <button className="icon-btn" onClick={() => startEdit(milestone)}>
                              Edit
                            </button>
                            <button className="icon-btn" onClick={() => handleDelete(milestone.id)}>
                              Delete
                            </button>
                          </div>
                        </div>

                        {milestone.description && (
                          <p style={{ fontSize: '0.9rem', color: 'var(--gray)', marginTop: '0.5rem' }}>
                            {milestone.description}
                          </p>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                          {milestone.completed && milestone.completedAt && (
                            <span style={{ color: 'var(--success)', fontWeight: 500 }}>
                              ✓ Completed {formatDateTime(milestone.completedAt)}
                            </span>
                          )}
                          {!milestone.completed && milestone.dueDate && (
                            <span style={{ color: isOverdue(milestone.dueDate) ? 'var(--accent)' : 'var(--gray)' }}>
                              Due {formatDate(milestone.dueDate)}
                              {isOverdue(milestone.dueDate) && ' (overdue)'}
                            </span>
                          )}
                          {assignees.length > 0 && (
                            <span style={{ color: 'var(--gray)' }}>
                              {assignees.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              }
            </div>
          )}
        </div>
      )}

      {/* History View */}
      {activeView === 'history' && (
        <div className="card">
          <div className="card-header">
            <h2>Activity History</h2>
          </div>

          <p style={{ color: 'var(--gray)', marginBottom: '1.5rem' }}>
            Record of completed tasks and milestones
          </p>

          {completedTasks.length === 0 ? (
            <div className="empty-state">
              <p>No completed tasks yet. Completed items will appear here.</p>
            </div>
          ) : (
            <div>
              {completedTasks.map(task => {
                const assignees = getAssignees(task);
                return (
                  <div
                    key={task.id}
                    style={{
                      display: 'flex',
                      gap: '1rem',
                      padding: '1rem',
                      borderBottom: '1px solid var(--border)',
                      background: task.isMilestone ? '#f0fdf4' : 'transparent'
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: task.isMilestone ? '#f59e0b' : 'var(--success)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      flexShrink: 0
                    }}>
                      {task.isMilestone ? 'M' : '✓'}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                            {task.isMilestone && <span style={{ color: '#f59e0b' }}>[Milestone] </span>}
                            {task.title}
                          </h4>
                          {task.description && (
                            <p style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>
                              {task.description}
                            </p>
                          )}
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--gray)', whiteSpace: 'nowrap' }}>
                          {formatDateTime(task.completedAt)}
                        </span>
                      </div>

                      {assignees.length > 0 && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--gray)' }}>
                          Completed by: {assignees.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showAddModal && renderModal(false)}
      {editingTask && renderModal(true)}
    </div>
  );
}

export default TasksTab;
