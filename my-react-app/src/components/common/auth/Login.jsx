import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../../services/api';
import '../Auth.css';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(formData.username, formData.password);
      console.log('Login successful:', response);
      
      localStorage.setItem('user', JSON.stringify(response));
      localStorage.setItem('isAuthenticated', 'true');
      
      // Chuyển đến dashboard dựa trên role
      if (response.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      let errorMessage = 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      
      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;
        
        if (data?.message) {
          errorMessage = data.message;
        } else if (data && typeof data === 'string') {
          errorMessage = data;
        } else if (status === 401 || status === 403) {
          errorMessage = 'Tài khoản hoặc mật khẩu không đúng.';
        } else if (status === 500) {
          errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
        }
      } else if (err.request) {
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra lại kết nối.';
      } else {
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Đăng Nhập</h1>
          <p>Chào mừng trở lại! Vui lòng đăng nhập vào tài khoản của bạn.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="username">Tên đăng nhập</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Nhập tên đăng nhập"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Nhập mật khẩu"
              required
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Chưa có tài khoản?{' '}
            <Link to="/register" className="auth-link">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;

