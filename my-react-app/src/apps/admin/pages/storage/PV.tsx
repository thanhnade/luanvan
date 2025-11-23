import { useEffect, useState } from "react";
import { ResourceTable } from "../../components/ResourceTable";
import { Badge } from "@/components/ui/badge";
import { adminAPI } from "@/lib/admin-api";
import type { PV } from "@/types/admin";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { toast } from "sonner";

/**
 * Trang quản lý PVs
 */
export function PVList() {
  const [pvs, setPvs] = useState<PV[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPV, setEditingPV] = useState<PV | null>(null);

  useEffect(() => {
    loadPVs();
  }, []);

  const loadPVs = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getPVs();
      setPvs(data);
    } catch (error) {
      toast.error("Không thể tải danh sách PVs");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingPV(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (pv: PV) => {
    setEditingPV(pv);
    setIsDialogOpen(true);
  };

  const handleDelete = async (pv: PV) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa PV "${pv.name}"?`)) return;
    try {
      await adminAPI.deletePV(pv.id);
      toast.success("Xóa PV thành công");
      loadPVs();
    } catch (error) {
      toast.error("Không thể xóa PV");
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
      capacity: formData.get("capacity") as string,
      accessModes,
      reclaimPolicy: (formData.get("reclaimPolicy") as "Retain" | "Delete" | "Recycle") || "Retain",
      status: "available" as const,
      storageClass: formData.get("storageClass") as string,
      volumeAttributesClass: (formData.get("volumeAttributesClass") as string) || "standard",
      reason: (formData.get("reason") as string) || "-",
      volumeMode: (formData.get("volumeMode") as string) || "Filesystem",
    };

    try {
      if (editingPV) {
        await adminAPI.deletePV(editingPV.id);
        await adminAPI.createPV(data);
        toast.success("Cập nhật PV thành công");
      } else {
        await adminAPI.createPV(data);
        toast.success("Tạo PV thành công");
      }
      setIsDialogOpen(false);
      setEditingPV(null);
      loadPVs();
    } catch (error) {
      toast.error("Không thể tạo PV");
    }
  };

  const columns = [
    {
      key: "name",
      label: "NAME",
    },
    {
      key: "capacity",
      label: "CAPACITY",
      align: "center" as const,
    },
    {
      key: "accessModes",
      label: "ACCESS MODES",
      render: (pv: PV) => (
        <div className="text-sm">
          {pv.accessModes.map((mode, i) => (
            <Badge key={i} variant="secondary" className="mr-1 text-xs">
              {mode}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "reclaimPolicy",
      label: "RECLAIM POLICY",
      render: (pv: PV) => (
        <Badge variant="secondary">{pv.reclaimPolicy}</Badge>
      ),
    },
    {
      key: "status",
      label: "STATUS",
      render: (pv: PV) => (
        <Badge
          variant={
            pv.status === "available"
              ? "success"
              : pv.status === "bound"
              ? "secondary"
              : "warning"
          }
        >
          {pv.status}
        </Badge>
      ),
    },
    {
      key: "claim",
      label: "CLAIM",
      render: (pv: PV) =>
        pv.claim ? `${pv.claim.namespace}/${pv.claim.name}` : "-",
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
      render: (pv: PV) => pv.volumeMode || "-",
    },
  ];

  return (
    <>
      <ResourceTable
        title="PV"
        columns={columns}
        data={pvs}
        loading={loading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Tìm kiếm PV..."
      />

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) setEditingPV(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPV ? "Sửa PV" : "Tạo PV mới"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Tên</Label>
              <Input id="name" name="name" defaultValue={editingPV?.name} required />
            </div>
            <div>
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                name="capacity"
                placeholder="50Gi"
                defaultValue={editingPV?.capacity}
                required
              />
            </div>
            <div>
              <Label htmlFor="accessModes">Access Modes (phân cách bằng dấu phẩy)</Label>
              <Input
                id="accessModes"
                name="accessModes"
                placeholder="ReadWriteOnce"
                defaultValue={editingPV?.accessModes.join(", ") ?? "ReadWriteOnce"}
                required
              />
            </div>
            <div>
              <Label htmlFor="reclaimPolicy">Reclaim Policy</Label>
              <Select
                id="reclaimPolicy"
                name="reclaimPolicy"
                defaultValue={editingPV?.reclaimPolicy ?? "Retain"}
                required
              >
                <option value="Retain">Retain</option>
                <option value="Delete">Delete</option>
                <option value="Recycle">Recycle</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="storageClass">Storage Class</Label>
              <Input
                id="storageClass"
                name="storageClass"
                defaultValue={editingPV?.storageClass ?? "standard"}
                required
              />
            </div>
            <div>
              <Label htmlFor="volumeAttributesClass">VolumeAttributesClass</Label>
              <Input
                id="volumeAttributesClass"
                name="volumeAttributesClass"
                placeholder="standard"
                defaultValue={editingPV?.volumeAttributesClass}
              />
            </div>
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                name="reason"
                placeholder="-"
                defaultValue={editingPV?.reason ?? "-"}
              />
            </div>
            <div>
              <Label htmlFor="volumeMode">VolumeMode</Label>
              <Input
                id="volumeMode"
                name="volumeMode"
                placeholder="Filesystem"
                defaultValue={editingPV?.volumeMode ?? "Filesystem"}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingPV(null);
                }}
              >
                Hủy
              </Button>
              <Button type="submit">{editingPV ? "Lưu" : "Tạo"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

