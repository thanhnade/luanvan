import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../user/Dashboard.css';

function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    const parsedUser = JSON.parse(userData);
    
    // Nếu không phải admin, chuyển đến user dashboard
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
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="logo">DeployHub Admin</h1>
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
        <div className="dashboard-content">
          <div className="dashboard-card">
            <div className="card-header">
              <h2>Trang quản trị</h2>
              <p>Quản lý hệ thống, người dùng và triển khai</p>
            </div>
            
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                style={{ width: '64px', height: '64px', color: '#2563eb', margin: '0 auto 20px' }}
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h3 style={{ color: '#1e293b', marginBottom: '12px' }}>Chào mừng đến trang quản trị</h3>
              <p style={{ color: '#64748b', marginBottom: '24px' }}>
                Trang quản trị sẽ được phát triển trong các bước tiếp theo
              </p>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '20px',
                marginTop: '40px',
                textAlign: 'left'
              }}>
                <div style={{ 
                  padding: '20px', 
                  background: 'white', 
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <h4 style={{ color: '#1e293b', marginBottom: '8px' }}>Quản lý người dùng</h4>
                  <p style={{ color: '#64748b', fontSize: '14px' }}>Xem và quản lý tất cả người dùng trong hệ thống</p>
                </div>
                
                <div style={{ 
                  padding: '20px', 
                  background: 'white', 
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <h4 style={{ color: '#1e293b', marginBottom: '8px' }}>Quản lý triển khai</h4>
                  <p style={{ color: '#64748b', fontSize: '14px' }}>Theo dõi và quản lý tất cả các triển khai</p>
                </div>
                
                <div style={{ 
                  padding: '20px', 
                  background: 'white', 
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <h4 style={{ color: '#1e293b', marginBottom: '8px' }}>Thống kê hệ thống</h4>
                  <p style={{ color: '#64748b', fontSize: '14px' }}>Xem báo cáo và thống kê hệ thống</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;

