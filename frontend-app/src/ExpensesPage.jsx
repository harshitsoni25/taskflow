import { useState, useEffect } from 'react';
import api from './api';

// Generate deterministic expenses per project from seed
function generateExpenses(projects) {
  const CATEGORIES = ['Software', 'Design', 'Infrastructure', 'Marketing', 'Travel', 'Training'];
  const VENDORS = ['AWS', 'Figma', 'GitHub', 'Notion', 'Slack', 'Zoom', 'Vercel', 'Linear'];
  const STATUS = ['paid', 'paid', 'paid', 'pending', 'approved'];

  const expenses = [];
  projects.forEach((p, pi) => {
    const budget = 5000 + (pi * 3000) + ((p.name?.length || 0) * 100);
    const count = 4 + (pi % 3);
    let spent = 0;
    for (let i = 0; i < count; i++) {
      const amount = Math.round((200 + ((pi * 7 + i * 13) % 800)) * 10) / 10;
      spent += amount;
      const daysAgo = (pi * 5 + i * 7) % 30;
      const date = new Date(); date.setDate(date.getDate() - daysAgo);
      expenses.push({
        id: `${p.id}-exp-${i}`,
        project_id: p.id,
        project_name: p.name,
        category: CATEGORIES[(pi * 3 + i) % CATEGORIES.length],
        vendor: VENDORS[(pi * 2 + i) % VENDORS.length],
        description: `${CATEGORIES[(pi * 3 + i) % CATEGORIES.length]} expense for ${p.name}`,
        amount,
        date: date.toISOString().split('T')[0],
        status: STATUS[(pi + i) % STATUS.length],
        budget,
        spent: Math.min(spent, budget),
      });
    }
  });
  return expenses;
}

const STATUS_META = {
  paid:     { color:'var(--green)',  bg:'rgba(16,185,129,0.1)',  label:'Paid'     },
  pending:  { color:'var(--yellow)', bg:'rgba(245,158,11,0.1)',  label:'Pending'  },
  approved: { color:'var(--accent)', bg:'rgba(99,102,241,0.1)',  label:'Approved' },
};

function formatCurrency(n) { return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 })}`; }
function formatCurrencyCompact(n) {
  const num = Number(n);
  if (num >= 100000) return `₹${(num/100000).toFixed(1)}L`;
  if (num >= 1000)   return `₹${(num/1000).toFixed(1)}K`;
  return `₹${num.toFixed(0)}`;
}
function formatDate(d) { return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }); }

export default function ExpensesPage() {
  const [projects, setProjects] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filterProject, setFilterProject] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus]   = useState('');

  useEffect(() => {
    api.get('/projects').then(r => {
      const ps = r.data.projects || [];
      setProjects(ps);
      setExpenses(generateExpenses(ps));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner"/></div>;

  const filtered = expenses.filter(e => {
    if (filterProject  && e.project_id !== filterProject) return false;
    if (filterCategory && e.category !== filterCategory) return false;
    if (filterStatus   && e.status !== filterStatus) return false;
    return true;
  });

  const totalBudget  = [...new Map(expenses.map(e => [e.project_id, e])).values()].reduce((a,e)=>a+e.budget,0);
  const totalSpent   = filtered.reduce((a,e)=>a+e.amount,0);
  const totalPending = filtered.filter(e=>e.status==='pending').reduce((a,e)=>a+e.amount,0);
  const categories   = [...new Set(expenses.map(e=>e.category))];

  // Per-project budget breakdown
  const projectBudgets = projects.map(p => {
    const pExp = expenses.filter(e => e.project_id === p.id);
    const budget = pExp[0]?.budget || 5000;
    const spent  = pExp.reduce((a,e)=>a+e.amount,0);
    return { ...p, budget, spent, pct: Math.min(100, Math.round(spent/budget*100)) };
  });

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Expenses</div>
          <div className="page-subtitle">Project budget and expense tracking</div>
        </div>
      </div>
      <div className="page-body">

        {/* KPIs */}
        <div className="stats-grid" style={{ marginBottom:24 }}>
          <div className="stat-card blue">   <div className="stat-label">Total Budget</div> <div className="stat-value blue"  >{formatCurrencyCompact(totalBudget)}</div></div>
          <div className="stat-card red">    <div className="stat-label">Total Spent</div>  <div className="stat-value red"   >{formatCurrencyCompact(totalSpent)}</div></div>
          <div className="stat-card yellow"> <div className="stat-label">Pending</div>      <div className="stat-value yellow">{formatCurrencyCompact(totalPending)}</div></div>
          <div className="stat-card green">  <div className="stat-label">Remaining</div>    <div className="stat-value green" >{formatCurrencyCompact(Math.max(0,totalBudget-totalSpent))}</div></div>
        </div>

        {/* Budget per project */}
        <div className="card" style={{ marginBottom:20 }}>
          <div className="card-title">Budget Utilisation by Project</div>
          {projectBudgets.map(p => (
            <div key={p.id} style={{ marginBottom:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5, fontSize:13 }}>
                <span style={{ fontWeight:500, color:'var(--text)' }}>{p.name}</span>
                <span style={{ color:'var(--text2)', fontSize:12 }}>
                  {formatCurrency(p.spent)} / {formatCurrency(p.budget)}
                  <span style={{ marginLeft:8, color: p.pct>85?'var(--red)':p.pct>60?'var(--yellow)':'var(--green)', fontWeight:600 }}>{p.pct}%</span>
                </span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{
                  width:`${p.pct}%`,
                  background: p.pct>85?'var(--red)':p.pct>60?'var(--yellow)':'var(--green)',
                }}/>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
          <select value={filterProject} onChange={e=>setFilterProject(e.target.value)}
            style={{ padding:'8px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg2)', color:'var(--text)', fontSize:13, cursor:'pointer' }}>
            <option value="">All Projects</option>
            {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={filterCategory} onChange={e=>setFilterCategory(e.target.value)}
            style={{ padding:'8px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg2)', color:'var(--text)', fontSize:13, cursor:'pointer' }}>
            <option value="">All Categories</option>
            {categories.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
            style={{ padding:'8px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg2)', color:'var(--text)', fontSize:13, cursor:'pointer' }}>
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
          </select>
          <span style={{ marginLeft:'auto', fontSize:12, color:'var(--text3)', alignSelf:'center' }}>{filtered.length} records</span>
        </div>

        {/* Expense table */}
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <table>
            <thead><tr>
              <th>Date</th><th>Project</th><th>Category</th><th>Vendor</th><th>Description</th>
              <th style={{ textAlign:'right' }}>Amount</th><th>Status</th>
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign:'center', color:'var(--text3)', padding:32 }}>No expenses found</td></tr>
              ) : filtered.map(e => {
                const sm = STATUS_META[e.status] || STATUS_META.pending;
                return (
                  <tr key={e.id}>
                    <td style={{ color:'var(--text2)', whiteSpace:'nowrap' }}>{formatDate(e.date)}</td>
                    <td style={{ fontWeight:500 }}>{e.project_name}</td>
                    <td><span style={{ padding:'3px 8px', borderRadius:6, fontSize:11, background:'var(--bg3)', color:'var(--text2)' }}>{e.category}</span></td>
                    <td style={{ color:'var(--text2)' }}>{e.vendor}</td>
                    <td style={{ color:'var(--text2)', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.description}</td>
                    <td style={{ textAlign:'right', fontWeight:600, color:'var(--text)' }}>{formatCurrency(e.amount)}</td>
                    <td><span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:sm.bg, color:sm.color }}>{sm.label}</span></td>
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
