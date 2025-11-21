import { useEffect, useState } from "react";
import { ResourceTable } from "../../components/ResourceTable";
import { Badge } from "@/components/ui/badge";
import { adminAPI } from "@/lib/admin-api";
import type { Node } from "@/types/admin";
import { toast } from "sonner";

/**
 * Trang quản lý Nodes
 */
export function Nodes() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNodes();
  }, []);

  const loadNodes = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getNodes();
      setNodes(data);
    } catch (error) {
      toast.error("Không thể tải danh sách nodes");
    } finally {
      setLoading(false);
    }
  };

  const handleView = (node: Node) => {
    // TODO: Implement view node details
    toast.info(`Xem chi tiết node: ${node.name}`);
  };

  const columns = [
    {
      key: "name",
      label: "Tên",
    },
    {
      key: "role",
      label: "Role",
      align: "center" as const,
      render: (node: Node) => (
        <Badge variant="secondary" className="text-xs">
          {node.role}
        </Badge>
      ),
    },
    {
      key: "cpu",
      label: "CPU",
      align: "center" as const,
      render: (node: Node) => (
        <span className="text-sm">
          {node.cpu.requested}/{node.cpu.limit} / {node.cpu.capacity}
        </span>
      ),
    },
    {
      key: "memory",
      label: "Memory",
      align: "center" as const,
      render: (node: Node) => (
        <span className="text-sm">
          {node.memory.requested}/{node.memory.limit} / {node.memory.capacity} GB
        </span>
      ),
    },
    {
      key: "disk",
      label: "Disk",
      align: "center" as const,
      render: (node: Node) => (
        <span className="text-sm">
          {node.disk.requested}/{node.disk.limit} / {node.disk.capacity} GB
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      align: "center" as const,
      render: (node: Node) => (
        <Badge variant={node.status === "ready" ? "success" : "destructive"}>
          {node.status === "ready" ? "Ready" : "Not Ready"}
        </Badge>
      ),
    },
  ];

  return (
    <ResourceTable
      title="Nodes"
      columns={columns}
      data={nodes}
      loading={loading}
      searchPlaceholder="Tìm kiếm node..."
      onView={handleView}
    />
  );
}

