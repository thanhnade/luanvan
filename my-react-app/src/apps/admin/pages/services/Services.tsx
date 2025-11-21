import { useEffect, useState } from "react";
import { ResourceTable } from "../../components/ResourceTable";
import { Badge } from "@/components/ui/badge";
import { adminAPI } from "@/lib/admin-api";
import type { Service } from "@/types/admin";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

/**
 * Trang quản lý Services
 */
export function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [createMode, setCreateMode] = useState<"yaml" | "form">("yaml");
  const [yamlContent, setYamlContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getServices();
      setServices(data);
    } catch (error) {
      toast.error("Không thể tải danh sách services");
    } finally {
      setLoading(false);
    }
  };

  const clearDialogState = () => {
    setEditingService(null);
    setCreateMode("yaml");
    setYamlContent("");
    setIsSubmitting(false);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    clearDialogState();
  };

  const handleAdd = () => {
    setEditingService(null);
    setCreateMode("yaml");
    setYamlContent("");
    setIsDialogOpen(true);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setCreateMode("form");
    setIsDialogOpen(true);
  };

  const handleDelete = async (service: Service) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa service "${service.name}"?`)) return;
    try {
      await adminAPI.deleteService(service.id);
      toast.success("Xóa service thành công");
      loadServices();
    } catch (error) {
      toast.error("Không thể xóa service");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const selectorInput = (formData.get("selector") as string) || "";
    const selectorEntries = selectorInput
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((pair) => {
        const [key, value] = pair.split("=").map((part) => part.trim());
        return [key, value] as [string, string];
      })
      .filter(([key, value]) => key && value);

    const data = {
      name: formData.get("name") as string,
      namespace: formData.get("namespace") as string,
      type: (formData.get("type") as "ClusterIP" | "NodePort" | "LoadBalancer") || "ClusterIP",
      clusterIP: formData.get("clusterIP") as string,
      externalIP: (formData.get("externalIP") as string) || "-",
      ports: [
        {
          port: parseInt(formData.get("port") as string) || 80,
          targetPort: parseInt(formData.get("targetPort") as string) || 8080,
          protocol: (formData.get("protocol") as string) || "TCP",
        },
      ],
      selector:
        selectorEntries.length > 0
          ? Object.fromEntries(selectorEntries)
          : editingService?.selector ?? { app: (formData.get("name") as string) || "app" },
    };

    try {
      setIsSubmitting(true);
      if (editingService) {
        await adminAPI.updateService(editingService.id, data);
        toast.success("Cập nhật service thành công");
      } else {
        await adminAPI.createService(data);
        toast.success("Tạo service thành công");
      }
      closeDialog();
      loadServices();
    } catch (error) {
      toast.error("Không thể lưu service");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleYamlCreate = async () => {
    if (!yamlContent.trim()) {
      toast.error("Vui lòng nhập YAML");
      return;
    }
    try {
      setIsSubmitting(true);
      await adminAPI.createServiceFromYaml(yamlContent);
      toast.success("Tạo service từ YAML thành công");
      closeDialog();
      loadServices();
    } catch (error) {
      toast.error("Không thể tạo service từ YAML");
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
      key: "type",
      label: "TYPE",
      align: "center" as const,
      render: (service: Service) => (
        <Badge variant="secondary">{service.type}</Badge>
      ),
    },
    {
      key: "clusterIP",
      label: "CLUSTER-IP",
      align: "center" as const,
    },
    {
      key: "externalIP",
      label: "EXTERNAL-IP",
      align: "center" as const,
      render: (service: Service) => service.externalIP || "-",
    },
    {
      key: "ports",
      label: "PORT(S)",
      render: (service: Service) => (
        <div className="text-sm">
          {service.ports.map((p, i) => (
            <span key={i}>
              {p.port}:{p.targetPort}/{p.protocol}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "age",
      label: "AGE",
      align: "center" as const,
    },
    {
      key: "selector",
      label: "SELECTOR",
      render: (service: Service) =>
        service.selector
          ? Object.entries(service.selector)
              .map(([k, v]) => `${k}=${v}`)
              .join(", ")
          : "-",
    },
  ];

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Tên</Label>
        <Input id="name" name="name" defaultValue={editingService?.name ?? ""} required />
      </div>
      <div>
        <Label htmlFor="namespace">Namespace</Label>
        <Input
          id="namespace"
          name="namespace"
          defaultValue={editingService?.namespace ?? "default"}
          required
        />
      </div>
      <div>
        <Label htmlFor="type">Type</Label>
        <Select
          id="type"
          name="type"
          defaultValue={editingService?.type ?? "ClusterIP"}
          required
        >
          <option value="ClusterIP">ClusterIP</option>
          <option value="NodePort">NodePort</option>
          <option value="LoadBalancer">LoadBalancer</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="clusterIP">Cluster IP</Label>
        <Input
          id="clusterIP"
          name="clusterIP"
          placeholder="10.96.0.1"
          defaultValue={editingService?.clusterIP ?? ""}
          required
        />
      </div>
      <div>
        <Label htmlFor="externalIP">External IP</Label>
        <Input
          id="externalIP"
          name="externalIP"
          placeholder="-"
          defaultValue={editingService?.externalIP ?? "-"}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="port">Port</Label>
          <Input
            id="port"
            name="port"
            type="number"
            defaultValue={editingService?.ports[0]?.port ?? 80}
            required
          />
        </div>
        <div>
          <Label htmlFor="targetPort">Target Port</Label>
          <Input
            id="targetPort"
            name="targetPort"
            type="number"
            defaultValue={editingService?.ports[0]?.targetPort ?? 8080}
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="protocol">Protocol</Label>
        <Select
          id="protocol"
          name="protocol"
          defaultValue={editingService?.ports[0]?.protocol ?? "TCP"}
          required
        >
          <option value="TCP">TCP</option>
          <option value="UDP">UDP</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="selector">Selector (key=value, phân cách bởi dấu phẩy)</Label>
        <Input
          id="selector"
          name="selector"
          placeholder="app=my-app, tier=backend"
          defaultValue={
            editingService?.selector
              ? Object.entries(editingService.selector)
                  .map(([k, v]) => `${k}=${v}`)
                  .join(", ")
              : ""
          }
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
          {isSubmitting ? "Đang lưu..." : editingService ? "Lưu" : "Tạo"}
        </Button>
      </div>
    </form>
  );

  return (
    <>
      <ResourceTable
        title="Services"
        columns={columns}
        data={services}
        loading={loading}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Tìm kiếm service..."
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
            <DialogTitle>{editingService ? "Sửa Service" : "Tạo Service mới"}</DialogTitle>
          </DialogHeader>
          {editingService ? (
            renderForm()
          ) : (
            <Tabs value={createMode} onValueChange={(value) => setCreateMode(value as "yaml" | "form")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="yaml">Tải YAML</TabsTrigger>
                <TabsTrigger value="form">Nhập thông tin</TabsTrigger>
              </TabsList>
              <TabsContent value="yaml" className="space-y-4 pt-4">
                <div className="text-sm text-muted-foreground">
                  Dán YAML Service để hệ thống tạo tự động.
                </div>
                <Textarea
                  placeholder="apiVersion: v1&#10;kind: Service&#10;metadata:..."
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

