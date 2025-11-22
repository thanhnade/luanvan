import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { useSearchParams } from "react-router-dom";
import { adminAPI } from "@/lib/admin-api";
import type {
  AdminUser,
  AdminUserProject,
  AdminProjectDetail,
  AdminProjectComponent,
  AdminOverviewResponse,
  ClusterCapacityResponse,
  AdminUserProjectSummaryResponse,
  AdminUserProjectListResponse,
  AdminProjectResourceDetailResponse,
  AdminDatabaseDetailResponse,
  AdminBackendDetailResponse,
} from "@/types/admin";
import { ResourceTable } from "../../components/ResourceTable";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  ArrowLeft,
  Users,
  FolderTree,
  Cpu,
  MemoryStick,
  MoreVertical,
  PauseCircle,
  PlayCircle,
  Trash2,
  Eye,
  Database,
  Server,
  Network,
  Box,
  HardDrive,
  HardDriveIcon,
} from "lucide-react";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

type ViewState = "users" | "projects" | "projectDetail";

export function UserServices() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [clusterCapacity, setClusterCapacity] = useState<ClusterCapacityResponse | null>(null);
  const [clusterCapacityLoading, setClusterCapacityLoading] = useState(true);

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [projects, setProjects] = useState<AdminUserProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [userSummary, setUserSummary] = useState<AdminUserProjectSummaryResponse | null>(null);
  const [userProjectsDetail, setUserProjectsDetail] = useState<AdminUserProjectListResponse | null>(null);
  const [userViewClusterCapacity, setUserViewClusterCapacity] = useState<ClusterCapacityResponse | null>(null);

  const [selectedProject, setSelectedProject] = useState<AdminUserProject | null>(null);
  const [projectDetail, setProjectDetail] = useState<AdminProjectDetail | null>(null);
  const [projectDetailLoading, setProjectDetailLoading] = useState(false);
  const [componentDetail, setComponentDetail] = useState<{
    item: AdminProjectComponent;
    type: "databases" | "backends" | "frontends";
  } | null>(null);
  const [isComponentDialogOpen, setComponentDialogOpen] = useState(false);
  const [databaseDetail, setDatabaseDetail] = useState<AdminDatabaseDetailResponse | null>(null);
  const [databaseDetailLoading, setDatabaseDetailLoading] = useState(false);
  const [backendDetail, setBackendDetail] = useState<AdminBackendDetailResponse | null>(null);
  const [backendDetailLoading, setBackendDetailLoading] = useState(false);

  const [view, setView] = useState<ViewState>("users");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentProjectPage, setCurrentProjectPage] = useState(1);

  // Sử dụng overview cho số lượng users và projects
  const totalUsers = overview?.totalUsers ?? users.length;
  const totalProjects = overview?.totalProjects ?? users.reduce((sum, user) => sum + user.projectCount, 0);
  // Sử dụng overview cho tổng CPU/Memory đang dùng
  const totalCpuUsed = overview?.totalCpuCores ?? users.reduce((sum, user) => sum + user.cpuUsage.used, 0);
  // Sử dụng cluster capacity từ API mới cho phần sau dấu /
  const totalCpuCapacity = clusterCapacity?.totalCpuCores ?? 0;
  const totalMemUsed = overview?.totalMemoryGb ?? users.reduce((sum, user) => sum + user.memoryUsage.used, 0);
  const totalMemCapacity = clusterCapacity?.totalMemoryGb ?? 0;

  useEffect(() => {
    const loadData = async () => {
      try {
        setUsersLoading(true);
        setOverviewLoading(true);
        setClusterCapacityLoading(true);
        
        // Gọi 3 API song song
        const [usersData, overviewData, capacityData] = await Promise.all([
          adminAPI.getAdminUsers(),
          adminAPI.getOverview(),
          adminAPI.getClusterCapacity(),
        ]);
        
        setUsers(usersData);
        setOverview(overviewData);
        setClusterCapacity(capacityData);
      } catch (error) {
        toast.error("Không thể tải dữ liệu");
        console.error("Error loading data:", error);
      } finally {
        setUsersLoading(false);
        setOverviewLoading(false);
        setClusterCapacityLoading(false);
      }
    };
    loadData();
  }, []);

  // Restore state from URL params on mount
  useEffect(() => {
    if (users.length === 0) return; // Wait for users to load

    const userId = searchParams.get("userId");
    const projectId = searchParams.get("projectId");
    const viewParam = searchParams.get("view") as ViewState | null;

    if (!viewParam || !userId) return; // No state to restore

    const user = users.find((u) => u.id === userId);
    if (!user) return; // User not found

    setSelectedUser(user);
    setView(viewParam);

    if (viewParam === "projects") {
      // Load projects for user
      const loadProjects = async () => {
        try {
          setProjectsLoading(true);
          
          // Gọi 3 API song song
          const [summaryData, projectsData, capacityData] = await Promise.all([
            adminAPI.getUserSummary(user.id),
            adminAPI.getUserProjectsDetail(user.id),
            adminAPI.getClusterCapacity(),
          ]);
          
          setUserSummary(summaryData);
          setUserProjectsDetail(projectsData);
          setUserViewClusterCapacity(capacityData);
          
          // Map dữ liệu từ API response sang format AdminUserProject
          const mappedProjects: AdminUserProject[] = projectsData.projects.map((project) => ({
            id: String(project.projectId),
            name: project.projectName,
            databaseCount: project.databaseCount,
            backendCount: project.backendCount,
            frontendCount: project.frontendCount,
            cpuUsage: {
              used: project.cpuCores,
              total: capacityData.totalCpuCores,
            },
            memoryUsage: {
              used: project.memoryGb,
              total: capacityData.totalMemoryGb,
            },
          }));
          
          setProjects(mappedProjects);
        } catch (error) {
          toast.error("Không thể tải danh sách dự án của người dùng");
          console.error("Error loading user projects:", error);
        } finally {
          setProjectsLoading(false);
        }
      };
      loadProjects();
    } else if (viewParam === "projectDetail" && projectId) {
      // Load projects and project detail
      const loadProjectDetail = async () => {
        try {
          setProjectsLoading(true);
          
          // Gọi 3 API song song
          const [summaryData, projectsData, capacityData] = await Promise.all([
            adminAPI.getUserSummary(user.id),
            adminAPI.getUserProjectsDetail(user.id),
            adminAPI.getClusterCapacity(),
          ]);
          
          setUserSummary(summaryData);
          setUserProjectsDetail(projectsData);
          setUserViewClusterCapacity(capacityData);
          
          // Map dữ liệu từ API response sang format AdminUserProject
          const mappedProjects: AdminUserProject[] = projectsData.projects.map((project) => ({
            id: String(project.projectId),
            name: project.projectName,
            databaseCount: project.databaseCount,
            backendCount: project.backendCount,
            frontendCount: project.frontendCount,
            cpuUsage: {
              used: project.cpuCores,
              total: capacityData.totalCpuCores,
            },
            memoryUsage: {
              used: project.memoryGb,
              total: capacityData.totalMemoryGb,
            },
          }));
          
          setProjects(mappedProjects);
          const project = mappedProjects.find((p) => p.id === projectId);
          if (project) {
            setSelectedProject(project);
            setProjectDetailLoading(true);
            
            try {
              const resourceDetail = await adminAPI.getProjectResources(project.id);
              
              // Map dữ liệu từ AdminProjectResourceDetailResponse sang AdminProjectDetail
              const mappedDetail: AdminProjectDetail = {
                id: String(resourceDetail.projectId),
                name: resourceDetail.projectName,
                databases: resourceDetail.databases.map((db) => ({
                  id: String(db.id),
                  name: `database-${db.id}`,
                  status: db.status.toLowerCase() as "running" | "stopped" | "error",
                  cpu: `${db.cpuCores} cores`,
                  memory: `${db.memoryGb} GB`,
                  cpuUsed: `${db.cpuCores} cores`,
                  memoryUsed: `${db.memoryGb} GB`,
                  projectName: db.projectName,
                })),
                backends: resourceDetail.backends.map((be) => ({
                  id: String(be.id),
                  name: `backend-${be.id}`,
                  status: be.status.toLowerCase() as "running" | "stopped" | "error",
                  cpu: `${be.cpuCores} cores`,
                  memory: `${be.memoryGb} GB`,
                  cpuUsed: `${be.cpuCores} cores`,
                  memoryUsed: `${be.memoryGb} GB`,
                  projectName: be.projectName,
                })),
                frontends: resourceDetail.frontends.map((fe) => ({
                  id: String(fe.id),
                  name: `frontend-${fe.id}`,
                  status: fe.status.toLowerCase() as "running" | "stopped" | "error",
                  cpu: `${fe.cpuCores} cores`,
                  memory: `${fe.memoryGb} GB`,
                  cpuUsed: `${fe.cpuCores} cores`,
                  memoryUsed: `${fe.memoryGb} GB`,
                  projectName: fe.projectName,
                })),
              };
              
              setProjectDetail(mappedDetail);
            } catch (error) {
              console.error("Error loading project resources:", error);
              toast.error("Không thể tải chi tiết dự án");
            } finally {
              setProjectDetailLoading(false);
            }
          }
        } catch (error) {
          toast.error("Không thể tải chi tiết dự án");
          console.error("Error loading project detail:", error);
        } finally {
          setProjectsLoading(false);
        }
      };
      loadProjectDetail();
    }
  }, [users, searchParams]);

  const handleViewUser = async (user: AdminUser) => {
    setSelectedUser(user);
    setProjects([]);
    setCurrentProjectPage(1);
    setView("projects");
    setSearchParams({ view: "projects", userId: user.id });
    try {
      setProjectsLoading(true);
      
      // Gọi 3 API song song
      const [summaryData, projectsData, capacityData] = await Promise.all([
        adminAPI.getUserSummary(user.id),
        adminAPI.getUserProjectsDetail(user.id),
        adminAPI.getClusterCapacity(),
      ]);
      
      setUserSummary(summaryData);
      setUserProjectsDetail(projectsData);
      setUserViewClusterCapacity(capacityData);
      
      // Map dữ liệu từ API response sang format AdminUserProject
      const mappedProjects: AdminUserProject[] = projectsData.projects.map((project) => ({
        id: String(project.projectId),
        name: project.projectName,
        databaseCount: project.databaseCount,
        backendCount: project.backendCount,
        frontendCount: project.frontendCount,
        cpuUsage: {
          used: project.cpuCores,
          total: capacityData.totalCpuCores, // Sử dụng cluster capacity
        },
        memoryUsage: {
          used: project.memoryGb,
          total: capacityData.totalMemoryGb, // Sử dụng cluster capacity
        },
      }));
      
      setProjects(mappedProjects);
    } catch (error) {
      toast.error("Không thể tải danh sách dự án của người dùng");
      setProjects([]);
      console.error("Error loading user projects:", error);
    } finally {
      setProjectsLoading(false);
    }
  };

  const handleViewProject = async (project: AdminUserProject) => {
    setSelectedProject(project);
    setProjectDetail(null);
    setView("projectDetail");
    if (selectedUser) {
      setSearchParams({
        view: "projectDetail",
        userId: selectedUser.id,
        projectId: project.id,
      });
    }
    try {
      setProjectDetailLoading(true);
      const resourceDetail = await adminAPI.getProjectResources(project.id);
      
      // Map dữ liệu từ AdminProjectResourceDetailResponse sang AdminProjectDetail
      const mappedDetail: AdminProjectDetail = {
        id: String(resourceDetail.projectId),
        name: resourceDetail.projectName,
        databases: resourceDetail.databases.map((db) => ({
          id: String(db.id),
          name: `database-${db.id}`, // API không trả về name, tạo tên từ id
          status: db.status.toLowerCase() as "running" | "stopped" | "error",
          cpu: `${db.cpuCores} cores`,
          memory: `${db.memoryGb} GB`,
          cpuUsed: `${db.cpuCores} cores`,
          memoryUsed: `${db.memoryGb} GB`,
          projectName: db.projectName,
        })),
        backends: resourceDetail.backends.map((be) => ({
          id: String(be.id),
          name: `backend-${be.id}`, // API không trả về name, tạo tên từ id
          status: be.status.toLowerCase() as "running" | "stopped" | "error",
          cpu: `${be.cpuCores} cores`,
          memory: `${be.memoryGb} GB`,
          cpuUsed: `${be.cpuCores} cores`,
          memoryUsed: `${be.memoryGb} GB`,
          projectName: be.projectName,
        })),
        frontends: resourceDetail.frontends.map((fe) => ({
          id: String(fe.id),
          name: `frontend-${fe.id}`, // API không trả về name, tạo tên từ id
          status: fe.status.toLowerCase() as "running" | "stopped" | "error",
          cpu: `${fe.cpuCores} cores`,
          memory: `${fe.memoryGb} GB`,
          cpuUsed: `${fe.cpuCores} cores`,
          memoryUsed: `${fe.memoryGb} GB`,
          projectName: fe.projectName,
        })),
      };
      
      setProjectDetail(mappedDetail);
    } catch (error) {
      toast.error("Không thể tải chi tiết dự án");
      setProjectDetail(null);
      console.error("Error loading project resources:", error);
    } finally {
      setProjectDetailLoading(false);
    }
  };

  const handleBackToUsers = () => {
    setSelectedUser(null);
    setSelectedProject(null);
    setProjectDetail(null);
    setUserSummary(null);
    setUserProjectsDetail(null);
    setUserViewClusterCapacity(null);
    setView("users");
    setSearchParams({});
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
    setProjectDetail(null);
    setView("projects");
    if (selectedUser) {
      setSearchParams({ view: "projects", userId: selectedUser.id });
    }
  };

  const userColumns = [
    {
      key: "name",
      label: "Tên người dùng",
    },
    {
      key: "username",
      label: "Username",
    },
    {
      key: "projectCount",
      label: "Số dự án",
      align: "center" as const,
    },
    {
      key: "tier",
      label: "Cấp bậc",
      align: "center" as const,
      render: (user: AdminUser) => (
        <Badge variant={user.tier === "premium" ? "success" : "secondary"} className="uppercase">
          {user.tier}
        </Badge>
      ),
    },
    {
      key: "cpuUsage",
      label: "CPU",
      align: "center" as const,
      render: (user: AdminUser) => `${user.cpuUsage.used} cores`,
    },
    {
      key: "memoryUsage",
      label: "Memory",
      align: "center" as const,
      render: (user: AdminUser) => `${user.memoryUsage.used} GB`,
    },
  ];

  const projectColumns = [
    {
      key: "name",
      label: "Tên dự án",
    },
    {
      key: "databaseCount",
      label: "Database",
      align: "center" as const,
    },
    {
      key: "backendCount",
      label: "Backend",
      align: "center" as const,
    },
    {
      key: "frontendCount",
      label: "Frontend",
      align: "center" as const,
    },
    {
      key: "cpuUsage",
      label: "CPU",
      align: "center" as const,
      render: (project: AdminUserProject) => `${project.cpuUsage.used} cores`,
    },
    {
      key: "memoryUsage",
      label: "Memory",
      align: "center" as const,
      render: (project: AdminUserProject) => `${project.memoryUsage.used} GB`,
    },
  ];

  const handleComponentAction = async (
    component: AdminProjectComponent,
    action: "pause" | "start" | "delete" | "view",
    resourceType?: "databases" | "backends" | "frontends"
  ) => {
    if (action === "view") {
      if (resourceType) {
        setComponentDetail({ item: component, type: resourceType });
        setComponentDialogOpen(true);
        
        // Gọi API để lấy chi tiết tùy theo loại
        if (resourceType === "databases") {
          try {
            setDatabaseDetailLoading(true);
            setBackendDetail(null);
            const detail = await adminAPI.getDatabaseDetail(component.id);
            setDatabaseDetail(detail);
          } catch (error) {
            toast.error("Không thể tải chi tiết database");
            console.error("Error loading database detail:", error);
            setDatabaseDetail(null);
          } finally {
            setDatabaseDetailLoading(false);
          }
        } else if (resourceType === "backends") {
          try {
            setBackendDetailLoading(true);
            setDatabaseDetail(null);
            const detail = await adminAPI.getBackendDetail(component.id);
            setBackendDetail(detail);
          } catch (error) {
            toast.error("Không thể tải chi tiết backend");
            console.error("Error loading backend detail:", error);
            setBackendDetail(null);
          } finally {
            setBackendDetailLoading(false);
          }
        } else {
          setDatabaseDetail(null);
          setBackendDetail(null);
        }
      }
      return;
    }
    const actionLabel =
      action === "pause" ? "tạm dừng" : action === "start" ? "chạy" : "xóa";
    toast.success(`Đã ${actionLabel} ${component.name}`);
  };

  const renderComponents = (items: AdminProjectComponent[], type: "databases" | "backends" | "frontends") => {
    const metricLabel = (metric: "cpu" | "memory", item: AdminProjectComponent) => {
      if (type === "backends" || type === "frontends" || item.projectName) {
        return metric === "cpu" ? "CPU đang dùng" : "Memory đang dùng";
      }
      return metric === "cpu" ? "CPU" : "Memory";
    };

    if (items.length === 0) {
      return <p className="text-sm text-muted-foreground">Chưa có thành phần nào.</p>;
    }

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <Card key={item.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-base">{item.name}</CardTitle>
                <Badge
                  variant={
                    item.status === "running"
                      ? "success"
                      : item.status === "error"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {item.status}
                </Badge>
              </div>
              <DropdownMenu
                trigger={
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                }
              >
                <DropdownMenuItem onClick={() => handleComponentAction(item, "view", type)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Xem chi tiết
                </DropdownMenuItem>
                {item.status === "running" && (
                  <DropdownMenuItem onClick={() => handleComponentAction(item, "pause", type)}>
                    <PauseCircle className="mr-2 h-4 w-4" />
                    Tạm dừng
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => handleComponentAction(item, "start", type)}>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Chạy
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => handleComponentAction(item, "delete", type)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Xóa
                </DropdownMenuItem>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>{metricLabel("cpu", item)}</span>
                <span className="text-foreground font-medium">{item.cpuUsed ?? item.cpu}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{metricLabel("memory", item)}</span>
                <span className="text-foreground font-medium">
                  {item.memoryUsed ?? item.memory}
                </span>
              </div>
              {item.replicas && (
                <div className="flex items-center justify-between">
                  <span>Replicas</span>
                  <span className="text-foreground font-medium">{item.replicas}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderComponentDetailDialog = () => {
    const type = componentDetail?.type;
    const detail = componentDetail?.item;
    const isDatabase = type === "databases";
    const isBackend = type === "backends";
    const detailRow = (label: string, value?: string | number) => (
      <div className="rounded-lg border bg-muted/30 p-3 transition-colors hover:bg-muted/50">
        <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
        <p className="text-sm font-semibold text-foreground break-words">{value ?? "-"}</p>
      </div>
    );

    const SectionCard = ({
      title,
      icon: Icon,
      children,
    }: {
      title: string;
      icon: ComponentType<{ className?: string }>;
      children: React.ReactNode;
    }) => (
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    );

    return (
      <Dialog
        open={isComponentDialogOpen && !!detail}
        onOpenChange={(open) => {
          setComponentDialogOpen(open);
          if (!open) {
            setComponentDetail(null);
            setDatabaseDetail(null);
            setBackendDetail(null);
          }
        }}
      >
        <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold">
                  {type === "backends"
                    ? "Chi tiết Backend"
                    : type === "frontends"
                      ? "Chi tiết Frontend"
                      : "Chi tiết Database"}
                </DialogTitle>
                <DialogDescription className="mt-2">
                  Thông tin cấu hình và tài nguyên của thành phần đang chọn.
                </DialogDescription>
              </div>
              {detail && (
                <Badge
                  variant={
                    detail.status === "running"
                      ? "success"
                      : detail.status === "error"
                        ? "destructive"
                        : "secondary"
                  }
                  className="text-sm px-3 py-1"
                >
                  {detail.status}
                </Badge>
              )}
            </div>
            {detail && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-base font-semibold text-foreground">{detail.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Thuộc dự án: <span className="font-medium text-foreground">{detail.projectName ?? selectedProject?.name ?? "-"}</span>
                </p>
              </div>
            )}
          </DialogHeader>
          {detail && (
            <div className="mt-6">
              {isDatabase ? (
                databaseDetailLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mb-3" />
                    <p className="text-sm">Đang tải chi tiết database...</p>
                  </div>
                ) : databaseDetail ? (
                  <div className="space-y-6">
                    {/* Thông tin Database */}
                    <SectionCard title="Thông tin Database" icon={Database}>
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {detailRow("Loại", databaseDetail.databaseType)}
                        {detailRow("IP", databaseDetail.databaseIp)}
                        {detailRow("Port", databaseDetail.databasePort?.toString())}
                        {detailRow("Database name", databaseDetail.databaseName)}
                        {detailRow("Username", databaseDetail.databaseUsername)}
                        {detailRow("Password", databaseDetail.databasePassword)}
                      </div>
                    </SectionCard>

                    {/* Thông tin Pod */}
                    <SectionCard title="Thông tin Pod" icon={Server}>
                      <div className="grid gap-3 md:grid-cols-3">
                        {detailRow("Name", databaseDetail.podName)}
                        {detailRow("Node", databaseDetail.podNode)}
                        {detailRow("Trạng thái", databaseDetail.podStatus)}
                      </div>
                    </SectionCard>

                    {/* Thông tin Service */}
                    <SectionCard title="Thông tin Service" icon={Network}>
                      <div className="grid gap-3 md:grid-cols-3">
                        {detailRow("Name", databaseDetail.serviceName)}
                        {detailRow("EXTERNAL-IP", databaseDetail.serviceExternalIp ?? "-")}
                        {detailRow("Port", databaseDetail.servicePort?.toString())}
                      </div>
                    </SectionCard>

                    {/* Thông tin StatefulSet */}
                    <SectionCard title="Thông tin StatefulSet" icon={Box}>
                      <div className="grid gap-3 md:grid-cols-1">
                        {detailRow("Name", databaseDetail.statefulSetName)}
                      </div>
                    </SectionCard>

                    {/* Thông tin PVC */}
                    <SectionCard title="Thông tin PVC" icon={HardDrive}>
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                        {detailRow("Name", databaseDetail.pvcName)}
                        {detailRow("STATUS", databaseDetail.pvcStatus)}
                        {detailRow("VOLUME", databaseDetail.pvcVolume)}
                        {detailRow("CAPACITY", databaseDetail.pvcCapacity)}
                      </div>
                    </SectionCard>

                    {/* Thông tin PV */}
                    <SectionCard title="Thông tin PV" icon={HardDriveIcon}>
                      <div className="grid gap-3 md:grid-cols-3">
                        {detailRow("Name", databaseDetail.pvName)}
                        {detailRow("CAPACITY", databaseDetail.pvCapacity)}
                        {detailRow("Node", databaseDetail.pvNode)}
                      </div>
                    </SectionCard>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {detailRow("Project", detail.projectName ?? selectedProject?.name ?? "-")}
                    {detailRow("IP", detail.ip)}
                    {detailRow("Port", detail.port?.toString())}
                    {detailRow("Database name", detail.databaseName)}
                    {detailRow("Username", detail.dbUsername)}
                    {detailRow("Password", detail.dbPassword)}
                    {detailRow("CPU đang dùng", detail.cpuUsed ?? detail.cpu)}
                    {detailRow("Memory đang dùng", detail.memoryUsed ?? detail.memory)}
                    {detailRow("Pod đang chạy trên node", detail.node)}
                    {detailRow("PVC", detail.pvc)}
                    {detailRow("PV", detail.pv)}
                  </div>
                )
              ) : isBackend ? (
                backendDetailLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mb-3" />
                    <p className="text-sm">Đang tải chi tiết backend...</p>
                  </div>
                ) : backendDetail ? (
                  <div className="space-y-6">
                    {/* Thông tin Backend */}
                    <SectionCard title="Thông tin Backend" icon={Server}>
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {detailRow("Tên", backendDetail.projectName)}
                        {detailRow("Deployment Type", backendDetail.deploymentType)}
                        {detailRow("Framework Type", backendDetail.frameworkType)}
                        {detailRow("Domain Name", backendDetail.domainNameSystem ?? "-")}
                        {detailRow("Docker Image", backendDetail.dockerImage ?? "-")}
                      </div>
                    </SectionCard>

                    {/* Thông tin kết nối Database */}
                    <SectionCard title="Thông tin kết nối Database" icon={Database}>
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {detailRow("IP", backendDetail.databaseIp ?? "-")}
                        {detailRow("Port", backendDetail.databasePort?.toString() ?? "-")}
                        {detailRow("Database name", backendDetail.databaseName ?? "-")}
                        {detailRow("Username", backendDetail.databaseUsername ?? "-")}
                        {detailRow("Password", backendDetail.databasePassword ?? "-")}
                      </div>
                    </SectionCard>

                    {/* Thông tin Deployment */}
                    <SectionCard title="Thông tin Deployment" icon={Box}>
                      <div className="grid gap-3 md:grid-cols-2">
                        {detailRow("Name", backendDetail.deploymentName ?? "-")}
                        {detailRow("Replica", backendDetail.replicas?.toString() ?? "-")}
                      </div>
                    </SectionCard>

                    {/* Thông tin Pod */}
                    <SectionCard title="Thông tin Pod" icon={Server}>
                      <div className="grid gap-3 md:grid-cols-3">
                        {detailRow("Name", backendDetail.podName ?? "-")}
                        {detailRow("Node", backendDetail.podNode ?? "-")}
                        {detailRow("Trạng thái", backendDetail.podStatus ?? "-")}
                      </div>
                    </SectionCard>

                    {/* Thông tin Service */}
                    <SectionCard title="Thông tin Service" icon={Network}>
                      <div className="grid gap-3 md:grid-cols-3">
                        {detailRow("Name", backendDetail.serviceName ?? "-")}
                        {detailRow("Type", backendDetail.serviceType ?? "-")}
                        {detailRow("Port", backendDetail.servicePort ?? "-")}
                      </div>
                    </SectionCard>

                    {/* Thông tin Ingress */}
                    <SectionCard title="Thông tin Ingress" icon={Network}>
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {detailRow("Name", backendDetail.ingressName ?? "-")}
                        {detailRow("Hosts", backendDetail.ingressHosts ?? "-")}
                        {detailRow("Address", backendDetail.ingressAddress ?? "-")}
                        {detailRow("Port", backendDetail.ingressPort ?? "-")}
                        {detailRow("Class", backendDetail.ingressClass ?? "-")}
                      </div>
                    </SectionCard>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {detailRow("Project", detail.projectName ?? selectedProject?.name ?? "-")}
                    {detailRow("CPU đang dùng", detail.cpuUsed ?? detail.cpu)}
                    {detailRow("Memory đang dùng", detail.memoryUsed ?? detail.memory)}
                    {detailRow("Replicas", detail.replicas)}
                    {detailRow("Trạng thái", detail.status)}
                  </div>
                )
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {detailRow("Project", detail.projectName ?? selectedProject?.name ?? "-")}
                  {detailRow("CPU đang dùng", detail.cpuUsed ?? detail.cpu)}
                  {detailRow("Memory đang dùng", detail.memoryUsed ?? detail.memory)}
                  {detailRow("Replicas", detail.replicas)}
                  {detailRow("Trạng thái", detail.status)}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  const StatCard = ({
    icon: Icon,
    label,
    value,
    subtext,
  }: {
    icon: ComponentType<{ className?: string }>;
    label: string;
    value: string;
    subtext?: string;
  }) => (
    <Card className="border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {view === "users" && (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Dịch vụ người dùng</h1>
            <p className="text-sm text-muted-foreground">
              Giám sát tài nguyên và các dịch vụ đang chạy của từng người dùng trong hệ thống.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Users}
              label="Tổng người dùng"
              value={totalUsers.toString()}
              subtext="Tổng tài khoản"
            />
            <StatCard
              icon={FolderTree}
              label="Tổng dự án"
              value={totalProjects.toString()}
              subtext="Bao gồm tất cả người dùng"
            />
            <StatCard
              icon={Cpu}
              label="CPU đang dùng"
              value={`${totalCpuUsed}/${totalCpuCapacity} cores`}
              subtext="Tổng CPU allocation"
            />
            <StatCard
              icon={MemoryStick}
              label="Memory đang dùng"
              value={`${totalMemUsed}/${totalMemCapacity} GB`}
              subtext="Tổng Memory allocation"
            />
          </div>

          {(usersLoading || overviewLoading || clusterCapacityLoading) ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Đang tải danh sách...
            </div>
          ) : (
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Danh sách người dùng</CardTitle>
              </CardHeader>
              <CardContent>
                <ResourceTable
                  title="Người dùng"
                  columns={userColumns}
                  data={users}
                  loading={false}
                  onView={handleViewUser}
                  emptyMessage="Chưa có người dùng nào."
                  searchPlaceholder="Tìm kiếm người dùng..."
                  pagination={{
                    page: currentPage,
                    pageSize: 5,
                    onPageChange: (page) => setCurrentPage(page),
                  }}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {view === "projects" && selectedUser && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="px-0 text-muted-foreground hover:text-foreground"
                onClick={handleBackToUsers}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại danh sách người dùng
              </Button>
              <h2 className="text-3xl font-semibold text-foreground">
                {userSummary?.fullname ?? userProjectsDetail?.fullname ?? selectedUser.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {userSummary?.username ?? userProjectsDetail?.username ?? selectedUser.username}
              </p>
            </div>
            <Card className="border shadow-sm">
              <CardContent className="flex gap-6 py-4 px-6 text-sm">
                <div>
                  <p className="text-muted-foreground">CPU đang dùng</p>
                  <p className="text-xl font-semibold text-foreground">
                    {userSummary?.cpuCores ?? selectedUser.cpuUsage.used}/
                    {userViewClusterCapacity?.totalCpuCores ?? selectedUser.cpuUsage.total} cores
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Memory đang dùng</p>
                  <p className="text-xl font-semibold text-foreground">
                    {userSummary?.memoryGb ?? selectedUser.memoryUsage.used}/
                    {userViewClusterCapacity?.totalMemoryGb ?? selectedUser.memoryUsage.total} GB
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Số dự án</p>
                  <p className="text-xl font-semibold text-foreground">
                    {userSummary?.projectCount ?? selectedUser.projectCount}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {projectsLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Đang tải dự án...
            </div>
          ) : (
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Danh sách dự án</CardTitle>
              </CardHeader>
              <CardContent>
                <ResourceTable
                  title="Dự án"
                  columns={projectColumns}
                  data={projects}
                  loading={false}
                  onView={handleViewProject}
                  emptyMessage="Người dùng này chưa có dự án nào."
                  searchPlaceholder="Tìm kiếm dự án..."
                  pagination={{
                    page: currentProjectPage,
                    pageSize: 5,
                    onPageChange: (page) => setCurrentProjectPage(page),
                  }}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {view === "projectDetail" && selectedProject && selectedUser && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="px-0 text-muted-foreground hover:text-foreground"
                onClick={handleBackToProjects}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại danh sách dự án
              </Button>
              <div>
                <h2 className="text-3xl font-semibold text-foreground">{selectedProject.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Người dùng: <span className="text-foreground font-medium">{selectedUser.name}</span>
                </p>
              </div>
            </div>
            <Card className="border shadow-sm">
              <CardContent className="flex gap-6 py-4 px-6 text-sm">
                <div>
                  <p className="text-muted-foreground">CPU đang dùng</p>
                  <p className="text-xl font-semibold text-foreground">
                    {selectedProject.cpuUsage.used}/{selectedProject.cpuUsage.total} cores
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Memory đang dùng</p>
                  <p className="text-xl font-semibold text-foreground">
                    {selectedProject.memoryUsage.used}/{selectedProject.memoryUsage.total} GB
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {projectDetailLoading || !projectDetail ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Đang tải chi tiết dự án...
            </div>
          ) : (
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Chi tiết dự án</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="databases">
                  <TabsList className="grid grid-cols-3">
                    <TabsTrigger value="databases">
                      Database ({projectDetail.databases.length})
                    </TabsTrigger>
                    <TabsTrigger value="backends">
                      Backend ({projectDetail.backends.length})
                    </TabsTrigger>
                    <TabsTrigger value="frontends">
                      Frontend ({projectDetail.frontends.length})
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="databases" className="pt-4">
                    {renderComponents(projectDetail.databases, "databases")}
                  </TabsContent>
                  <TabsContent value="backends" className="pt-4">
                    {renderComponents(projectDetail.backends, "backends")}
                  </TabsContent>
                  <TabsContent value="frontends" className="pt-4">
                    {renderComponents(projectDetail.frontends, "frontends")}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      {renderComponentDetailDialog()}
    </div>
  );
}

