import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/common/auth/Login';
import Register from './components/common/auth/Register';
import Dashboard from './components/user/Dashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import ProtectedRoute from './components/common/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
