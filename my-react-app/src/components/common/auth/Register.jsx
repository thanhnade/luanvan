import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../../services/api';
import '../Auth.css';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullname: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
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

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.register(
        formData.fullname,
        formData.username,
        formData.password,
        formData.confirmPassword
      );
      console.log('Registration successful:', response);
      
      setError('');
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      let errorMessage = 'Đăng ký thất bại. Vui lòng thử lại.';
      
      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;
        
        if (data?.message) {
          errorMessage = data.message;
        } else if (data && typeof data === 'string') {
          errorMessage = data;
        } else if (status === 400) {
          errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
        } else if (status === 409 || status === 500) {
          errorMessage = data?.message || 'Tài khoản đã tồn tại hoặc có lỗi xảy ra.';
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
          <h1>Đăng Ký</h1>
          <p>Tạo tài khoản mới để bắt đầu sử dụng dịch vụ của chúng tôi.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {success && (
            <div className="success-message">
              <svg className="success-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M8 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div>
                <strong>Đăng ký thành công!</strong>
                <p>Đang chuyển đến trang đăng nhập...</p>
              </div>
            </div>
          )}
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="fullname">Họ và tên</label>
            <input
              type="text"
              id="fullname"
              name="fullname"
              value={formData.fullname}
              onChange={handleChange}
              placeholder="Nhập họ và tên"
              required
              autoFocus
            />
          </div>

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

          <div className="form-group">
            <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Nhập lại mật khẩu"
              required
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading || success}>
            {loading ? 'Đang xử lý...' : success ? 'Đăng ký thành công!' : 'Đăng Ký'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Đã có tài khoản?{' '}
            <Link to="/login" className="auth-link">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;

