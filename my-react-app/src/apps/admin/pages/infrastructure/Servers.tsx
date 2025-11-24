import { useEffect, useState, useRef } from "react";
import { ResourceTable } from "../../components/ResourceTable";
import { Badge } from "@/components/ui/badge";
import { adminAPI } from "@/lib/admin-api";
import type { Server } from "@/types/admin";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Power, PowerOff, RotateCcw, Wifi, WifiOff, Server as ServerIcon, Network, User, Lock, Settings, CheckCircle2, RefreshCw, Terminal as TerminalIcon } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Terminal } from "@/components/common/Terminal";

/**
 * Trang quản lý Servers
 */
export function Servers() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<Server | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTestingSsh, setIsTestingSsh] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isExecutingAction, setIsExecutingAction] = useState<string | null>(null);
  const [reconnectDialogOpen, setReconnectDialogOpen] = useState(false);
  const [reconnectPassword, setReconnectPassword] = useState("");
  const [reconnectingServer, setReconnectingServer] = useState<Server | null>(null);
  const [activeTab, setActiveTab] = useState("connection");
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [selectedServerForTerminal, setSelectedServerForTerminal] = useState<Server | null>(null);
  const pageSize = 10;

  useEffect(() => {
    // Load danh sách servers và kiểm tra status khi vào trang
    const initializeServers = async () => {
      try {
        setLoading(true);
        // Chỉ kiểm tra status (ping), metrics sẽ lấy từ database
        const result = await adminAPI.checkAllStatuses();
        setServers(result.servers);
      } catch (error: any) {
        // Nếu kiểm tra status thất bại, vẫn load danh sách servers từ database
        console.error("Error checking server status:", error);
        await loadServers();
        const errorMessage = error.message || 
                            error.response?.data?.message || 
                            error.response?.data?.error || 
                            "Không thể kiểm tra trạng thái servers";
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    initializeServers();
  }, []);

  const loadServers = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getServers();
      setServers(data);
    } catch (error) {
      toast.error("Không thể tải danh sách servers");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingServer(null);
    setActiveTab("connection"); // Reset về tab đầu tiên
    setIsDialogOpen(true);
  };

  const handleEdit = async (server: Server) => {
    try {
      // Load đầy đủ thông tin server từ backend
      const fullServer = await adminAPI.getServer(server.id);
      setEditingServer(fullServer);
      setIsDialogOpen(true);
    } catch (error: any) {
      const errorMessage = error.message || 
                          error.response?.data?.message || 
                          "Không thể tải thông tin server";
      toast.error(errorMessage);
      // Fallback: dùng thông tin từ list nếu load detail thất bại
    setEditingServer(server);
    setIsDialogOpen(true);
    }
  };

  const handleDelete = async (server: Server) => {
    if (!confirm(`Bạn có chắc muốn xóa server "${server.name}"?`)) return;
    try {
      await adminAPI.deleteServer(server.id);
      toast.success("Xóa server thành công");
      loadServers();
    } catch (error: any) {
      const errorMessage = error.message || 
                          error.response?.data?.message || 
                          error.response?.data?.error || 
                          "Không thể xóa server";
      toast.error(errorMessage);
      console.error("Error deleting server:", error);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsCheckingStatus(true);
      // Gọi API check all servers (status + metrics)
      const result = await adminAPI.checkAllServers();
      
      // Cập nhật danh sách servers với dữ liệu mới nhất
      setServers(result.servers);
      
      toast.success(result.message || "Đã làm mới dữ liệu servers");
    } catch (error: any) {
      const errorMessage = error.message || 
                          error.response?.data?.message || 
                          error.response?.data?.error || 
                          "Không thể làm mới dữ liệu";
      toast.error(errorMessage);
      console.error("Error refreshing:", error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleReconnect = async (server: Server) => {
    if (!confirm(`Bạn có chắc muốn reconnect server "${server.name}"?`)) return;
    
    try {
      setIsExecutingAction(server.id);
      setReconnectingServer(server);
      
      // Bước 1: Kiểm tra ping đến server trước
      try {
        const pingResult = await adminAPI.pingServer(server.id, 2000);
        if (!pingResult.success) {
          toast.error("Không thể ping đến server. Vui lòng kiểm tra kết nối mạng.");
          setIsExecutingAction(null);
          return;
        }
      } catch (pingError: any) {
        const pingErrorMessage = pingError.message || 
                                pingError.response?.data?.message || 
                                pingError.response?.data?.error || 
                                "Không thể ping đến server";
        toast.error(pingErrorMessage);
        setIsExecutingAction(null);
        return;
      }
      
      // Bước 2: Ping thành công, thử reconnect với SSH key
      try {
        const updatedServer = await adminAPI.reconnectServer(server.id, undefined);
        
        // Cập nhật server trong danh sách
        setServers(servers.map(s => s.id === server.id ? updatedServer : s));
        
        toast.success("Reconnect server thành công bằng SSH key");
        setIsExecutingAction(null);
        return;
      } catch (keyError: any) {
        // SSH key không hoạt động, kiểm tra xem có yêu cầu password không
        const errorMessage = keyError.message || 
                            keyError.response?.data?.message || 
                            keyError.response?.data?.error || 
                            "";
        
        // Nếu lỗi là yêu cầu password, hiển thị dialog
        if (errorMessage.includes("SSH key không hoạt động") || 
            errorMessage.includes("Password không được để trống")) {
          // Hiển thị dialog nhập password
          setReconnectPassword("");
          setReconnectDialogOpen(true);
          return;
        } else {
          // Lỗi khác, hiển thị thông báo
          toast.error(errorMessage || "Không thể reconnect server");
          setIsExecutingAction(null);
          return;
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || 
                          error.response?.data?.message || 
                          error.response?.data?.error || 
                          "Không thể reconnect server";
      toast.error(errorMessage);
      console.error("Error reconnecting server:", error);
      setIsExecutingAction(null);
    }
  };

  const handleReconnectWithPassword = async () => {
    if (!reconnectingServer || !reconnectPassword.trim()) {
      toast.error("Vui lòng nhập password");
      return;
    }
    
    try {
      setIsExecutingAction(reconnectingServer.id);
      
      const updatedServer = await adminAPI.reconnectServer(reconnectingServer.id, reconnectPassword);
      
      // Cập nhật server trong danh sách
      setServers(servers.map(s => s.id === reconnectingServer.id ? updatedServer : s));
      
      toast.success("Reconnect server thành công bằng password");
      setReconnectDialogOpen(false);
      setReconnectPassword("");
      setReconnectingServer(null);
    } catch (error: any) {
      const errorMessage = error.message || 
                          error.response?.data?.message || 
                          error.response?.data?.error || 
                          "Không thể reconnect server";
      toast.error(errorMessage);
      console.error("Error reconnecting server with password:", error);
    } finally {
      setIsExecutingAction(null);
    }
  };

  const handleDisconnect = async (server: Server) => {
    if (!confirm(`Bạn có chắc muốn disconnect server "${server.name}"?`)) return;
    
    try {
      setIsExecutingAction(server.id);
      const updatedServer = await adminAPI.disconnectServer(server.id);
      
      // Cập nhật server trong danh sách
      setServers(servers.map(s => s.id === server.id ? updatedServer : s));
      
      toast.success("Disconnect server thành công");
    } catch (error: any) {
      const errorMessage = error.message || 
                          error.response?.data?.message || 
                          error.response?.data?.error || 
                          "Không thể disconnect server";
      toast.error(errorMessage);
      console.error("Error disconnecting server:", error);
    } finally {
      setIsExecutingAction(null);
    }
  };


  const handleShutdown = async (server: Server) => {
    if (!confirm(`Bạn có chắc muốn shutdown server "${server.name}"? Server sẽ tắt sau vài giây.`)) return;
    
    try {
      setIsExecutingAction(server.id);
      const result = await adminAPI.shutdownServer(server.id);
      
      // Cập nhật server status trong danh sách
      setServers(servers.map(s => s.id === server.id ? { ...s, status: "offline" as const } : s));
      
      toast.success(result.message || "Đã gửi lệnh shutdown đến server");
    } catch (error: any) {
      const errorMessage = error.message || 
                          error.response?.data?.message || 
                          error.response?.data?.error || 
                          "Không thể shutdown server";
      toast.error(errorMessage);
      console.error("Error shutting down server:", error);
    } finally {
      setIsExecutingAction(null);
    }
  };

  const handleRestart = async (server: Server) => {
    if (!confirm(`Bạn có chắc muốn restart server "${server.name}"? Server sẽ khởi động lại sau vài giây.`)) return;
    
    try {
      setIsExecutingAction(server.id);
      const result = await adminAPI.restartServer(server.id);
      
      // Cập nhật server status trong danh sách
      setServers(servers.map(s => s.id === server.id ? { ...s, status: "offline" as const } : s));
      
      toast.success(result.message || "Đã gửi lệnh restart đến server");
    } catch (error: any) {
      const errorMessage = error.message || 
                          error.response?.data?.message || 
                          error.response?.data?.error || 
                          "Không thể restart server";
      toast.error(errorMessage);
      console.error("Error restarting server:", error);
    } finally {
      setIsExecutingAction(null);
    }
  };

  const handleTestSsh = async (e: React.MouseEvent) => {
    e.preventDefault();
    const form = document.querySelector('form') as HTMLFormElement;
    if (!form) return;

    const formData = new FormData(form);
    const ip = formData.get("ipAddress") as string;
    const port = parseInt(formData.get("port") as string) || 22;
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    if (!ip || !username || !password) {
      toast.error("Vui lòng điền đầy đủ thông tin IP, Username và Password");
      return;
    }

    try {
      setIsTestingSsh(true);
      const result = await adminAPI.testSsh({
        ip,
        port,
        username,
        password,
      });

      if (result.success) {
        toast.success("Kết nối SSH thành công!");
      } else {
        toast.error(result.message || "Kết nối SSH thất bại");
      }
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi test SSH connection");
    } finally {
      setIsTestingSsh(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const passwordValue = formData.get("password") as string;
    
    const data: any = {
      name: formData.get("name") as string,
      ipAddress: formData.get("ipAddress") as string,
      port: formData.get("port") ? parseInt(formData.get("port") as string) : 22,
      username: formData.get("username") as string,
      role: formData.get("role") as string || "WORKER",
      serverStatus: formData.get("serverStatus") as string || "RUNNING",
      clusterStatus: formData.get("clusterStatus") as string || "UNAVAILABLE",
      // Giá trị mặc định cho các trường không nhập
      status: "online" as const,
      os: "Unknown",
    };
    
    // Chỉ gửi password nếu có giá trị (khi edit có thể để trống)
    if (passwordValue && passwordValue.trim() !== "") {
      data.password = passwordValue;
    }

    try {
      setIsSubmitting(true);
      if (editingServer) {
        await adminAPI.updateServer(editingServer.id, data);
        toast.success("Cập nhật server thành công");
        setIsDialogOpen(false);
        loadServers();
      } else {
        await adminAPI.createServer(data);
        toast.success("Tạo server thành công. Hệ thống đang tự động cấu hình SSH key và lấy metrics...");
      setIsDialogOpen(false);
      loadServers();
      }
    } catch (error: any) {
      // Hiển thị error message chính xác từ backend
      const errorMessage = error.message || 
                          error.response?.data?.message || 
                          error.response?.data?.error || 
                          "Không thể lưu server";
      toast.error(errorMessage);
      console.error("Error saving server:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      key: "name",
      label: "Tên",
    },
    {
      key: "ipAddress",
      label: "IP",
      align: "center" as const,
    },
    {
      key: "cpu",
      label: "CPU",
      align: "center" as const,
      render: (server: Server) => (
        <span>
          {server.cpu.total === "-" ? "-" : `${server.cpu.total} cores`}
        </span>
      ),
    },
    {
      key: "memory",
      label: "Memory",
      align: "center" as const,
      render: (server: Server) => (
        <span>
          {server.memory.total === "-" ? "-" : typeof server.memory.total === "number" 
            ? `${server.memory.total} GiB` 
            : server.memory.total}
        </span>
      ),
    },
    {
      key: "disk",
      label: "Disk",
      align: "center" as const,
      render: (server: Server) => (
        <span>
          {server.disk.total === "-" ? "-" : typeof server.disk.total === "number" 
            ? `${server.disk.total} GiB` 
            : server.disk.total}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      align: "center" as const,
      render: (server: Server) => {
        if (server.status === "online") {
          return <Badge variant="success">Online</Badge>;
        } else if (server.status === "disabled") {
          return <Badge variant="secondary">Disabled</Badge>;
        } else {
          return <Badge variant="destructive">Offline</Badge>;
        }
      },
    },
  ];

  return (
    <>
      <ResourceTable
        title="Servers"
        columns={columns}
        data={servers}
        loading={loading}
        pagination={{
          page: currentPage,
          pageSize,
          onPageChange: (page) => setCurrentPage(page),
        }}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Tìm kiếm server..."
        customActions={(server: Server) => (
          <>
            {(server.status === "offline" || server.status === "disabled") && (
              <DropdownMenuItem onClick={() => handleReconnect(server)}>
                <Wifi className="h-4 w-4 mr-2" />
                Kết nối lại
              </DropdownMenuItem>
            )}
            {server.status === "online" && (
              <DropdownMenuItem onClick={() => handleDisconnect(server)}>
                <WifiOff className="h-4 w-4 mr-2" />
                Ngắt kết nối
              </DropdownMenuItem>
            )}
            {server.status === "online" && (
              <>
                <DropdownMenuItem onClick={() => {
                  setSelectedServerForTerminal(server);
                  setTerminalOpen(true);
                }}>
                  <TerminalIcon className="h-4 w-4 mr-2" />
                  Mở Terminal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRestart(server)}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restart
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleShutdown(server)}
                  className="text-destructive focus:text-destructive"
                >
                  <PowerOff className="h-4 w-4 mr-2" />
                  Shutdown
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
        extraActions={
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isCheckingStatus || loading}
            className="gap-2"
          >
            {isCheckingStatus ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang làm mới...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                <span>Làm mới</span>
              </>
            )}
          </Button>
        }
      />

      {/* Dialog thêm/sửa server */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setActiveTab("connection"); // Reset tab khi đóng dialog
        }
      }}>
        <DialogContent className="w-[800px] max-w-[800px] h-[600px] max-h-[600px] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              {editingServer ? (
                <>
                  <Settings className="h-6 w-6" />
                  Sửa Server
                </>
              ) : (
                <>
                  <ServerIcon className="h-6 w-6" />
                  Thêm Server mới
                </>
              )}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              {editingServer 
                ? "Cập nhật thông tin kết nối và cấu hình server"
                : "Nhập thông tin kết nối SSH để hệ thống tự động cấu hình và quản lý server"}
            </p>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 space-y-4">
            {/* Tên server - hiển thị ở trên cùng, không trong tab */}
            <div className="space-y-2 flex-shrink-0">
              <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                <ServerIcon className="h-3.5 w-3.5" />
                Tên Server <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                key={editingServer?.id || "new"} // Force re-render khi chuyển giữa add/edit
                defaultValue={editingServer?.name || ""}
                placeholder="server-01, master-node, worker-01..."
                className="h-10"
                required
              />
              <p className="text-xs text-muted-foreground">
                Tên hiển thị để dễ dàng nhận biết server
              </p>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-1 min-h-0">
              <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
                <TabsTrigger value="connection" className="flex items-center gap-2">
                  <Network className="h-4 w-4" />
                  Thông tin kết nối
                </TabsTrigger>
                <TabsTrigger value="configuration" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Cấu hình
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Thông tin kết nối SSH */}
              <TabsContent value="connection" className="space-y-4 mt-4 flex-1 overflow-y-auto min-h-0 pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                    <Label htmlFor="ipAddress" className="text-sm font-medium flex items-center gap-2">
                      <Network className="h-3.5 w-3.5" />
                  IP Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ipAddress"
                  name="ipAddress"
                  type="text"
                  defaultValue={editingServer?.ipAddress}
                  placeholder="192.168.1.10"
                      className="h-10 font-mono"
                  required
                />
                    <p className="text-xs text-muted-foreground">
                      Địa chỉ IP hoặc hostname
                    </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="port" className="text-sm font-medium">
                  Port SSH <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="port"
                  name="port"
                  type="number"
                  defaultValue={editingServer?.port || 22}
                  placeholder="22"
                  className="h-10"
                      min="1"
                      max="65535"
                  required
                />
                    <p className="text-xs text-muted-foreground">
                      Port SSH (mặc định: 22)
                    </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium flex items-center gap-2">
                      <User className="h-3.5 w-3.5" />
                  Username <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  defaultValue={editingServer?.username || ""}
                      placeholder="root, ubuntu..."
                  className="h-10"
                  required
                />
                    <p className="text-xs text-muted-foreground">
                      Tên người dùng SSH
                    </p>
              </div>
              <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                      <Lock className="h-3.5 w-3.5" />
                      Password {!editingServer && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                      placeholder={editingServer ? "Để trống nếu không đổi" : "••••••••"}
                      className="h-10"
                      required={!editingServer}
                    />
                    {editingServer ? (
                      <p className="text-xs text-muted-foreground">
                        Chỉ nhập nếu muốn thay đổi password
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Password sẽ được dùng để tự động tạo SSH key
                      </p>
                    )}
                  </div>
                </div>

              </TabsContent>  

              {/* Tab 2: Cấu hình Server */}
              <TabsContent value="configuration" className="space-y-4 mt-4 flex-1 overflow-y-auto min-h-0 pr-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-medium">
                      Role <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      id="role"
                      name="role"
                      defaultValue={editingServer?.role || "WORKER"}
                      className="h-10"
                      required
                    >
                      <option value="MASTER">MASTER - Master Node</option>
                      <option value="WORKER">WORKER - Worker Node</option>
                      <option value="DOCKER">DOCKER - Docker Host</option>
                      <option value="ANSIBLE">ANSIBLE - Ansible Controller</option>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Vai trò của server trong hệ thống
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serverStatus" className="text-sm font-medium">
                      Server Status <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      id="serverStatus"
                      name="serverStatus"
                      defaultValue={editingServer?.serverStatus || (editingServer?.status === "online" ? "RUNNING" : "STOPPED") || "RUNNING"}
                  className="h-10"
                  required
                    >
                      <option value="RUNNING">RUNNING - Đang chạy</option>
                      <option value="STOPPED">STOPPED - Đã dừng</option>
                      <option value="BUILDING">BUILDING - Đang xây dựng</option>
                      <option value="ERROR">ERROR - Lỗi</option>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Trạng thái hoạt động của server
                    </p>
              </div>
            </div>

                <div className="space-y-2">
                  <Label htmlFor="clusterStatus" className="text-sm font-medium">
                    Cluster Status <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    id="clusterStatus"
                    name="clusterStatus"
                    defaultValue={editingServer?.clusterStatus || "UNAVAILABLE"}
                    className="h-10"
                    required
                  >
                    <option value="AVAILABLE">AVAILABLE - Sẵn sàng trong cluster</option>
                    <option value="UNAVAILABLE">UNAVAILABLE - Không sẵn sàng</option>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Trạng thái tham gia vào Kubernetes cluster
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {/* Footer buttons */}
            <div className="flex justify-between items-center pt-4 border-t flex-shrink-0">
              {/* Test SSH Button - chỉ hiển thị khi thêm mới */}
              {!editingServer && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestSsh}
                  disabled={isTestingSsh || isSubmitting}
                  className="min-w-[160px]"
                >
                  {isTestingSsh ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang kiểm tra...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Kiểm tra kết nối SSH
                    </>
                  )}
                </Button>
              )}
              {editingServer && <div />} {/* Spacer khi edit */}
              
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="min-w-[100px]"
                  disabled={isSubmitting || isTestingSsh}
                >
                  Hủy
                </Button>
                <Button type="submit" className="min-w-[120px]" disabled={isSubmitting || isTestingSsh}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingServer ? "Đang cập nhật..." : "Đang tạo..."}
                    </>
                  ) : (
                    <>
                      {editingServer ? (
                        <>
                          <Settings className="mr-2 h-4 w-4" />
                          Cập nhật
                        </>
                      ) : (
                        <>
                          <ServerIcon className="mr-2 h-4 w-4" />
                          Thêm Server
                        </>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reconnect Password Dialog */}
      <Dialog open={reconnectDialogOpen} onOpenChange={setReconnectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Nhập Password để Reconnect
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              SSH key không hoạt động. Vui lòng nhập password để kết nối lại server{" "}
              <span className="font-semibold">{reconnectingServer?.name}</span>
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reconnectPassword" className="text-sm font-medium">
                Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="reconnectPassword"
                type="password"
                value={reconnectPassword}
                onChange={(e) => setReconnectPassword(e.target.value)}
                placeholder="Nhập password SSH"
                className="h-10"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && reconnectPassword.trim()) {
                    handleReconnectWithPassword();
                  }
                }}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Password sẽ được sử dụng để kết nối và có thể tự động generate SSH key mới
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setReconnectDialogOpen(false);
                  setReconnectPassword("");
                  setReconnectingServer(null);
                  setIsExecutingAction(null);
                }}
                disabled={isExecutingAction !== null}
              >
                Hủy
              </Button>
              <Button
                onClick={handleReconnectWithPassword}
                disabled={!reconnectPassword.trim() || isExecutingAction !== null}
              >
                {isExecutingAction !== null ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang kết nối...
                  </>
                ) : (
                  "Kết nối"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Terminal Dialog */}
      {selectedServerForTerminal && (
        <Terminal
          open={terminalOpen}
          onClose={() => {
            setTerminalOpen(false);
            setSelectedServerForTerminal(null);
          }}
          server={selectedServerForTerminal}
        />
      )}
    </>
  );
}

