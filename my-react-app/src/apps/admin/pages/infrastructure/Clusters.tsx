import { useEffect, useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { adminAPI } from "@/lib/admin-api";
import type { Server, Cluster } from "@/types/admin";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { Network, Server as ServerIcon, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

// Component để quản lý role cho server được chọn
function ServerRoleSelector({
  serverId,
  value,
  onChange,
}: {
  serverId: string;
  value: "master" | "worker";
  onChange: (role: "master" | "worker") => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Label
        htmlFor={`role_${serverId}`}
        className="text-xs text-muted-foreground whitespace-nowrap"
      >
        Role:
      </Label>
      <Select
        id={`role_${serverId}`}
        name={`role_${serverId}`}
        value={value}
        onChange={(e) => onChange(e.target.value as "master" | "worker")}
        className="h-10 text-sm min-w-[110px] leading-normal"
      >
        <option value="master">Master</option>
        <option value="worker">Worker</option>
      </Select>
    </div>
  );
}

/**
 * Trang quản lý Cluster - chỉ quản lý 1 cụm K8s
 */
export function Clusters() {
  const [cluster, setCluster] = useState<Cluster | null>(null);
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedServers, setSelectedServers] = useState<Set<string>>(new Set());
  const [serverRoles, setServerRoles] = useState<Record<string, "master" | "worker">>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clusterData, serversData] = await Promise.all([
        adminAPI.getCluster(),
        adminAPI.getServers(),
      ]);
      setCluster(clusterData);
      setServers(serversData);
    } catch (error) {
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedServers(new Set());
    setServerRoles({});
    setSearchQuery("");
    setCurrentPage(1);
    setIsDialogOpen(true);
  };

  // Lọc servers theo search query
  const filteredServers = useMemo(() => {
    if (!searchQuery) return servers;
    const query = searchQuery.toLowerCase();
    return servers.filter(
      (server) =>
        server.name.toLowerCase().includes(query) ||
        server.ipAddress.toLowerCase().includes(query)
    );
  }, [servers, searchQuery]);

  // Phân trang
  const totalPages = Math.ceil(filteredServers.length / itemsPerPage);
  const paginatedServers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredServers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredServers, currentPage]);

  // Thống kê server đã chọn
  const selectedStats = useMemo(() => {
    const selected = Array.from(selectedServers);
    const masterCount = selected.filter((id) => serverRoles[id] === "master").length;
    const workerCount = selected.filter((id) => serverRoles[id] === "worker").length;
    return {
      total: selected.length,
      master: masterCount,
      worker: workerCount,
    };
  }, [selectedServers, serverRoles]);

  const handleRoleChange = (serverId: string, role: "master" | "worker") => {
    setServerRoles((prev) => ({
      ...prev,
      [serverId]: role,
    }));
  };

  const handleServerToggle = (serverId: string, checked: boolean) => {
    const newSelected = new Set(selectedServers);
    if (checked) {
      newSelected.add(serverId);
      // Mặc định role là worker nếu chưa có
      if (!serverRoles[serverId]) {
        setServerRoles((prev) => ({ ...prev, [serverId]: "worker" }));
      }
    } else {
      newSelected.delete(serverId);
      // Xóa role khi bỏ chọn
      setServerRoles((prev) => {
        const newRoles = { ...prev };
        delete newRoles[serverId];
        return newRoles;
      });
    }
    setSelectedServers(newSelected);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (selectedServers.size === 0) {
      toast.error("Vui lòng chọn ít nhất 1 server");
      return;
    }

    // Kiểm tra phải có ít nhất 1 master
    const masterCount = Array.from(selectedServers).filter(
      (id) => serverRoles[id] === "master"
    ).length;
    if (masterCount === 0) {
      toast.error("Phải có ít nhất 1 server với role Master");
      return;
    }

    // Tự động tạo tên cluster và các giá trị mặc định
    const data = {
      name: `cluster-${new Date().getTime()}`,
      version: "v1.28.0",
      nodeCount: selectedServers.size,
      status: "healthy" as const,
      provider: "local" as const,
      serverIds: Array.from(selectedServers),
      serverRoles,
    };

    try {
      await adminAPI.createCluster(data);
      toast.success("Tạo cluster thành công");
      setIsDialogOpen(false);
      setSelectedServers(new Set());
      setServerRoles({});
      setSearchQuery("");
      setCurrentPage(1);
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo cluster");
    }
  };

  // Phân loại servers
  const serversInCluster = cluster
    ? servers.filter((s) => cluster.serverIds.includes(s.id))
    : [];
  const serversNotInCluster = cluster
    ? servers.filter((s) => !cluster.serverIds.includes(s.id))
    : servers;

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Clusters</h2>
        <div className="border rounded-lg p-8 text-center">
          <div className="animate-pulse">Đang tải...</div>
        </div>
      </div>
    );
  }

  // Chưa có cluster - hiển thị empty state
  if (!cluster) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Clusters</h2>
        <EmptyState
          icon={<Network className="w-12 h-12 text-muted-foreground" />}
          title="Chưa có cluster nào"
          description="Bạn cần tạo một cluster Kubernetes để bắt đầu quản lý. Cluster sẽ được tạo từ các server có sẵn."
          actionLabel="Tạo Cluster"
          onAction={handleAdd}
        />

        {/* Dialog tạo cluster */}
        <Dialog 
          open={isDialogOpen} 
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setSelectedServers(new Set());
              setServerRoles({});
              setSearchQuery("");
              setCurrentPage(1);
            }
          }}
        >
          <DialogContent 
            className="max-w-6xl w-[90vw] max-h-[90vh] overflow-y-auto"
            style={{ maxWidth: '1152px' }}
          >
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                Tạo Cluster mới
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Chọn các server và gán role (Master/Worker) để tạo cluster Kubernetes
              </p>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Thống kê server đã chọn */}
              <div className="bg-muted/50 rounded-lg p-4 border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-sm text-muted-foreground">Tổng số server: </span>
                      <span className="text-sm font-semibold">{selectedStats.total}</span>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Master: </span>
                      <Badge variant="secondary" className="ml-1">
                        {selectedStats.master}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Worker: </span>
                      <Badge variant="secondary" className="ml-1">
                        {selectedStats.worker}
                      </Badge>
                    </div>
                  </div>
                  {selectedStats.master === 0 && selectedStats.total > 0 && (
                    <span className="text-xs text-destructive">
                      ⚠ Cần ít nhất 1 Master
                    </span>
                  )}
                </div>
              </div>

              {/* Thanh tìm kiếm */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm theo tên hoặc IP..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1); // Reset về trang 1 khi search
                    }}
                    className="pl-10"
                  />
                </div>
                <Label className="text-sm font-medium">
                  Chọn Servers và Role <span className="text-destructive">*</span>
                  {filteredServers.length > 0 && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({filteredServers.length} server{filteredServers.length > 1 ? "s" : ""})
                    </span>
                  )}
                </Label>
                <div className="border rounded-lg p-4 max-h-[400px] overflow-y-auto space-y-3">
                  {filteredServers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {searchQuery
                        ? "Không tìm thấy server nào"
                        : "Chưa có server nào. Vui lòng tạo server trước."}
                    </p>
                  ) : (
                    paginatedServers.map((server) => {
                      const isSelected = selectedServers.has(server.id);
                      return (
                        <div
                          key={server.id}
                          className="p-3 rounded-md border hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-start space-x-3 flex-1">
                              <Checkbox
                                id={`server_${server.id}`}
                                name={`server_${server.id}`}
                                className="mt-1"
                                checked={isSelected}
                                onChange={(e) => handleServerToggle(server.id, e.target.checked)}
                              />
                              <label
                                htmlFor={`server_${server.id}`}
                                className="flex-1 cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{server.name}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {server.ipAddress}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  CPU: {server.cpu.used}/{server.cpu.total} cores • Memory:{" "}
                                  {server.memory.used}/{server.memory.total} GB • Disk:{" "}
                                  {server.disk.used}/{server.disk.total} GB
                                </div>
                              </label>
                            </div>
                            {isSelected && (
                              <div className="flex-shrink-0">
                                <ServerRoleSelector
                                  serverId={server.id}
                                  value={serverRoles[server.id] || "worker"}
                                  onChange={(role) => handleRoleChange(server.id, role)}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Phân trang */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-sm text-muted-foreground">
                      Trang {currentPage} / {totalPages} ({filteredServers.length} server
                      {filteredServers.length > 1 ? "s" : ""})
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Trước
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Sau
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setSelectedServers(new Set());
                  setServerRoles({});
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="min-w-[100px]"
              >
                Hủy
              </Button>
              <Button 
                type="submit" 
                className="min-w-[100px]" 
                disabled={filteredServers.length === 0 || selectedStats.total === 0}
              >
                Tạo Cluster
              </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Đã có cluster - hiển thị thông tin cluster và danh sách servers
  return (
    <div className="space-y-6">
      {/* Thông tin cluster */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{cluster.name}</h2>
          <div className="flex items-center gap-4 mt-2">
            <Badge variant={cluster.status === "healthy" ? "success" : "destructive"}>
              {cluster.status === "healthy" ? "Healthy" : "Unhealthy"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Version: {cluster.version}
            </span>
            <span className="text-sm text-muted-foreground">
              Nodes: {cluster.nodeCount}
            </span>
            <Badge variant="secondary">{cluster.provider}</Badge>
          </div>
        </div>
      </div>

      {/* Servers trong cluster */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ServerIcon className="h-5 w-5" />
            Servers trong Cluster ({serversInCluster.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {serversInCluster.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Chưa có server nào trong cluster
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Tên</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">IP</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">CPU</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Memory</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Disk</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {serversInCluster.map((server) => (
                    <tr key={server.id} className="border-t hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm">{server.name}</td>
                      <td className="px-4 py-3 text-sm">{server.ipAddress}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">
                          {cluster?.serverRoles[server.id] || "worker"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {server.cpu.used} / {server.cpu.total} cores
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {server.memory.used} / {server.memory.total} GB
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {server.disk.used} / {server.disk.total} GB
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={server.status === "online" ? "success" : "destructive"}
                        >
                          {server.status === "online" ? "Online" : "Offline"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Servers không trong cluster */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ServerIcon className="h-5 w-5" />
            Servers không trong Cluster ({serversNotInCluster.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {serversNotInCluster.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Tất cả servers đã được thêm vào cluster
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Tên</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">IP</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">CPU</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Memory</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Disk</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {serversNotInCluster.map((server) => (
                    <tr key={server.id} className="border-t hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm">{server.name}</td>
                      <td className="px-4 py-3 text-sm">{server.ipAddress}</td>
                      <td className="px-4 py-3 text-sm">
                        {server.cpu.used} / {server.cpu.total} cores
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {server.memory.used} / {server.memory.total} GB
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {server.disk.used} / {server.disk.total} GB
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={server.status === "online" ? "success" : "destructive"}
                        >
                          {server.status === "online" ? "Online" : "Offline"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
