import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, requireAdmin = false }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      setIsAuthenticated(false);
      setIsAuthorized(false);
      return;
    }

    const user = JSON.parse(userData);
    setIsAuthenticated(true);
    
    if (requireAdmin) {
      setIsAuthorized(user.role === 'admin');
    } else {
      setIsAuthorized(true);
    }
  }, [requireAdmin]);

  if (isAuthenticated === null || isAuthorized === null) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAuthorized) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;

