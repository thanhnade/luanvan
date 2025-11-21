import { useEffect, useState } from "react";
import { ResourceTable } from "../../components/ResourceTable";
import { adminAPI } from "@/lib/admin-api";
import type { Deployment } from "@/types/admin";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

/**
 * Trang quản lý Deployments
 */
export function Deployments() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDeployment, setEditingDeployment] = useState<Deployment | null>(null);
  const [createMode, setCreateMode] = useState<"yaml" | "form">("yaml");
  const [yamlContent, setYamlContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadDeployments();
  }, []);

  const loadDeployments = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getDeployments();
      setDeployments(data);
    } catch (error) {
      toast.error("Không thể tải danh sách deployments");
    } finally {
      setLoading(false);
    }
  };

  const clearDialogState = () => {
    setEditingDeployment(null);
    setCreateMode("yaml");
    setYamlContent("");
    setIsSubmitting(false);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    clearDialogState();
  };

  const handleAdd = () => {
    setEditingDeployment(null);
    setCreateMode("yaml");
    setYamlContent("");
    setIsDialogOpen(true);
  };

  const handleEdit = (deployment: Deployment) => {
    setEditingDeployment(deployment);
    setCreateMode("form");
    setIsDialogOpen(true);
  };

  const handleDelete = async (deployment: Deployment) => {
    if (!confirm(`Bạn có chắc muốn xóa deployment "${deployment.name}"?`)) return;
    try {
      await adminAPI.deleteDeployment(deployment.id);
      toast.success("Xóa deployment thành công");
      loadDeployments();
    } catch (error) {
      toast.error("Không thể xóa deployment");
    }
  };

  const handleYamlCreate = async () => {
    if (!yamlContent.trim()) {
      toast.error("Vui lòng nhập YAML");
      return;
    }
    try {
      setIsSubmitting(true);
      await adminAPI.createDeploymentFromYaml(yamlContent);
      toast.success("Tạo deployment thành công từ YAML");
      closeDialog();
      loadDeployments();
    } catch (error) {
      toast.error("Không thể tạo deployment từ YAML");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const desired = parseInt(formData.get("replicasDesired") as string) || 1;
    const ready = parseInt(formData.get("replicasReady") as string) || 0;
    const updated = parseInt(formData.get("replicasUpdated") as string) || desired;
    const available = parseInt(formData.get("replicasAvailable") as string) || 0;
    const containersInput = (formData.get("containers") as string) || "";
    const imagesInput = (formData.get("images") as string) || "";

    const data = {
      name: formData.get("name") as string,
      namespace: (formData.get("namespace") as string) || "default",
      replicas: {
        desired,
        ready,
        updated,
        available,
      },
      status: editingDeployment?.status ?? "running",
      containers: containersInput
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      images: imagesInput
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      selector: (formData.get("selector") as string) || "",
    };

    try {
      setIsSubmitting(true);
      if (editingDeployment) {
        await adminAPI.updateDeployment(editingDeployment.id, data);
        toast.success("Cập nhật deployment thành công");
      } else {
        await adminAPI.createDeployment(data);
        toast.success("Tạo deployment thành công");
      }
      closeDialog();
      loadDeployments();
    } catch (error) {
      toast.error("Không thể lưu deployment");
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
      key: "ready",
      label: "READY",
      align: "center" as const,
      render: (deployment: Deployment) => (
        <span>
          {deployment.replicas.ready}/{deployment.replicas.desired}
        </span>
      ),
    },
    {
      key: "upToDate",
      label: "UP-TO-DATE",
      align: "center" as const,
      render: (deployment: Deployment) => <span>{deployment.replicas.updated}</span>,
    },
    {
      key: "available",
      label: "AVAILABLE",
      align: "center" as const,
      render: (deployment: Deployment) => <span>{deployment.replicas.available}</span>,
    },
    {
      key: "age",
      label: "AGE",
      align: "center" as const,
    },
    {
      key: "containers",
      label: "CONTAINERS",
      render: (deployment: Deployment) =>
        deployment.containers.length > 0 ? deployment.containers.join(", ") : "-",
    },
    {
      key: "images",
      label: "IMAGES",
      render: (deployment: Deployment) =>
        deployment.images.length > 0 ? deployment.images.join(", ") : "-",
    },
    {
      key: "selector",
      label: "SELECTOR",
    },
  ];

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Tên</Label>
        <Input
          id="name"
          name="name"
          defaultValue={editingDeployment?.name ?? ""}
          required
        />
      </div>
      <div>
        <Label htmlFor="namespace">Namespace</Label>
        <Input
          id="namespace"
          name="namespace"
          defaultValue={editingDeployment?.namespace || "default"}
          required
        />
      </div>
      <div>
        <Label htmlFor="replicasDesired">Replicas (Desired)</Label>
        <Input
          id="replicasDesired"
          name="replicasDesired"
          type="number"
          min="1"
          defaultValue={editingDeployment?.replicas.desired ?? 1}
          required
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label htmlFor="replicasReady">Ready</Label>
          <Input
            id="replicasReady"
            name="replicasReady"
            type="number"
            min="0"
            defaultValue={editingDeployment?.replicas.ready ?? 0}
          />
        </div>
        <div>
          <Label htmlFor="replicasUpdated">Up-to-date</Label>
          <Input
            id="replicasUpdated"
            name="replicasUpdated"
            type="number"
            min="0"
            defaultValue={
              editingDeployment?.replicas.updated ??
              editingDeployment?.replicas.desired ??
              1
            }
          />
        </div>
        <div>
          <Label htmlFor="replicasAvailable">Available</Label>
          <Input
            id="replicasAvailable"
            name="replicasAvailable"
            type="number"
            min="0"
            defaultValue={editingDeployment?.replicas.available ?? 0}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="containers">Containers (comma separated)</Label>
        <Input
          id="containers"
          name="containers"
          placeholder="web, sidecar"
          defaultValue={editingDeployment?.containers.join(", ") ?? ""}
          required
        />
      </div>
      <div>
        <Label htmlFor="images">Images (comma separated)</Label>
        <Input
          id="images"
          name="images"
          placeholder="nginx:1.21, alpine:latest"
          defaultValue={editingDeployment?.images.join(", ") ?? ""}
        />
      </div>
      <div>
        <Label htmlFor="selector">Selector</Label>
        <Input
          id="selector"
          name="selector"
          placeholder="app=my-app"
          defaultValue={editingDeployment?.selector ?? ""}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={closeDialog}
          disabled={isSubmitting}
        >
          Hủy
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Đang lưu..." : editingDeployment ? "Lưu" : "Tạo"}
        </Button>
      </div>
    </form>
  );

  return (
    <>
      <ResourceTable
        title="Deployments"
        columns={columns}
        data={deployments}
        loading={loading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Tìm kiếm deployment..."
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
            <DialogTitle>
              {editingDeployment ? "Sửa Deployment" : "Tạo Deployment mới"}
            </DialogTitle>
          </DialogHeader>
          {editingDeployment ? (
            renderForm()
          ) : (
            <Tabs value={createMode} onValueChange={(value) => setCreateMode(value as "yaml" | "form")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="yaml">Tải YAML</TabsTrigger>
                <TabsTrigger value="form">Nhập thông tin</TabsTrigger>
              </TabsList>
              <TabsContent value="yaml" className="space-y-4 pt-4">
                <div className="text-sm text-muted-foreground">
                  Dán YAML Deployment để hệ thống tạo tự động.
                </div>
                <Textarea
                  placeholder="apiVersion: apps/v1&#10;kind: Deployment&#10;metadata:..."
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

