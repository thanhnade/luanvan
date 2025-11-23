import { useEffect, useState } from "react";
import { ResourceTable } from "../../components/ResourceTable";
import { Badge } from "@/components/ui/badge";
import { adminAPI } from "@/lib/admin-api";
import type { PVC } from "@/types/admin";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

/**
 * Trang quản lý PVCs
 */
export function PVCList() {
  const [pvcs, setPvcs] = useState<PVC[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPVC, setEditingPVC] = useState<PVC | null>(null);

  useEffect(() => {
    loadPVCs();
  }, []);

  const loadPVCs = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getPVCs();
      setPvcs(data);
    } catch (error) {
      toast.error("Không thể tải danh sách PVCs");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingPVC(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (pvc: PVC) => {
    setEditingPVC(pvc);
    setIsDialogOpen(true);
  };

  const handleDelete = async (pvc: PVC) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa PVC "${pvc.name}"?`)) return;
    try {
      await adminAPI.deletePVC(pvc.id);
      toast.success("Xóa PVC thành công");
      loadPVCs();
    } catch (error) {
      toast.error("Không thể xóa PVC");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const accessModes = (formData.get("accessModes") as string)
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);
    const data = {
      name: formData.get("name") as string,
      namespace: formData.get("namespace") as string,
      status: "pending" as const,
      capacity: formData.get("capacity") as string,
      accessModes,
      storageClass: formData.get("storageClass") as string,
      volumeAttributesClass: (formData.get("volumeAttributesClass") as string) || "standard",
      volumeMode: (formData.get("volumeMode") as string) || "Filesystem",
    };

    try {
      if (editingPVC) {
        await adminAPI.deletePVC(editingPVC.id);
        await adminAPI.createPVC(data);
        toast.success("Cập nhật PVC thành công");
      } else {
        await adminAPI.createPVC(data);
        toast.success("Tạo PVC thành công");
      }
      setIsDialogOpen(false);
      setEditingPVC(null);
      loadPVCs();
    } catch (error) {
      toast.error("Không thể tạo PVC");
    }
  };

  const columns = [
    {
      key: "name",
      label: "NAME",
    },
    {
      key: "status",
      label: "STATUS",
      align: "center" as const,
      render: (pvc: PVC) => (
        <Badge variant={pvc.status === "bound" ? "success" : "warning"}>
          {pvc.status === "bound" ? "Bound" : "Pending"}
        </Badge>
      ),
    },
    {
      key: "volume",
      label: "VOLUME",
      render: (pvc: PVC) => pvc.volume || "-",
    },
    {
      key: "capacity",
      label: "CAPACITY",
      align: "center" as const,
    },
    {
      key: "accessModes",
      label: "ACCESS MODES",
      render: (pvc: PVC) => (
        <div className="text-sm">
          {pvc.accessModes.map((mode, i) => (
            <Badge key={i} variant="secondary" className="mr-1 text-xs">
              {mode}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "storageClass",
      label: "STORAGECLASS",
    },
    {
      key: "age",
      label: "AGE",
    },
    {
      key: "volumeMode",
      label: "VOLUMEMODE",
      render: (pvc: PVC) => pvc.volumeMode || "-",
    },
  ];

  return (
    <>
      <ResourceTable
        title="PVC"
        columns={columns}
        data={pvcs}
        loading={loading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Tìm kiếm PVC..."
      />

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingPVC(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPVC ? "Sửa PVC" : "Tạo PVC mới"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Tên</Label>
              <Input id="name" name="name" defaultValue={editingPVC?.name} required />
            </div>
            <div>
              <Label htmlFor="namespace">Namespace</Label>
              <Input
                id="namespace"
                name="namespace"
                defaultValue={editingPVC?.namespace ?? "default"}
                required
              />
            </div>
            <div>
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                name="capacity"
                placeholder="20Gi"
                defaultValue={editingPVC?.capacity}
                required
              />
            </div>
            <div>
              <Label htmlFor="accessModes">Access Modes (phân cách bằng dấu phẩy)</Label>
              <Input
                id="accessModes"
                name="accessModes"
                placeholder="ReadWriteOnce"
                defaultValue={editingPVC?.accessModes.join(", ") ?? "ReadWriteOnce"}
                required
              />
            </div>
            <div>
              <Label htmlFor="storageClass">Storage Class</Label>
              <Input
                id="storageClass"
                name="storageClass"
                defaultValue={editingPVC?.storageClass ?? "standard"}
                required
              />
            </div>
            <div>
              <Label htmlFor="volumeAttributesClass">VolumeAttributesClass</Label>
              <Input
                id="volumeAttributesClass"
                name="volumeAttributesClass"
                placeholder="standard"
                defaultValue={editingPVC?.volumeAttributesClass}
              />
            </div>
            <div>
              <Label htmlFor="volumeMode">VolumeMode</Label>
              <Input
                id="volumeMode"
                name="volumeMode"
                placeholder="Filesystem"
                defaultValue={editingPVC?.volumeMode ?? "Filesystem"}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingPVC(null);
                }}
              >
                Hủy
              </Button>
              <Button type="submit">{editingPVC ? "Lưu" : "Tạo"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

