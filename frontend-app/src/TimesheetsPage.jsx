import { useState, useEffect } from 'react';
import api from './api';

const initials = (name) => name ? name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) : '?';
const avatarColor = (name) => {
  const colors = ['#6366f1','#f59e0b','#10b981','#ef4444','#8b5cf6','#ec4899'];
  let h = 0; for (const c of (name||'')) h = (h*31+c.charCodeAt(0))%colors.length;
  return colors[h];
};

const WEEKS = ['Week 1','Week 2','Week 3','Week 4'];
const HOURS = [2,3,4,5,6,7,8,5,4,6,7,3,2,5,6,7,4,3,5,8,6,4,3,5]; // 24 fake weekly data points

export default function TimesheetsPage({ setView }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner"/></div>;

  const users = data?.tasksPerUser || [];
  const allTasks = data?.myTasks || [];

  // Generate mock timesheet data per user based on task counts
  const timesheetData = users.map((u, i) => ({
    ...u,
    hoursThisWeek: 6 + (u.task_count * 1.5) % 16,
    hoursLastWeek: 5 + (u.task_count * 1.8) % 18,
    hoursTotal:    (u.task_count * 4.5).toFixed(1),
    weeklyHours: WEEKS.map((_, wi) => Math.round(2 + (u.task_count + i + wi) % 8)),
  }));

  const totalHoursWeek = timesheetData.reduce((a,u)=>a+u.hoursThisWeek,0).toFixed(1);
  const maxBar = Math.max(...timesheetData.flatMap(u => u.weeklyHours), 1);

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Timesheets</div>
          <div className="page-subtitle">Track time logged across projects and team members</div>
        </div>
      </div>
      <div className="page-body">

        {/* KPI row */}
        <div className="stats-grid" style={{ marginBottom:24 }}>
          <div className="stat-card blue">   <div className="stat-label">Hrs This Week</div><div className="stat-value blue">{totalHoursWeek}</div></div>
          <div className="stat-card green">  <div className="stat-label">Active Members</div><div className="stat-value green">{users.length}</div></div>
          <div className="stat-card yellow"> <div className="stat-label">Tasks Tracked</div><div className="stat-value yellow">{allTasks.length}</div></div>
          <div className="stat-card purple"> <div className="stat-label">Avg Hrs/Member</div><div className="stat-value purple">{users.length?Math.round(Number(totalHoursWeek)/users.length):0}</div></div>
        </div>

        <div className="filter-bar" style={{ marginBottom:20 }}>
          {['overview','weekly'].map(t => (
            <button key={t} className="btn btn-ghost btn-sm"
              style={{ background:tab===t?'var(--bg3)':'transparent', color:tab===t?'var(--text)':'var(--text2)', textTransform:'capitalize' }}
              onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>

        {users.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">⏱️</div><div className="empty-title">No timesheet data yet</div></div>
        ) : tab === 'overview' ? (
          <div className="card">
            <div className="card-title">Team Time Log — This Week</div>
            <table>
              <thead><tr>
                <th>Member</th><th>This Week</th><th>Last Week</th><th>Total</th><th>Utilisation</th>
              </tr></thead>
              <tbody>
                {timesheetData.map(u => {
                  const util = Math.min(100, Math.round(u.hoursThisWeek / 40 * 100));
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{
                            width:28, height:28, borderRadius:'50%', background:avatarColor(u.name),
                            display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#fff',
                          }}>{initials(u.name)}</div>
                          <span style={{ fontWeight:500, color:'var(--text)' }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ color:'var(--text)', fontWeight:600 }}>{u.hoursThisWeek.toFixed(1)}h</td>
                      <td style={{ color:'var(--text2)' }}>{u.hoursLastWeek.toFixed(1)}h</td>
                      <td style={{ color:'var(--text2)' }}>{u.hoursTotal}h</td>
                      <td style={{ width:140 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div className="progress-bar" style={{ flex:1 }}>
                            <div className="progress-fill" style={{
                              width:`${util}%`,
                              background: util>80?'var(--red)':util>50?'var(--yellow)':'var(--green)',
                            }}/>
                          </div>
                          <span style={{ fontSize:11, color:'var(--text3)', flexShrink:0 }}>{util}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card">
            <div className="card-title">Weekly Hours — Last 4 Weeks</div>
            <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
              {timesheetData.map(u => (
                <div key={u.id} style={{ flex:'1 1 200px', minWidth:160 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                    <div style={{ width:24, height:24, borderRadius:'50%', background:avatarColor(u.name), display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:'#fff' }}>{initials(u.name)}</div>
                    <span style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{u.name}</span>
                  </div>
                  <div style={{ display:'flex', gap:8, alignItems:'flex-end', height:80 }}>
                    {u.weeklyHours.map((h, i) => (
                      <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                        <span style={{ fontSize:9, color:'var(--text3)' }}>{h}h</span>
                        <div style={{
                          width:'100%', background:avatarColor(u.name)+'88', borderRadius:'4px 4px 0 0',
                          height:`${h/maxBar*60}px`, minHeight:4, transition:'height 0.4s',
                        }}/>
                        <span style={{ fontSize:8, color:'var(--text3)' }}>W{i+1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
