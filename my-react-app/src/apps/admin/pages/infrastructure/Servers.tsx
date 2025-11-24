import { useEffect, useState } from "react";
import { ResourceTable } from "../../components/ResourceTable";
import { Badge } from "@/components/ui/badge";
import { adminAPI } from "@/lib/admin-api";
import type { Server } from "@/types/admin";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
  const pageSize = 10;

  useEffect(() => {
    const initializeServers = async () => {
      // Load danh sách servers trước
      await loadServers();
      // Sau đó tự động kiểm tra trạng thái và refresh metrics
      try {
        setIsCheckingStatus(true);
        // Gọi API check status với includeMetrics = true
        const result = await adminAPI.checkAllStatuses(true);
        
        // Cập nhật danh sách servers với dữ liệu mới nhất
        setServers(result.servers);
      } catch (error: any) {
        console.error("Error auto-refreshing servers:", error);
        // Không hiển thị toast error khi auto-refresh, chỉ log
      } finally {
        setIsCheckingStatus(false);
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
      // Gọi API check status với includeMetrics = true để vừa check status vừa lấy metrics
      const result = await adminAPI.checkAllStatuses(true);
      
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
      cpu: { used: "-", total: "-" },
      memory: { used: "-", total: "-" },
      disk: { used: "-", total: "-" },
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
          {server.cpu.used === "-" ? "-" : `${server.cpu.used} load`} / {server.cpu.total === "-" ? "-" : server.cpu.total} cores
        </span>
      ),
    },
    {
      key: "memory",
      label: "Memory",
      align: "center" as const,
      render: (server: Server) => (
        <span>
          {server.memory.used === "-" ? "-" : server.memory.used} / {server.memory.total === "-" ? "-" : server.memory.total} GiB
        </span>
      ),
    },
    {
      key: "disk",
      label: "Disk",
      align: "center" as const,
      render: (server: Server) => (
        <span>
          {server.disk.used === "-" ? "-" : server.disk.used} / {server.disk.total === "-" ? "-" : server.disk.total} GiB
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      align: "center" as const,
      render: (server: Server) => (
        <Badge variant={server.status === "online" ? "success" : "destructive"}>
          {server.status === "online" ? "Online" : "Offline"}
        </Badge>
      ),
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
        extraActions={
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isCheckingStatus || loading}
          >
            {isCheckingStatus ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang làm mới...
              </>
            ) : (
              "Làm mới"
            )}
          </Button>
        }
      />

      {/* Dialog thêm/sửa server */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {editingServer ? "Sửa Server" : "Thêm Server mới"}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Nhập thông tin kết nối SSH để quản lý server
            </p>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tên server - full width */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Tên Server <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                defaultValue={editingServer?.name}
                placeholder="server-01"
                className="h-10"
                required
              />
            </div>

            {/* IP và Port - cùng 1 hàng */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ipAddress" className="text-sm font-medium">
                  IP Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ipAddress"
                  name="ipAddress"
                  type="text"
                  defaultValue={editingServer?.ipAddress}
                  placeholder="192.168.1.10"
                  className="h-10"
                  required
                />
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
                  required
                />
              </div>
            </div>

            {/* Username và Password - cùng 1 hàng */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Username <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  defaultValue={editingServer?.username || ""}
                  placeholder="root"
                  className="h-10"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
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
                {editingServer && (
                  <p className="text-xs text-muted-foreground">
                    Chỉ nhập nếu muốn thay đổi password
                  </p>
                )}
              </div>
            </div>

            {/* Role và Server Status - cùng 1 hàng */}
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
                  <option value="MASTER">MASTER</option>
                  <option value="WORKER">WORKER</option>
                  <option value="DOCKER">DOCKER</option>
                  <option value="ANSIBLE">ANSIBLE</option>
                </Select>
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
                  <option value="RUNNING">RUNNING</option>
                  <option value="STOPPED">STOPPED</option>
                  <option value="BUILDING">BUILDING</option>
                  <option value="ERROR">ERROR</option>
                </Select>
              </div>
            </div>

            {/* Cluster Status */}
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
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="UNAVAILABLE">UNAVAILABLE</option>
              </Select>
            </div>

            {/* Test SSH Button */}
            {!editingServer && (
              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestSsh}
                  disabled={isTestingSsh}
                  className="w-full"
                >
                  {isTestingSsh ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang test...
                    </>
                  ) : (
                    "Test SSH Connection"
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Kiểm tra kết nối SSH trước khi tạo server
                </p>
              </div>
            )}

            {/* Footer buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="min-w-[100px]"
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button type="submit" className="min-w-[100px]" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingServer ? "Đang cập nhật..." : "Đang tạo..."}
                  </>
                ) : (
                  editingServer ? "Cập nhật" : "Thêm mới"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

