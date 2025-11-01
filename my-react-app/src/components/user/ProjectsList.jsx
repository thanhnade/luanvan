import { useState, useEffect } from 'react';
import './Dashboard.css';

function ProjectsList({ user, onRefresh }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [stoppingId, setStoppingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    // Reset về trang 1 khi search term thay đổi
    setCurrentPage(1);
  }, [searchTerm]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      // TODO: Gọi API để lấy danh sách projects
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock data - thêm nhiều hơn để demo phân trang
      const mockProjects = [
        {
          id: 1,
          name: 'my-react-app',
          status: 'running',
          url: 'https://my-react-app.example.com',
          framework: 'React',
          createdAt: '2024-01-15T10:30:00',
          updatedAt: '2024-01-15T10:35:00'
        },
        {
          id: 2,
          name: 'portfolio-site',
          status: 'stopped',
          url: 'https://portfolio.example.com',
          framework: 'Next.js',
          createdAt: '2024-01-10T14:20:00',
          updatedAt: '2024-01-14T09:15:00'
        },
        {
          id: 3,
          name: 'api-service',
          status: 'running',
          url: 'https://api.example.com',
          framework: 'Node.js',
          createdAt: '2024-01-08T08:00:00',
          updatedAt: '2024-01-12T16:45:00'
        },
        {
          id: 4,
          name: 'e-commerce-platform',
          status: 'running',
          url: 'https://shop.example.com',
          framework: 'Vue.js',
          createdAt: '2024-01-20T09:00:00',
          updatedAt: '2024-01-22T14:30:00'
        },
        {
          id: 5,
          name: 'blog-app',
          status: 'building',
          url: 'https://blog.example.com',
          framework: 'Next.js',
          createdAt: '2024-01-18T11:15:00',
          updatedAt: '2024-01-23T10:00:00'
        },
        {
          id: 6,
          name: 'landing-page',
          status: 'running',
          url: 'https://landing.example.com',
          framework: 'React',
          createdAt: '2024-01-12T16:00:00',
          updatedAt: '2024-01-16T09:20:00'
        },
        {
          id: 7,
          name: 'dashboard-app',
          status: 'stopped',
          url: 'https://dashboard.example.com',
          framework: 'Angular',
          createdAt: '2024-01-05T08:30:00',
          updatedAt: '2024-01-11T15:45:00'
        },
        {
          id: 8,
          name: 'mobile-backend',
          status: 'running',
          url: 'https://api-mobile.example.com',
          framework: 'Node.js',
          createdAt: '2024-01-07T10:00:00',
          updatedAt: '2024-01-19T12:00:00'
        },
        {
          id: 9,
          name: 'admin-panel',
          status: 'running',
          url: 'https://admin.example.com',
          framework: 'React',
          createdAt: '2024-01-14T13:20:00',
          updatedAt: '2024-01-21T11:30:00'
        },
        {
          id: 10,
          name: 'documentation-site',
          status: 'stopped',
          url: 'https://docs.example.com',
          framework: 'Vite',
          createdAt: '2024-01-09T14:00:00',
          updatedAt: '2024-01-17T10:15:00'
        }
      ];
      
      setProjects(mockProjects);
    } catch (err) {
      console.error('Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  };

  // Lọc projects theo search term
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Tính toán phân trang
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProjects = filteredProjects.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStop = async (id) => {
    setStoppingId(id);
    try {
      // TODO: Gọi API để dừng project
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProjects(projects.map(p => 
        p.id === id ? { ...p, status: 'stopped' } : p
      ));
      
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error stopping project:', err);
    } finally {
      setStoppingId(null);
    }
  };

  const handleStart = async (id) => {
    setStoppingId(id);
    try {
      // TODO: Gọi API để khởi động project
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProjects(projects.map(p => 
        p.id === id ? { ...p, status: 'running' } : p
      ));
      
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error starting project:', err);
    } finally {
      setStoppingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa dự án này không?')) {
      return;
    }

    setDeletingId(id);
    try {
      // TODO: Gọi API để xóa project
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProjects(projects.filter(p => p.id !== id));
      
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error deleting project:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
        return '#10b981';
      case 'stopped':
        return '#64748b';
      case 'building':
        return '#2563eb';
      case 'error':
        return '#dc2626';
      default:
        return '#64748b';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'running':
        return 'Đang chạy';
      case 'stopped':
        return 'Đã dừng';
      case 'building':
        return 'Đang xây dựng';
      case 'error':
        return 'Lỗi';
      default:
        return status;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="projects-loading">
        <span className="spinner"></span>
        <p>Đang tải danh sách dự án...</p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="projects-empty">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="currentColor"/>
        </svg>
        <h3>Chưa có dự án nào</h3>
        <p>Bắt đầu bằng cách tạo triển khai mới</p>
      </div>
    );
  }

  return (
    <div className="projects-list">
      <div className="projects-header">
        <h2>Dự án của bạn ({filteredProjects.length})</h2>
        <div className="projects-header-actions">
          <div className="search-wrapper">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Tìm kiếm theo tên dự án..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="search-clear"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                <svg viewBox="0 0 24 24" fill="none">
                  <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
          <button className="refresh-btn" onClick={loadProjects} disabled={loading}>
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Làm mới
          </button>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="projects-empty">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <h3>Không tìm thấy dự án</h3>
          <p>Không có dự án nào khớp với từ khóa "{searchTerm}"</p>
        </div>
      ) : (
        <>
          <div className="projects-grid">
            {paginatedProjects.map((project) => (
          <div key={project.id} className="project-card">
            <div className="project-header">
              <div className="project-title">
                <h3>{project.name}</h3>
                <span 
                  className="project-status"
                  style={{ backgroundColor: getStatusColor(project.status) + '20', color: getStatusColor(project.status) }}
                >
                  <span className="status-dot" style={{ backgroundColor: getStatusColor(project.status) }}></span>
                  {getStatusLabel(project.status)}
                </span>
              </div>
            </div>

            <div className="project-info">
              <div className="project-meta">
                <div className="meta-item">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M13.984 6.016v12.469c0 .563-.281.984-.656 1.219-.375.281-.75.375-1.219.375-.516 0-.891-.188-1.266-.516l-2.484-2.156c-.188-.141-.469-.141-.656 0l-2.484 2.156c-.375.328-.75.516-1.266.516-.469 0-.844-.094-1.219-.375C2.298 19.469 2 19.048 2 18.516V5.531c0-.563.298-.984.656-1.219C3.031 4.031 3.406 3.938 3.875 3.938c.516 0 .891.188 1.266.516l2.484 2.156c.188.141.469.141.656 0L10.75 4.453c.375-.328.75-.516 1.266-.516.469 0 .844.094 1.219.375C13.594 4.547 13.984 4.969 13.984 5.531v.485z" fill="currentColor"/>
                  </svg>
                  <span>{project.framework}</span>
                </div>
                <div className="meta-item">
                  <svg viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span>{formatDate(project.updatedAt)}</span>
                </div>
              </div>

              {project.url && (
                <div className="project-url">
                  <a href={project.url} target="_blank" rel="noopener noreferrer">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <polyline points="15 3 21 3 21 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    {project.url}
                  </a>
                </div>
              )}
            </div>

            <div className="project-actions">
              {project.status === 'running' ? (
                <button
                  className="action-btn stop-btn"
                  onClick={() => handleStop(project.id)}
                  disabled={stoppingId === project.id}
                >
                  {stoppingId === project.id ? (
                    <>
                      <span className="spinner-small"></span>
                      Đang dừng...
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none">
                        <rect x="6" y="6" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                      </svg>
                      Dừng
                    </>
                  )}
                </button>
              ) : (
                <button
                  className="action-btn start-btn"
                  onClick={() => handleStart(project.id)}
                  disabled={stoppingId === project.id}
                >
                  {stoppingId === project.id ? (
                    <>
                      <span className="spinner-small"></span>
                      Đang khởi động...
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none">
                        <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/>
                      </svg>
                      Khởi động
                    </>
                  )}
                </button>
              )}
              
              <button
                className="action-btn delete-btn"
                onClick={() => handleDelete(project.id)}
                disabled={deletingId === project.id}
              >
                {deletingId === project.id ? (
                  <>
                    <span className="spinner-small"></span>
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none">
                      <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Xóa
                  </>
                )}
              </button>
            </div>
          </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Trước
              </button>
              
              <div className="pagination-pages">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Hiển thị tất cả các trang nếu <= 7 trang
                  if (totalPages <= 7) {
                    return (
                      <button
                        key={page}
                        className={`pagination-page ${currentPage === page ? 'active' : ''}`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    );
                  }
                  
                  // Logic hiển thị trang với ellipsis
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        className={`pagination-page ${currentPage === page ? 'active' : ''}`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    );
                  }
                  
                  if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <span key={page} className="pagination-ellipsis">
                        ...
                      </span>
                    );
                  }
                  
                  return null;
                })}
              </div>
              
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Sau
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ProjectsList;

