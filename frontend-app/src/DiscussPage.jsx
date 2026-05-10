import { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import api from './api';

const initials = (name) => name ? name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) : '?';
const avatarColor = (name) => {
  const colors = ['#6366f1','#f59e0b','#10b981','#ef4444','#8b5cf6','#ec4899','#14b8a6'];
  let h = 0; for (const c of (name||'')) h = (h*31+c.charCodeAt(0))%colors.length;
  return colors[h];
};

// Persist messages in localStorage keyed by project
const loadMsgs = (pid) => {
  try { return JSON.parse(localStorage.getItem(`discuss_${pid}`) || '[]'); } catch { return []; }
};
const saveMsgs = (pid, msgs) => {
  try { localStorage.setItem(`discuss_${pid}`, JSON.stringify(msgs)); } catch {}
};

// Seed each project with initial messages if empty
function seedMessages(projectId, projectName, members) {
  if (loadMsgs(projectId).length > 0) return;
  const now = Date.now();
  const MIN = 60000;
  const seed = [
    { id:'s1', author: members[1]?.name || 'Alice Johnson', text:`Hey team! I've started working on the ${projectName} tasks. Let me know if anyone needs help.`, ts: now - 180*MIN },
    { id:'s2', author: members[2]?.name || 'Bob Martinez',  text:`Great! I'll take care of the backend parts. Should we do a quick sync tomorrow morning?`, ts: now - 120*MIN },
    { id:'s3', author: members[0]?.name || 'TaskFlow Demo', text:`Sounds good. I've also updated the task priorities — please check and let me know if anything looks off.`, ts: now - 60*MIN },
    { id:'s4', author: members[1]?.name || 'Alice Johnson', text:`Checked ✅ Everything looks good. The high priority ones are clear.`, ts: now - 30*MIN },
  ];
  saveMsgs(projectId, seed);
}

