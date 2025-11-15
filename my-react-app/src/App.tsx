import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "sonner"
import { AuthProvider } from "./contexts/AuthContext"
import { ProtectedRoute } from "./components/auth/ProtectedRoute"
import { Login } from "./pages/auth/Login"
import { Register } from "./pages/auth/Register"
import { ProjectsList } from "./pages/projects/List"
import { ProjectDetail } from "./pages/projects/Detail"
import { ProjectNew } from "./pages/projects/New"
import { Navbar } from "./components/user/Navbar"
import { Footer } from "./components/user/Footer"
import "./index.css"

/**
 * Component App chính với routing và dark mode
 */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-background flex flex-col">
          <Routes>
            {/* Public routes - không cần đăng nhập */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes - cần đăng nhập */}
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <Navbar />
                  <ProjectsList />
                  <Footer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/new"
              element={
                <ProtectedRoute>
                  <Navbar />
                  <ProjectNew />
                  <Footer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id"
              element={
                <ProtectedRoute>
                  <Navbar />
                  <ProjectDetail />
                  <Footer />
                </ProtectedRoute>
              }
            />
            
            {/* Default routes */}
            <Route path="/" element={<Navigate to="/projects" replace />} />
            <Route path="*" element={<Navigate to="/projects" replace />} />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

