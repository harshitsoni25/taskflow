import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from './api';

const initials = n => n ? n.split(' ').map(x=>x[0]).join('').toUpperCase().slice(0,2) : '?';
const avatarColor = n => { const c=['#6366f1','#f59e0b','#10b981','#ef4444','#8b5cf6','#ec4899']; let h=0; for(const x of(n||''))h=(h*31+x.charCodeAt(0))%c.length; return c[h]; };

const loadForums = () => { try { return JSON.parse(localStorage.getItem('taskflow_forums')||'[]'); } catch { return []; } };
const saveForums = d => { try { localStorage.setItem('taskflow_forums',JSON.stringify(d)); } catch {} };

const TAGS = ['Question','Idea','Bug','Discussion','Announcement'];
const TAG_COLORS = { Question:'#6366f1', Idea:'#10b981', Bug:'#ef4444', Discussion:'#f59e0b', Announcement:'#ec4899' };

function seedForums(projects, userName) {
  if (loadForums().length > 0) return;
  const now = Date.now(); const MIN = 60000;
  const topics = projects.flatMap((p, pi) => [
    {
      id:`f${pi}1`, project_id:p.id, project_name:p.name,
      title:`How should we handle the ${p.name} deployment process?`,
      tag:'Discussion', author:'Alice Johnson', created_at:now-(pi*3+5)*60*MIN, views:12+pi*3,
      replies:[
        { id:`r${pi}1a`, author:'Bob Martinez',  text:'We should use CI/CD with GitHub Actions. That way every push to main triggers a deploy automatically.', ts:now-(pi*3+4)*60*MIN },
        { id:`r${pi}1b`, author: userName||'You', text:'Agreed! Let me set up the workflow file. Should take about an hour.', ts:now-(pi*3+3)*60*MIN },
      ],
    },
    {
      id:`f${pi}2`, project_id:p.id, project_name:p.name,
      title:`[${p.name}] Weekly standup format suggestions`,
      tag:'Idea', author:'Carol Lee', created_at:now-(pi*2+2)*60*MIN, views:8+pi,
      replies:[
        { id:`r${pi}2a`, author:'Alice Johnson', text:'I suggest 15 min daily standups — What did I do yesterday? What am I doing today? Any blockers?', ts:now-(pi*2+1)*60*MIN },
      ],
    },
    {
      id:`f${pi}3`, project_id:p.id, project_name:p.name,
      title:`Best practices for code reviews on ${p.name}`,
      tag:'Question', author:'Bob Martinez', created_at:now-pi*60*MIN, views:5+pi*2,
      replies:[],
    },
  ]);
  saveForums(topics);
}

function timeAgo(ts) {
  const d=(Date.now()-ts)/1000;
  if(d<60)return 'just now';
  if(d<3600)return`${Math.floor(d/60)}m ago`;
  if(d<86400)return`${Math.floor(d/3600)}h ago`;
  return`${Math.floor(d/86400)}d ago`;
}

