import { useState, useEffect } from 'react';
import api from './api';

const initials = (name) => name ? name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) : '?';
const avatarColor = (name) => {
  const colors = ['#6366f1','#f59e0b','#10b981','#ef4444','#8b5cf6','#ec4899'];
  let h = 0; for (const c of (name||'')) h = (h*31+c.charCodeAt(0))%colors.length;
  return colors[h];
};

export default function ReportsPage({ setView }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner"/></div>;

  const statusMap = {};
  (data?.statusCounts||[]).forEach(s => { statusMap[s.status] = Number(s.count); });
  const total = (statusMap.todo||0) + (statusMap.in_progress||0) + (statusMap.done||0);

  const priorityMap = {};
  (data?.priorityCounts||[]).forEach(p => { priorityMap[p.priority] = Number(p.count); });
  const pTotal = Object.values(priorityMap).reduce((a,b)=>a+b,0);

  const projects = data?.projects || [];
  const users = data?.tasksPerUser || [];
  const overdue = data?.overdueTasks || [];

  const completionRate = total ? Math.round((statusMap.done||0)/total*100) : 0;
  const overdueRate = total ? Math.round(overdue.length/total*100) : 0;

  const StatRing = ({ value, label, color }) => {
    const r = 40; const circ = 2 * Math.PI * r;
    const fill = circ * (1 - value/100);
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
        <svg width={100} height={100} viewBox="0 0 100 100">
          <circle cx={50} cy={50} r={r} fill="none" stroke="var(--bg3)" strokeWidth={10}/>
          <circle cx={50} cy={50} r={r} fill="none" stroke={color} strokeWidth={10}
            strokeDasharray={circ} strokeDashoffset={fill}
            strokeLinecap="round" transform="rotate(-90 50 50)"
            style={{ transition:'stroke-dashoffset 0.6s ease' }}/>
          <text x={50} y={55} textAnchor="middle" fill="var(--text)" fontSize={18} fontWeight={700}>{value}%</text>
        </svg>
        <div style={{ fontSize:12, color:'var(--text2)', fontWeight:500 }}>{label}</div>
      </div>
    );
  };

  const BarRow = ({ label, value, max, color }) => (
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
      <div style={{ width:110, fontSize:12, color:'var(--text2)', textAlign:'right', flexShrink:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{label}</div>
      <div style={{ flex:1, height:16, background:'var(--bg3)', borderRadius:8, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${max?value/max*100:0}%`, background:color, borderRadius:8, transition:'width 0.5s ease' }}/>
      </div>
      <div style={{ width:28, fontSize:12, color:'var(--text2)', flexShrink:0 }}>{value}</div>
    </div>
  );

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Reports & Analytics</div>
          <div className="page-subtitle">Performance overview across all projects</div>
        </div>
      </div>
      <div className="page-body">

        {/* KPI row */}
        <div className="stats-grid" style={{ marginBottom:24 }}>
          {[
            { label:'Total Tasks',   value:total,              color:'blue'   },
            { label:'Completed',     value:statusMap.done||0,  color:'green'  },
            { label:'In Progress',   value:statusMap.in_progress||0, color:'yellow'},
            { label:'Overdue',       value:overdue.length,     color:'red'    },
            { label:'Projects',      value:projects.length,    color:'purple' },
          ].map(s => (
            <div key={s.label} className={`stat-card ${s.color}`}>
              <div className="stat-label">{s.label}</div>
              <div className={`stat-value ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Ring charts */}
        <div className="card" style={{ marginBottom:20 }}>
          <div className="card-title">Health Overview</div>
          <div style={{ display:'flex', gap:40, justifyContent:'center', padding:'16px 0', flexWrap:'wrap' }}>
            <StatRing value={completionRate} label="Completion Rate" color="var(--green)"/>
            <StatRing value={total ? Math.round((statusMap.in_progress||0)/total*100) : 0} label="Active Rate" color="var(--yellow)"/>
            <StatRing value={overdueRate} label="Overdue Rate" color="var(--red)"/>
            <StatRing value={total ? Math.round((statusMap.todo||0)/total*100) : 0} label="Backlog Rate" color="var(--text3)"/>
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom:20 }}>
          {/* Tasks by project */}
          <div className="card">
            <div className="card-title">Tasks by Project</div>
            {projects.length === 0
              ? <div style={{ color:'var(--text3)', fontSize:13 }}>No projects</div>
              : projects.map(p => (
                <BarRow key={p.id}
                  label={p.name} value={Number(p.total_tasks)||0}
                  max={Math.max(...projects.map(x=>Number(x.total_tasks)||0))}
                  color="var(--accent)"/>
              ))
            }
          </div>

          {/* Priority breakdown */}
          <div className="card">
            <div className="card-title">Active Tasks by Priority</div>
            {[
              { key:'high',   label:'High',   color:'var(--red)'    },
              { key:'medium', label:'Medium', color:'var(--yellow)' },
              { key:'low',    label:'Low',    color:'var(--green)'  },
            ].map(({ key, label, color }) => (
              <BarRow key={key} label={label} value={priorityMap[key]||0} max={pTotal||1} color={color}/>
            ))}
          </div>
        </div>

        <div className="grid-2">
          {/* Workload per member */}
          <div className="card">
            <div className="card-title">Workload per Team Member</div>
            {users.length === 0
              ? <div style={{ color:'var(--text3)', fontSize:13 }}>No data</div>
              : users.map(u => (
                <div key={u.id} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                  <div style={{
                    width:32, height:32, borderRadius:'50%', flexShrink:0, fontSize:11, fontWeight:700,
                    background:avatarColor(u.name), color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
                  }}>{initials(u.name)}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, fontSize:13 }}>
                      <span style={{ fontWeight:500, color:'var(--text)' }}>{u.name}</span>
                      <span style={{ color:'var(--text2)', fontSize:12 }}>{u.done_count||0}/{u.task_count} done</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width:`${u.task_count?((u.done_count||0)/u.task_count*100):0}%` }}/>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>

          {/* Project completion */}
          <div className="card">
            <div className="card-title">Project Completion</div>
            {projects.length === 0
              ? <div style={{ color:'var(--text3)', fontSize:13 }}>No projects</div>
              : projects.map(p => {
                const pct = p.total_tasks ? Math.round((p.done_tasks||0)/p.total_tasks*100) : 0;
                return (
                  <div key={p.id} style={{ marginBottom:14, cursor:'pointer' }} onClick={() => setView(`project-${p.id}`)}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5, fontSize:13 }}>
                      <span style={{ fontWeight:500, color:'var(--text)' }}>{p.name}</span>
                      <span style={{ color: pct===100?'var(--green)':'var(--text2)', fontSize:12 }}>{pct}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{
                        width:`${pct}%`,
                        background: pct===100?'var(--green)':'var(--accent)',
                      }}/>
                    </div>
                    <div style={{ fontSize:11, color:'var(--text3)', marginTop:3 }}>
                      {p.done_tasks||0} of {p.total_tasks||0} tasks · {p.member_count||0} members
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>
      </div>
    </>
  );
}
