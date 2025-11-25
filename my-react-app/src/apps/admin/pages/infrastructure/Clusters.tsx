import { useEffect, useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { adminAPI } from "@/lib/admin-api";
import type { Server } from "@/types/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, RefreshCw, Loader2, Plus, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";

/**
 * Trang quản lý Cluster - chỉ hiển thị danh sách server trong cluster
 * Có nút gán server vào cluster qua modal
 */
export function Clusters() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // States cho modal gán server
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedServers, setSelectedServers] = useState<Set<string>>(new Set());
  const [serverRoles, setServerRoles] = useState<Record<string, string>>({});
  const [modalSearchQuery, setModalSearchQuery] = useState("");

  // States cho cập nhật role và gỡ server
  const [updatingRoleServerId, setUpdatingRoleServerId] = useState<string | null>(null);
  const [removingServerId, setRemovingServerId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Chỉ lấy danh sách servers, không gọi getCluster() để tránh timeout
      const serversData = await adminAPI.getServers();
      setServers(serversData);
    } catch (error) {
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  // Chỉ lấy servers trong cluster (clusterStatus = "AVAILABLE")
  const serversInCluster = servers.filter((s) => s.clusterStatus === "AVAILABLE");

  // Servers chưa trong cluster (cho modal) - hiển thị tất cả
  const serversNotInCluster = servers.filter(
    (s) => s.clusterStatus !== "AVAILABLE"
  );

  // Filter servers trong cluster theo search query
  const filteredServersInCluster = useMemo(() => {
    if (!searchQuery) return serversInCluster;
    const query = searchQuery.toLowerCase();
    return serversInCluster.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.ipAddress.toLowerCase().includes(query) ||
        (s.role && s.role.toLowerCase().includes(query))
    );
  }, [serversInCluster, searchQuery]);

  // Filter servers chưa trong cluster cho modal - hiển thị tất cả
  const filteredAvailableServers = useMemo(() => {
    if (!modalSearchQuery) return serversNotInCluster;
    const query = modalSearchQuery.toLowerCase();
    return serversNotInCluster.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.ipAddress.toLowerCase().includes(query) ||
        (s.role && s.role.toLowerCase().includes(query))
    );
  }, [serversNotInCluster, modalSearchQuery]);

  // Tất cả servers đều có thể gán vào cluster với bất kỳ role nào
  const canAssignToCluster = (server: Server) => {
    return true;
  };

  // Handle mở modal gán server
  const handleOpenAssignModal = () => {
    setShowAssignModal(true);
    setSelectedServers(new Set());
    setServerRoles({});
    setModalSearchQuery("");
  };

  // Handle đóng modal
  const handleCloseAssignModal = () => {
    setShowAssignModal(false);
    setSelectedServers(new Set());
    setServerRoles({});
    setModalSearchQuery("");
  };

  // Handle toggle chọn server trong modal
  const handleToggleServer = (serverId: string, checked: boolean) => {
    const server = serversNotInCluster.find((s) => s.id === serverId);
    if (!server) return;

    const newSelected = new Set(selectedServers);
    if (checked) {
      newSelected.add(serverId);
      // Giữ nguyên role mặc định của server nếu chưa có
      if (!serverRoles[serverId]) {
        const defaultRole = server?.role?.toUpperCase() || "WORKER";
        setServerRoles((prev) => ({ ...prev, [serverId]: defaultRole }));
      }
    } else {
      newSelected.delete(serverId);
    }
    setSelectedServers(newSelected);
  };

  // Handle chọn tất cả servers trong modal
  const handleSelectAllServers = (checked: boolean) => {
    if (checked) {
      // Chọn tất cả servers
      const allIds = new Set(filteredAvailableServers.map((s) => s.id));
      setSelectedServers(allIds);
      // Khởi tạo roles cho tất cả, giữ nguyên role hiện tại của server
      const roles: Record<string, string> = { ...serverRoles };
      filteredAvailableServers.forEach((s) => {
        if (!roles[s.id]) {
          const role = s.role?.toUpperCase() || "WORKER";
          roles[s.id] = role;
        }
      });
      setServerRoles(roles);
    } else {
      setSelectedServers(new Set());
    }
  };

  // Handle thay đổi role của server trong modal
  const handleRoleChange = (serverId: string, role: string) => {
    setServerRoles((prev) => ({ ...prev, [serverId]: role }));
  };

  // Handle cập nhật role cho một server
  const handleUpdateServerRole = async (serverId: string, newRole: string) => {
    const server = serversInCluster.find((s) => s.id === serverId);
    if (!server) return;

    // Kiểm tra nếu role không thay đổi thì không cần cập nhật
    const currentRole = server.role?.toUpperCase() || "WORKER";
    if (currentRole === newRole.toUpperCase()) {
      return;
    }

    // Kiểm tra nếu đang đổi tất cả MASTER thành role khác
    const currentMasterCount = serversInCluster.filter((s) => s.role === "MASTER").length;
    if (server.role === "MASTER" && newRole !== "MASTER" && currentMasterCount === 1) {
      toast.error("Phải có ít nhất 1 server với role MASTER trong cluster");
      return;
    }

    try {
      setUpdatingRoleServerId(serverId);
      await adminAPI.updateServerRoles([{ serverId, role: newRole }]);
      toast.success(`Đã cập nhật role của ${server.name} thành ${newRole}`);
      await loadData();
    } catch (error: any) {
      const errorMessage = error.message || "Không thể cập nhật role";
      toast.error(errorMessage);
    } finally {
      setUpdatingRoleServerId(null);
    }
  };

  // Handle gỡ server khỏi cluster
  const handleRemoveServer = async (serverId: string) => {
    const server = serversInCluster.find((s) => s.id === serverId);
    if (!server) return;

    // Kiểm tra nếu đang xóa tất cả MASTER
    const currentMasterCount = serversInCluster.filter((s) => s.role === "MASTER").length;
    if (server.role === "MASTER" && currentMasterCount === 1) {
      toast.error("Không thể bỏ server MASTER này. Phải có ít nhất 1 MASTER trong cluster.");
      return;
    }

    if (!confirm(`Bạn có chắc muốn gỡ server "${server.name}" khỏi cluster?`)) {
      return;
    }

    try {
      setRemovingServerId(serverId);
      await adminAPI.unassignServersFromCluster([serverId]);
      toast.success(`Đã gỡ server ${server.name} khỏi cluster`);
      await loadData();
    } catch (error: any) {
      const errorMessage = error.message || "Không thể gỡ server khỏi cluster";
      toast.error(errorMessage);
    } finally {
      setRemovingServerId(null);
    }
  };

  // Handle gán servers vào cluster
  const handleAssignServers = async () => {
    if (selectedServers.size === 0) {
      toast.error("Vui lòng chọn ít nhất một server");
      return;
    }

    // Kiểm tra phải có ít nhất 1 MASTER
    const masterCount = Array.from(selectedServers).filter(
      (id) => serverRoles[id] === "MASTER"
    ).length;
    
    // Nếu chưa có MASTER nào trong cluster và không có MASTER nào được chọn
    const existingMasterCount = serversInCluster.filter((s) => s.role === "MASTER").length;
    if (existingMasterCount === 0 && masterCount === 0) {
      toast.error("Phải có ít nhất 1 server với role MASTER");
      return;
    }

    try {
      setIsAssigning(true);
      const serverIds = Array.from(selectedServers);
      
      const updates = serverIds.map((id) => {
        // Ưu tiên role từ serverRoles, nếu không có thì lấy từ server object, cuối cùng mới là WORKER
        const server = serversNotInCluster.find((s) => s.id === id);
        const role = serverRoles[id] || server?.role?.toUpperCase() || "WORKER";
        return {
          serverId: id,
          role,
        };
      });

      await adminAPI.assignServersToCluster(updates);
      toast.success(`Đã gán ${serverIds.length} server vào cluster`);
      
      handleCloseAssignModal();
      await loadData();
    } catch (error: any) {
      const errorMessage = error.message || "Không thể gán servers vào cluster";
      toast.error(errorMessage);
    } finally {
      setIsAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">🔗 Quản lý Cluster</h2>
        <div className="border rounded-lg p-8 text-center">
          <div className="animate-pulse">Đang tải...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">🔗 Quản lý Cluster</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Danh sách servers trong cluster
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <Button onClick={handleOpenAssignModal} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Gán vào cluster
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm theo tên, IP hoặc role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Servers trong Cluster Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            ✅ Servers trong cluster ({serversInCluster.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {serversInCluster.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg">
              <p className="text-lg mb-2">Chưa có server nào trong cluster</p>
              <p className="text-sm">Nhấn nút "Gán vào cluster" để thêm servers</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 text-left">Tên</th>
                    <th className="p-3 text-left">IP Address</th>
                    <th className="p-3 text-left">Port</th>
                    <th className="p-3 text-left">Role</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Cluster Status</th>
                    <th className="p-3 text-left">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServersInCluster.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        Không tìm thấy server nào
                      </td>
                    </tr>
                  ) : (
                    filteredServersInCluster.map((server) => (
                      <tr key={server.id} className="border-t hover:bg-muted/50">
                        <td className="p-3 font-medium">{server.name}</td>
                        <td className="p-3">{server.ipAddress}</td>
                        <td className="p-3">{server.port}</td>
                        <td className="p-3">
                          <Select
                            value={server.role?.toUpperCase() || "WORKER"}
                            onChange={(e) => handleUpdateServerRole(server.id, e.target.value)}
                            className="h-10 text-sm min-w-[120px]"
                            disabled={updatingRoleServerId === server.id}
                          >
                            <option value="MASTER">MASTER</option>
                            <option value="WORKER">WORKER</option>
                            <option value="DOCKER">DOCKER</option>
                            <option value="ANSIBLE">ANSIBLE</option>
                          </Select>
                        </td>
                        <td className="p-3">
                          <Badge variant={server.status === "online" ? "default" : "secondary"}>
                            {server.status}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge variant="default">{server.clusterStatus || "AVAILABLE"}</Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveServer(server.id)}
                              disabled={removingServerId === server.id}
                            >
                              {removingServerId === server.id ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Đang gỡ...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Gỡ
                                </>
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Gán Server vào Cluster */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col" onClose={handleCloseAssignModal}>
          <DialogHeader>
            <DialogTitle>Gán servers vào cluster</DialogTitle>
            <DialogDescription>
              Chọn các servers chưa nằm trong cluster để gán vào cluster. 
              Có thể gán servers với bất kỳ role nào (MASTER, WORKER, DOCKER, ANSIBLE). 
              Vui lòng đảm bảo có ít nhất 1 server với role MASTER.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 flex-1 flex flex-col min-h-0">
            {/* Search trong modal */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm server..."
                value={modalSearchQuery}
                onChange={(e) => setModalSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Danh sách servers chưa trong cluster */}
            <div className="border rounded-lg overflow-hidden flex-1 flex flex-col min-h-0">
              <div className="overflow-y-auto flex-1" style={{ maxHeight: "400px" }}>
                {filteredAvailableServers.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    {serversNotInCluster.length === 0 
                      ? "Không có server nào chưa trong cluster"
                      : "Không tìm thấy server nào"}
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="p-3 text-left w-12">
                          <Checkbox
                            checked={
                              filteredAvailableServers.length > 0 &&
                              filteredAvailableServers.every((s) => selectedServers.has(s.id))
                            }
                            onChange={(e) => handleSelectAllServers(e.target.checked)}
                          />
                        </th>
                        <th className="p-3 text-left">Tên</th>
                        <th className="p-3 text-left">IP Address</th>
                        <th className="p-3 text-left">Port</th>
                        <th className="p-3 text-left">Role</th>
                        <th className="p-3 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAvailableServers.map((server) => {
                        return (
                          <tr
                            key={server.id}
                            className={`border-t hover:bg-muted/50 ${
                              selectedServers.has(server.id) ? "bg-muted/30" : ""
                            }`}
                          >
                            <td className="p-3">
                              <Checkbox
                                checked={selectedServers.has(server.id)}
                                onChange={(e) => handleToggleServer(server.id, e.target.checked)}
                              />
                            </td>
                            <td className="p-3 font-medium">{server.name}</td>
                            <td className="p-3">{server.ipAddress}</td>
                            <td className="p-3">{server.port}</td>
                            <td className="p-3">
                              <Select
                                value={serverRoles[server.id] || server.role?.toUpperCase() || "WORKER"}
                                onChange={(e) => handleRoleChange(server.id, e.target.value)}
                                className="h-10 text-sm min-w-[120px]"
                                disabled={!selectedServers.has(server.id)}
                              >
                                <option value="MASTER">MASTER</option>
                                <option value="WORKER">WORKER</option>
                                <option value="DOCKER">DOCKER</option>
                                <option value="ANSIBLE">ANSIBLE</option>
                              </Select>
                            </td>
                            <td className="p-3">
                              <Badge variant={server.status === "online" ? "default" : "secondary"}>
                                {server.status}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Footer với thông tin và nút */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Đã chọn: {selectedServers.size} server
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleCloseAssignModal}
                  disabled={isAssigning}
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleAssignServers}
                  disabled={isAssigning || selectedServers.size === 0}
                >
                  {isAssigning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang gán...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Gán vào cluster ({selectedServers.size})
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
