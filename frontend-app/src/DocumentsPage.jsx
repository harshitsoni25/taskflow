import { useState, useEffect } from 'react';
import api from './api';

const CATEGORIES = ['Design', 'Technical', 'Meeting Notes', 'Requirements', 'General'];
const ICONS = { Design:'🎨', Technical:'⚙️', 'Meeting Notes':'📝', Requirements:'📋', General:'📄' };

const loadDocs = () => { try { return JSON.parse(localStorage.getItem('taskflow_docs') || '[]'); } catch { return []; } };
const saveDocs = (d) => { try { localStorage.setItem('taskflow_docs', JSON.stringify(d)); } catch {} };

function seedDocs(projects) {
  const existing = loadDocs();
  if (existing.length > 0) return;
  const now = Date.now();
  const MIN = 60000;
  const seeds = projects.flatMap((p, pi) => [
    { id:`d${pi}1`, project_id:p.id, project_name:p.name, title:`${p.name} — Project Brief`, category:'Requirements', content:`# ${p.name} — Project Brief\n\n## Overview\nThis document outlines the scope, goals, and deliverables for the ${p.name} project.\n\n## Goals\n- Deliver on time and within budget\n- Ensure high quality standards\n- Maintain clear communication across the team\n\n## Timeline\nSee the Calendar and Gantt views for detailed task timelines.\n\n## Team\nRefer to the Users section for team member details and responsibilities.`, created_at: now - (pi*3+1)*60*MIN, updated_at: now - (pi*3+1)*60*MIN },
    { id:`d${pi}2`, project_id:p.id, project_name:p.name, title:`${p.name} — Meeting Notes`, category:'Meeting Notes', content:`# ${p.name} — Meeting Notes\n\n## Kickoff Meeting\n**Date:** ${new Date(now-(pi*2+5)*24*60*MIN).toLocaleDateString()}\n\n### Attendees\n- All project members\n\n### Agenda\n1. Project overview and goals\n2. Task assignment\n3. Timeline review\n4. Q&A\n\n### Action Items\n- [ ] Review and confirm task assignments\n- [ ] Set up communication channels\n- [ ] Schedule next sync`, created_at: now - (pi*2+2)*60*MIN, updated_at: now - (pi*2+2)*60*MIN },
    { id:`d${pi}3`, project_id:p.id, project_name:p.name, title:`${p.name} — Technical Spec`, category:'Technical', content:`# ${p.name} — Technical Specification\n\n## Architecture\nThis document describes the technical architecture and implementation details.\n\n## Tech Stack\n- Frontend: React + Vite\n- Backend: Node.js + Express\n- Database: SQLite (libsql)\n- Auth: JWT\n\n## API Endpoints\nAll API routes follow REST conventions and require JWT authentication.\n\n## Deployment\nHosted on Railway with automatic deployments from the main branch.`, created_at: now - pi*60*MIN, updated_at: now - pi*60*MIN },
  ]);
  saveDocs(seeds);
}