export default function ForumsPage() {
  const { user } = useAuth();
  const [topics, setTopics]   = useState([]);
  const [selected, setSelected] = useState(null);
  const [reply, setReply]     = useState('');
  const [filter, setFilter]   = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTag, setNewTag]   = useState('Discussion');
  const [newBody, setNewBody] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/projects').then(r => {
      seedForums(r.data.projects||[], user?.name);
      setTopics(loadForums());
    }).catch(()=>setTopics(loadForums())).finally(()=>setLoading(false));
  }, []);

  const filtered = topics.filter(t => {
    if (filter && t.project_id !== filter) return false;
    if (tagFilter && t.tag !== tagFilter) return false;
    return true;
  });

  const sendReply = () => {
    if (!reply.trim() || !selected) return;
    const r = { id:Date.now().toString(), author:user?.name||'You', text:reply.trim(), ts:Date.now() };
    const updated = topics.map(t => t.id===selected.id ? {...t, replies:[...t.replies,r]} : t);
    saveForums(updated); setTopics(updated);
    const sel = updated.find(t=>t.id===selected.id);
    setSelected(sel); setReply('');
  };

  const createTopic = () => {
    if (!newTitle.trim()) return;
    const t = { id:Date.now().toString(), project_id:'', project_name:'General', title:newTitle.trim(), tag:newTag, author:user?.name||'You', created_at:Date.now(), views:1, replies:newBody.trim()?[{id:'r0',author:user?.name||'You',text:newBody.trim(),ts:Date.now()}]:[] };
    const updated = [t,...topics]; saveForums(updated); setTopics(updated);
    setShowNew(false); setNewTitle(''); setNewBody(''); setNewTag('Discussion');
    setSelected(t);
  };

  if (loading) return <div className="loading"><div className="spinner"/></div>;

  return (
    <>
      <div className="page-header">
        <div><div className="page-title">Forums</div><div className="page-subtitle">{topics.length} topics · {topics.reduce((a,t)=>a+t.replies.length,0)} replies</div></div>
        <button className="btn btn-primary btn-sm" onClick={()=>setShowNew(true)}>+ New Topic</button>
      </div>
      <div className="page-body">

        {showNew && (
          <div className="modal-overlay" onClick={()=>setShowNew(false)}>
            <div className="modal" onClick={e=>e.stopPropagation()} style={{ maxWidth:560 }}>
              <div className="modal-header"><div className="modal-title">New Topic</div><button className="modal-close" onClick={()=>setShowNew(false)}>✕</button></div>
              <div className="form-group"><label className="form-label">Title</label><input className="form-input" value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Topic title..." autoFocus/></div>
              <div className="form-group"><label className="form-label">Tag</label>
                <select className="form-input" value={newTag} onChange={e=>setNewTag(e.target.value)}>{TAGS.map(t=><option key={t}>{t}</option>)}</select>
              </div>
              <div className="form-group"><label className="form-label">Body (optional)</label><textarea className="form-input" value={newBody} onChange={e=>setNewBody(e.target.value)} placeholder="Describe your topic..." rows={4}/></div>
              <div className="modal-actions"><button className="btn btn-ghost" onClick={()=>setShowNew(false)}>Cancel</button><button className="btn btn-primary" onClick={createTopic}>Post Topic</button></div>
            </div>
          </div>
        )}

        <div style={{ display:'flex', gap:16, height:'calc(100vh-200px)', minHeight:400 }}>

          {/* Topic list */}
          <div style={{ width:340, flexShrink:0, display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <select value={tagFilter} onChange={e=>setTagFilter(e.target.value)}
                style={{ flex:1, padding:'7px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg2)', color:'var(--text)', fontSize:12, cursor:'pointer' }}>
                <option value="">All Tags</option>{TAGS.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:6 }}>
              {filtered.length===0
                ? <div style={{ textAlign:'center', color:'var(--text3)', fontSize:13, paddingTop:32 }}>No topics yet</div>
                : filtered.map(t => (
                <div key={t.id} onClick={()=>setSelected(t)}
                  style={{ padding:'12px 14px', borderRadius:8, cursor:'pointer', background:selected?.id===t.id?'var(--bg3)':'var(--bg2)', border:`1px solid ${selected?.id===t.id?'var(--accent)':'var(--border)'}`, transition:'all 0.15s' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:6 }}>
                    <span style={{ padding:'2px 8px', borderRadius:10, fontSize:10, fontWeight:700, flexShrink:0, background:TAG_COLORS[t.tag]+'22', color:TAG_COLORS[t.tag] }}>{t.tag}</span>
                    <span style={{ fontSize:13, fontWeight:600, color:'var(--text)', lineHeight:1.4 }}>{t.title}</span>
                  </div>
                  <div style={{ fontSize:11, color:'var(--text3)', display:'flex', gap:10 }}>
                    <span>👤 {t.author}</span>
                    <span>💬 {t.replies.length}</span>
                    <span>👁 {t.views}</span>
                    <span>🕐 {timeAgo(t.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Topic detail */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
            {!selected ? (
              <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'var(--text3)' }}>
                <span style={{ fontSize:48, marginBottom:12 }}>🗣️</span>
                <span style={{ fontSize:14 }}>Select a topic to read</span>
              </div>
            ) : (
              <>
                <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                    <span style={{ padding:'2px 10px', borderRadius:10, fontSize:10, fontWeight:700, background:TAG_COLORS[selected.tag]+'22', color:TAG_COLORS[selected.tag] }}>{selected.tag}</span>
                    {selected.project_name && <span style={{ fontSize:11, color:'var(--text3)' }}>📁 {selected.project_name}</span>}
                  </div>
                  <div style={{ fontWeight:700, fontSize:17, color:'var(--text)', marginBottom:4 }}>{selected.title}</div>
                  <div style={{ fontSize:12, color:'var(--text3)' }}>Posted by {selected.author} · {timeAgo(selected.created_at)} · {selected.views} views</div>
                </div>

                <div style={{ flex:1, overflowY:'auto', padding:'16px 20px', display:'flex', flexDirection:'column', gap:12 }}>
                  {selected.replies.length===0
                    ? <div style={{ textAlign:'center', color:'var(--text3)', fontSize:13, paddingTop:24 }}>No replies yet. Be the first to respond!</div>
                    : selected.replies.map(r => (
                    <div key={r.id} style={{ display:'flex', gap:12 }}>
                      <div style={{ width:34, height:34, borderRadius:'50%', background:avatarColor(r.author), display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0 }}>{initials(r.author)}</div>
                      <div style={{ flex:1, background:'var(--bg3)', borderRadius:'0 10px 10px 10px', padding:'10px 14px' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                          <span style={{ fontWeight:700, fontSize:13, color:'var(--text)' }}>{r.author}</span>
                          <span style={{ fontSize:11, color:'var(--text3)' }}>{timeAgo(r.ts)}</span>
                        </div>
                        <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.6 }}>{r.text}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ padding:'12px 20px', borderTop:'1px solid var(--border)', display:'flex', gap:10 }}>
                  <textarea value={reply} onChange={e=>setReply(e.target.value)}
                    onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendReply();}}}
                    placeholder="Write a reply... (Enter to send)"
                    rows={2}
                    style={{ flex:1, padding:'8px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg3)', color:'var(--text)', fontSize:13, resize:'none', outline:'none' }}/>
                  <button onClick={sendReply} disabled={!reply.trim()}
                    style={{ background:reply.trim()?'var(--accent)':'var(--bg3)', border:'none', borderRadius:8, padding:'8px 16px', color:reply.trim()?'#fff':'var(--text3)', fontSize:13, fontWeight:600, cursor:reply.trim()?'pointer':'default', alignSelf:'flex-end', transition:'background 0.15s' }}>
                    Reply
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
