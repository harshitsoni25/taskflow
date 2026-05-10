import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import LoginPage from './LoginPage';
import SignupPage from './SignupPage';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import ProjectsPage from './ProjectsPage';
import ProjectDetail from './ProjectDetail';
import MyTasksPage from './MyTasksPage';
import FeedPage from './FeedPage';
import DiscussPage from './DiscussPage';
import CalendarPage from './CalendarPage';
import ReportsPage from './ReportsPage';
import UsersPage from './UsersPage';
import IssuesPage from './IssuesPage';
import MilestonesPage from './MilestonesPage';
import TimesheetsPage from './TimesheetsPage';
import ExpensesPage from './ExpensesPage';
import DocumentsPage from './DocumentsPage';
import FinancePage from './FinancePage';
import ForumsPage from './ForumsPage';
import GanttPage from './GanttPage';
import PlaceholderPage from './PlaceholderPage';
import api from './api';
import './index.css';

function AppContent() {
  const { user, loading } = useAuth();
  const [authPage, setAuthPage]           = useState('login');
  const [view, setView]                   = useState('dashboard');
  const [projects, setProjects]           = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [searchOpen, setSearchOpen]       = useState(false);
  const [searchQ, setSearchQ]             = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [notifOpen, setNotifOpen]         = useState(false);
  const [createOpen, setCreateOpen]       = useState(false);

  useEffect(() => {
    if (user) {
      setProjectsLoading(true);
      api.get('/projects').then(r => setProjects(r.data.projects || [])).catch(console.error).finally(() => setProjectsLoading(false));
    }
  }, [user]);

  // Cache dashboard data for notifications
  useEffect(() => {
    if (!user) return;
    api.get('/dashboard').then(r => sessionStorage.setItem('tf_dash', JSON.stringify(r.data))).catch(() => {});
  }, [user]);

  // Close dropdowns on outside click
  useEffect(() => {
    const close = () => { setNotifOpen(false); setCreateOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  // ── Early returns (after all hooks) ───────────────────────────────────────────
  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)'}}>
      <div className="spinner"/>
    </div>
  );

  if (!user) {
    return authPage === 'login'
      ? <LoginPage onNavigate={setAuthPage}/>
      : <SignupPage onNavigate={setAuthPage}/>;
  }

  const handleProjectCreated = (project) => {
    setProjects(prev => [project, ...prev]);
  };

  const handleProjectUpdated = (project) => {
    setProjects(prev => prev.map(p => (p.id === project.id ? { ...p, ...project } : p)));
  };

  const renderMain = () => {
    if (view === 'dashboard')   return <Dashboard setView={setView}/>;
    if (view === 'projects')    return <ProjectsPage projects={projects} onProjectCreated={handleProjectCreated} setView={setView} loading={projectsLoading}/>;
    if (view === 'my-tasks')    return <MyTasksPage setView={setView}/>;
    if (view === 'feed')        return <FeedPage setView={setView}/>;
    if (view === 'discuss')     return <DiscussPage/>;
    if (view === 'reports')     return <ReportsPage setView={setView}/>;
    if (view === 'calendar')    return <CalendarPage setView={setView}/>;
    if (view === 'issues')      return <IssuesPage setView={setView}/>;
    if (view === 'milestones')  return <MilestonesPage setView={setView}/>;
    if (view === 'timesheets')  return <TimesheetsPage setView={setView}/>;
    if (view === 'expenses')    return <ExpensesPage/>;
    if (view === 'documents')   return <DocumentsPage/>;
    if (view === 'finance')     return <FinancePage/>;
    if (view === 'forums')      return <ForumsPage/>;
    if (view === 'users')       return <UsersPage setView={setView}/>;
    if (view === 'gantt')       return <GanttPage setView={setView}/>;
    if (view.startsWith('project-')) {
      const projectId = view.replace('project-', '');
      return <ProjectDetail key={projectId} projectId={projectId} setView={setView} onProjectUpdated={handleProjectUpdated}/>;
    }
    return <Dashboard setView={setView}/>;
  };

  const runSearch = async (q) => {
    setSearchQ(q);
    if (!q.trim()) { setSearchResults([]); return; }
    try {
      const [dashRes, projRes] = await Promise.all([api.get('/dashboard'), api.get('/projects')]);
      const tasks = dashRes.data.myTasks || [];
      const projs = projRes.data.projects || [];
      const lq    = q.toLowerCase();
      setSearchResults([
        ...projs.filter(p => p.name?.toLowerCase().includes(lq)).slice(0,3).map(p => ({ type:'project', label:p.name, sub:`Project · ${p.task_count||0} tasks`, key:`project-${p.id}` })),
        ...tasks.filter(t => t.title?.toLowerCase().includes(lq)).slice(0,6).map(t => ({ type:'task', label:t.title, sub:`Task in ${t.project_name} · ${t.status}`, key:`project-${t.project_id}` })),
      ]);
    } catch {}
  };

  const liveNotifs = (() => {
    try {
      const d = JSON.parse(sessionStorage.getItem('tf_dash') || 'null');
      if (!d) return [];
      return [
        ...(d.overdueTasks||[]).slice(0,3).map(t => ({ icon:'🔴', text:`Overdue: ${t.title}`, sub:t.project_name, nav:`project-${t.project_id}` })),
        ...(d.myTasks||[]).filter(t=>t.status==='in_progress').slice(0,3).map(t => ({ icon:'🔄', text:`Active: ${t.title}`, sub:t.project_name, nav:`project-${t.project_id}` })),
        ...(d.projects||[]).slice(0,2).map(p => ({ icon:'📁', text:`Project: ${p.name}`, sub:`${p.total_tasks||0} tasks`, nav:`project-${p.id}` })),
      ];
    } catch { return []; }
  })();

  const ICON_BTN = {
    background:'none', border:'none', cursor:'pointer', fontSize:18,
    width:34, height:34, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center',
    transition:'background 0.15s',
  };


  return (
    <div className="app-layout">
      <Sidebar view={view} setView={setView} projects={projects} onNewProject={() => setView('projects')}/>
      <div className="main-content" style={{display:'flex', flexDirection:'column'}}>

        {/* ── Top Navbar ─────────────────────────────────────────────────────── */}
        <div style={{height: 60, borderBottom: '1px solid var(--border)', display:'flex', alignItems:'center', padding: '0 32px', background: 'var(--bg)', position:'relative', zIndex:50}}>
          <div style={{display:'flex', gap: 24, fontSize: 13, fontWeight: 500, color: 'var(--text2)', flex: 1, overflowX: 'auto'}}>
            {[
              { label: 'Dashboard',      key: 'dashboard'  },
              { label: 'Tasks',          key: 'my-tasks'   },
              { label: 'Issues',         key: 'issues'     },
              { label: 'Milestones',     key: 'milestones' },
              { label: 'Documents',      key: 'documents'  },
              { label: 'Finance',        key: 'finance'    },
              { label: 'Forums',         key: 'forums'     },
              { label: 'Users',          key: 'users'      },
              { label: 'Gantt & Reports', key: 'gantt'    },
              { label: 'Timesheets',     key: 'timesheets' },
            ].map(({ label, key }) => (
              <span key={key} style={{ cursor:'pointer', color:view===key?'var(--accent)':'inherit', borderBottom:view===key?'2px solid var(--accent)':'2px solid transparent', padding:'20px 0', whiteSpace:'nowrap', transition:'color 0.15s' }} onClick={() => setView(key)}>
                {label}
              </span>
            ))}
          </div>

          {/* ── Action icons ───────────────────────────────────────────────── */}
          <div style={{display:'flex', alignItems:'center', gap:6}} onMouseDown={e => e.stopPropagation()}>

            {/* 🔍 Search */}
            <button title="Search" style={ICON_BTN} onClick={() => { setSearchOpen(true); setSearchQ(''); setSearchResults([]); }}
              onMouseEnter={e=>e.currentTarget.style.background='var(--bg3)'} onMouseLeave={e=>e.currentTarget.style.background='none'}>🔍</button>

            {/* ⏱️ Timer → Timesheets */}
            <button title="Timesheets" style={ICON_BTN} onClick={() => setView('timesheets')}
              onMouseEnter={e=>e.currentTarget.style.background='var(--bg3)'} onMouseLeave={e=>e.currentTarget.style.background='none'}>⏱️</button>

            {/* 🔔 Notifications */}
            <div style={{position:'relative'}}>
              <button title="Notifications" style={{...ICON_BTN, position:'relative'}} onClick={() => { setNotifOpen(o=>!o); setCreateOpen(false); }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--bg3)'} onMouseLeave={e=>e.currentTarget.style.background='none'}>
                🔔
                {liveNotifs.length > 0 && <span style={{ position:'absolute', top:4, right:4, width:8, height:8, borderRadius:'50%', background:'var(--red)', border:'2px solid var(--bg)' }}/>}
              </button>
              {notifOpen && (
                <div style={{ position:'absolute', right:0, top:'calc(100% + 8px)', width:320, background:'var(--bg)', border:'1px solid var(--border)', borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,0.12)', zIndex:200, overflow:'hidden' }}>
                  <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', fontWeight:700, fontSize:13, color:'var(--text)', display:'flex', justifyContent:'space-between' }}>
                    Notifications
                    <span style={{ fontSize:11, color:'var(--text3)', fontWeight:400 }}>{liveNotifs.length} items</span>
                  </div>
                  {liveNotifs.length === 0
                    ? <div style={{ padding:24, textAlign:'center', color:'var(--text3)', fontSize:13 }}>All caught up! 🎉</div>
                    : liveNotifs.map((n,i) => (
                      <div key={i} onClick={() => { setView(n.nav); setNotifOpen(false); }}
                        style={{ display:'flex', gap:10, padding:'10px 16px', cursor:'pointer', borderBottom:'1px solid var(--border)', transition:'background 0.1s' }}
                        onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <span style={{ fontSize:16, flexShrink:0 }}>{n.icon}</span>
                        <div>
                          <div style={{ fontSize:13, color:'var(--text)', fontWeight:500 }}>{n.text}</div>
                          <div style={{ fontSize:11, color:'var(--text3)' }}>{n.sub}</div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>

            {/* ＋ Quick Create */}
            <div style={{position:'relative'}}>
              <button title="Quick Create" style={{...ICON_BTN, background:'var(--accent)', color:'#fff', fontWeight:700, fontSize:20, borderRadius:8}} onClick={() => { setCreateOpen(o=>!o); setNotifOpen(false); }}
                onMouseEnter={e=>e.currentTarget.style.opacity='0.85'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>+</button>
              {createOpen && (
                <div style={{ position:'absolute', right:0, top:'calc(100% + 8px)', width:220, background:'var(--bg)', border:'1px solid var(--border)', borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,0.12)', zIndex:200, overflow:'hidden', padding:'6px 0' }}>
                  {[
                    { icon:'📁', label:'New Project',   action:() => { setView('projects'); setCreateOpen(false); } },
                    { icon:'✅', label:'New Task',       action:() => { setView('my-tasks'); setCreateOpen(false); } },
                    { icon:'📄', label:'New Document',   action:() => { setView('documents'); setCreateOpen(false); } },
                    { icon:'🗣️', label:'New Forum Topic', action:() => { setView('forums'); setCreateOpen(false); } },
                    { icon:'💬', label:'New Message',    action:() => { setView('discuss'); setCreateOpen(false); } },
                  ].map(item => (
                    <button key={item.label} onClick={item.action}
                      style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px', width:'100%', background:'none', border:'none', cursor:'pointer', fontSize:13, color:'var(--text)', textAlign:'left', transition:'background 0.1s' }}
                      onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'} onMouseLeave={e=>e.currentTarget.style.background='none'}>
                      <span>{item.icon}</span> {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Search Modal ────────────────────────────────────────────────────── */}
        {searchOpen && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', zIndex:300, display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:100 }}
            onClick={() => setSearchOpen(false)}>
            <div style={{ width:'100%', maxWidth:560, background:'var(--bg)', borderRadius:16, border:'1px solid var(--border)', boxShadow:'0 24px 64px rgba(0,0,0,0.2)', overflow:'hidden' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 20px', borderBottom:'1px solid var(--border)' }}>
                <span style={{ fontSize:18 }}>🔍</span>
                <input autoFocus value={searchQ} onChange={e => runSearch(e.target.value)}
                  placeholder="Search tasks, projects..."
                  style={{ flex:1, border:'none', outline:'none', background:'transparent', fontSize:15, color:'var(--text)' }}/>
                <button onClick={() => setSearchOpen(false)} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color:'var(--text3)' }}>✕</button>
              </div>
              {searchQ && (
                <div style={{ maxHeight:360, overflowY:'auto' }}>
                  {searchResults.length === 0
                    ? <div style={{ padding:32, textAlign:'center', color:'var(--text3)', fontSize:14 }}>No results for "{searchQ}"</div>
                    : searchResults.map((r,i) => (
                      <div key={i} onClick={() => { setView(r.key); setSearchOpen(false); }}
                        style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 20px', cursor:'pointer', borderBottom:'1px solid var(--border)', transition:'background 0.1s' }}
                        onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <span style={{ fontSize:18 }}>{r.type==='project'?'📁':'✅'}</span>
                        <div>
                          <div style={{ fontSize:14, fontWeight:500, color:'var(--text)' }}>{r.label}</div>
                          <div style={{ fontSize:12, color:'var(--text3)' }}>{r.sub}</div>
                        </div>
                        <span style={{ marginLeft:'auto', fontSize:11, color:'var(--text3)', background:'var(--bg3)', padding:'2px 8px', borderRadius:6, flexShrink:0 }}>{r.type}</span>
                      </div>
                    ))
                  }
                </div>
              )}
              {!searchQ && (
                <div style={{ padding:'12px 20px' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', marginBottom:8, letterSpacing:1 }}>QUICK JUMP</div>
                  {[['🏠','Dashboard','dashboard'],['✅','My Tasks','my-tasks'],['📁','Projects','projects'],['📅','Calendar','calendar'],['📈','Reports','reports']].map(([ic,lb,k])=>(
                    <div key={k} onClick={() => { setView(k); setSearchOpen(false); }}
                      style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', cursor:'pointer', borderBottom:'1px solid var(--border)', fontSize:13, color:'var(--text2)', transition:'color 0.1s' }}
                      onMouseEnter={e=>e.currentTarget.style.color='var(--accent)'} onMouseLeave={e=>e.currentTarget.style.color='var(--text2)'}>
                      <span>{ic}</span> {lb}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{flex: 1, overflowY: 'auto'}}>
          {renderMain()}
        </div>
      </div>
    </div>
  );
}


export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
