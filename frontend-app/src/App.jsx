import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import LoginPage from './LoginPage';
import SignupPage from './SignupPage';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import ProjectsPage from './ProjectsPage';
import ProjectDetail from './ProjectDetail';
import MyTasksPage from './MyTasksPage';
import api from './api';
import './index.css';

function AppContent() {
  const { user, loading } = useAuth();
  const [authPage, setAuthPage] = useState('login');
  const [view, setView] = useState('dashboard');
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProjectsLoading(true);
      api.get('/projects').then(r => setProjects(r.data.projects || [])).catch(console.error).finally(() => setProjectsLoading(false));
    }
  }, [user]);

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
    if (view === 'dashboard') return <Dashboard setView={setView}/>;
    if (view === 'projects') return <ProjectsPage projects={projects} onProjectCreated={handleProjectCreated} setView={setView} loading={projectsLoading}/>;
    if (view === 'my-tasks') return <MyTasksPage setView={setView}/>;
    if (view.startsWith('project-')) {
      const projectId = view.replace('project-', '');
      return <ProjectDetail key={projectId} projectId={projectId} setView={setView} onProjectUpdated={handleProjectUpdated}/>;
    }
    return <Dashboard setView={setView}/>;
  };

  return (
    <div className="app-layout">
      <Sidebar view={view} setView={setView} projects={projects} onNewProject={() => setView('projects')}/>
      <div className="main-content" style={{display:'flex', flexDirection:'column'}}>
        <div style={{height: 60, borderBottom: '1px solid var(--border)', display:'flex', alignItems:'center', padding: '0 32px', background: 'var(--bg)'}}>
          <div style={{display:'flex', gap: 24, fontSize: 13, fontWeight: 500, color: 'var(--text2)', flex: 1}}>
            <span style={{cursor:'pointer', color: view==='dashboard'?'var(--accent)':'inherit', borderBottom: view==='dashboard'?'2px solid var(--accent)':'none', padding: '20px 0'}} onClick={() => setView('dashboard')}>Dashboard</span>
            <span style={{cursor:'pointer', color: view==='my-tasks'?'var(--accent)':'inherit', borderBottom: view==='my-tasks'?'2px solid var(--accent)':'none', padding: '20px 0'}} onClick={() => setView('my-tasks')}>Tasks</span>
            <span style={{cursor:'pointer', padding: '20px 0'}}>Issues</span>
            <span style={{cursor:'pointer', padding: '20px 0'}}>Milestones</span>
            <span style={{cursor:'pointer', padding: '20px 0'}}>Documents</span>
            <span style={{cursor:'pointer', padding: '20px 0'}}>Finance</span>
            <span style={{cursor:'pointer', padding: '20px 0'}}>Forums</span>
            <span style={{cursor:'pointer', padding: '20px 0'}}>Users</span>
            <span style={{cursor:'pointer', padding: '20px 0'}}>Gantt & Reports</span>
            <span style={{cursor:'pointer', padding: '20px 0'}}>Timesheets</span>
          </div>
          <div style={{display:'flex', alignItems:'center', gap: 16}}>
            <button style={{background:'none',border:'none',cursor:'pointer',fontSize:18}}>🔍</button>
            <button style={{background:'none',border:'none',cursor:'pointer',fontSize:18}}>⏱️</button>
            <button style={{background:'none',border:'none',cursor:'pointer',fontSize:18}}>🔔</button>
            <button style={{background:'none',border:'none',cursor:'pointer',fontSize:18}}>+</button>
          </div>
        </div>
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
