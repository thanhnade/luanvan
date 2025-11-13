import { Link, useLocation } from "react-router-dom"
import { Moon, Sun, FolderKanban, Plus } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Component Navbar với dark mode toggle
 */
export function Navbar() {
  const location = useLocation()
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    // Load dark mode từ localStorage
    const saved = localStorage.getItem("darkMode")
    if (saved === "true") {
      setDarkMode(true)
      document.documentElement.classList.add("dark")
    }
  }, [])

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    localStorage.setItem("darkMode", String(newMode))
    if (newMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  return (
    <nav className="border-b bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/projects" className="flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold text-foreground">DeployHub</span>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-4">
            <Link to="/projects">
              <Button
                variant={location.pathname === "/projects" ? "default" : "ghost"}
              >
                Projects
              </Button>
            </Link>
            <Link to="/projects/new">
              <Button
                variant={location.pathname === "/projects/new" ? "default" : "outline"}
              >
                <Plus className="w-4 h-4 mr-2" />
                Tạo Project
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
              {darkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>
            {/* Avatar placeholder */}
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
              U
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

