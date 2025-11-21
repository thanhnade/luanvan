import { useEffect, useState } from "react";
import { ResourceTable } from "../../components/ResourceTable";
import { Badge } from "@/components/ui/badge";
import { adminAPI } from "@/lib/admin-api";
import type { Server } from "@/types/admin";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

/**
 * Trang quản lý Servers
 */
export function Servers() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<Server | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    loadServers();
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

  const handleEdit = (server: Server) => {
    setEditingServer(server);
    setIsDialogOpen(true);
  };

  const handleDelete = async (server: Server) => {
    if (!confirm(`Bạn có chắc muốn xóa server "${server.name}"?`)) return;
    try {
      await adminAPI.deleteServer(server.id);
      toast.success("Xóa server thành công");
      loadServers();
    } catch (error) {
      toast.error("Không thể xóa server");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      ipAddress: formData.get("ipAddress") as string,
      port: formData.get("port") ? parseInt(formData.get("port") as string) : 22,
      username: formData.get("username") as string,
      password: formData.get("password") as string,
      // Giá trị mặc định cho các trường không nhập
      status: "online" as const,
      cpu: { used: 0, total: 100 },
      memory: { used: 0, total: 128 },
      disk: { used: 0, total: 500 },
      os: "Unknown",
    };

    try {
      if (editingServer) {
        await adminAPI.updateServer(editingServer.id, data);
        toast.success("Cập nhật server thành công");
      } else {
        await adminAPI.createServer(data);
        toast.success("Tạo server thành công");
      }
      setIsDialogOpen(false);
      loadServers();
    } catch (error) {
      toast.error("Không thể lưu server");
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
          {server.cpu.used} / {server.cpu.total} cores
        </span>
      ),
    },
    {
      key: "memory",
      label: "Memory",
      align: "center" as const,
      render: (server: Server) => (
        <span>
          {server.memory.used} / {server.memory.total} GB
        </span>
      ),
    },
    {
      key: "disk",
      label: "Disk",
      align: "center" as const,
      render: (server: Server) => (
        <span>
          {server.disk.used} / {server.disk.total} GB
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
                  Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  className="h-10"
                  required
                />
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="min-w-[100px]"
              >
                Hủy
              </Button>
              <Button type="submit" className="min-w-[100px]">
                {editingServer ? "Cập nhật" : "Thêm mới"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

