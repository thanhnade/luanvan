import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "sonner"
import { ProjectsList } from "./pages/projects/List"
import { ProjectDetail } from "./pages/projects/Detail"
import { ProjectNew } from "./pages/projects/New"
import { Navbar } from "./components/user/Navbar"
import "./index.css"

/**
 * Component App chính với routing và dark mode
 */
function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <Navbar />
        <Routes>
          <Route path="/projects" element={<ProjectsList />} />
          <Route path="/projects/new" element={<ProjectNew />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/" element={<Navigate to="/projects" replace />} />
          <Route path="*" element={<Navigate to="/projects" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </div>
    </BrowserRouter>
  )
}

export default App

