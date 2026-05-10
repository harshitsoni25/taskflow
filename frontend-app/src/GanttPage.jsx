import { useState, useEffect } from 'react';
import api from './api';

const STATUS_COLOR = { todo:'#6366f1', in_progress:'#f59e0b', done:'#10b981' };
const PRIORITY_COLOR = { high:'#ef4444', medium:'#f59e0b', low:'#22c55e' };

function toDate(str) { return str ? new Date(str + (str.includes('T')?'':'T00:00:00')) : null; }
function formatDate(d) { if (!d) return ''; return new Date(d+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'}); }

export default function GanttPage({ setView }) {
  const [tasks, setTasks]     = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState('project'); // project | status | priority
  const [showDone, setShowDone] = useState(true);

  useEffect(() => {
    api.get('/projects').then(async r => {
      const ps = r.data.projects || [];
      setProjects(ps);
      const all = await Promise.all(ps.map(p =>
        api.get(`/projects/${p.id}/tasks`).then(res => (res.data.tasks||[]).map(t=>({...t,project_name:p.name}))).catch(()=>[])
      ));
      setTasks(all.flat());
    }).catch(console.error).finally(()=>setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner"/></div>;

  const withDates = tasks.filter(t => t.due_date && (showDone || t.status !== 'done'));
  if (withDates.length === 0) return (
    <>
      <div className="page-header"><div><div className="page-title">Gantt & Reports</div><div className="page-subtitle">Task timeline view</div></div></div>
      <div className="page-body"><div className="empty-state"><div className="empty-icon">📊</div><div className="empty-title">No tasks with due dates</div><div className="empty-text">Add due dates to your tasks to see them on the Gantt chart</div></div></div>
    </>
  );

  // Date range
  const dates = withDates.map(t => toDate(t.due_date)).filter(Boolean);
  const today = new Date();
  const minDate = new Date(Math.min(...dates.map(d=>d.getTime()), today.getTime()));
  const maxDate = new Date(Math.max(...dates.map(d=>d.getTime()), today.getTime()));
  minDate.setDate(minDate.getDate() - 3);
  maxDate.setDate(maxDate.getDate() + 5);
  const totalDays = Math.round((maxDate - minDate) / 86400000) + 1;

  // Build day headers
  const dayHeaders = [];
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(minDate); d.setDate(d.getDate() + i);
    dayHeaders.push(d);
  }

  const dayPct = (date) => Math.max(0, Math.min(100, (date - minDate) / (maxDate - minDate) * 100));
  const todayPct = dayPct(today);

  // Group tasks
  let groups = [];
  if (groupBy === 'project') {
    groups = projects.map(p => ({ key:p.id, label:p.name, tasks:withDates.filter(t=>t.project_id===p.id) })).filter(g=>g.tasks.length);
  } else if (groupBy === 'status') {
    groups = [
      { key:'todo',        label:'To Do',       tasks:withDates.filter(t=>t.status==='todo')        },
      { key:'in_progress', label:'In Progress',  tasks:withDates.filter(t=>t.status==='in_progress') },
      { key:'done',        label:'Done',         tasks:withDates.filter(t=>t.status==='done')        },
    ].filter(g=>g.tasks.length);
  } else {
    groups = [
      { key:'high',   label:'High Priority',   tasks:withDates.filter(t=>t.priority==='high')   },
      { key:'medium', label:'Medium Priority',  tasks:withDates.filter(t=>t.priority==='medium') },
      { key:'low',    label:'Low Priority',     tasks:withDates.filter(t=>t.priority==='low')    },
    ].filter(g=>g.tasks.length);
  }

  const ROW_H = 36;
  const LABEL_W = 200;
  const COL_W = Math.max(24, Math.min(48, Math.round(900 / totalDays)));

  return (
    <>
      <div className="page-header">
        <div><div className="page-title">Gantt & Reports</div><div className="page-subtitle">{withDates.length} tasks with due dates across {projects.length} projects</div></div>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'var(--text2)', cursor:'pointer' }}>
            <input type="checkbox" checked={showDone} onChange={e=>setShowDone(e.target.checked)}/> Show Done
          </label>
          <select value={groupBy} onChange={e=>setGroupBy(e.target.value)}
            style={{ padding:'7px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg2)', color:'var(--text)', fontSize:13, cursor:'pointer' }}>
            <option value="project">Group by Project</option>
            <option value="status">Group by Status</option>
            <option value="priority">Group by Priority</option>
          </select>
        </div>
      </div>
      <div className="page-body">
        <div style={{ overflowX:'auto', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:10, paddingBottom:8 }}>

          {/* Day header row */}
          <div style={{ display:'flex', borderBottom:'1px solid var(--border)', position:'sticky', top:0, background:'var(--bg2)', zIndex:10 }}>
            <div style={{ width:LABEL_W, flexShrink:0, padding:'10px 14px', fontSize:11, fontWeight:700, color:'var(--text3)', borderRight:'1px solid var(--border)' }}>TASK</div>
            <div style={{ flex:1, position:'relative', minWidth:totalDays*COL_W }}>
              <div style={{ display:'flex' }}>
                {dayHeaders.map((d,i) => {
                  const isToday = d.toDateString()===today.toDateString();
                  const showLabel = d.getDate()===1 || i===0 || d.getDay()===1;
                  return (
                    <div key={i} style={{ width:COL_W, flexShrink:0, textAlign:'center', padding:'10px 0', fontSize:9, fontWeight:isToday?800:500, color:isToday?'var(--accent)':'var(--text3)', background:isToday?'rgba(239,108,0,0.05)':'transparent', borderRight:'1px solid var(--border)', whiteSpace:'nowrap', overflow:'hidden' }}>
                      {showLabel||isToday ? `${d.getDate()} ${d.toLocaleString('default',{month:'short'})}` : ''}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Groups + tasks */}
          {groups.map(group => (
            <div key={group.key}>
              {/* Group header */}
              <div style={{ display:'flex', background:'var(--bg3)', borderBottom:'1px solid var(--border)' }}>
                <div style={{ width:LABEL_W, flexShrink:0, padding:'8px 14px', fontSize:11, fontWeight:700, color:'var(--text3)', letterSpacing:1, borderRight:'1px solid var(--border)' }}>{group.label.toUpperCase()}</div>
                <div style={{ flex:1, minWidth:totalDays*COL_W }}/>
              </div>

              {/* Task rows */}
              {group.tasks.map(t => {
                const due = toDate(t.due_date);
                if (!due) return null;
                const isOverdue = due < today && t.status !== 'done';
                const color = groupBy==='priority' ? PRIORITY_COLOR[t.priority] : STATUS_COLOR[t.status];

                // Bar: starts 1 day before due, ends at due date (single-point tasks)
                const startDate = new Date(due); startDate.setDate(startDate.getDate()-1);
                const barStart = Math.max(0, (startDate - minDate) / (maxDate - minDate) * 100);
                const barEnd   = Math.max(0, (due - minDate) / (maxDate - minDate) * 100);
                const barW     = Math.max(1, barEnd - barStart);

                return (
                  <div key={t.id} style={{ display:'flex', borderBottom:'1px solid var(--border)', height:ROW_H }}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--bg3)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    {/* Label */}
                    <div style={{ width:LABEL_W, flexShrink:0, padding:'0 14px', display:'flex', alignItems:'center', gap:6, borderRight:'1px solid var(--border)', cursor:'pointer' }}
                      onClick={()=>setView(`project-${t.project_id}`)}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:color, flexShrink:0 }}/>
                      <span style={{ fontSize:12, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{t.title}</span>
                      {isOverdue && <span style={{ fontSize:9, color:'var(--red)', flexShrink:0 }}>!</span>}
                    </div>

                    {/* Timeline bar */}
                    <div style={{ flex:1, position:'relative', minWidth:totalDays*COL_W, alignSelf:'center' }}>
                      {/* Today line */}
                      <div style={{ position:'absolute', left:`${todayPct}%`, top:-4, bottom:-4, width:1.5, background:'var(--accent)', opacity:0.5, zIndex:1 }}/>
                      {/* Bar */}
                      <div title={`${t.title} — Due: ${formatDate(t.due_date)}`} onClick={()=>setView(`project-${t.project_id}`)}
                        style={{ position:'absolute', left:`${barStart}%`, width:`${barW}%`, height:18, top:'50%', transform:'translateY(-50%)',
                          background:isOverdue?'var(--red)':color, borderRadius:9, cursor:'pointer', minWidth:8, opacity:0.85,
                          display:'flex', alignItems:'center', paddingLeft:6, overflow:'hidden',
                          boxShadow:`0 2px 6px ${color}44`,
                        }}>
                        <span style={{ fontSize:9, color:'#fff', fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.title}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display:'flex', gap:16, marginTop:14, fontSize:12, color:'var(--text2)', flexWrap:'wrap' }}>
          {groupBy==='project'
            ? Object.entries(STATUS_COLOR).map(([s,c]) => <span key={s} style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:10, height:10, borderRadius:'50%', background:c, display:'inline-block' }}/>{s==='in_progress'?'In Progress':s==='done'?'Done':'To Do'}</span>)
            : groupBy==='priority'
            ? Object.entries(PRIORITY_COLOR).map(([p,c]) => <span key={p} style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:10, height:10, borderRadius:'50%', background:c, display:'inline-block' }}/>{p.charAt(0).toUpperCase()+p.slice(1)}</span>)
            : Object.entries(STATUS_COLOR).map(([s,c]) => <span key={s} style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:10, height:10, borderRadius:'50%', background:c, display:'inline-block' }}/>{s==='in_progress'?'In Progress':s==='done'?'Done':'To Do'}</span>)
          }
          <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:10, height:10, borderRadius:'50%', background:'var(--red)', display:'inline-block' }}/>Overdue</span>
          <span style={{ display:'flex', alignItems:'center', gap:5, marginLeft:'auto', color:'var(--text3)' }}>Orange line = Today · Click any bar to open project</span>
        </div>
      </div>
    </>
  );
}
