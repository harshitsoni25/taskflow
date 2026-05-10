import { useState, useEffect } from 'react';
import api from './api';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}

export default function MilestonesPage({ setView }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner"/></div>;

  const projects = data?.projects || [];
  const allTasks = data?.myTasks || [];

  // Group milestones by project — each project gets a milestone card
  const milestones = projects.map(p => {
    const pTasks = allTasks.filter(t => t.project_id === p.id);
    const done = Number(p.done_tasks) || 0;
    const total = Number(p.total_tasks) || 0;
    const pct = total ? Math.round(done / total * 100) : 0;
    const status = pct === 100 ? 'completed' : pct > 0 ? 'in_progress' : 'not_started';
    const dueDates = pTasks.map(t => t.due_date).filter(Boolean).sort();
    const deadline = dueDates[dueDates.length - 1]; // latest due date = project milestone deadline
    const isOverdue = deadline && new Date(deadline) < new Date() && status !== 'completed';
    return { ...p, done, total, pct, status, deadline, isOverdue };
  });

  const STATUS_META = {
    completed:   { icon:'🏆', label:'Completed',  color:'var(--green)',  bg:'rgba(16,185,129,0.1)'  },
    in_progress: { icon:'🚀', label:'In Progress', color:'var(--accent)', bg:'rgba(99,102,241,0.08)' },
    not_started: { icon:'🎯', label:'Not Started', color:'var(--text3)',  bg:'var(--bg3)'            },
  };

  const counts = {
    completed:   milestones.filter(m=>m.status==='completed').length,
    in_progress: milestones.filter(m=>m.status==='in_progress').length,
    not_started: milestones.filter(m=>m.status==='not_started').length,
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Milestones</div>
          <div className="page-subtitle">Project completion milestones</div>
        </div>
      </div>
      <div className="page-body">

        {/* Summary */}
        <div className="stats-grid" style={{ marginBottom:24 }}>
          <div className="stat-card green">  <div className="stat-label">Completed</div>  <div className="stat-value green">{counts.completed}</div></div>
          <div className="stat-card blue">   <div className="stat-label">In Progress</div><div className="stat-value blue">{counts.in_progress}</div></div>
          <div className="stat-card purple"> <div className="stat-label">Not Started</div><div className="stat-value purple">{counts.not_started}</div></div>
          <div className="stat-card yellow"> <div className="stat-label">Total</div>       <div className="stat-value yellow">{milestones.length}</div></div>
        </div>

        {milestones.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏁</div>
            <div className="empty-title">No milestones yet</div>
            <div className="empty-text">Create projects and add tasks to track milestones</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {milestones.map(m => {
              const meta = STATUS_META[m.status];
              return (
                <div key={m.id}
                  className="card"
                  onClick={() => setView(`project-${m.id}`)}
                  style={{
                    cursor:'pointer', borderLeft:`4px solid ${meta.color}`,
                    transition:'transform 0.15s,box-shadow 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}
                >
                  <div style={{ display:'flex', alignItems:'flex-start', gap:16 }}>
                    <div style={{ fontSize:28 }}>{meta.icon}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                        <div style={{ fontWeight:700, fontSize:15, color:'var(--text)' }}>{m.name}</div>
                        <span style={{
                          padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:600,
                          background:meta.bg, color:meta.color,
                        }}>{meta.label}</span>
                      </div>
                      {m.description && (
                        <div style={{ fontSize:13, color:'var(--text2)', marginBottom:10, lineHeight:1.5 }}>{m.description}</div>
                      )}
                      <div style={{ display:'flex', gap:20, fontSize:12, color:'var(--text3)', marginBottom:12, flexWrap:'wrap' }}>
                        <span>📋 {m.total} tasks</span>
                        <span style={{ color:'var(--green)' }}>✅ {m.done} done</span>
                        <span>👥 {m.member_count} members</span>
                        {m.deadline && (
                          <span style={{ color: m.isOverdue ? 'var(--red)' : 'var(--text3)' }}>
                            📅 Target: {formatDate(m.deadline)}{m.isOverdue ? ' ⚠ Overdue' : ''}
                          </span>
                        )}
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div className="progress-bar" style={{ flex:1 }}>
                          <div className="progress-fill" style={{
                            width:`${m.pct}%`,
                            background: m.pct===100?'var(--green)':meta.color,
                          }}/>
                        </div>
                        <span style={{ fontSize:12, fontWeight:700, color:meta.color, flexShrink:0 }}>{m.pct}%</span>
                      </div>
                    </div>
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
