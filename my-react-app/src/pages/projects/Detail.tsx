import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Copy, CheckCircle2, ExternalLink, MoreVertical, Play, Pause, Trash2, Eye, EyeOff, Plus, Upload, X } from "lucide-react"
import { motion } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { getProjectById, deployProject, addDatabaseToProject, addBackendToProject, addFrontendToProject } from "@/lib/mock-api"
import { getProjectBasicInfo, getProjectOverview, getProjectDatabases, getProjectBackends, getProjectFrontends, deleteProject, type DatabaseInfo, type BackendInfo, type FrontendInfo } from "@/lib/project-api"
import { useAuth } from "@/contexts/AuthContext"
import type { Project, ComponentStatus } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { OverviewStats } from "@/components/common/StatsChart"
import { HintBox } from "@/components/user/HintBox"
import { validateDNS, validateDockerImage, validateIP, validatePort, validateZipFile } from "@/lib/validators"
import { toast } from "sonner"

/**
 * Trang chi tiết Project với tabs
 */
export function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [projectBasicInfo, setProjectBasicInfo] = useState<{ name: string; description?: string; updatedAt: string } | null>(null)
  const [projectOverview, setProjectOverview] = useState<{
    databases: { total: number; running: number; paused: number; other: number }
    backends: { total: number; running: number; paused: number; other: number }
    frontends: { total: number; running: number; paused: number; other: number }
  } | null>(null)
  const [projectDatabases, setProjectDatabases] = useState<DatabaseInfo[]>([])
  const [projectBackends, setProjectBackends] = useState<BackendInfo[]>([])
  const [projectFrontends, setProjectFrontends] = useState<FrontendInfo[]>([])
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [showLogModal, setShowLogModal] = useState(false)
  const [selectedLogs, setSelectedLogs] = useState("")
  const [deploying, setDeploying] = useState(false)
  const [showAddDatabase, setShowAddDatabase] = useState(false)
  const [showAddBackend, setShowAddBackend] = useState(false)
  const [showAddFrontend, setShowAddFrontend] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // State cho file uploads
  const [zipFileDb, setZipFileDb] = useState<File | null>(null)
  const [zipErrorDb, setZipErrorDb] = useState("")
  const [zipFileBe, setZipFileBe] = useState<File | null>(null)
  const [zipErrorBe, setZipErrorBe] = useState("")
  const [zipFileFe, setZipFileFe] = useState<File | null>(null)
  const [zipErrorFe, setZipErrorFe] = useState("")
  
  // State cho runtime env (chỉ cho frontend)
  const [runtimeEnv, setRuntimeEnv] = useState<Array<{ key: string; value: string }>>([])

  // Load project basic info từ API
  useEffect(() => {
    const loadProjectBasicInfo = async () => {
      if (!id) return
      try {
        const basicInfo = await getProjectBasicInfo(id)
        setProjectBasicInfo({
          name: basicInfo.projectName,
          description: basicInfo.description,
          updatedAt: basicInfo.updatedAt,
        })
      } catch (error) {
        console.error("Lỗi load project basic info:", error)
        // Không hiển thị toast để tránh làm phiền user nếu vẫn có thể load từ mock-api
      }
    }

    loadProjectBasicInfo()
  }, [id])

  // Load project overview từ API
  useEffect(() => {
    const loadProjectOverview = async () => {
      if (!id) return
      try {
        const overview = await getProjectOverview(id)
        // Map dữ liệu từ API sang format phù hợp với component
        setProjectOverview({
          databases: {
            total: overview.databases.total,
            running: overview.databases.running,
            paused: overview.databases.paused,
            other: overview.databases.stopped + overview.databases.error,
          },
          backends: {
            total: overview.backends.total,
            running: overview.backends.running,
            paused: overview.backends.paused,
            other: overview.backends.stopped + overview.backends.error,
          },
          frontends: {
            total: overview.frontends.total,
            running: overview.frontends.running,
            paused: overview.frontends.paused,
            other: overview.frontends.stopped + overview.frontends.error,
          },
        })
      } catch (error) {
        console.error("Lỗi load project overview:", error)
        // Không hiển thị toast để tránh làm phiền user nếu vẫn có thể load từ mock-api
      }
    }

    loadProjectOverview()
  }, [id])

  // Load project databases từ API
  useEffect(() => {
    const loadProjectDatabases = async () => {
      if (!id) return
      try {
        const response = await getProjectDatabases(id)
        setProjectDatabases(response.databases)
      } catch (error) {
        console.error("Lỗi load project databases:", error)
        // Không hiển thị toast để tránh làm phiền user nếu vẫn có thể load từ mock-api
      }
    }

    loadProjectDatabases()
  }, [id])

  // Load project backends từ API
  useEffect(() => {
    const loadProjectBackends = async () => {
      if (!id) return
      try {
        const response = await getProjectBackends(id)
        setProjectBackends(response.backends)
      } catch (error) {
        console.error("Lỗi load project backends:", error)
        // Không hiển thị toast để tránh làm phiền user nếu vẫn có thể load từ mock-api
      }
    }

    loadProjectBackends()
  }, [id])

  // Load project frontends từ API
  useEffect(() => {
    const loadProjectFrontends = async () => {
      if (!id) return
      try {
        const response = await getProjectFrontends(id)
        setProjectFrontends(response.frontends)
      } catch (error) {
        console.error("Lỗi load project frontends:", error)
        // Không hiển thị toast để tránh làm phiền user nếu vẫn có thể load từ mock-api
      }
    }

    loadProjectFrontends()
  }, [id])

  // Load project (components) từ mock-api
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

  // Chạy component
  const handleStart = async (resourceName: string, resourceType: "database" | "backend" | "frontend") => {
    if (!project) return
    setDeploying(true)
    try {
      await deployProject(project.id)
      toast.success(`Đã bắt đầu chạy ${resourceName}!`)
      // Reload project để cập nhật status
      const data = await getProjectById(project.id)
      setProject(data)
    } catch (error) {
      toast.error("Có lỗi xảy ra khi chạy")
    } finally {
      setDeploying(false)
    }
  }

  // Tạm dừng component
  const handlePause = async (resourceName: string, resourceType: "database" | "backend" | "frontend") => {
    toast.success(`Đã tạm dừng ${resourceName}!`)
    // Mock: Cập nhật status trong project
    if (project) {
      // Có thể cập nhật state local hoặc gọi API
      toast.info("Tính năng tạm dừng đang được phát triển")
    }
  }

  // Xóa component
  const handleDelete = async (resourceName: string, resourceType: "database" | "backend" | "frontend") => {
    if (confirm(`Bạn có chắc chắn muốn xóa ${resourceName}?`)) {
      toast.success(`Đã xóa ${resourceName}!`)
      // Mock: Có thể reload project hoặc cập nhật state
      toast.info("Tính năng xóa đang được phát triển")
    }
  }

  // Xem chi tiết component
  const handleViewDetails = (resourceName: string, resourceType: "database" | "backend" | "frontend") => {
    toast.info(`Xem chi tiết ${resourceName} (${resourceType})`)
    // Có thể mở modal hoặc navigate đến trang chi tiết
  }

  // Xóa project
  const handleDeleteProject = async () => {
    if (!id || !user?.username) {
      toast.error("Không thể xóa project")
      return
    }

    setIsDeleting(true)
    try {
      await deleteProject(id, user.username)
      toast.success("Đã xóa project thành công!")
      navigate("/projects")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra khi xóa project")
      console.error(error)
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  // Tính toán thống kê - ưu tiên dữ liệu từ API, nếu không có thì tính từ project
  const calculateStats = () => {
    // Nếu có dữ liệu từ API overview, sử dụng nó
    if (projectOverview) {
      return projectOverview
    }

    // Nếu không có, tính từ project (fallback)
    if (!project) return null

    const calculateComponentStats = (components: Array<{ status: ComponentStatus }>) => {
      const stats = {
        total: components.length,
        running: 0,
        paused: 0,
        other: 0,
      }

      components.forEach((comp) => {
        if (comp.status === "deployed") {
          stats.running++
        } else if (comp.status === "pending" || comp.status === "building") {
          stats.paused++
        } else {
          stats.other++
        }
      })

      return stats
    }

    return {
      databases: calculateComponentStats(project.components.databases),
      backends: calculateComponentStats(project.components.backends),
      frontends: calculateComponentStats(project.components.frontends),
    }
  }

  const stats = calculateStats()

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

  // Schema validation cho form thêm database
  const databaseSchema = z.object({
    name: z.string().min(1, "Tên database không được để trống"),
    type: z.enum(["mysql", "mongodb"]),
    databaseName: z.string().optional(), // Tên database thực tế trên server
    username: z.string().optional(),
    password: z.string().optional(),
  })

  // Schema validation cho form thêm backend
  const backendSchema = z.object({
    name: z.string().min(1, "Tên backend không được để trống"),
    tech: z.enum(["spring", "node"]),
    sourceKind: z.enum(["zip", "image"]),
    sourceRef: z.string().optional(),
    dns: z.string().optional(),
    // Database connection fields
    dbName: z.string().optional(),
    dbIp: z.string().optional(),
    dbPort: z.string().optional(),
    dbUsername: z.string().optional(),
    dbPassword: z.string().optional(),
  }).refine((data) => {
    if (data.sourceKind === "image") {
      return !!data.sourceRef && data.sourceRef.trim() !== ""
    }
    return true
  }, {
    message: "Vui lòng nhập Docker image hoặc upload file ZIP",
    path: ["sourceRef"]
  })

  // Schema validation cho form thêm frontend
  const frontendSchema = z.object({
    name: z.string().min(1, "Tên frontend không được để trống"),
    tech: z.enum(["react", "vue", "angular"]),
    sourceKind: z.enum(["zip", "image"]),
    sourceRef: z.string().optional(),
    publicUrl: z.string().optional(),
  }).refine((data) => {
    if (data.sourceKind === "image") {
      return !!data.sourceRef && data.sourceRef.trim() !== ""
    }
    return true
  }, {
    message: "Vui lòng nhập Docker image hoặc upload file ZIP",
    path: ["sourceRef"]
  })

  // Form thêm database
  const {
    register: registerDb,
    handleSubmit: handleSubmitDb,
    reset: resetDb,
    formState: { errors: errorsDb },
  } = useForm<z.infer<typeof databaseSchema>>({
    resolver: zodResolver(databaseSchema),
    defaultValues: {
      type: "mysql",
    },
  })

  const onSubmitDatabase = async (data: z.infer<typeof databaseSchema>) => {
    if (!id) return

    try {
      const newDatabase = {
        name: data.name,
        type: data.type,
        provision: "system" as const, // Mặc định là hệ thống
        databaseName: data.databaseName || undefined,
        username: data.username || undefined,
      }

      const updatedProject = await addDatabaseToProject(id, newDatabase)
      setProject(updatedProject)
      setShowAddDatabase(false)
      resetDb()
      toast.success(`Đã thêm database "${data.name}"`)
    } catch (error) {
      toast.error("Có lỗi xảy ra khi thêm database")
      console.error(error)
    }
  }

  // Form thêm backend
  const {
    register: registerBe,
    handleSubmit: handleSubmitBe,
    watch: watchBe,
    setValue: setValueBe,
    reset: resetBe,
    formState: { errors: errorsBe },
  } = useForm<z.infer<typeof backendSchema>>({
    resolver: zodResolver(backendSchema),
    defaultValues: {
      tech: "spring",
      sourceKind: "image",
    },
  })

  const sourceTypeBe = watchBe("sourceKind")
  const dockerImageBe = watchBe("sourceRef")
  const dnsBe = watchBe("dns")

  // Validate Docker image
  const validateDockerBe = () => {
    if (sourceTypeBe === "image" && dockerImageBe) {
      const validation = validateDockerImage(dockerImageBe)
      if (!validation.valid) {
        // Có thể set error state nếu cần
      }
    }
  }

  // Validate DNS
  const validateDNSBe = () => {
    if (dnsBe) {
      const validation = validateDNS(dnsBe)
      if (!validation.valid) {
        // Có thể set error state nếu cần
      }
    }
  }

  const onSubmitBackend = async (data: z.infer<typeof backendSchema>) => {
    if (!id) return

    if (data.sourceKind === "zip" && !zipFileBe) {
      toast.error("Vui lòng chọn file ZIP")
      return
    }

    if (data.sourceKind === "zip" && zipFileBe) {
      const validation = validateZipFile(zipFileBe)
      if (!validation.valid) {
        setZipErrorBe(validation.message || "")
        return
      }
    }

    // Validate Docker image
    if (data.sourceKind === "image") {
      if (!data.sourceRef || data.sourceRef.trim() === "") {
        toast.error("Vui lòng nhập Docker image")
        return
      }
      const validation = validateDockerImage(data.sourceRef)
      if (!validation.valid) {
        toast.error(validation.message || "Định dạng Docker image không hợp lệ")
        return
      }
    }

    // Validate DNS
    if (data.dns) {
      const dnsValidation = validateDNS(data.dns)
      if (!dnsValidation.valid) {
        toast.error(dnsValidation.message || "DNS không hợp lệ")
        return
      }
    }

    try {
      const sourceRef = data.sourceKind === "zip" 
        ? zipFileBe?.name || "uploaded.zip"
        : data.sourceRef || ""

      // Tạo env vars từ database connection fields
      const env: Array<{ key: string; value: string }> = []
      if (data.dbName) env.push({ key: "DB_NAME", value: data.dbName })
      if (data.dbIp) env.push({ key: "DB_HOST", value: data.dbIp })
      if (data.dbPort) env.push({ key: "DB_PORT", value: data.dbPort })
      if (data.dbUsername) env.push({ key: "DB_USERNAME", value: data.dbUsername })
      if (data.dbPassword) env.push({ key: "DB_PASSWORD", value: data.dbPassword })

      const newBackend = {
        name: data.name,
        tech: data.tech,
        source: {
          kind: data.sourceKind,
          ref: sourceRef,
        },
        dns: data.dns || undefined,
        env: env.reduce((acc, e) => {
          acc[e.key] = e.value
          return acc
        }, {} as Record<string, string>),
      }

      const updatedProject = await addBackendToProject(id, newBackend)
      setProject(updatedProject)
      setShowAddBackend(false)
      resetBe()
      setZipFileBe(null)
      setZipErrorBe("")
      toast.success(`Đã thêm backend "${data.name}"`)
    } catch (error) {
      toast.error("Có lỗi xảy ra khi thêm backend")
      console.error(error)
    }
  }

  // Form thêm frontend
  const {
    register: registerFe,
    handleSubmit: handleSubmitFe,
    watch: watchFe,
    setValue: setValueFe,
    reset: resetFe,
    formState: { errors: errorsFe },
  } = useForm<z.infer<typeof frontendSchema>>({
    resolver: zodResolver(frontendSchema),
    defaultValues: {
      tech: "react",
      sourceKind: "image",
    },
  })

  const sourceTypeFe = watchFe("sourceKind")
  const dockerImageFe = watchFe("sourceRef")
  const publicUrlFe = watchFe("publicUrl")

  // Validate Docker image
  const validateDockerFe = () => {
    if (sourceTypeFe === "image" && dockerImageFe) {
      const validation = validateDockerImage(dockerImageFe)
      if (!validation.valid) {
        // Có thể set error state nếu cần
      }
    }
  }

  // Validate DNS
  const validateDNSPublicUrl = () => {
    if (publicUrlFe) {
      const validation = validateDNS(publicUrlFe)
      if (!validation.valid) {
        // Có thể set error state nếu cần
      }
    }
  }

  const onSubmitFrontend = async (data: z.infer<typeof frontendSchema>) => {
    if (!id) return

    if (data.sourceKind === "zip" && !zipFileFe) {
      toast.error("Vui lòng chọn file ZIP")
      return
    }

    if (data.sourceKind === "zip" && zipFileFe) {
      const validation = validateZipFile(zipFileFe)
      if (!validation.valid) {
        setZipErrorFe(validation.message || "")
        return
      }
    }

    // Validate Docker image
    if (data.sourceKind === "image") {
      if (!data.sourceRef || data.sourceRef.trim() === "") {
        toast.error("Vui lòng nhập Docker image")
        return
      }
      const validation = validateDockerImage(data.sourceRef)
      if (!validation.valid) {
        toast.error(validation.message || "Định dạng Docker image không hợp lệ")
        return
      }
    }

    // Validate DNS
    if (data.publicUrl) {
      const dnsValidation = validateDNS(data.publicUrl)
      if (!dnsValidation.valid) {
        toast.error(dnsValidation.message || "DNS không hợp lệ")
        return
      }
    }

    try {
      const sourceRef = data.sourceKind === "zip" 
        ? zipFileFe?.name || "uploaded.zip"
        : data.sourceRef || ""

      const newFrontend = {
        name: data.name,
        tech: data.tech,
        source: {
          kind: data.sourceKind,
          ref: sourceRef,
        },
        publicUrl: data.publicUrl || undefined,
      }

      const updatedProject = await addFrontendToProject(id, newFrontend)
      setProject(updatedProject)
      setShowAddFrontend(false)
      resetFe()
      setZipFileFe(null)
      setZipErrorFe("")
      toast.success(`Đã thêm frontend "${data.name}"`)
    } catch (error) {
      toast.error("Có lỗi xảy ra khi thêm frontend")
      console.error(error)
    }
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
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/projects")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Xóa Project
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-3xl mb-2">
                    {projectBasicInfo?.name || project.name}
                  </CardTitle>
                  {(projectBasicInfo?.description || project.description) && (
                    <CardDescription className="mb-4">
                      {projectBasicInfo?.description || project.description}
                    </CardDescription>
                  )}
                  <span className="text-sm text-muted-foreground">
                    Cập nhật:{" "}
                    {projectBasicInfo?.updatedAt
                      ? new Date(projectBasicInfo.updatedAt).toLocaleString("vi-VN")
                      : new Date(project.updatedAt).toLocaleString("vi-VN")}
                  </span>
                </div>
                <Badge variant={statusConfig.variant} className="ml-4">
                  {statusConfig.label}
                </Badge>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Tabs */}
        <Card>
          <CardContent className="p-0">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start border-b rounded-none">
                <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                <TabsTrigger value="databases">
                  Databases ({projectDatabases.length > 0 ? projectDatabases.length : (stats?.databases?.total ?? project.components.databases.length)})
                </TabsTrigger>
                <TabsTrigger value="backends">
                  Backends ({projectBackends.length > 0 ? projectBackends.length : (stats?.backends?.total ?? project.components.backends.length)})
                </TabsTrigger>
                <TabsTrigger value="frontends">
                  Frontends ({projectFrontends.length > 0 ? projectFrontends.length : (stats?.frontends?.total ?? project.components.frontends.length)})
                </TabsTrigger>
                <TabsTrigger value="history">Lịch sử triển khai</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="p-6">
                <div className="space-y-6">
                  {/* Thống kê với biểu đồ */}
                  {stats && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Thống kê Components</h3>
                      <OverviewStats
                        databases={stats.databases}
                        backends={stats.backends}
                        frontends={stats.frontends}
                      />
                    </div>
                  )}

                  {/* Tổng hợp nhanh */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Tổng hợp</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {stats?.databases?.total ?? project.components.databases.length}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">Databases</div>
                        </div>
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {stats?.backends?.total ?? project.components.backends.length}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">Backends</div>
                        </div>
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {stats?.frontends?.total ?? project.components.frontends.length}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">Frontends</div>
                        </div>
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <div className="text-2xl font-bold">
                            {(stats?.databases?.total ?? project.components.databases.length) +
                              (stats?.backends?.total ?? project.components.backends.length) +
                              (stats?.frontends?.total ?? project.components.frontends.length)}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">Tổng cộng</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="databases" className="p-6">
                {/* Header với nút thêm */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Databases</h3>
                  <Button onClick={() => setShowAddDatabase(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm Database
                  </Button>
                </div>

                {/* Thống kê Databases */}
                {stats && (
                  <Card className="mb-6">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {stats.databases.total}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">Tổng số</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {stats.databases.running}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">Đang chạy</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                            {stats.databases.paused}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">Đang dừng</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {(projectDatabases.length > 0 || project.components.databases.length > 0) ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(projectDatabases.length > 0 ? projectDatabases : project.components.databases).map((db) => {
                      // Map dữ liệu từ API hoặc mock
                      const isApiData = 'databaseType' in db
                      const dbName = isApiData ? (db as DatabaseInfo).projectName : (db as any).name
                      const dbDescription = isApiData ? (db as DatabaseInfo).description : undefined
                      const dbType = isApiData ? (db as DatabaseInfo).databaseType : (db as any).type
                      const dbStatus = getStatusBadge(isApiData ? (db as DatabaseInfo).status.toLowerCase() as ComponentStatus : (db as any).status)
                      const dbIp = isApiData ? (db as DatabaseInfo).databaseIp : undefined
                      const dbPort = isApiData ? (db as DatabaseInfo).databasePort : undefined
                      const dbDatabaseName = isApiData ? (db as DatabaseInfo).databaseName : (db as any).databaseName
                      const dbUsername = isApiData ? (db as DatabaseInfo).databaseUsername : (db as any).username
                      const dbPassword = isApiData ? (db as DatabaseInfo).databasePassword : undefined
                      const dbId = isApiData ? `api-${(db as DatabaseInfo).id}` : (db as any).id

                      return (
                        <Card key={dbId}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-lg">{dbName}</CardTitle>
                                {dbDescription && (
                                  <CardDescription className="mt-1">
                                    {dbDescription}
                                  </CardDescription>
                                )}
                                <CardDescription className="mt-1">
                                  {dbType === "MYSQL" || dbType === "mysql" ? "MySQL" : dbType === "MONGODB" || dbType === "mongodb" ? "MongoDB" : dbType} - Của hệ thống
                                </CardDescription>
                              </div>
                              <Badge variant={dbStatus.variant}>
                                {dbStatus.label}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {/* IP, Port, Database Name - chung 1 hàng */}
                              {(dbIp || dbPort || dbDatabaseName) && (
                                <div className="grid grid-cols-3 gap-4">
                                  {/* IP */}
                                  {dbIp && (
                                    <div>
                                      <span className="text-xs font-medium text-muted-foreground uppercase">
                                        IP
                                      </span>
                                      <p className="text-sm font-mono mt-1">{dbIp}</p>
                                    </div>
                                  )}
                                  
                                  {/* Port */}
                                  {dbPort && (
                                    <div>
                                      <span className="text-xs font-medium text-muted-foreground uppercase">
                                        Port
                                      </span>
                                      <p className="text-sm font-mono mt-1">{dbPort}</p>
                                    </div>
                                  )}

                                  {/* Database Name */}
                                  {dbDatabaseName && (
                                    <div>
                                      <span className="text-xs font-medium text-muted-foreground uppercase">
                                        Database Name
                                      </span>
                                      <p className="text-sm font-mono mt-1">{dbDatabaseName}</p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Username và Password - chung 1 hàng */}
                              {(dbUsername || dbPassword) && (
                                <div className="grid grid-cols-2 gap-4">
                                  {/* Username */}
                                  {dbUsername && (
                                    <div>
                                      <span className="text-xs font-medium text-muted-foreground uppercase">
                                        Username
                                      </span>
                                      <p className="text-sm font-mono mt-1">{dbUsername}</p>
                                    </div>
                                  )}

                                  {/* Password với icon toggle */}
                                  {dbPassword && (
                                    <div>
                                      <span className="text-xs font-medium text-muted-foreground uppercase">
                                        Password
                                      </span>
                                      <div className="relative mt-1">
                                        <p className="text-sm font-mono pr-8">
                                          {showPasswords[dbId] ? dbPassword : "••••••••"}
                                        </p>
                                        <button
                                          type="button"
                                          onClick={() => setShowPasswords(prev => ({ ...prev, [dbId]: !prev[dbId] }))}
                                          className="absolute right-0 top-0 p-1 text-muted-foreground hover:text-foreground transition-colors"
                                          aria-label={showPasswords[dbId] ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                        >
                                          {showPasswords[dbId] ? (
                                            <EyeOff className="w-4 h-4" />
                                          ) : (
                                            <Eye className="w-4 h-4" />
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex justify-end mt-4">
                              <DropdownMenu
                                trigger={
                                  <Button variant="outline" size="sm">
                                    <MoreVertical className="w-4 h-4 mr-2" />
                                    Thao tác
                                  </Button>
                                }
                              >
                                <DropdownMenuItem
                                  onClick={() => handleStart(dbName, "database")}
                                  disabled={deploying || dbStatus.label === "Đang chạy"}
                                >
                                  <Play className="w-4 h-4 mr-2" />
                                  Chạy
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handlePause(dbName, "database")}
                                  disabled={dbStatus.label === "Tạm dừng" || dbStatus.label === "Chờ xử lý"}
                                >
                                  <Pause className="w-4 h-4 mr-2" />
                                  Tạm dừng
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(dbName, "database")}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Xóa
                                </DropdownMenuItem>
                              </DropdownMenu>
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
                {/* Header với nút thêm */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Backends</h3>
                  <Button onClick={() => setShowAddBackend(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm Backend
                  </Button>
                </div>

                {/* Thống kê Backends */}
                {stats && (
                  <Card className="mb-6">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {stats.backends.total}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">Tổng số</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {stats.backends.running}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">Đang chạy</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                            {stats.backends.paused}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">Đang dừng</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {(projectBackends.length > 0 || project.components.backends.length > 0) ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(projectBackends.length > 0 ? projectBackends : project.components.backends).map((be) => {
                      // Map dữ liệu từ API hoặc mock
                      const isApiData = 'frameworkType' in be
                      const beName = isApiData ? (be as BackendInfo).projectName : (be as any).name
                      const beDescription = isApiData ? (be as BackendInfo).description : undefined
                      const beTech = isApiData ? (be as BackendInfo).frameworkType : (be as any).tech
                      const beStatus = getStatusBadge(isApiData ? (be as BackendInfo).status.toLowerCase() as ComponentStatus : (be as any).status)
                      const beDns = isApiData ? (be as BackendInfo).domainNameSystem : (be as any).dns
                      const beDockerImage = isApiData ? (be as BackendInfo).dockerImage : (be as any).source?.ref
                      const beDbIp = isApiData ? (be as BackendInfo).databaseIp : undefined
                      const beDbPort = isApiData ? (be as BackendInfo).databasePort : undefined
                      const beDbName = isApiData ? (be as BackendInfo).databaseName : undefined
                      const beDbUsername = isApiData ? (be as BackendInfo).databaseUsername : undefined
                      const beDbPassword = isApiData ? (be as BackendInfo).databasePassword : undefined
                      const beId = isApiData ? `api-be-${(be as BackendInfo).id}` : (be as any).id

                      return (
                        <Card key={beId}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-lg">{beName}</CardTitle>
                                {beDescription && (
                                  <CardDescription className="mt-1">
                                    {beDescription}
                                  </CardDescription>
                                )}
                                <CardDescription className="mt-1">
                                  {beTech === "SPRING" || beTech === "spring" ? "Spring Boot" : beTech === "NODEJS" || beTech === "node" ? "Node.js" : beTech}
                                </CardDescription>
                              </div>
                              <Badge variant={beStatus.variant}>
                                {beStatus.label}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {/* DNS */}
                              {beDns && (
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-muted-foreground uppercase">
                                      DNS
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5"
                                      onClick={() => copyToClipboard(beDns!)}
                                    >
                                      <Copy className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  <p className="text-sm font-mono mt-1">{beDns}</p>
                                </div>
                              )}

                              {/* Docker Image */}
                              {beDockerImage && (
                                <div>
                                  <span className="text-xs font-medium text-muted-foreground uppercase">
                                    Docker Image
                                  </span>
                                  <p className="text-sm font-mono mt-1">{beDockerImage}</p>
                                </div>
                              )}

                              {/* IP, Port, Database Name - chung 1 hàng (nếu có database connection) */}
                              {(beDbIp || beDbPort || beDbName) && (
                                <div className="grid grid-cols-3 gap-4">
                                  {/* IP */}
                                  {beDbIp && (
                                    <div>
                                      <span className="text-xs font-medium text-muted-foreground uppercase">
                                        IP
                                      </span>
                                      <p className="text-sm font-mono mt-1">{beDbIp}</p>
                                    </div>
                                  )}
                                  
                                  {/* Port */}
                                  {beDbPort && (
                                    <div>
                                      <span className="text-xs font-medium text-muted-foreground uppercase">
                                        Port
                                      </span>
                                      <p className="text-sm font-mono mt-1">{beDbPort}</p>
                                    </div>
                                  )}

                                  {/* Database Name */}
                                  {beDbName && (
                                    <div>
                                      <span className="text-xs font-medium text-muted-foreground uppercase">
                                        Database Name
                                      </span>
                                      <p className="text-sm font-mono mt-1">{beDbName}</p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Username và Password - chung 1 hàng (nếu có database connection) */}
                              {(beDbUsername || beDbPassword) && (
                                <div className="grid grid-cols-2 gap-4">
                                  {/* Username */}
                                  {beDbUsername && (
                                    <div>
                                      <span className="text-xs font-medium text-muted-foreground uppercase">
                                        Username
                                      </span>
                                      <p className="text-sm font-mono mt-1">{beDbUsername}</p>
                                    </div>
                                  )}

                                  {/* Password với icon toggle */}
                                  {beDbPassword && (
                                    <div>
                                      <span className="text-xs font-medium text-muted-foreground uppercase">
                                        Password
                                      </span>
                                      <div className="relative mt-1">
                                        <p className="text-sm font-mono pr-8">
                                          {showPasswords[beId] ? beDbPassword : "••••••••"}
                                        </p>
                                        <button
                                          type="button"
                                          onClick={() => setShowPasswords(prev => ({ ...prev, [beId]: !prev[beId] }))}
                                          className="absolute right-0 top-0 p-1 text-muted-foreground hover:text-foreground transition-colors"
                                          aria-label={showPasswords[beId] ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                        >
                                          {showPasswords[beId] ? (
                                            <EyeOff className="w-4 h-4" />
                                          ) : (
                                            <Eye className="w-4 h-4" />
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex justify-end mt-4">
                              <DropdownMenu
                                trigger={
                                  <Button variant="outline" size="sm">
                                    <MoreVertical className="w-4 h-4 mr-2" />
                                    Thao tác
                                  </Button>
                                }
                              >
                                <DropdownMenuItem
                                  onClick={() => handleStart(beName, "backend")}
                                  disabled={deploying || beStatus.label === "Đang chạy"}
                                >
                                  <Play className="w-4 h-4 mr-2" />
                                  Chạy
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handlePause(beName, "backend")}
                                  disabled={beStatus.label === "Tạm dừng" || beStatus.label === "Chờ xử lý"}
                                >
                                  <Pause className="w-4 h-4 mr-2" />
                                  Tạm dừng
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(beName, "backend")}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Xóa
                                </DropdownMenuItem>
                              </DropdownMenu>
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
                {/* Header với nút thêm */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Frontends</h3>
                  <Button onClick={() => setShowAddFrontend(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm Frontend
                  </Button>
                </div>

                {/* Thống kê Frontends */}
                {stats && (
                  <Card className="mb-6">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {stats.frontends.total}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">Tổng số</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {stats.frontends.running}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">Đang chạy</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                            {stats.frontends.paused}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">Đang dừng</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {(projectFrontends.length > 0 || project.components.frontends.length > 0) ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(projectFrontends.length > 0 ? projectFrontends : project.components.frontends).map((fe) => {
                      // Map dữ liệu từ API hoặc mock
                      const isApiData = 'frameworkType' in fe
                      const feName = isApiData ? (fe as FrontendInfo).projectName : (fe as any).name
                      const feDescription = isApiData ? (fe as FrontendInfo).description : undefined
                      const feTech = isApiData ? (fe as FrontendInfo).frameworkType : (fe as any).tech
                      const feStatus = getStatusBadge(isApiData ? (fe as FrontendInfo).status.toLowerCase() as ComponentStatus : (fe as any).status)
                      const feDns = isApiData ? (fe as FrontendInfo).domainNameSystem : (fe as any).publicUrl
                      const feDockerImage = isApiData ? (fe as FrontendInfo).dockerImage : (fe as any).source?.ref
                      const feId = isApiData ? `api-fe-${(fe as FrontendInfo).id}` : (fe as any).id

                      return (
                        <Card key={feId}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-lg">{feName}</CardTitle>
                                {feDescription && (
                                  <CardDescription className="mt-1">
                                    {feDescription}
                                  </CardDescription>
                                )}
                                <CardDescription className="mt-1">
                                  {feTech === "REACT" || feTech === "react" ? "React" : 
                                   feTech === "VUE" || feTech === "vue" ? "Vue" : 
                                   feTech === "ANGULAR" || feTech === "angular" ? "Angular" : feTech}
                                </CardDescription>
                              </div>
                              <Badge variant={feStatus.variant}>
                                {feStatus.label}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {/* DNS */}
                              {feDns && (
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-muted-foreground uppercase">
                                      DNS
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5"
                                      onClick={() => copyToClipboard(feDns!)}
                                    >
                                      <Copy className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  <a
                                    href={`https://${feDns}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                                  >
                                    {feDns}
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              )}

                              {/* Docker Image */}
                              {feDockerImage && (
                                <div>
                                  <span className="text-xs font-medium text-muted-foreground uppercase">
                                    Docker Image
                                  </span>
                                  <p className="text-sm font-mono mt-1">{feDockerImage}</p>
                                </div>
                              )}
                            </div>

                            <div className="flex justify-end mt-4">
                              <DropdownMenu
                                trigger={
                                  <Button variant="outline" size="sm">
                                    <MoreVertical className="w-4 h-4 mr-2" />
                                    Thao tác
                                  </Button>
                                }
                              >
                                <DropdownMenuItem
                                  onClick={() => handleStart(feName, "frontend")}
                                  disabled={deploying || feStatus.label === "Đang chạy"}
                                >
                                  <Play className="w-4 h-4 mr-2" />
                                  Chạy
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handlePause(feName, "frontend")}
                                  disabled={feStatus.label === "Tạm dừng" || feStatus.label === "Chờ xử lý"}
                                >
                                  <Pause className="w-4 h-4 mr-2" />
                                  Tạm dừng
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(feName, "frontend")}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Xóa
                                </DropdownMenuItem>
                              </DropdownMenu>
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
                      Tạo project -{" "}
                      {projectBasicInfo?.updatedAt
                        ? new Date(projectBasicInfo.updatedAt).toLocaleString("vi-VN")
                        : new Date(project.updatedAt).toLocaleString("vi-VN")}
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

        {/* Dialog thêm Database */}
        <Dialog open={showAddDatabase} onOpenChange={setShowAddDatabase}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Thêm Database</DialogTitle>
              <DialogDescription>
                Thêm database mới vào project
              </DialogDescription>
            </DialogHeader>
            
            <HintBox title="Hướng dẫn">
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Chọn loại database: MySQL hoặc MongoDB</li>
                <li>
                  Hệ thống sẽ tự động tạo và quản lý database (chỉ thao tác qua ứng dụng, không cấp quyền đăng nhập DB)
                </li>
                <li>
                  Upload file ZIP: Chỉ nhận tệp .zip. Khi giải nén, tên thư mục gốc phải trùng với tên database
                </li>
                <li>Ví dụ cấu trúc: <code className="bg-muted px-1 rounded">my-database/schema.sql</code></li>
              </ul>
            </HintBox>
            
            <form onSubmit={handleSubmitDb(onSubmitDatabase)} className="space-y-4">
              <div>
                <Label htmlFor="db-name">
                  Tên Database <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="db-name"
                  {...registerDb("name")}
                  placeholder="my-database"
                />
                {errorsDb.name && (
                  <p className="text-sm text-destructive mt-1">
                    {errorsDb.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="db-type">
                  Loại Database <span className="text-destructive">*</span>
                </Label>
                <Select id="db-type" {...registerDb("type")}>
                  <option value="mysql">MySQL</option>
                  <option value="mongodb">MongoDB</option>
                </Select>
              </div>

              {/* Form fields cho Database connection - chỉ hiển thị cho hệ thống */}
              <div className="p-4 bg-muted rounded-lg space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Thông tin Database của hệ thống
                  </Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Nhập thông tin database (tùy chọn cho hệ thống tự quản lý)
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="db-databaseName">
                      Tên Database
                    </Label>
                    <Input
                      id="db-databaseName"
                      {...registerDb("databaseName")}
                      placeholder="my_database"
                    />
                    {errorsDb.databaseName && (
                      <p className="text-sm text-destructive mt-1">
                        {errorsDb.databaseName.message}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="db-username">
                        Username Database
                      </Label>
                      <Input
                        id="db-username"
                        {...registerDb("username")}
                        placeholder="admin"
                      />
                      {errorsDb.username && (
                        <p className="text-sm text-destructive mt-1">
                          {errorsDb.username.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="db-password">
                        Password Database
                      </Label>
                      <Input
                        id="db-password"
                        type="password"
                        {...registerDb("password")}
                        placeholder="••••••••"
                      />
                      {errorsDb.password && (
                        <p className="text-sm text-destructive mt-1">
                          {errorsDb.password.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload ZIP */}
              <div>
                <Label>Upload file ZIP (tùy chọn)</Label>
                <div
                  className="mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => document.getElementById("zip-input-db-modal")?.click()}
                >
                  {zipFileDb ? (
                    <div>
                      <p className="font-medium">{zipFileDb.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(zipFileDb.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={(e) => {
                          e.stopPropagation()
                          setZipFileDb(null)
                          setZipErrorDb("")
                        }}
                      >
                        Xóa file
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm">Chọn file hoặc kéo thả vào đây</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        File ZIP, tối đa 100 MB
                      </p>
                    </div>
                  )}
                </div>
                <input
                  id="zip-input-db-modal"
                  type="file"
                  accept=".zip"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const validation = validateZipFile(file)
                      if (validation.valid) {
                        setZipFileDb(file)
                        setZipErrorDb("")
                      } else {
                        setZipErrorDb(validation.message || "")
                      }
                    }
                  }}
                />
                {zipErrorDb && (
                  <p className="text-sm text-destructive mt-1">{zipErrorDb}</p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddDatabase(false)
                    resetDb()
                    setZipFileDb(null)
                    setZipErrorDb("")
                  }}
                >
                  Hủy
                </Button>
                <Button type="submit">Thêm Database</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog thêm Backend */}
        <Dialog open={showAddBackend} onOpenChange={setShowAddBackend}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Thêm Backend</DialogTitle>
              <DialogDescription>
                Thêm backend mới vào project
              </DialogDescription>
            </DialogHeader>
            
            <HintBox title="Hướng dẫn">
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Chọn Spring Boot hoặc Node.js</li>
                <li>
                  <strong>Upload ZIP:</strong> Tên thư mục gốc trùng với tên dự án. Spring Boot cần <code className="bg-muted px-1 rounded">pom.xml</code> hoặc <code className="bg-muted px-1 rounded">build.gradle</code>. Node cần <code className="bg-muted px-1 rounded">package.json</code>
                </li>
                <li>
                  <strong>Docker Image:</strong> Định dạng <code className="bg-muted px-1 rounded">owner/name:tag</code> (ví dụ: <code className="bg-muted px-1 rounded">docker.io/user/app:1.0.0</code>)
                </li>
                <li>
                  <strong>DNS:</strong> Chỉ a-z, 0-9, '-', dài 3-63 ký tự, không bắt đầu/kết thúc bằng '-' (ví dụ: <code className="bg-muted px-1 rounded">api.myapp.local.test</code>)
                </li>
                <li>
                  <strong>Kết nối Database:</strong> Nhập thông tin kết nối database (tên, IP, Port, Username, Password) để backend có thể kết nối
                </li>
              </ul>
            </HintBox>
            
            <form onSubmit={handleSubmitBe(onSubmitBackend)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="be-name">Tên Backend <span className="text-destructive">*</span></Label>
                  <Input id="be-name" {...registerBe("name")} placeholder="api-service" />
                  {errorsBe.name && (
                    <p className="text-sm text-destructive mt-1">{errorsBe.name.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="be-tech">Technology <span className="text-destructive">*</span></Label>
                  <Select id="be-tech" {...registerBe("tech")} onChange={(e) => {
                    registerBe("tech").onChange(e)
                  }}>
                    <option value="spring">Spring Boot</option>
                    <option value="node">Node.js</option>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Nguồn mã nguồn <span className="text-destructive">*</span></Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant={sourceTypeBe === "zip" ? "default" : "outline"}
                    onClick={() => setValueBe("sourceKind", "zip")}
                  >
                    Upload ZIP
                  </Button>
                  <Button
                    type="button"
                    variant={sourceTypeBe === "image" ? "default" : "outline"}
                    onClick={() => setValueBe("sourceKind", "image")}
                  >
                    Docker Image
                  </Button>
                </div>
              </div>

              {sourceTypeBe === "zip" ? (
                <div>
                  <Label>File ZIP <span className="text-destructive">*</span></Label>
                  <div
                    className="mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => document.getElementById("zip-input-be-modal")?.click()}
                  >
                    {zipFileBe ? (
                      <div>
                        <p className="font-medium">{zipFileBe.name}</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={(e) => {
                            e.stopPropagation()
                            setZipFileBe(null)
                            setZipErrorBe("")
                          }}
                        >
                          Xóa file
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm">Chọn file ZIP</p>
                      </div>
                    )}
                  </div>
                  <input
                    id="zip-input-be-modal"
                    type="file"
                    accept=".zip"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const validation = validateZipFile(file)
                        if (validation.valid) {
                          setZipFileBe(file)
                          setZipErrorBe("")
                        } else {
                          setZipErrorBe(validation.message || "")
                        }
                      }
                    }}
                  />
                  {zipErrorBe && (
                    <p className="text-sm text-destructive mt-1">{zipErrorBe}</p>
                  )}
                </div>
              ) : (
                <div>
                  <Label htmlFor="be-source-ref">Docker Image <span className="text-destructive">*</span></Label>
                  <Input
                    id="be-source-ref"
                    {...registerBe("sourceRef")}
                    placeholder="docker.io/user/app:1.0.0"
                    className="font-mono"
                    onBlur={validateDockerBe}
                  />
                  {errorsBe.sourceRef && (
                    <p className="text-sm text-destructive mt-1">{errorsBe.sourceRef.message}</p>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="be-dns">DNS (tùy chọn)</Label>
                <div className="flex gap-2">
                  <Input
                    id="be-dns"
                    {...registerBe("dns")}
                    placeholder="api-myapp"
                    onBlur={validateDNSBe}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const dnsValue = watchBe("dns")
                      if (dnsValue) {
                        const validation = validateDNS(dnsValue)
                        if (validation.valid) {
                          toast.success("DNS hợp lệ!")
                        } else {
                          toast.error(validation.message || "DNS không hợp lệ")
                        }
                      } else {
                        toast.info("Vui lòng nhập DNS trước khi kiểm tra")
                      }
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Kiểm tra
                  </Button>
                </div>
              </div>

              {/* Database connection fields */}
              <div className="p-4 bg-muted rounded-lg space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Kết nối Database
                  </Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Nhập thông tin kết nối database cho backend
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-5">
                      <Label htmlFor="be-dbName">
                        Tên Database
                      </Label>
                      <Input
                        id="be-dbName"
                        {...registerBe("dbName")}
                        placeholder="my_database"
                      />
                    </div>
                    <div className="col-span-5">
                      <Label htmlFor="be-dbIp">
                        IP/Host Database
                      </Label>
                      <Input
                        id="be-dbIp"
                        {...registerBe("dbIp")}
                        placeholder="192.168.1.100"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="be-dbPort">
                        Port
                      </Label>
                      <Input
                        id="be-dbPort"
                        {...registerBe("dbPort")}
                        placeholder="3306"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="be-dbUsername">
                        Username Database
                      </Label>
                      <Input
                        id="be-dbUsername"
                        {...registerBe("dbUsername")}
                        placeholder="admin"
                      />
                    </div>
                    <div>
                      <Label htmlFor="be-dbPassword">
                        Password Database
                      </Label>
                      <Input
                        id="be-dbPassword"
                        type="password"
                        {...registerBe("dbPassword")}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddBackend(false)
                    resetBe()
                    setZipFileBe(null)
                    setZipErrorBe("")
                  }}
                >
                  Hủy
                </Button>
                <Button type="submit">Thêm Backend</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog thêm Frontend */}
        <Dialog open={showAddFrontend} onOpenChange={setShowAddFrontend}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Thêm Frontend</DialogTitle>
              <DialogDescription>
                Thêm frontend mới vào project
              </DialogDescription>
            </DialogHeader>
            
            <HintBox title="Hướng dẫn">
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Chọn React, Vue hoặc Angular</li>
                <li>
                  <strong>Upload ZIP:</strong> Tên thư mục gốc trùng với tên dự án
                </li>
                <li>
                  <strong>Docker Image:</strong> Định dạng <code className="bg-muted px-1 rounded">owner/name:tag</code>
                </li>
                <li>
                  <strong>DNS:</strong> Chỉ a-z, 0-9, '-', dài 3-63 ký tự, không bắt đầu/kết thúc bằng '-' (ví dụ: <code className="bg-muted px-1 rounded">fe.myapp.local.test</code>)
                </li>
              </ul>
            </HintBox>
            
            <form onSubmit={handleSubmitFe(onSubmitFrontend)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fe-name">Tên Frontend <span className="text-destructive">*</span></Label>
                  <Input id="fe-name" {...registerFe("name")} placeholder="web-app" />
                  {errorsFe.name && (
                    <p className="text-sm text-destructive mt-1">{errorsFe.name.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="fe-tech">Technology <span className="text-destructive">*</span></Label>
                  <Select id="fe-tech" {...registerFe("tech")}>
                    <option value="react">React</option>
                    <option value="vue">Vue</option>
                    <option value="angular">Angular</option>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Nguồn mã nguồn <span className="text-destructive">*</span></Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant={sourceTypeFe === "zip" ? "default" : "outline"}
                    onClick={() => setValueFe("sourceKind", "zip")}
                  >
                    Upload ZIP
                  </Button>
                  <Button
                    type="button"
                    variant={sourceTypeFe === "image" ? "default" : "outline"}
                    onClick={() => setValueFe("sourceKind", "image")}
                  >
                    Docker Image
                  </Button>
                </div>
              </div>

              {sourceTypeFe === "zip" ? (
                <div>
                  <Label>File ZIP <span className="text-destructive">*</span></Label>
                  <div
                    className="mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => document.getElementById("zip-input-fe-modal")?.click()}
                  >
                    {zipFileFe ? (
                      <div>
                        <p className="font-medium">{zipFileFe.name}</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={(e) => {
                            e.stopPropagation()
                            setZipFileFe(null)
                            setZipErrorFe("")
                          }}
                        >
                          Xóa file
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm">Chọn file ZIP</p>
                      </div>
                    )}
                  </div>
                  <input
                    id="zip-input-fe-modal"
                    type="file"
                    accept=".zip"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const validation = validateZipFile(file)
                        if (validation.valid) {
                          setZipFileFe(file)
                          setZipErrorFe("")
                        } else {
                          setZipErrorFe(validation.message || "")
                        }
                      }
                    }}
                  />
                  {zipErrorFe && (
                    <p className="text-sm text-destructive mt-1">{zipErrorFe}</p>
                  )}
                </div>
              ) : (
                <div>
                  <Label htmlFor="fe-source-ref">Docker Image <span className="text-destructive">*</span></Label>
                  <Input
                    id="fe-source-ref"
                    {...registerFe("sourceRef")}
                    placeholder="docker.io/user/app:1.0.0"
                    className="font-mono"
                    onBlur={validateDockerFe}
                  />
                  {errorsFe.sourceRef && (
                    <p className="text-sm text-destructive mt-1">{errorsFe.sourceRef.message}</p>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="fe-public-url">DNS (tùy chọn)</Label>
                <div className="flex gap-2">
                  <Input
                    id="fe-public-url"
                    {...registerFe("publicUrl")}
                    placeholder="fe-myapp"
                    onBlur={validateDNSPublicUrl}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const dnsValue = watchFe("publicUrl")
                      if (dnsValue) {
                        const validation = validateDNS(dnsValue)
                        if (validation.valid) {
                          toast.success("DNS hợp lệ!")
                        } else {
                          toast.error(validation.message || "DNS không hợp lệ")
                        }
                      } else {
                        toast.info("Vui lòng nhập DNS trước khi kiểm tra")
                      }
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Kiểm tra
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddFrontend(false)
                    resetFe()
                    setZipFileFe(null)
                    setZipErrorFe("")
                  }}
                >
                  Hủy
                </Button>
                <Button type="submit">Thêm Frontend</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog xác nhận xóa project */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xác nhận xóa project</DialogTitle>
              <DialogDescription>
                Bạn có chắc chắn muốn xóa project "{projectBasicInfo?.name || project.name}"? 
                Hành động này không thể hoàn tác. Tất cả databases, backends và frontends của project này sẽ bị xóa.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
              >
                Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteProject}
                disabled={isDeleting}
              >
                {isDeleting ? "Đang xóa..." : "Xóa Project"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