export default function DiscussPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [members, setMembers]   = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    api.get('/projects').then(r => {
      const ps = r.data.projects || [];
      setProjects(ps);
      if (ps.length > 0) setActiveProject(ps[0]);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeProject) return;
    // Load members for this project
    api.get(`/projects/${activeProject.id}`).then(r => {
      const m = r.data.members || [];
      setMembers(m);
      seedMessages(activeProject.id, activeProject.name, m);
      setMessages(loadMsgs(activeProject.id));
    }).catch(() => setMessages(loadMsgs(activeProject.id)));
  }, [activeProject]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages]);

  const send = () => {
    if (!input.trim() || !activeProject) return;
    const msg = { id: Date.now().toString(), author: user?.name || 'You', text: input.trim(), ts: Date.now() };
    const updated = [...messages, msg];
    saveMsgs(activeProject.id, updated);
    setMessages(updated);
    setInput('');
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) return d.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
    return d.toLocaleDateString('en-IN', { day:'numeric', month:'short' }) + ' ' + d.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
  };

  if (loading) return <div className="loading"><div className="spinner"/></div>;

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Discuss</div>
          <div className="page-subtitle">Team conversations by project</div>
        </div>
      </div>
      <div className="page-body" style={{ padding:0 }}>
        <div style={{ display:'flex', height:'calc(100vh - 160px)', minHeight:400 }}>

          {/* Sidebar — project list */}
          <div style={{
            width:220, flexShrink:0, borderRight:'1px solid var(--border)',
            background:'var(--bg2)', display:'flex', flexDirection:'column',
          }}>
            <div style={{ padding:'14px 16px', fontSize:11, fontWeight:700, color:'var(--text3)', letterSpacing:1 }}>CHANNELS</div>
            {projects.length === 0 ? (
              <div style={{ padding:'12px 16px', fontSize:13, color:'var(--text3)' }}>No projects yet</div>
            ) : projects.map(p => (
              <button key={p.id}
                onClick={() => setActiveProject(p)}
                style={{
                  display:'flex', alignItems:'center', gap:8, padding:'10px 16px',
                  background: activeProject?.id===p.id ? 'var(--bg3)' : 'transparent',
                  border:'none', cursor:'pointer', textAlign:'left', width:'100%',
                  borderLeft: activeProject?.id===p.id ? '2px solid var(--accent)' : '2px solid transparent',
                  transition:'background 0.15s',
                }}>
                <span style={{ fontSize:14 }}>#</span>
                <span style={{
                  fontSize:13, fontWeight: activeProject?.id===p.id ? 600 : 400,
                  color: activeProject?.id===p.id ? 'var(--text)' : 'var(--text2)',
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                }}>{p.name}</span>
              </button>
            ))}

            {/* Members list */}
            {members.length > 0 && (
              <>
                <div style={{ padding:'20px 16px 8px', fontSize:11, fontWeight:700, color:'var(--text3)', letterSpacing:1 }}>MEMBERS</div>
                {members.map(m => (
                  <div key={m.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 16px' }}>
                    <div style={{
                      width:8, height:8, borderRadius:'50%', background:'var(--green)', flexShrink:0,
                    }}/>
                    <div style={{ width:22, height:22, borderRadius:'50%', background:avatarColor(m.name), display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:'#fff' }}>
                      {initials(m.name)}
                    </div>
                    <span style={{ fontSize:12, color:'var(--text2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.name}</span>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Chat area */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
            {/* Header */}
            <div style={{
              padding:'14px 20px', borderBottom:'1px solid var(--border)',
              display:'flex', alignItems:'center', gap:8, background:'var(--bg)',
            }}>
              <span style={{ fontSize:16, color:'var(--text3)' }}>#</span>
              <span style={{ fontWeight:700, fontSize:15, color:'var(--text)' }}>{activeProject?.name || 'Select a project'}</span>
              {activeProject && <span style={{ fontSize:12, color:'var(--text3)', marginLeft:8 }}>{members.length} members · {messages.length} messages</span>}
            </div>

            {/* Messages */}
            <div style={{ flex:1, overflowY:'auto', padding:'16px 20px', display:'flex', flexDirection:'column', gap:2 }}>
              {messages.length === 0 ? (
                <div style={{ textAlign:'center', color:'var(--text3)', fontSize:14, marginTop:40 }}>
                  No messages yet. Start the conversation!
                </div>
              ) : messages.map((msg, i) => {
                const isMe = msg.author === user?.name;
                const showHeader = i === 0 || messages[i-1].author !== msg.author;
                return (
                  <div key={msg.id} style={{ display:'flex', gap:10, alignItems:'flex-start', marginTop: showHeader ? 12 : 2 }}>
                    {showHeader ? (
                      <div style={{
                        width:36, height:36, borderRadius:'50%', flexShrink:0, marginTop:2,
                        background: isMe ? 'var(--accent)' : avatarColor(msg.author),
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:12, fontWeight:700, color:'#fff',
                      }}>{initials(msg.author)}</div>
                    ) : (
                      <div style={{ width:36, flexShrink:0 }}/>
                    )}
                    <div style={{ flex:1, minWidth:0 }}>
                      {showHeader && (
                        <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:3 }}>
                          <span style={{ fontWeight:700, fontSize:13, color: isMe ? 'var(--accent)' : 'var(--text)' }}>{msg.author}</span>
                          <span style={{ fontSize:11, color:'var(--text3)' }}>{formatTime(msg.ts)}</span>
                        </div>
                      )}
                      <div style={{
                        fontSize:13, color:'var(--text)', lineHeight:1.5,
                        background: showHeader ? 'transparent' : 'transparent',
                        padding: '2px 0',
                      }}>{msg.text}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef}/>
            </div>

            {/* Input */}
            <div style={{ padding:'12px 20px', borderTop:'1px solid var(--border)', background:'var(--bg)' }}>
              <div style={{
                display:'flex', gap:10, alignItems:'flex-end',
                background:'var(--bg2)', borderRadius:10, border:'1px solid var(--border)', padding:'8px 12px',
              }}>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder={`Message #${activeProject?.name || 'channel'}... (Enter to send)`}
                  rows={1}
                  style={{
                    flex:1, background:'transparent', border:'none', outline:'none', resize:'none',
                    color:'var(--text)', fontSize:13, lineHeight:1.5, maxHeight:120, overflowY:'auto',
                  }}
                />
                <button
                  onClick={send}
                  disabled={!input.trim()}
                  style={{
                    background: input.trim() ? 'var(--accent)' : 'var(--bg3)',
                    border:'none', borderRadius:6, padding:'6px 14px', cursor: input.trim() ? 'pointer' : 'default',
                    color: input.trim() ? '#fff' : 'var(--text3)', fontSize:13, fontWeight:600, flexShrink:0,
                    transition:'background 0.15s',
                  }}>Send</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
