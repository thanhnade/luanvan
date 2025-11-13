import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Plus, Filter, ArrowUpDown } from "lucide-react"
import { motion } from "framer-motion"
import { getProjects } from "@/lib/mock-api"
import type { Project, ProjectStatus } from "@/types"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { EmptyState } from "@/components/EmptyState"

/**
 * Trang danh sách Projects với tìm kiếm, lọc và sắp xếp
 */
export function ProjectsList() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"name" | "updated">("updated")

  // Load projects
  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true)
      try {
        const data = await getProjects(
          searchQuery,
          statusFilter === "all" ? undefined : statusFilter
        )
        // Sort
        const sorted = [...data].sort((a, b) => {
          if (sortBy === "name") {
            return a.name.localeCompare(b.name)
          }
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        })
        setProjects(sorted)
      } catch (error) {
        console.error("Lỗi load projects:", error)
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [searchQuery, statusFilter, sortBy])

  // Map trạng thái sang badge variant
  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case "running":
        return { variant: "success" as const, label: "Đang chạy" }
      case "deploying":
        return { variant: "default" as const, label: "Đang triển khai" }
      case "error":
        return { variant: "destructive" as const, label: "Lỗi" }
      case "paused":
        return { variant: "secondary" as const, label: "Tạm dừng" }
      default:
        return { variant: "secondary" as const, label: status }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Quản lý Projects
          </h1>
          <p className="text-muted-foreground">
            Quản lý và theo dõi các dự án triển khai của bạn
          </p>
        </div>

        {/* Toolbar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Tìm kiếm project..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filter và Sort */}
              <div className="flex gap-2">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="running">Đang chạy</option>
                  <option value="deploying">Đang triển khai</option>
                  <option value="error">Lỗi</option>
                  <option value="paused">Tạm dừng</option>
                </Select>

                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "name" | "updated")}
                >
                  <option value="updated">Sắp xếp theo thời gian</option>
                  <option value="name">Sắp xếp theo tên</option>
                </Select>
              </div>

              {/* Create button */}
              <Button onClick={() => navigate("/projects/new")}>
                <Plus className="w-4 h-4 mr-2" />
                Tạo Project
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Projects list */}
        {projects.length === 0 ? (
          <EmptyState
            title="Chưa có project nào"
            description="Bắt đầu bằng cách tạo project mới để triển khai ứng dụng của bạn"
            actionLabel="Tạo project mới"
            onAction={() => navigate("/projects/new")}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => {
              const statusConfig = getStatusBadge(project.status)

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-xl">{project.name}</CardTitle>
                        <Badge variant={statusConfig.variant}>
                          {statusConfig.label}
                        </Badge>
                      </div>
                      {project.description && (
                        <CardDescription className="line-clamp-2">
                          {project.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span>Databases: {project.components.databases.length}</span>
                          <span>Backends: {project.components.backends.length}</span>
                          <span>Frontends: {project.components.frontends.length}</span>
                        </div>
                        <div className="text-xs">
                          Cập nhật: {formatDate(project.updatedAt)}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        Xem chi tiết
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

