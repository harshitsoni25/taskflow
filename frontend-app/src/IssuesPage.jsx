import { useState, useEffect } from 'react';
import api from './api';

const PRIORITY_CLASSES = { high: 'priority-high', medium: 'priority-medium', low: 'priority-low' };
function formatDate(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}

export default function IssuesPage({ setView }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner"/></div>;

  const allTasks = [...(data?.myTasks||[]), ...(data?.overdueTasks||[])];
  const seen = new Set();
  const tasks = allTasks.filter(t => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });

  const filtered = tasks.filter(t => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const isOverdue = (t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done';

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Issues</div>
          <div className="page-subtitle">{tasks.length} total tasks across all projects</div>
        </div>
      </div>
      <div className="page-body">
        {/* Filters */}
        <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
          <input
            placeholder="🔍 Search issues..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex:1, minWidth:180, padding:'8px 12px', borderRadius:8, border:'1px solid var(--border)',
              background:'var(--bg2)', color:'var(--text)', fontSize:13, outline:'none',
            }}
          />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ padding:'8px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg2)', color:'var(--text)', fontSize:13, cursor:'pointer' }}>
            <option value="">All Status</option>
            <option value="todo">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Closed</option>
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
            style={{ padding:'8px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg2)', color:'var(--text)', fontSize:13, cursor:'pointer' }}>
            <option value="">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Summary badges */}
        <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
          {[
            { label:`${tasks.filter(t=>t.status==='todo').length} Open`,        bg:'var(--bg3)',                color:'var(--text2)'  },
            { label:`${tasks.filter(t=>t.status==='in_progress').length} Active`, bg:'rgba(99,102,241,0.1)',  color:'var(--accent)' },
            { label:`${tasks.filter(t=>t.status==='done').length} Closed`,      bg:'rgba(16,185,129,0.1)',    color:'var(--green)'  },
            { label:`${tasks.filter(isOverdue).length} Overdue`,                bg:'rgba(239,68,68,0.1)',     color:'var(--red)'    },
          ].map(b => (
            <span key={b.label} style={{ padding:'5px 14px', borderRadius:20, fontSize:12, fontWeight:600, background:b.bg, color:b.color }}>{b.label}</span>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🐛</div><div className="empty-title">No issues found</div></div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {filtered.map(t => {
              const overdue = isOverdue(t);
              return (
                <div key={t.id}
                  onClick={() => setView(`project-${t.project_id}`)}
                  style={{
                    display:'flex', alignItems:'center', gap:14,
                    padding:'14px 18px', borderRadius:10, cursor:'pointer',
                    background:'var(--bg2)', border:`1px solid ${overdue?'rgba(239,68,68,0.3)':'var(--border)'}`,
                    transition:'background 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background='var(--bg3)'; e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='var(--bg2)'; e.currentTarget.style.boxShadow=''; }}
                >
                  {/* Status icon */}
                  <div style={{ fontSize:16, flexShrink:0 }}>
                    {t.status==='done'?'✅':t.status==='in_progress'?'🔄':'⭕'}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:500, color:'var(--text)', marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {t.title}
                      {overdue && <span style={{ color:'var(--red)', fontSize:11, marginLeft:8 }}>⚠ Overdue</span>}
                    </div>
                    <div style={{ fontSize:12, color:'var(--text3)', display:'flex', gap:12 }}>
                      <span>📁 {t.project_name}</span>
                      {t.assignee_name && <span>👤 {t.assignee_name}</span>}
                      {t.due_date && <span style={{ color:overdue?'var(--red)':'var(--text3)' }}>📅 {formatDate(t.due_date)}</span>}
                    </div>
                  </div>
                  <span className={`priority-badge ${PRIORITY_CLASSES[t.priority]||''}`}>{t.priority}</span>
                  <span style={{
                    padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:600, flexShrink:0,
                    background: t.status==='done'?'#E8F5E9':t.status==='in_progress'?'#E3F2FD':'#FFEBEE',
                    color: t.status==='done'?'#2E7D32':t.status==='in_progress'?'#1565C0':'#C62828',
                  }}>
                    {t.status==='in_progress'?'In Progress':t.status==='done'?'Closed':'Open'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
