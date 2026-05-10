import { useState, useEffect } from 'react';
import api from './api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const STATUS_COLOR = { todo:'#6366f1', in_progress:'#f59e0b', done:'#10b981' };

export default function CalendarPage({ setView }) {
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed

  useEffect(() => {
    // Fetch all projects, then all tasks across all projects
    api.get('/projects').then(async r => {
      const projects = r.data.projects || [];
      const taskArrays = await Promise.all(
        projects.map(p => api.get(`/projects/${p.id}/tasks`).then(res =>
          (res.data.tasks || []).map(t => ({ ...t, project_name: p.name }))
        ).catch(() => []))
      );
      setTasks(taskArrays.flat());
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner"/></div>;

  // Build task map: "YYYY-MM-DD" -> tasks[]
  const taskMap = {};
  tasks.forEach(t => {
    if (!t.due_date) return;
    const key = t.due_date.split('T')[0];
    if (!taskMap[key]) taskMap[key] = [];
    taskMap[key].push(t);
  });

  const totalWithDates = tasks.filter(t => t.due_date).length;

  // Calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
  while (cells.length % 7 !== 0) cells.push(null);

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };
  const pad = n => String(n).padStart(2, '0');

  // Count tasks in current month
  const monthKey = `${year}-${pad(month + 1)}`;
  const monthTaskCount = Object.entries(taskMap).filter(([k]) => k.startsWith(monthKey)).reduce((a, [, v]) => a + v.length, 0);

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Calendar</div>
          <div className="page-subtitle">{monthTaskCount} tasks due in {MONTHS[month]} · {totalWithDates} total with due dates</div>
        </div>
      </div>
      <div className="page-body">
        {/* Nav */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <button className="btn btn-ghost btn-sm" onClick={prev}>← Prev</button>
          <div style={{ fontSize:18, fontWeight:700, color:'var(--text)' }}>{MONTHS[month]} {year}</div>
          <button className="btn btn-ghost btn-sm" onClick={next}>Next →</button>
        </div>

        {/* Day headers */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:4 }}>
          {DAYS.map(d => (
            <div key={d} style={{ textAlign:'center', fontSize:11, fontWeight:700, color:'var(--text3)', padding:'6px 0', letterSpacing:1 }}>{d}</div>
          ))}
        </div>

        {/* Calendar cells */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
          {cells.map((day, idx) => {
            if (!day) return <div key={`e-${idx}`} style={{ minHeight:90, borderRadius:8 }}/>;
            const key = `${year}-${pad(month+1)}-${pad(day)}`;
            const dayTasks = taskMap[key] || [];
            const isToday = today.getFullYear()===year && today.getMonth()===month && today.getDate()===day;
            const hasOverdue = dayTasks.some(t => t.status !== 'done' && new Date(key) < today);
            return (
              <div key={key} style={{
                minHeight:90, borderRadius:8, padding:'6px 8px',
                background: isToday ? 'rgba(99,102,241,0.08)' : 'var(--bg2)',
                border: isToday ? '1.5px solid var(--accent)' : hasOverdue ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--border)',
                position:'relative',
              }}>
                <div style={{
                  width:24, height:24, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                  background: isToday ? 'var(--accent)' : 'transparent',
                  color: isToday ? '#fff' : hasOverdue ? 'var(--red)' : 'var(--text2)',
                  fontSize:12, fontWeight:600, marginBottom:4,
                }}>{day}</div>
                {dayTasks.slice(0,3).map(t => (
                  <div key={t.id}
                    onClick={() => setView(`project-${t.project_id}`)}
                    title={`${t.title} — ${t.project_name}`}
                    style={{
                      fontSize:10, fontWeight:500, padding:'2px 5px', borderRadius:4, marginBottom:2,
                      background: STATUS_COLOR[t.status] + '22',
                      color: STATUS_COLOR[t.status],
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', cursor:'pointer',
                      borderLeft:`2px solid ${STATUS_COLOR[t.status]}`,
                    }}>{t.title}</div>
                ))}
                {dayTasks.length > 3 && (
                  <div style={{ fontSize:9, color:'var(--text3)', marginTop:2 }}>+{dayTasks.length-3} more</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend + summary */}
        <div style={{ display:'flex', gap:16, marginTop:16, fontSize:12, color:'var(--text2)', flexWrap:'wrap', alignItems:'center' }}>
          {Object.entries(STATUS_COLOR).map(([s,c]) => (
            <span key={s} style={{ display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ width:10, height:10, borderRadius:3, background:c, display:'inline-block' }}/>
              {s === 'in_progress' ? 'In Progress' : s === 'done' ? 'Done' : 'To Do'}
            </span>
          ))}
          <span style={{ marginLeft:'auto', color:'var(--text3)' }}>Click any task to open its project</span>
        </div>
      </div>
    </>
  );
}
