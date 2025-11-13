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
      console.log('Response role:', response.role);
      console.log('Role uppercase:', response.role?.toUpperCase());
      
      localStorage.setItem('user', JSON.stringify(response));
      localStorage.setItem('isAuthenticated', 'true');
      
      // Navigate to dashboard based on role (so sánh không phân biệt hoa thường)
      const isAdmin = response.role && response.role.toUpperCase() === 'ADMIN';
      console.log('Is Admin?', isAdmin);
      
      if (isAdmin) {
        console.log('Navigating to /admin/dashboard');
        navigate('/admin/dashboard', { replace: true });
      } else {
        console.log('Navigating to /dashboard');
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;
        
        if (data?.message) {
          errorMessage = data.message;
        } else if (data && typeof data === 'string') {
          errorMessage = data;
        } else if (status === 401 || status === 403) {
          errorMessage = 'Incorrect username or password.';
        } else if (status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (err.request) {
        errorMessage = 'Cannot connect to server. Please check your connection.';
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
          <h1>Sign In</h1>
          <p>Welcome back! Please sign in to your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Processing…' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don’t have an account?{' '}
            <Link to="/register" className="auth-link">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;

