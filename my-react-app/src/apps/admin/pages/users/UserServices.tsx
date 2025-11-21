import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { useSearchParams } from "react-router-dom";
import { adminAPI } from "@/lib/admin-api";
import type {
  AdminUser,
  AdminUserProject,
  AdminProjectDetail,
  AdminProjectComponent,
} from "@/types/admin";
import { ResourceTable } from "../../components/ResourceTable";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

type ViewState = "users" | "projects" | "projectDetail";

export function UserServices() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [projects, setProjects] = useState<AdminUserProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  const [selectedProject, setSelectedProject] = useState<AdminUserProject | null>(null);
  const [projectDetail, setProjectDetail] = useState<AdminProjectDetail | null>(null);
  const [projectDetailLoading, setProjectDetailLoading] = useState(false);

  const [view, setView] = useState<ViewState>("users");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentProjectPage, setCurrentProjectPage] = useState(1);

  const totalUsers = users.length;
  const totalProjects = users.reduce((sum, user) => sum + user.projectCount, 0);
  const totalCpuUsed = users.reduce((sum, user) => sum + user.cpuUsage.used, 0);
  const totalCpuCapacity = users.reduce((sum, user) => sum + user.cpuUsage.total, 0);
  const totalMemUsed = users.reduce((sum, user) => sum + user.memoryUsage.used, 0);
  const totalMemCapacity = users.reduce((sum, user) => sum + user.memoryUsage.total, 0);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setUsersLoading(true);
        const data = await adminAPI.getAdminUsers();
        setUsers(data);
      } finally {
        setUsersLoading(false);
      }
    };
    loadUsers();
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
          const data = await adminAPI.getUserProjects(user.id);
          setProjects(data);
        } catch (error) {
          toast.error("Không thể tải danh sách dự án của người dùng");
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
          const projectData = await adminAPI.getUserProjects(user.id);
          setProjects(projectData);
          const project = projectData.find((p) => p.id === projectId);
          if (project) {
            setSelectedProject(project);
            setProjectDetailLoading(true);
            const detail = await adminAPI.getProjectDetail(project.id);
            setProjectDetail(detail);
            setProjectDetailLoading(false);
          }
        } catch (error) {
          toast.error("Không thể tải chi tiết dự án");
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
      const data = await adminAPI.getUserProjects(user.id);
      setProjects(data);
    } catch (error) {
      toast.error("Không thể tải danh sách dự án của người dùng");
      setProjects([]);
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
      const detail = await adminAPI.getProjectDetail(project.id);
      setProjectDetail(detail);
    } catch (error) {
      toast.error("Không thể tải chi tiết dự án");
      setProjectDetail(null);
    } finally {
      setProjectDetailLoading(false);
    }
  };

  const handleBackToUsers = () => {
    setSelectedUser(null);
    setSelectedProject(null);
    setProjectDetail(null);
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
      render: (user: AdminUser) => `${user.cpuUsage.used}/${user.cpuUsage.total} cores`,
    },
    {
      key: "memoryUsage",
      label: "Memory",
      align: "center" as const,
      render: (user: AdminUser) => `${user.memoryUsage.used}/${user.memoryUsage.total} GB`,
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
      render: (project: AdminUserProject) =>
        `${project.cpuUsage.used}/${project.cpuUsage.total} cores`,
    },
    {
      key: "memoryUsage",
      label: "Memory",
      align: "center" as const,
      render: (project: AdminUserProject) =>
        `${project.memoryUsage.used}/${project.memoryUsage.total} GB`,
    },
  ];

  const handleComponentAction = (
    component: AdminProjectComponent,
    action: "pause" | "start" | "delete" | "view"
  ) => {
    if (action === "view") {
      toast.info(`Xem chi tiết ${component.name}`);
      // TODO: Implement view detail functionality
      return;
    }
    const actionLabel =
      action === "pause" ? "tạm dừng" : action === "start" ? "chạy" : "xóa";
    toast.success(`Đã ${actionLabel} ${component.name}`);
  };

  const renderComponents = (items: AdminProjectComponent[]) => {
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
                <DropdownMenuItem onClick={() => handleComponentAction(item, "view")}>
                  <Eye className="mr-2 h-4 w-4" />
                  Xem chi tiết
                </DropdownMenuItem>
                {item.status === "running" && (
                  <DropdownMenuItem onClick={() => handleComponentAction(item, "pause")}>
                    <PauseCircle className="mr-2 h-4 w-4" />
                    Tạm dừng
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => handleComponentAction(item, "start")}>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Chạy
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => handleComponentAction(item, "delete")}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Xóa
                </DropdownMenuItem>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>CPU</span>
                <span className="text-foreground font-medium">{item.cpu}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Memory</span>
                <span className="text-foreground font-medium">{item.memory}</span>
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

          {usersLoading ? (
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
              <h2 className="text-3xl font-semibold text-foreground">{selectedUser.name}</h2>
              <p className="text-sm text-muted-foreground">{selectedUser.username}</p>
            </div>
            <Card className="border shadow-sm">
              <CardContent className="flex gap-6 py-4 px-6 text-sm">
                <div>
                  <p className="text-muted-foreground">CPU đang dùng</p>
                  <p className="text-xl font-semibold text-foreground">
                    {selectedUser.cpuUsage.used}/{selectedUser.cpuUsage.total} cores
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Memory đang dùng</p>
                  <p className="text-xl font-semibold text-foreground">
                    {selectedUser.memoryUsage.used}/{selectedUser.memoryUsage.total} GB
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Số dự án</p>
                  <p className="text-xl font-semibold text-foreground">
                    {selectedUser.projectCount}
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
                    {renderComponents(projectDetail.databases)}
                  </TabsContent>
                  <TabsContent value="backends" className="pt-4">
                    {renderComponents(projectDetail.backends)}
                  </TabsContent>
                  <TabsContent value="frontends" className="pt-4">
                    {renderComponents(projectDetail.frontends)}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

