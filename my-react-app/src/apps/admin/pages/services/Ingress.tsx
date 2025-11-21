import { useEffect, useState } from "react";
import { ResourceTable } from "../../components/ResourceTable";
import { adminAPI } from "@/lib/admin-api";
import type { Ingress } from "@/types/admin";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

/**
 * Trang quản lý Ingress
 */
export function IngressList() {
  const [ingress, setIngress] = useState<Ingress[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIngress, setEditingIngress] = useState<Ingress | null>(null);

  useEffect(() => {
    loadIngress();
  }, []);

  const loadIngress = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getIngress();
      setIngress(data);
    } catch (error) {
      toast.error("Không thể tải danh sách ingress");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingIngress(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (ing: Ingress) => {
    setEditingIngress(ing);
    setIsDialogOpen(true);
  };

  const handleDelete = async (ing: Ingress) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa ingress "${ing.name}"?`)) return;
    try {
      await adminAPI.deleteIngress(ing.id);
      toast.success("Xóa ingress thành công");
      loadIngress();
    } catch (error) {
      toast.error("Không thể xóa ingress");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const hosts = (formData.get("hosts") as string)
      .split(",")
      .map((h) => h.trim())
      .filter(Boolean);
    const portsInput = (formData.get("ports") as string) || "80,443";
    const ports = portsInput
      .split(",")
      .map((p) => parseInt(p.trim(), 10))
      .filter((p) => !Number.isNaN(p));
    const data = {
      name: formData.get("name") as string,
      namespace: formData.get("namespace") as string,
      ingressClass: (formData.get("ingressClass") as string) || "nginx",
      hosts,
      address: formData.get("address") as string,
      ports: ports.length > 0 ? ports : [80, 443],
    };

    try {
      if (editingIngress) {
        await adminAPI.createIngress({ ...editingIngress, ...data });
        toast.success("Cập nhật ingress thành công");
      } else {
        await adminAPI.createIngress(data);
        toast.success("Tạo ingress thành công");
      }
      setIsDialogOpen(false);
      setEditingIngress(null);
      loadIngress();
    } catch (error) {
      toast.error("Không thể lưu ingress");
    }
  };

  const columns = [
    {
      key: "name",
      label: "NAME",
    },
    {
      key: "ingressClass",
      label: "CLASS",
      render: (ing: Ingress) => ing.ingressClass || "-",
    },
    {
      key: "hosts",
      label: "HOSTS",
      render: (ing: Ingress) => (
        <div className="text-sm">
          {ing.hosts.map((host, i) => (
            <span key={i} className="mr-2">
              {host}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "address",
      label: "ADDRESS",
      render: (ing: Ingress) => ing.address || "-",
    },
    {
      key: "ports",
      label: "PORTS",
      render: (ing: Ingress) => ing.ports.join(", "),
    },
    {
      key: "age",
      label: "AGE",
    },
  ];

  return (
    <>
      <ResourceTable
        title="Ingress"
        columns={columns}
        data={ingress}
        loading={loading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Tìm kiếm ingress..."
      />

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) setEditingIngress(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingIngress ? "Sửa Ingress" : "Tạo Ingress mới"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Tên</Label>
              <Input id="name" name="name" defaultValue={editingIngress?.name} required />
            </div>
            <div>
              <Label htmlFor="namespace">Namespace</Label>
              <Input
                id="namespace"
                name="namespace"
                defaultValue={editingIngress?.namespace ?? "default"}
                required
              />
            </div>
            <div>
              <Label htmlFor="ingressClass">Ingress Class</Label>
              <Input
                id="ingressClass"
                name="ingressClass"
                placeholder="nginx"
                defaultValue={editingIngress?.ingressClass ?? "nginx"}
              />
            </div>
            <div>
              <Label htmlFor="hosts">Hosts (phân cách bằng dấu phẩy)</Label>
              <Input
                id="hosts"
                name="hosts"
                placeholder="example.com, www.example.com"
                defaultValue={editingIngress?.hosts.join(", ")}
                required
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                placeholder="192.168.1.100"
                defaultValue={editingIngress?.address ?? ""}
              />
            </div>
            <div>
              <Label htmlFor="ports">Ports (phân cách bằng dấu phẩy)</Label>
              <Input
                id="ports"
                name="ports"
                placeholder="80,443"
                defaultValue={editingIngress?.ports.join(", ") ?? "80,443"}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingIngress(null);
                }}
              >
                Hủy
              </Button>
              <Button type="submit">{editingIngress ? "Lưu" : "Tạo"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

