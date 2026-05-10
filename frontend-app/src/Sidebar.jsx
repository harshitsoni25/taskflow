import { useAuth } from './AuthContext';

const initials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : '?';

export default function Sidebar({ view, setView, projects, onNewProject }) {
  const { user, logout } = useAuth();

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon" style={{width:24,height:24,fontSize:14,background:'var(--accent)',borderRadius:4}}>✨</div>
        <div className="logo-text" style={{fontSize:16}}>Project<span style={{color:'var(--accent)'}}>Hub</span></div>
      </div>

      <div className="nav-section" style={{paddingTop: 8, paddingBottom: 0}}>
        <button className={`nav-item ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>
          <span style={{width: 20, textAlign:'center'}}>🏠</span> Home
        </button>
        <button className={`nav-item ${view === 'feed' ? 'active' : ''}`} onClick={() => setView('feed')}>
          <span style={{width: 20, textAlign:'center'}}>📰</span> Feed
        </button>
        <button className={`nav-item ${view === 'discuss' ? 'active' : ''}`} onClick={() => setView('discuss')}>
          <span style={{width: 20, textAlign:'center'}}>💬</span> Discuss
        </button>
        <button className={`nav-item ${view === 'reports' ? 'active' : ''}`} onClick={() => setView('reports')}>
          <span style={{width: 20, textAlign:'center'}}>📈</span> Reports
        </button>
        <button className={`nav-item ${view === 'calendar' ? 'active' : ''}`} onClick={() => setView('calendar')}>
          <span style={{width: 20, textAlign:'center'}}>📅</span> Calendar
        </button>
        <button className={`nav-item ${view === 'projects' || view.startsWith('project-') ? 'active' : ''}`} onClick={() => setView('projects')}>
          <span style={{width: 20, textAlign:'center'}}>📁</span> Projects
        </button>
      </div>

      <div className="nav-section" style={{flex:1, paddingTop: 16}}>
        <div className="nav-label">WORK OVERVIEW</div>
        <button className={`nav-item ${view === 'my-tasks'   ? 'active' : ''}`} onClick={() => setView('my-tasks')}   style={{paddingLeft: 32}}>Tasks</button>
        <button className={`nav-item ${view === 'issues'     ? 'active' : ''}`} onClick={() => setView('issues')}     style={{paddingLeft: 32}}>Issues</button>
        <button className={`nav-item ${view === 'milestones' ? 'active' : ''}`} onClick={() => setView('milestones')} style={{paddingLeft: 32}}>Milestones</button>
        <button className={`nav-item ${view === 'timesheets' ? 'active' : ''}`} onClick={() => setView('timesheets')} style={{paddingLeft: 32}}>Timesheets</button>
        <button className={`nav-item ${view === 'expenses'   ? 'active' : ''}`} onClick={() => setView('expenses')}   style={{paddingLeft: 32}}>Expenses</button>

        <div className="nav-label" style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:24}}>
          <span>RECENT PROJECTS</span>
          <button onClick={onNewProject} style={{background:'none',border:'none',color:'var(--sidebar-text)',cursor:'pointer',fontSize:16,lineHeight:1}}>+</button>
        </div>
        {projects.slice(0,8).map(p => (
          <button key={p.id}
            className={`nav-item ${view === `project-${p.id}` ? 'active' : ''}`}
            onClick={() => setView(`project-${p.id}`)}
            style={{fontSize:13, paddingLeft: 16}}
          >
            <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</span>
          </button>
        ))}
      </div>

      <div className="sidebar-footer">
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
          <div className="avatar"><span>{initials(user?.name)}</span></div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'#fff'}}>{user?.name}</div>
            <div style={{fontSize:11,color:'var(--sidebar-text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.email}</div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" style={{width:'100%',color:'var(--sidebar-text)'}} onClick={logout}>Sign out</button>
      </div>
    </div>
  );
}
