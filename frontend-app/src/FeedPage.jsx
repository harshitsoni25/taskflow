import { useState, useEffect } from 'react';
import api from './api';

const initials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
const avatarColor = (name) => {
  const colors = ['#6366f1','#f59e0b','#10b981','#ef4444','#8b5cf6','#ec4899','#14b8a6'];
  let h = 0; for (const c of (name||'')) h = (h * 31 + c.charCodeAt(0)) % colors.length;
  return colors[h];
};

const ACTION_LABELS = { todo: 'opened', in_progress: 'started', done: 'completed' };
const ACTION_COLORS = { todo: 'var(--text3)', in_progress: 'var(--yellow)', done: 'var(--green)' };

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function FeedPage({ setView }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    Promise.all([api.get('/dashboard'), api.get('/projects')])
      .then(([dash, proj]) => setData({ dash: dash.data, projects: proj.data.projects || [] }))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner"/></div>;

  const allTasks = data?.dash?.myTasks || [];
  const overdues = data?.dash?.overdueTasks || [];

  // Build feed items from tasks (simulate activity)
  const feedItems = [
    ...allTasks.map(t => ({ ...t, action: t.status, time: t.updated_at || t.created_at, type: 'task' })),
    ...overdues.filter(o => !allTasks.find(t => t.id === o.id)).map(t => ({ ...t, action: 'overdue', time: t.due_date + 'T00:00:00', type: 'overdue' })),
  ].sort((a, b) => new Date(b.time) - new Date(a.time));

  const filtered = filter === 'all' ? feedItems : feedItems.filter(f => f.action === filter);

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Activity Feed</div>
          <div className="page-subtitle">Recent activity across all your projects</div>
        </div>
      </div>
      <div className="page-body">
        <div className="filter-bar">
          {[['all','All'],['done','Completed'],['in_progress','In Progress'],['todo','Opened'],['overdue','Overdue']].map(([k,l]) => (
            <button key={k} className="btn btn-ghost btn-sm"
              style={{ background: filter===k?'var(--bg3)':'transparent', color: filter===k?'var(--text)':'var(--text2)' }}
              onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📭</div><div className="empty-title">No activity yet</div></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filtered.map((item, i) => {
              const color = item.action === 'overdue' ? 'var(--red)' : ACTION_COLORS[item.action] || 'var(--text3)';
              const label = item.action === 'overdue' ? 'is overdue' : `was ${ACTION_LABELS[item.action] || item.action}`;
              return (
                <div key={item.id + i} style={{
                  display: 'flex', gap: 14, alignItems: 'flex-start',
                  padding: '14px 0', borderBottom: '1px solid var(--border)',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: avatarColor(item.assignee_name || item.project_name || '?'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: '#fff',
                  }}>{initials(item.assignee_name || item.project_name)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 2 }}>
                      <strong>{item.assignee_name || 'Unassigned'}</strong>
                      <span style={{ color: 'var(--text2)', fontWeight: 400 }}> — Task </span>
                      <strong style={{ cursor:'pointer', color:'var(--accent)' }}
                        onClick={() => setView(`project-${item.project_id}`)}>"{item.title}"</strong>
                      <span style={{ color, fontWeight: 600 }}> {label}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', gap: 12 }}>
                      <span>📁 {item.project_name}</span>
                      <span style={{ color: item.action==='overdue'?'var(--red)':'var(--text3)' }}>
                        🕐 {timeAgo(item.time)}
                      </span>
                      <span className={`priority-badge priority-${item.priority}`}>{item.priority}</span>
                    </div>
                  </div>
                  <div style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, flexShrink: 0,
                    background: item.action==='done'?'#E8F5E9':item.action==='in_progress'?'#E3F2FD':item.action==='overdue'?'#FFEBEE':'var(--bg3)',
                    color: item.action==='done'?'#2E7D32':item.action==='in_progress'?'#1565C0':item.action==='overdue'?'#C62828':'var(--text2)',
                  }}>
                    {item.action === 'overdue' ? 'Overdue' : item.action === 'in_progress' ? 'In Progress' : item.action === 'done' ? 'Done' : 'Open'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
