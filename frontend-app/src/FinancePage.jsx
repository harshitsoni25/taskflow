import { useState, useEffect } from 'react';
import api from './api';

function formatK(n) {
  if (n >= 100000) return `₹${(n/100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n/1000).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
}
function formatFull(n) { return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits:0 })}`; }

// Deterministic financial data from projects
function buildFinanceData(projects) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun'];
  return projects.map((p, pi) => {
    const budget   = 50000 + pi * 30000 + (p.name?.length || 0) * 500;
    const spent    = budget * (0.3 + (pi * 0.17) % 0.55);
    const forecast = budget * (0.75 + (pi * 0.09) % 0.2);
    const monthlyBudget = budget / 6;
    const monthly  = months.map((m, mi) => ({
      month: m,
      budget: Math.round(monthlyBudget),
      actual: Math.round(monthlyBudget * (0.5 + (pi * mi * 0.13) % 0.8)),
    }));
    return { ...p, budget, spent, forecast, monthly,
      variance: budget - forecast,
      roi: Math.round(80 + (pi * 7) % 40),
    };
  });
}

export default function FinancePage() {
  const [projects, setProjects] = useState([]);
  const [finData, setFinData]   = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/projects').then(r => {
      const ps = r.data.projects || [];
      const fd = buildFinanceData(ps);
      setProjects(ps); setFinData(fd);
      if (fd.length) setSelected(fd[0]);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner"/></div>;

  const totalBudget   = finData.reduce((a,p)=>a+p.budget,0);
  const totalSpent    = finData.reduce((a,p)=>a+p.spent,0);
  const totalForecast = finData.reduce((a,p)=>a+p.forecast,0);
  const avgROI        = finData.length ? Math.round(finData.reduce((a,p)=>a+p.roi,0)/finData.length) : 0;

  const BarChart = ({ data, maxVal }) => (
    <div style={{ display:'flex', gap:6, alignItems:'flex-end', height:120, padding:'0 4px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
          <div style={{ width:'100%', display:'flex', gap:2, alignItems:'flex-end', height:90 }}>
            <div title={`Budget: ${formatFull(d.budget)}`} style={{ flex:1, background:'var(--bg3)', borderRadius:'3px 3px 0 0', height:`${d.budget/maxVal*90}px`, minHeight:2 }}/>
            <div title={`Actual: ${formatFull(d.actual)}`} style={{ flex:1, background: d.actual>d.budget?'var(--red)':'var(--accent)', borderRadius:'3px 3px 0 0', height:`${d.actual/maxVal*90}px`, minHeight:2 }}/>
          </div>
          <span style={{ fontSize:9, color:'var(--text3)' }}>{d.month}</span>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Finance</div>
          <div className="page-subtitle">Budget planning and financial overview</div>
        </div>
      </div>
      <div className="page-body">

        {/* Global KPIs */}
        <div className="stats-grid" style={{ marginBottom:24 }}>
          <div className="stat-card blue">   <div className="stat-label">Total Budget</div>  <div className="stat-value blue"  >{formatK(totalBudget)}</div></div>
          <div className="stat-card red">    <div className="stat-label">Spent to Date</div> <div className="stat-value red"   >{formatK(totalSpent)}</div></div>
          <div className="stat-card yellow"> <div className="stat-label">Forecasted</div>    <div className="stat-value yellow">{formatK(totalForecast)}</div></div>
          <div className="stat-card green">  <div className="stat-label">Avg ROI</div>       <div className="stat-value green" >{avgROI}%</div></div>
          <div className="stat-card purple"> <div className="stat-label">Variance</div>      <div className="stat-value purple">{formatK(Math.abs(totalBudget-totalForecast))}</div></div>
        </div>

        <div className="grid-2" style={{ marginBottom:20 }}>
          {/* Project selector + summary */}
          <div className="card">
            <div className="card-title">Project Budgets</div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {finData.map(p => {
                const pct = Math.round(p.spent/p.budget*100);
                const isSelected = selected?.id===p.id;
                return (
                  <div key={p.id} onClick={() => setSelected(p)}
                    style={{ padding:'12px 14px', borderRadius:8, cursor:'pointer', border:`1px solid ${isSelected?'var(--accent)':'var(--border)'}`, background:isSelected?'var(--bg3)':'transparent', transition:'all 0.15s' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                      <span style={{ fontWeight:600, fontSize:13, color:'var(--text)' }}>{p.name}</span>
                      <span style={{ fontSize:12, color:'var(--text2)' }}>{formatK(p.spent)} / {formatK(p.budget)}</span>
                    </div>
                    <div className="progress-bar" style={{ marginTop:0 }}>
                      <div className="progress-fill" style={{ width:`${Math.min(100,pct)}%`, background:pct>85?'var(--red)':pct>60?'var(--yellow)':'var(--green)' }}/>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginTop:5, fontSize:11, color:'var(--text3)' }}>
                      <span>{pct}% used</span>
                      <span>ROI: {p.roi}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly breakdown for selected project */}
          {selected && (
            <div className="card">
              <div className="card-title">{selected.name} — Monthly Breakdown</div>
              <BarChart data={selected.monthly} maxVal={Math.max(...selected.monthly.flatMap(d=>[d.budget,d.actual]))*1.1}/>
              <div style={{ display:'flex', gap:16, marginTop:12, fontSize:11, color:'var(--text3)', justifyContent:'center' }}>
                <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:10, height:10, background:'var(--bg3)', borderRadius:2, display:'inline-block' }}/>Budget</span>
                <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:10, height:10, background:'var(--accent)', borderRadius:2, display:'inline-block' }}/>Actual</span>
                <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:10, height:10, background:'var(--red)', borderRadius:2, display:'inline-block' }}/>Over Budget</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:16 }}>
                {[
                  { label:'Total Budget', val:formatFull(selected.budget), color:'var(--blue)'   },
                  { label:'Spent',        val:formatFull(selected.spent),   color:'var(--red)'   },
                  { label:'Forecasted',   val:formatFull(selected.forecast), color:'var(--yellow)'},
                  { label:'ROI',          val:`${selected.roi}%`,           color:'var(--green)' },
                ].map(s => (
                  <div key={s.label} style={{ background:'var(--bg3)', borderRadius:8, padding:'10px 12px' }}>
                    <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>{s.label}</div>
                    <div style={{ fontSize:16, fontWeight:700, color:s.color }}>{s.val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Summary table */}
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <table>
            <thead><tr>
              <th>Project</th><th>Budget</th><th>Spent</th><th>Forecast</th><th>Variance</th><th>ROI</th><th>Status</th>
            </tr></thead>
            <tbody>
              {finData.map(p => {
                const variance = p.budget - p.forecast;
                const onTrack = variance >= 0;
                return (
                  <tr key={p.id} onClick={() => setSelected(p)} style={{ cursor:'pointer' }}>
                    <td style={{ fontWeight:500, color:'var(--text)' }}>{p.name}</td>
                    <td>{formatFull(p.budget)}</td>
                    <td style={{ color:'var(--red)' }}>{formatFull(p.spent)}</td>
                    <td style={{ color:'var(--yellow)' }}>{formatFull(p.forecast)}</td>
                    <td style={{ color:onTrack?'var(--green)':'var(--red)', fontWeight:600 }}>{onTrack?'+':'-'}{formatFull(Math.abs(variance))}</td>
                    <td style={{ color:'var(--green)', fontWeight:600 }}>{p.roi}%</td>
                    <td><span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:onTrack?'rgba(16,185,129,0.1)':'rgba(239,68,68,0.1)', color:onTrack?'var(--green)':'var(--red)' }}>{onTrack?'On Budget':'Over Budget'}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
