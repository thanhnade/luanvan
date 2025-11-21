import { useEffect, useState } from "react";
import { ResourceTable } from "../../components/ResourceTable";
import { Badge } from "@/components/ui/badge";
import { adminAPI } from "@/lib/admin-api";
import type { Namespace } from "@/types/admin";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

/**
 * Trang quản lý Namespaces
 */
export function Namespaces() {
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadNamespaces();
  }, []);

  const loadNamespaces = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getNamespaces();
      setNamespaces(data);
    } catch (error) {
      toast.error("Không thể tải danh sách namespaces");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      status: "active" as const,
      labels: {},
    };

    try {
      await adminAPI.createNamespace(data);
      toast.success("Tạo namespace thành công");
      setIsDialogOpen(false);
      loadNamespaces();
    } catch (error) {
      toast.error("Không thể tạo namespace");
    }
  };

  const handleDelete = async (namespace: Namespace) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa namespace "${namespace.name}"?`)) {
      return;
    }

    try {
      await adminAPI.deleteNamespace(namespace.id);
      toast.success("Xóa namespace thành công");
      loadNamespaces();
    } catch (error) {
      toast.error("Không thể xóa namespace");
    }
  };

  const columns = [
    {
      key: "name",
      label: "Tên",
    },
    {
      key: "status",
      label: "Status",
      align: "center" as const,
      render: (ns: Namespace) => (
        <Badge variant={ns.status === "active" ? "success" : "warning"}>
          {ns.status === "active" ? "Active" : "Terminating"}
        </Badge>
      ),
    },
    {
      key: "age",
      label: "Age",
      align: "center" as const,
    },
  ];

  return (
    <>
      <ResourceTable
        title="Namespaces"
        columns={columns}
        data={namespaces}
        loading={loading}
        onAdd={handleAdd}
        onDelete={handleDelete}
        searchPlaceholder="Tìm kiếm namespace..."
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg w-[480px] max-h-[70vh]">
          <DialogHeader>
            <DialogTitle>Tạo Namespace mới</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Tên</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit">Tạo</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

