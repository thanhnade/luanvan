import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Copy, CheckCircle2, ExternalLink } from "lucide-react"
import { motion } from "framer-motion"
import { getProjectById, deployProject } from "@/lib/mock-api"
import type { Project, ComponentStatus } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"

/**
 * Trang chi tiết Project với tabs
 */
export function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [showLogModal, setShowLogModal] = useState(false)
  const [selectedLogs, setSelectedLogs] = useState("")
  const [deploying, setDeploying] = useState(false)

  // Load project
  useEffect(() => {
    const loadProject = async () => {
      if (!id) return
      setLoading(true)
      try {
        const data = await getProjectById(id)
        setProject(data)
      } catch (error) {
        console.error("Lỗi load project:", error)
        toast.error("Không tìm thấy project")
      } finally {
        setLoading(false)
      }
    }

    loadProject()
  }, [id])

  // Xem log (giả lập)
  const handleViewLog = (resourceName: string) => {
    const fakeLogs = [
      `[${new Date().toLocaleString("vi-VN")}] Starting ${resourceName}...`,
      `[${new Date().toLocaleString("vi-VN")}] Building Docker image...`,
      `[${new Date().toLocaleString("vi-VN")}] Pushing to registry...`,
      `[${new Date().toLocaleString("vi-VN")}] Deploying to cluster...`,
      `[${new Date().toLocaleString("vi-VN")}] ${resourceName} deployed successfully`,
    ].join("\n")
    setSelectedLogs(fakeLogs)
    setShowLogModal(true)
  }

  // Redeploy (giả lập)
  const handleRedeploy = async (resourceName: string) => {
    if (!project) return
    setDeploying(true)
    try {
      await deployProject(project.id)
      toast.success(`Đã bắt đầu redeploy ${resourceName}!`)
    } catch (error) {
      toast.error("Có lỗi xảy ra khi redeploy")
    } finally {
      setDeploying(false)
    }
  }

  // Map trạng thái
  const getStatusBadge = (status: ComponentStatus | Project["status"]) => {
    switch (status) {
      case "deployed":
      case "running":
        return { variant: "success" as const, label: "Đang chạy" }
      case "building":
      case "deploying":
        return { variant: "default" as const, label: "Đang triển khai" }
      case "pending":
        return { variant: "warning" as const, label: "Chờ xử lý" }
      case "error":
        return { variant: "destructive" as const, label: "Lỗi" }
      case "paused":
        return { variant: "secondary" as const, label: "Tạm dừng" }
      default:
        return { variant: "secondary" as const, label: String(status) }
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Đã sao chép vào clipboard!")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Không tìm thấy project
          </h2>
          <Button onClick={() => navigate("/projects")}>Quay lại danh sách</Button>
        </div>
      </div>
    )
  }

  const statusConfig = getStatusBadge(project.status)

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/projects")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-3xl mb-2">{project.name}</CardTitle>
                  {project.description && (
                    <CardDescription className="mb-4">
                      {project.description}
                    </CardDescription>
                  )}
                  <div className="flex items-center gap-4">
                    <Badge variant={statusConfig.variant}>
                      {statusConfig.label}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Cập nhật: {new Date(project.updatedAt).toLocaleString("vi-VN")}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            {project.endpoints && project.endpoints.length > 0 && (
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {project.endpoints.map((endpoint, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md"
                    >
                      <span className="text-sm font-medium">{endpoint.label}:</span>
                      <a
                        href={endpoint.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        {endpoint.url}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(endpoint.url)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Tabs */}
        <Card>
          <CardContent className="p-0">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start border-b rounded-none">
                <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                <TabsTrigger value="databases">
                  Databases ({project.components.databases.length})
                </TabsTrigger>
                <TabsTrigger value="backends">
                  Backends ({project.components.backends.length})
                </TabsTrigger>
                <TabsTrigger value="frontends">
                  Frontends ({project.components.frontends.length})
                </TabsTrigger>
                <TabsTrigger value="history">Lịch sử triển khai</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Thông tin Project</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ID:</span>
                        <span className="font-mono">{project.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tên:</span>
                        <span>{project.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Trạng thái:</span>
                        <Badge variant={statusConfig.variant}>
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="databases" className="p-6">
                {project.components.databases.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {project.components.databases.map((db) => {
                      const dbStatus = getStatusBadge(db.status)
                      return (
                        <Card key={db.id}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-lg">{db.name}</CardTitle>
                                <CardDescription>
                                  {db.type === "mysql" ? "MySQL" : "MongoDB"} -{" "}
                                  {db.provision === "user" ? "Của người dùng" : "Của hệ thống"}
                                </CardDescription>
                              </div>
                              <Badge variant={dbStatus.variant}>
                                {dbStatus.label}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {db.endpoint && (
                              <div className="mb-2">
                                <span className="text-xs font-medium text-muted-foreground uppercase">
                                  Endpoint
                                </span>
                                <p className="text-sm font-mono mt-1">{db.endpoint}</p>
                              </div>
                            )}
                            <div className="flex gap-2 mt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewLog(db.name)}
                              >
                                Xem log
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleRedeploy(db.name)}
                                disabled={deploying}
                              >
                                Redeploy
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-12">
                    Chưa có database nào
                  </p>
                )}
              </TabsContent>

              <TabsContent value="backends" className="p-6">
                {project.components.backends.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {project.components.backends.map((be) => {
                      const beStatus = getStatusBadge(be.status)
                      return (
                        <Card key={be.id}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-lg">{be.name}</CardTitle>
                                <CardDescription>
                                  {be.tech === "spring" ? "Spring Boot" : "Node.js"}
                                </CardDescription>
                              </div>
                              <Badge variant={beStatus.variant}>
                                {beStatus.label}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {be.dns && (
                              <div className="mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-muted-foreground uppercase">
                                    DNS
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    onClick={() => copyToClipboard(be.dns!)}
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                </div>
                                <p className="text-sm font-mono mt-1">{be.dns}</p>
                              </div>
                            )}
                            {be.source.ref && (
                              <div className="mb-2">
                                <span className="text-xs font-medium text-muted-foreground uppercase">
                                  Image
                                </span>
                                <p className="text-sm font-mono mt-1">{be.source.ref}</p>
                              </div>
                            )}
                            <div className="flex gap-2 mt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewLog(be.name)}
                              >
                                Xem log
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleRedeploy(be.name)}
                                disabled={deploying}
                              >
                                Redeploy
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-12">
                    Chưa có backend nào
                  </p>
                )}
              </TabsContent>

              <TabsContent value="frontends" className="p-6">
                {project.components.frontends.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {project.components.frontends.map((fe) => {
                      const feStatus = getStatusBadge(fe.status)
                      return (
                        <Card key={fe.id}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-lg">{fe.name}</CardTitle>
                                <CardDescription>
                                  {fe.tech === "react"
                                    ? "React"
                                    : fe.tech === "vue"
                                    ? "Vue"
                                    : "Angular"}
                                </CardDescription>
                              </div>
                              <Badge variant={feStatus.variant}>
                                {feStatus.label}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {fe.publicUrl && (
                              <div className="mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-muted-foreground uppercase">
                                    URL
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    onClick={() => copyToClipboard(fe.publicUrl!)}
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                </div>
                                <a
                                  href={`https://${fe.publicUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary hover:underline flex items-center gap-1"
                                >
                                  {fe.publicUrl}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            )}
                            {fe.source.ref && (
                              <div className="mb-2">
                                <span className="text-xs font-medium text-muted-foreground uppercase">
                                  Image
                                </span>
                                <p className="text-sm font-mono mt-1">{fe.source.ref}</p>
                              </div>
                            )}
                            <div className="flex gap-2 mt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewLog(fe.name)}
                              >
                                Xem log
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleRedeploy(fe.name)}
                                disabled={deploying}
                              >
                                Redeploy
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-12">
                    Chưa có frontend nào
                  </p>
                )}
              </TabsContent>

              <TabsContent value="history" className="p-6">
                <div className="space-y-3">
                  <div className="text-sm p-4 bg-muted rounded-lg">
                    <div className="font-medium mb-1">
                      Tạo project - {new Date(project.updatedAt).toLocaleString("vi-VN")}
                    </div>
                    <div className="text-muted-foreground">
                      Project được tạo thành công
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Modal xem log */}
        <Dialog open={showLogModal} onOpenChange={setShowLogModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Logs</DialogTitle>
              <DialogDescription>
                Logs của quá trình triển khai
              </DialogDescription>
            </DialogHeader>
            <textarea
              className="w-full h-96 p-4 bg-muted rounded-md font-mono text-sm"
              value={selectedLogs}
              readOnly
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

