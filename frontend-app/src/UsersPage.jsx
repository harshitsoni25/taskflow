import { useState, useEffect } from 'react';
import api from './api';

const initials = (name) => name ? name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) : '?';
const avatarColor = (name) => {
  const colors = ['#6366f1','#f59e0b','#10b981','#ef4444','#8b5cf6','#ec4899','#14b8a6'];
  let h = 0; for (const c of (name||'')) h = (h*31+c.charCodeAt(0))%colors.length;
  return colors[h];
};

export default function UsersPage({ setView }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner"/></div>;

  const users = data?.tasksPerUser || [];
  const allTasks = data?.myTasks || [];
  const projects = data?.projects || [];

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Team Members</div>
          <div className="page-subtitle">{users.length} members across {projects.length} projects</div>
        </div>
      </div>
      <div className="page-body">
        {users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <div className="empty-title">No team members yet</div>
            <div className="empty-text">Add members to your projects to see them here</div>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
            {users.map(u => {
              const pct = u.task_count ? Math.round((u.done_count||0)/u.task_count*100) : 0;
              const userTasks = allTasks.filter(t => t.assignee_id === u.id || t.assignee_name === u.name);
              const color = avatarColor(u.name);
              return (
                <div key={u.id}
                  className="card"
                  style={{ cursor:'pointer', transition:'transform 0.15s,box-shadow 0.15s' }}
                  onClick={() => setSelected(selected===u.id ? null : u.id)}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}
                >
                  <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
                    <div style={{
                      width:52, height:52, borderRadius:'50%', background:color,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:18, fontWeight:700, color:'#fff', flexShrink:0,
                    }}>{initials(u.name)}</div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:15, color:'var(--text)' }}>{u.name}</div>
                      <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>
                        {u.task_count} tasks · {u.in_progress_count||0} active
                      </div>
                    </div>
                    <div style={{ marginLeft:'auto', textAlign:'right' }}>
                      <div style={{
                        width:42, height:42, position:'relative', display:'flex', alignItems:'center', justifyContent:'center',
                      }}>
                        <svg width={42} height={42} viewBox="0 0 42 42">
                          <circle cx={21} cy={21} r={16} fill="none" stroke="var(--bg3)" strokeWidth={5}/>
                          <circle cx={21} cy={21} r={16} fill="none" stroke={color} strokeWidth={5}
                            strokeDasharray={`${2*Math.PI*16}`}
                            strokeDashoffset={`${2*Math.PI*16*(1-pct/100)}`}
                            strokeLinecap="round" transform="rotate(-90 21 21)"/>
                        </svg>
                        <span style={{ position:'absolute', fontSize:9, fontWeight:700, color:'var(--text)' }}>{pct}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div style={{ display:'flex', gap:8, marginBottom:14 }}>
                    {[
                      { label:'Open',     val:u.todo_count||0,        bg:'var(--bg3)',                      c:'var(--text2)' },
                      { label:'Active',   val:u.in_progress_count||0, bg:'rgba(99,102,241,0.12)',           c:'var(--accent)' },
                      { label:'Done',     val:u.done_count||0,        bg:'rgba(16,185,129,0.12)',           c:'var(--green)' },
                    ].map(s => (
                      <div key={s.label} style={{
                        flex:1, textAlign:'center', padding:'8px 4px', borderRadius:8,
                        background:s.bg,
                      }}>
                        <div style={{ fontSize:16, fontWeight:700, color:s.c }}>{s.val}</div>
                        <div style={{ fontSize:10, color:'var(--text3)' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width:`${pct}%`, background:color }}/>
                  </div>

                  {/* Expanded task list */}
                  {selected === u.id && userTasks.length > 0 && (
                    <div style={{ marginTop:14, borderTop:'1px solid var(--border)', paddingTop:12 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', marginBottom:8, letterSpacing:1 }}>ASSIGNED TASKS</div>
                      {userTasks.slice(0,5).map(t => (
                        <div key={t.id}
                          onClick={e => { e.stopPropagation(); setView(`project-${t.project_id}`); }}
                          style={{
                            display:'flex', justifyContent:'space-between', alignItems:'center',
                            padding:'6px 0', borderBottom:'1px solid var(--border)',
                            cursor:'pointer', fontSize:12,
                          }}>
                          <span style={{ color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1, marginRight:8 }}>{t.title}</span>
                          <span style={{
                            padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:600, flexShrink:0,
                            background: t.status==='done'?'#E8F5E9':t.status==='in_progress'?'#E3F2FD':'var(--bg3)',
                            color: t.status==='done'?'#2E7D32':t.status==='in_progress'?'#1565C0':'var(--text2)',
                          }}>{t.status==='in_progress'?'Active':t.status==='done'?'Done':'Open'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
