import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../user/Dashboard.css';
import UserAccounts from './UserAccounts';
import UserServices from './UserServices';
import ClusterOverview from './ClusterOverview';
import Namespace from './Namespace';
import Nodes from './Nodes';
import Pods from './Pods';
import Services from './Services';
import Deployments from './Deployments';
import Servers from './Servers';
import Cluster from './Cluster';

function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeItem, setActiveItem] = useState('overview');
  const [expanded, setExpanded] = useState({
    users: true,
    deployments: true,
    system: true,
    analytics: false,
    cluster: false,
    operate: false,
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    setUser(parsedUser);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content" style={{ gap: 16 }}>
          <h1 className="logo">DeployHub</h1>
          <div className="header-right">
            <div className="user-info">
              <span className="user-name">Hello, {user.fullname}</span>
              <span className="user-role">{user.role}</span>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main layout: Sidebar + Content */}
      <main className="dashboard-main" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '16px' }}>
        {/* Sidebar (Navbar chức năng) */}
        <aside style={{ position: 'sticky', top: '84px', alignSelf: 'start' }}>
          <nav style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb', color: '#1e293b', fontWeight: 600 }}>Admin features</div>

            {/* Users Section */}
            <Section
              title="User management"
              expanded={expanded.users}
              onToggle={() => setExpanded(prev => ({ ...prev, users: !prev.users }))}
            >
              <MenuItem label="Accounts" active={activeItem === 'user-accounts'} onClick={() => setActiveItem('user-accounts')} />
                  <MenuItem label="User services" active={activeItem === 'user-services'} onClick={() => setActiveItem('user-services')} />
            </Section>

            

            {/* Operate Section */}
            <Section
              title="Operate"
              expanded={expanded.operate}
              onToggle={() => setExpanded(prev => ({ ...prev, operate: !prev.operate }))}
            >
              <MenuItem label="Server" active={activeItem === 'operate-server'} onClick={() => setActiveItem('operate-server')} />
              <MenuItem label="Cluster" active={activeItem === 'operate-cluster'} onClick={() => setActiveItem('operate-cluster')} />
            </Section>

            {/* Cluster Section */}
            <Section
              title="Cluster"
              expanded={expanded.cluster}
              onToggle={() => setExpanded(prev => ({ ...prev, cluster: !prev.cluster }))}
            >
              <MenuItem label="Overview" active={activeItem === 'cluster-overview'} onClick={() => setActiveItem('cluster-overview')} />
              <MenuItem label="Namespaces" active={activeItem === 'cluster-namespaces'} onClick={() => setActiveItem('cluster-namespaces')} />
              <MenuItem label="Nodes" active={activeItem === 'cluster-nodes'} onClick={() => setActiveItem('cluster-nodes')} />
              <MenuItem label="Pods" active={activeItem === 'cluster-pods'} onClick={() => setActiveItem('cluster-pods')} />
              <MenuItem label="Deployments" active={activeItem === 'cluster-deployments'} onClick={() => setActiveItem('cluster-deployments')} />
              <MenuItem label="Services" active={activeItem === 'cluster-services'} onClick={() => setActiveItem('cluster-services')} />
            </Section>
          </nav>
        </aside>

        {/* Content */}
        <div className="dashboard-content">
          <div className="dashboard-card">
            <div className="card-header">
              <h2>{getTitle(activeItem)}</h2>
            </div>

            <div style={{ padding: 24 }}>
              {renderContent(activeItem)}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Section({ title, expanded, onToggle, children }) {
  return (
    <div>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          textAlign: 'left',
          padding: '12px 16px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: '#0f172a',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <span>{title}</span>
        <svg viewBox="0 0 24 24" fill="none" style={{ width: 18, height: 18, transform: expanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease' }}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {expanded && (
        <div style={{ padding: '4px 0 10px 0' }}>
          {children}
        </div>
      )}
    </div>
  );
}

function MenuItem({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '10px 16px 10px 28px',
        background: active ? '#eff6ff' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: active ? '#1d4ed8' : '#374151',
        fontWeight: active ? 700 : 500,
        borderLeft: active ? '3px solid #2563eb' : '3px solid transparent'
      }}
    >
      {label}
    </button>
  );
}

function getTitle(key) {
  switch (key) {
    case 'user-accounts': return 'User management • Accounts';
    case 'user-services': return 'User management • User services';
    case 'deploy-list': return 'Deployments';
    case 'deploy-new': return 'New deployment';
    case 'deploy-config': return 'Environment & configuration';
    case 'system-settings': return 'System settings';
    case 'system-nodes': return 'Servers';
    case 'system-backup': return 'Backup & restore';
    case 'logs': return 'System logs';
    case 'alerts': return 'Alerts';
    case 'cluster-overview': return 'Cluster • Overview';
    case 'cluster-namespaces': return 'Cluster • Namespaces';
    case 'cluster-nodes': return 'Cluster • Nodes';
    case 'cluster-pods': return 'Cluster • Pods';
    case 'cluster-deployments': return 'Cluster • Deployments';
    case 'cluster-services': return 'Cluster • Services';
    case 'operate-server': return 'Operate • Server';
    case 'operate-cluster': return 'Operate • Cluster';
    default: return 'Orverview';
  }
}

function EmptyState({ title, description }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 0' }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 64, height: 64, color: '#2563eb', margin: '0 auto 16px' }}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <h3 style={{ color: '#1e293b', marginBottom: 8 }}>{title}</h3>
      <p style={{ color: '#64748b' }}>{description}</p>
    </div>
  );
}

function renderContent(key) {
  switch (key) {
    case 'user-accounts':
      return <UserAccounts />;
    case 'user-services':
      return <UserServices />;
    case 'deploy-list':
      return (
        <EmptyState title="Deployments" description="Track all deployments across the platform." />
      );
    case 'deploy-new':
      return (
        <EmptyState title="New deployment" description="Start a new rollout with standard presets." />
      );
    case 'deploy-config':
      return (
        <EmptyState title="Environment & configuration" description="Manage env vars, secrets and build configuration." />
      );
    case 'system-settings':
      return (
        <EmptyState title="System settings" description="Global platform and deployment settings." />
      );
    case 'system-nodes':
      return (
        <EmptyState title="Servers" description="Manage nodes/servers and their health status." />
      );
    case 'system-backup':
      return (
        <EmptyState title="Backup & restore" description="Schedule backups and perform restores when needed." />
      );
    case 'logs':
      return (
        <EmptyState title="System logs" description="View recent logs, filter by level and service." />
      );
    case 'alerts':
      return (
        <EmptyState title="Alerts" description="Monitor real-time alerts and configure notification rules." />
      );
    case 'cluster-overview':
      return <ClusterOverview />;
    case 'cluster-namespaces':
      return <Namespace />;
    case 'cluster-nodes':
      return <Nodes />;
    case 'cluster-pods':
      return <Pods />;
    case 'cluster-deployments':
      return <Deployments />;
    case 'cluster-services':
      return <Services />;
    case 'operate-server':
      return <Servers />;
    case 'operate-cluster':
      return <Cluster />;
    default:
      return (
        <EmptyState title="Overview" description="Pick a section from the left navigation to get started." />
      );
  }
}

export default AdminDashboard;