export default function DocumentsPage() {
  const [projects, setProjects] = useState([]);
  const [docs, setDocs]         = useState([]);
  const [filter, setFilter]     = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [editing, setEditing]   = useState(false);
  const [editContent, setEditContent] = useState('');
  const [showNew, setShowNew]   = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCat, setNewCat]     = useState('General');
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/projects').then(r => {
      const ps = r.data.projects || [];
      setProjects(ps);
      seedDocs(ps);
      setDocs(loadDocs());
    }).catch(() => setDocs(loadDocs())).finally(() => setLoading(false));
  }, []);

  const filtered = docs.filter(d => {
    if (filter && d.project_id !== filter) return false;
    if (catFilter && d.category !== catFilter) return false;
    return true;
  });

  const createDoc = () => {
    if (!newTitle.trim()) return;
    const project = projects[0];
    const doc = {
      id: Date.now().toString(), project_id: project?.id || '', project_name: project?.name || '',
      title: newTitle.trim(), category: newCat,
      content: `# ${newTitle.trim()}\n\nStart writing here...`,
      created_at: Date.now(), updated_at: Date.now(),
    };
    const updated = [doc, ...docs];
    saveDocs(updated); setDocs(updated);
    setSelected(doc); setEditing(true); setEditContent(doc.content);
    setShowNew(false); setNewTitle(''); setNewCat('General');
  };

  const saveEdit = () => {
    const updated = docs.map(d => d.id === selected.id ? { ...d, content: editContent, updated_at: Date.now() } : d);
    saveDocs(updated); setDocs(updated);
    setSelected({ ...selected, content: editContent });
    setEditing(false);
  };

  const deleteDoc = (id) => {
    if (!confirm('Delete this document?')) return;
    const updated = docs.filter(d => d.id !== id);
    saveDocs(updated); setDocs(updated);
    if (selected?.id === id) setSelected(null);
  };

  const timeAgo = (ts) => {
    const d = (Date.now() - ts) / 1000;
    if (d < 3600) return `${Math.floor(d/60)}m ago`;
    if (d < 86400) return `${Math.floor(d/3600)}h ago`;
    return `${Math.floor(d/86400)}d ago`;
  };

  if (loading) return <div className="loading"><div className="spinner"/></div>;

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Documents</div>
          <div className="page-subtitle">{docs.length} documents across {projects.length} projects</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}>+ New Document</button>
      </div>
      <div className="page-body">

        {/* New doc modal */}
        {showNew && (
          <div className="modal-overlay" onClick={() => setShowNew(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header"><div className="modal-title">New Document</div><button className="modal-close" onClick={() => setShowNew(false)}>✕</button></div>
              <div className="form-group"><label className="form-label">Title</label><input className="form-input" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Document title..." autoFocus/></div>
              <div className="form-group"><label className="form-label">Category</label>
                <select className="form-input" value={newCat} onChange={e => setNewCat(e.target.value)}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="modal-actions"><button className="btn btn-ghost" onClick={() => setShowNew(false)}>Cancel</button><button className="btn btn-primary" onClick={createDoc}>Create</button></div>
            </div>
          </div>
        )}

        <div style={{ display:'flex', gap:16, height:'calc(100vh - 200px)', minHeight:400 }}>
          {/* Doc list */}
          <div style={{ width:300, flexShrink:0, display:'flex', flexDirection:'column', gap:10 }}>
            {/* Filters */}
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <select value={filter} onChange={e => setFilter(e.target.value)}
                style={{ flex:1, padding:'7px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg2)', color:'var(--text)', fontSize:12, cursor:'pointer' }}>
                <option value="">All Projects</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                style={{ flex:1, padding:'7px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg2)', color:'var(--text)', fontSize:12, cursor:'pointer' }}>
                <option value="">All Types</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            {/* List */}
            <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:6 }}>
              {filtered.length === 0 ? (
                <div style={{ textAlign:'center', color:'var(--text3)', fontSize:13, paddingTop:32 }}>No documents found</div>
              ) : filtered.map(d => (
                <div key={d.id}
                  onClick={() => { setSelected(d); setEditing(false); }}
                  style={{
                    padding:'12px 14px', borderRadius:8, cursor:'pointer',
                    background: selected?.id===d.id ? 'var(--bg3)' : 'var(--bg2)',
                    border: `1px solid ${selected?.id===d.id ? 'var(--accent)' : 'var(--border)'}`,
                    transition:'all 0.15s',
                  }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    <span style={{ fontSize:16 }}>{ICONS[d.category]||'📄'}</span>
                    <span style={{ fontSize:13, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{d.title}</span>
                  </div>
                  <div style={{ fontSize:11, color:'var(--text3)', display:'flex', gap:8 }}>
                    <span>{d.project_name}</span>
                    <span>·</span>
                    <span>{timeAgo(d.updated_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Doc viewer / editor */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
            {!selected ? (
              <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'var(--text3)' }}>
                <span style={{ fontSize:48, marginBottom:12 }}>📄</span>
                <span style={{ fontSize:14 }}>Select a document to view</span>
              </div>
            ) : (
              <>
                {/* Doc toolbar */}
                <div style={{ padding:'12px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:18 }}>{ICONS[selected.category]||'📄'}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:15, color:'var(--text)' }}>{selected.title}</div>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>{selected.project_name} · {selected.category} · edited {timeAgo(selected.updated_at)}</div>
                  </div>
                  {editing
                    ? <><button className="btn btn-primary btn-sm" onClick={saveEdit}>Save</button><button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button></>
                    : <><button className="btn btn-ghost btn-sm" onClick={() => { setEditing(true); setEditContent(selected.content); }}>✏️ Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteDoc(selected.id)}>🗑</button></>
                  }
                </div>
                {/* Content */}
                {editing ? (
                  <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
                    style={{ flex:1, padding:24, background:'transparent', border:'none', outline:'none', resize:'none', color:'var(--text)', fontSize:14, lineHeight:1.8, fontFamily:'inherit' }}/>
                ) : (
                  <div style={{ flex:1, overflowY:'auto', padding:24 }}>
                    {selected.content.split('\n').map((line, i) => {
                      if (line.startsWith('# ')) return <h1 key={i} style={{ fontSize:22, fontWeight:800, margin:'0 0 16px', color:'var(--text)' }}>{line.slice(2)}</h1>;
                      if (line.startsWith('## ')) return <h2 key={i} style={{ fontSize:16, fontWeight:700, margin:'20px 0 8px', color:'var(--text)' }}>{line.slice(3)}</h2>;
                      if (line.startsWith('### ')) return <h3 key={i} style={{ fontSize:14, fontWeight:700, margin:'16px 0 6px', color:'var(--text)' }}>{line.slice(4)}</h3>;
                      if (line.startsWith('- ')) return <div key={i} style={{ fontSize:14, color:'var(--text2)', margin:'3px 0', paddingLeft:16 }}>• {line.slice(2)}</div>;
                      if (line.startsWith('- [ ] ')) return <div key={i} style={{ fontSize:14, color:'var(--text2)', margin:'3px 0', paddingLeft:16 }}>☐ {line.slice(6)}</div>;
                      if (line.startsWith('**') && line.endsWith('**')) return <strong key={i} style={{ display:'block', fontSize:13, color:'var(--text)', margin:'4px 0' }}>{line.slice(2,-2)}</strong>;
                      if (line === '') return <div key={i} style={{ height:8 }}/>;
                      return <p key={i} style={{ fontSize:14, color:'var(--text2)', margin:'3px 0', lineHeight:1.7 }}>{line}</p>;
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
