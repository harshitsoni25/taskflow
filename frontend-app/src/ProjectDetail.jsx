import { useState, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import api from './api';
import { useAuth } from './AuthContext';
import TaskModal from './TaskModal';

const initials = (name) => name ? name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) : '?';

const PRIORITY_CLASSES = { high: 'priority-high', medium: 'priority-medium', low: 'priority-low' };

function formatDate(d) {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function ProjectDetail({ projectId, setView, onProjectUpdated }) {
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('list');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [addMemberError, setAddMemberError] = useState('');
  const [taskForm, setTaskForm] = useState({ title:'', description:'', due_date:'', priority:'medium', assignee_id:'' });
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskError, setTaskError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [showEditProject, setShowEditProject] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [editingProject, setEditingProject] = useState(false);
  const [editProjectError, setEditProjectError] = useState('');
  const [toast, setToast] = useState(null);

  const isAdmin = project?.admin_id === user?.id;

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/projects/${projectId}`),
      api.get(`/projects/${projectId}/tasks`),
    ]).then(([pd, td]) => {
      setProject(pd.data.project);
      setMembers(pd.data.members);
      setTasks(td.data.tasks);
    }).catch(err => {
      if (err.response?.status === 403) setView('projects');
    }).finally(() => setLoading(false));
  }, [projectId]);

  const createTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;
    setCreatingTask(true);
    setTaskError('');
    try {
      const payload = { ...taskForm, assignee_id: taskForm.assignee_id || undefined, due_date: taskForm.due_date || undefined };
      const r = await api.post(`/projects/${projectId}/tasks`, payload);
      setTasks(prev => [...prev, r.data.task]);
      setShowNewTask(false);
      setTaskForm({ title:'', description:'', due_date:'', priority:'medium', assignee_id:'' });
    } catch (err) {
      setTaskError(err.response?.data?.error || 'Failed to create task');
    } finally {
      setCreatingTask(false);
    }
  };

  const addMember = async (e) => {
    e.preventDefault();
    setAddMemberError('');
    try {
      const r = await api.post(`/projects/${projectId}/members`, { email: newMemberEmail });
      setMembers(prev => [...prev, r.data.member]);
      setNewMemberEmail('');
      setShowAddMember(false);
    } catch (err) {
      setAddMemberError(err.response?.data?.error || 'Failed to add member');
    }
  };

  const removeMember = async (uid) => {
    if (!confirm('Remove this member?')) return;
    try {
      await api.delete(`/projects/${projectId}/members/${uid}`);
      setMembers(prev => prev.filter(m => m.id !== uid));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove member');
    }
  };

  const updateTask = (updated) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    setSelectedTask(updated);
  };

  const deleteTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    setSelectedTask(null);
  };

  const openEditProject = () => {
    setEditProjectError('');
    setEditForm({
      name: project?.name || '',
      description: project?.description || '',
    });
    setShowEditProject(true);
  };

  const saveProjectChanges = async (e) => {
    e.preventDefault();
    const trimmedName = editForm.name.trim();

    if (!trimmedName) {
      setEditProjectError('Project name cannot be empty');
      return;
    }

    setEditingProject(true);
    setEditProjectError('');

    try {
      const response = await api.put(`/projects/${projectId}`, {
        name: trimmedName,
        description: editForm.description.trim(),
      });

      setProject(response.data.project);
      onProjectUpdated?.(response.data.project);
      setShowEditProject(false);
      setToast({ type: 'success', message: 'Project updated successfully' });
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to update project';
      setEditProjectError(errorMsg);
      setToast({ type: 'error', message: errorMsg });
    } finally {
      setEditingProject(false);
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterAssignee && t.assignee_id !== filterAssignee) return false;
    return true;
  });

  const byStatus = (s) => filteredTasks.filter(t => t.status === s);
  const done = byStatus('done');
  const pct = tasks.length ? Math.round((tasks.filter(t=>t.status==='done').length / tasks.length) * 100) : 0;

  if (loading) return <div className="loading"><div className="spinner"/></div>;
  if (!project) return null;

  return (
    <>
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <button onClick={() => setView('projects')}>Projects</button>
            <span>›</span>
            <span style={{color:'var(--text2)'}}>{project.name}</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div className="page-title">{project.name}</div>
            {isAdmin && (
              <button
                className="project-edit-btn"
                onClick={openEditProject}
                aria-label="Edit Project"
                title="Edit Project"
                type="button"
              >
                <Pencil size={14} />
                <span className="project-edit-tooltip">Edit Project</span>
              </button>
            )}
          </div>
          {project.description && <div className="page-subtitle">{project.description}</div>}
          <div style={{display:'flex',alignItems:'center',gap:16,marginTop:10}}>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              {members.slice(0,5).map(m => (
                <div key={m.id} className="avatar avatar-sm" title={m.name}>{initials(m.name)}</div>
              ))}
              {members.length > 5 && <span style={{fontSize:12,color:'var(--text3)'}}>+{members.length-5}</span>}
            </div>
            <span style={{fontSize:13,color:'var(--text2)'}}>{tasks.length} tasks · {pct}% done</span>
          </div>
        </div>
        <div style={{display:'flex',gap:10}}>
          {isAdmin && <button className="btn btn-ghost btn-sm" onClick={() => setShowAddMember(true)}>+ Member</button>}
          {isAdmin && <button className="btn btn-primary btn-sm" onClick={() => setShowNewTask(true)}>+ Task</button>}
        </div>
      </div>

      <div className="page-body">
        {/* Progress */}
        <div style={{marginBottom:20}}>
          <div className="progress-bar" style={{height:8}}>
            <div className="progress-fill" style={{width:`${pct}%`}}/>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, paddingBottom:10, borderBottom:'1px solid var(--border)'}}>
          <div style={{display:'flex',gap:16, alignItems:'center'}}>
            <span style={{fontSize:14, fontWeight:600, color:'var(--accent)'}}>All Tasks ▾</span>
            <span style={{color:'var(--text3)'}}>☆ ⟳</span>
          </div>
          <div style={{display:'flex',gap:16, alignItems:'center'}}>
            <div style={{display:'flex',gap:4, background:'var(--bg3)', borderRadius: 20, padding: 2}}>
              {['board','list','members'].map(t => (
                <button key={t} onClick={() => setTab(t)}
                  style={{padding:'4px 12px',border:'none',borderRadius: 20, cursor:'pointer',fontSize:12,fontWeight:600,
                    background: tab===t ? 'var(--bg)' : 'transparent',
                    color: tab===t ? 'var(--accent)' : 'var(--text2)',
                    boxShadow: tab===t ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                    textTransform:'capitalize',transition:'all 0.2s'
                  }}>{t}</button>
              ))}
            </div>
            <button className="btn" style={{background:'var(--accent)', color:'white', borderRadius:20, padding:'6px 16px'}} onClick={() => setShowNewTask(true)}>Add Task ▾</button>
            <span style={{color:'var(--text3)'}}>⏳ ⋯</span>
          </div>
        </div>

        {/* Filter bar */}
        {(tab === 'board' || tab === 'list') && (
          <div className="filter-bar">
            <select className="form-input" style={{width:'auto',fontSize:13,padding:'7px 12px'}} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <select className="form-input" style={{width:'auto',fontSize:13,padding:'7px 12px'}} value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}>
              <option value="">All Assignees</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            {(filterStatus || filterAssignee) && (
              <button className="btn btn-ghost btn-sm" onClick={() => { setFilterStatus(''); setFilterAssignee(''); }}>Clear</button>
            )}
          </div>
        )}

        {/* Board */}
        {tab === 'board' && (
          <div className="board-columns">
            {[
              {key:'todo', label:'To Do', cls:'col-todo'},
              {key:'in_progress', label:'In Progress', cls:'col-inprogress'},
              {key:'done', label:'Done', cls:'col-done'},
            ].map(col => (
              <div key={col.key} className={`board-column ${col.cls}`}>
                <div className="column-header">
                  <div className="column-title">
                    <div className="column-dot"/>
                    {col.label}
                  </div>
                  <div className="column-count">{byStatus(col.key).length}</div>
                </div>
                <div className="column-body">
                  {byStatus(col.key).length === 0 ? (
                    <div style={{textAlign:'center',padding:'20px 10px',color:'var(--text3)',fontSize:12}}>No tasks</div>
                  ) : byStatus(col.key).map(task => {
                    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
                    return (
                      <div key={task.id} className="task-card" onClick={() => setSelectedTask(task)}>
                        <div className="task-title">{task.title}</div>
                        {task.description && <div className="task-desc">{task.description}</div>}
                        <div className="task-footer">
                          <span className={`priority-badge ${PRIORITY_CLASSES[task.priority]}`}>{task.priority}</span>
                          <div style={{display:'flex',gap:8,alignItems:'center'}}>
                            {task.due_date && <span className={`due-date ${isOverdue?'overdue':''}`}>📅 {formatDate(task.due_date)}</span>}
                            {task.assignee_name && (
                              <div className="assignee-chip">
                                <div className="avatar" style={{width:20,height:20,fontSize:9}}>{initials(task.assignee_name)}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List view */}
        {tab === 'list' && (
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            {filteredTasks.length === 0 ? (
              <div className="empty-state" style={{padding:'40px 20px'}}>
                <div className="empty-icon">✅</div>
                <div className="empty-title">No tasks found</div>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th style={{width: 30}}></th>
                    <th>TASK</th>
                    <th>OWNER</th>
                    <th>STATUS</th>
                    <th>DUE DATE</th>
                    <th>% COMPLETE</th>
                    <th>PRIORITY</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map(t => {
                    const isOverdue = t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done';
                    return (
                      <tr key={t.id} style={{cursor:'pointer'}} onClick={() => setSelectedTask(t)}>
                        <td><input type="checkbox" onClick={e => e.stopPropagation()} /></td>
                        <td style={{color:'var(--text)',fontWeight:500}}>
                          <span style={{color:'var(--text3)', marginRight: 8}}>📄</span>
                          {t.title}
                        </td>
                        <td>
                          {t.assignee_name ? t.assignee_name : <span style={{color:'var(--text3)'}}>Unassigned</span>}
                        </td>
                        <td>
                          <span style={{fontSize:11,fontWeight:600,padding:'4px 10px',borderRadius:20,
                            background: t.status==='done'?'#E8F5E9':t.status==='in_progress'?'#E3F2FD':'#FFEBEE',
                            color: t.status==='done'?'#2E7D32':t.status==='in_progress'?'#1565C0':'#C62828'
                          }}>{t.status==='in_progress'?'In Progress':t.status==='done'?'Closed':'Open'}</span>
                        </td>
                        <td style={{color: isOverdue ? 'var(--red)' : 'var(--text2)'}}>
                          {t.due_date ? formatDate(t.due_date) : '—'}
                        </td>
                        <td>
                          <div style={{display:'flex', alignItems:'center', gap: 8}}>
                            <div className="progress-bar" style={{flex: 1, height: 6, margin: 0, background: '#E0E0E0'}}>
                              <div className="progress-fill" style={{width: t.status==='done'?'100%':t.status==='in_progress'?'50%':'0%', background: '#4CAF50'}}/>
                            </div>
                            <span style={{fontSize: 11}}>{t.status==='done'?'100%':t.status==='in_progress'?'50%':'0%'}</span>
                          </div>
                        </td>
                        <td><span className={`priority-badge ${PRIORITY_CLASSES[t.priority]}`}>{t.priority}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Members */}
        {tab === 'members' && (
          <div className="card">
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <span style={{fontWeight:600}}>{members.length} members</span>
              {isAdmin && <button className="btn btn-primary btn-sm" onClick={() => setShowAddMember(true)}>+ Add Member</button>}
            </div>
            {members.map(m => (
              <div key={m.id} className="member-row">
                <div className="member-info">
                  <div className="avatar">{initials(m.name)}</div>
                  <div>
                    <div style={{fontSize:14,fontWeight:500,color:'var(--text)'}}>{m.name} {m.id===user?.id && <span style={{fontSize:11,color:'var(--text3)'}}>(you)</span>}</div>
                    <div style={{fontSize:12,color:'var(--text3)'}}>{m.email}</div>
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span className={`badge ${m.id===project.admin_id?'badge-admin':'badge-member'}`}>{m.id===project.admin_id?'Admin':'Member'}</span>
                  {isAdmin && m.id !== user?.id && m.id !== project.admin_id && (
                    <button className="btn btn-danger btn-sm" onClick={() => removeMember(m.id)}>Remove</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task detail modal */}
      {selectedTask && (
        <TaskModal task={selectedTask} projectId={projectId} members={members} isAdmin={isAdmin}
          onClose={() => setSelectedTask(null)} onUpdated={updateTask} onDeleted={deleteTask}/>
      )}

      {/* New task modal */}
      {showNewTask && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowNewTask(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">New Task</div>
              <button className="modal-close" onClick={() => setShowNewTask(false)}>✕</button>
            </div>
            {taskError && <div className="error-msg">{taskError}</div>}
            <form onSubmit={createTask}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" placeholder="Task title" value={taskForm.title}
                  onChange={e => setTaskForm({...taskForm, title: e.target.value})} required autoFocus/>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" placeholder="Optional description..." value={taskForm.description}
                  onChange={e => setTaskForm({...taskForm, description: e.target.value})} rows={3}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-input" value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input className="form-input" type="date" value={taskForm.due_date}
                    onChange={e => setTaskForm({...taskForm, due_date: e.target.value})}/>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Assignee</label>
                <select className="form-input" value={taskForm.assignee_id} onChange={e => setTaskForm({...taskForm, assignee_id: e.target.value})}>
                  <option value="">Unassigned</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowNewTask(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creatingTask}>{creatingTask ? 'Creating...' : 'Create Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add member modal */}
      {showAddMember && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowAddMember(false)}>
          <div className="modal" style={{maxWidth:380}}>
            <div className="modal-header">
              <div className="modal-title">Add Member</div>
              <button className="modal-close" onClick={() => setShowAddMember(false)}>✕</button>
            </div>
            {addMemberError && <div className="error-msg">{addMemberError}</div>}
            <form onSubmit={addMember}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" placeholder="member@company.com"
                  value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)} required autoFocus/>
                <div style={{fontSize:12,color:'var(--text3)',marginTop:6}}>User must be registered on TaskFlow</div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddMember(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit project modal */}
      {showEditProject && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowEditProject(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Edit Project</div>
              <button className="modal-close" onClick={() => setShowEditProject(false)}>✕</button>
            </div>
            {editProjectError && <div className="error-msg">{editProjectError}</div>}
            <form onSubmit={saveProjectChanges}>
              <div className="form-group">
                <label className="form-label">Project Name *</label>
                <input
                  className="form-input"
                  placeholder="Project name"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Project Description</label>
                <textarea
                  className="form-input"
                  placeholder="Project description..."
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowEditProject(false)} disabled={editingProject}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={editingProject}>
                  {editingProject ? (
                    <span className="btn-loading">
                      <span className="spinner spinner-inline" aria-hidden />
                      Saving...
                    </span>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`} role="status" aria-live="polite">
          {toast.message}
        </div>
      )}
    </>
  );
}
