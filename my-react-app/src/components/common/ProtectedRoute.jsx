import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, requireAdmin = false }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    console.log('[ProtectedRoute] User data from localStorage:', userData);
    
    if (!userData) {
      console.log('[ProtectedRoute] No user data, setting authenticated=false');
      setIsAuthenticated(false);
      setIsAuthorized(false);
      return;
    }

    const user = JSON.parse(userData);
    console.log('[ProtectedRoute] Parsed user:', user);
    console.log('[ProtectedRoute] User role:', user.role);
    console.log('[ProtectedRoute] requireAdmin:', requireAdmin);
    
    setIsAuthenticated(true);
    
    if (requireAdmin) {
      // So sánh role không phân biệt hoa thường để đảm bảo tương thích
      const isAdmin = user.role && user.role.toUpperCase() === 'ADMIN';
      console.log('[ProtectedRoute] Is Admin?', isAdmin);
      setIsAuthorized(isAdmin);
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

