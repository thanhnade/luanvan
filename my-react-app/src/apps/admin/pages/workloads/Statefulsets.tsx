import { useEffect, useState } from "react";
import { ResourceTable } from "../../components/ResourceTable";
import { adminAPI } from "@/lib/admin-api";
import type { Statefulset } from "@/types/admin";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

/**
 * Trang quản lý Statefulsets
 */
export function Statefulsets() {
  const [statefulsets, setStatefulsets] = useState<Statefulset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStatefulset, setEditingStatefulset] = useState<Statefulset | null>(null);
  const [createMode, setCreateMode] = useState<"yaml" | "form">("yaml");
  const [yamlContent, setYamlContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadStatefulsets();
  }, []);

  const loadStatefulsets = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getStatefulsets();
      setStatefulsets(data);
    } catch (error) {
      toast.error("Không thể tải danh sách statefulsets");
    } finally {
      setLoading(false);
    }
  };

  const clearDialogState = () => {
    setEditingStatefulset(null);
    setCreateMode("yaml");
    setYamlContent("");
    setIsSubmitting(false);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    clearDialogState();
  };

  const handleAdd = () => {
    setCreateMode("yaml");
    setYamlContent("");
    setEditingStatefulset(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (sts: Statefulset) => {
    setEditingStatefulset(sts);
    setCreateMode("form");
    setIsDialogOpen(true);
  };

  const handleDelete = async (sts: Statefulset) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa statefulset "${sts.name}"?`)) return;
    try {
      await adminAPI.deleteStatefulset(sts.id);
      toast.success("Xóa statefulset thành công");
      loadStatefulsets();
    } catch (error) {
      toast.error("Không thể xóa statefulset");
    }
  };

  const handleYamlCreate = async () => {
    if (!yamlContent.trim()) {
      toast.error("Vui lòng nhập YAML");
      return;
    }
    try {
      setIsSubmitting(true);
      await adminAPI.createStatefulsetFromYaml(yamlContent);
      toast.success("Tạo statefulset thành công từ YAML");
      closeDialog();
      loadStatefulsets();
    } catch (error) {
      toast.error("Không thể tạo statefulset từ YAML");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const containersInput = (formData.get("containers") as string) || "";
    const imagesInput = (formData.get("images") as string) || "";
    const data = {
      name: formData.get("name") as string,
      namespace: formData.get("namespace") as string,
      replicas: {
        desired: parseInt(formData.get("replicas") as string) || 1,
        ready: editingStatefulset?.replicas.ready ?? 0,
      },
      status: (formData.get("status") as "running" | "error") || "running",
      service: formData.get("service") as string,
      containers: containersInput
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      images: imagesInput
        .split(",")
        .map((img) => img.trim())
        .filter(Boolean),
    };

    try {
      setIsSubmitting(true);
      if (editingStatefulset) {
        await adminAPI.updateStatefulset(editingStatefulset.id, data);
        toast.success("Cập nhật statefulset thành công");
      } else {
        await adminAPI.createStatefulset(data);
        toast.success("Tạo statefulset thành công");
      }
      closeDialog();
      loadStatefulsets();
    } catch (error) {
      toast.error("Không thể lưu statefulset");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      key: "name",
      label: "NAME",
    },
    {
      key: "replicas",
      label: "READY",
      align: "center" as const,
      render: (sts: Statefulset) => (
        <span>
          {sts.replicas.ready} / {sts.replicas.desired}
        </span>
      ),
    },
    {
      key: "age",
      label: "AGE",
      align: "center" as const,
    },
    {
      key: "containers",
      label: "CONTAINERS",
      render: (sts: Statefulset) =>
        sts.containers.length > 0 ? sts.containers.join(", ") : "-",
    },
    {
      key: "images",
      label: "IMAGES",
      render: (sts: Statefulset) =>
        sts.images.length > 0 ? sts.images.join(", ") : "-",
    },
  ];

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Tên</Label>
        <Input id="name" name="name" defaultValue={editingStatefulset?.name ?? ""} required />
      </div>
      <div>
        <Label htmlFor="namespace">Namespace</Label>
        <Input
          id="namespace"
          name="namespace"
          defaultValue={editingStatefulset?.namespace ?? "default"}
          required
        />
      </div>
      <div>
        <Label htmlFor="replicas">Replicas</Label>
        <Input
          id="replicas"
          name="replicas"
          type="number"
          min="1"
          defaultValue={editingStatefulset?.replicas.desired ?? 1}
          required
        />
      </div>
      <div>
        <Label htmlFor="service">Service</Label>
        <Input
          id="service"
          name="service"
          defaultValue={editingStatefulset?.service ?? ""}
          required
        />
      </div>
      <div>
        <Label htmlFor="containers">Containers (phân cách bằng dấu phẩy)</Label>
        <Input
          id="containers"
          name="containers"
          placeholder="mysql, backup"
          defaultValue={editingStatefulset?.containers.join(", ") ?? ""}
          required
        />
      </div>
      <div>
        <Label htmlFor="images">Images (phân cách bằng dấu phẩy)</Label>
        <Input
          id="images"
          name="images"
          placeholder="mysql:8.0, alpine:3.18"
          defaultValue={editingStatefulset?.images.join(", ") ?? ""}
          required
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" type="button" onClick={closeDialog} disabled={isSubmitting}>
          Hủy
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Đang lưu..." : editingStatefulset ? "Lưu" : "Tạo"}
        </Button>
      </div>
    </form>
  );

  return (
    <>
      <ResourceTable
        title="Statefulsets"
        columns={columns}
        data={statefulsets}
        loading={loading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Tìm kiếm statefulset..."
      />

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            clearDialogState();
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingStatefulset ? "Sửa Statefulset" : "Tạo Statefulset mới"}</DialogTitle>
          </DialogHeader>
          {editingStatefulset ? (
            renderForm()
          ) : (
            <Tabs value={createMode} onValueChange={(value) => setCreateMode(value as "yaml" | "form")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="yaml">Tải YAML</TabsTrigger>
                <TabsTrigger value="form">Nhập thông tin</TabsTrigger>
              </TabsList>
              <TabsContent value="yaml" className="space-y-4 pt-4">
                <div className="text-sm text-muted-foreground">
                  Dán YAML Statefulset để hệ thống tạo tự động.
                </div>
                <Textarea
                  placeholder="apiVersion: apps/v1&#10;kind: StatefulSet&#10;metadata:..."
                  className="min-h-[220px]"
                  value={yamlContent}
                  onChange={(e) => setYamlContent(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={closeDialog} disabled={isSubmitting}>
                    Hủy
                  </Button>
                  <Button onClick={handleYamlCreate} disabled={isSubmitting}>
                    {isSubmitting ? "Đang tạo..." : "Tạo từ YAML"}
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="form" className="pt-4">
                {renderForm()}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

