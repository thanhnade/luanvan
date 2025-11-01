import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectsList from './ProjectsList';
import NewDeployment from './NewDeployment';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('projects');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    const parsedUser = JSON.parse(userData);
    
    // Nếu là admin, chuyển đến admin dashboard
    if (parsedUser.role === 'admin') {
      navigate('/admin/dashboard');
      return;
    }
    
    setUser(parsedUser);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  const handleDeploySuccess = () => {
    setActiveTab('projects');
    setRefreshKey(prev => prev + 1);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="logo">DeployHub</h1>
          <div className="header-right">
            <div className="user-info">
              <span className="user-name">Xin chào, {user.fullname}</span>
              <span className="user-role">{user.role}</span>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-tabs">
          <button
            className={`tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" fill="none"/>
              <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Dự án
          </button>
          <button
            className={`tab-btn ${activeTab === 'new' ? 'active' : ''}`}
            onClick={() => setActiveTab('new')}
          >
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
              <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Tạo mới
          </button>
        </div>

        <div className="dashboard-content">
          {activeTab === 'projects' ? (
            <ProjectsList user={user} onRefresh={() => setRefreshKey(prev => prev + 1)} key={refreshKey} />
          ) : (
            <NewDeployment onDeploySuccess={handleDeploySuccess} />
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;

