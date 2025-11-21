import { useEffect, useState } from "react";
import { ResourceTable } from "../../components/ResourceTable";
import { Badge } from "@/components/ui/badge";
import { adminAPI } from "@/lib/admin-api";
import type { Pod } from "@/types/admin";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Trang quản lý Pods
 */
type PodFormState = {
  name: string;
  namespace: string;
  readyReady: number;
  readyTotal: number;
  status: Pod["status"];
  restarts: number;
  age: string;
  ip: string;
  node: string;
  nominatedNode: string;
  readinessGates: string;
};

const defaultFormState: PodFormState = {
  name: "",
  namespace: "default",
  readyReady: 1,
  readyTotal: 1,
  status: "running",
  restarts: 0,
  age: "0m",
  ip: "",
  node: "",
  nominatedNode: "",
  readinessGates: "",
};

export function Pods() {
  const [pods, setPods] = useState<Pod[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createMode, setCreateMode] = useState<"yaml" | "form">("yaml");
  const [yamlContent, setYamlContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<PodFormState>(defaultFormState);

  useEffect(() => {
    loadPods();
  }, []);

  const loadPods = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getPods();
      setPods(data);
    } catch (error) {
      toast.error("Không thể tải danh sách pods");
    } finally {
      setLoading(false);
    }
  };

  const resetCreateState = () => {
    setCreateMode("yaml");
    setYamlContent("");
    setFormData(defaultFormState);
  };

  const updateFormField = <K extends keyof PodFormState>(key: K, value: PodFormState[K]) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleDelete = async (pod: Pod) => {
    if (!confirm(`Bạn có chắc muốn xóa pod "${pod.name}"?`)) return;
    try {
      await adminAPI.deletePod(pod.id);
      toast.success("Xóa pod thành công");
      loadPods();
    } catch (error) {
      toast.error("Không thể xóa pod");
    }
  };

  const handleCreatePod = async () => {
    try {
      setIsSubmitting(true);
      if (createMode === "yaml") {
        if (!yamlContent.trim()) {
          toast.error("Vui lòng nhập nội dung YAML");
          return;
        }
        await adminAPI.createPodFromYaml(yamlContent);
      } else {
        const readinessGates = formData.readinessGates
          .split(",")
          .map((gate) => gate.trim())
          .filter(Boolean);

        await adminAPI.createPod({
          name: formData.name || `pod-${Date.now()}`,
          namespace: formData.namespace || "default",
          ready: {
            ready: Number(formData.readyReady) || 0,
            total: Number(formData.readyTotal) || 1,
          },
          node: formData.node || "node-01",
          status: formData.status,
          restarts: Number(formData.restarts) || 0,
          age: formData.age || "0m",
          ip: formData.ip || "-",
          nominatedNode: formData.nominatedNode || undefined,
          readinessGates,
        });
      }
      toast.success("Tạo pod thành công");
      setCreateDialogOpen(false);
      resetCreateState();
      loadPods();
    } catch (error) {
      toast.error("Không thể tạo pod");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusVariant = (status: Pod["status"]) => {
    switch (status) {
      case "running":
        return "success";
      case "pending":
        return "warning";
      case "failed":
        return "destructive";
      case "succeeded":
        return "secondary";
      default:
        return "default";
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
      render: (pod: Pod) => (
        <span>
          {pod.ready.ready}/{pod.ready.total}
        </span>
      ),
    },
    {
      key: "status",
      label: "STATUS",
      align: "center" as const,
      render: (pod: Pod) => (
        <Badge variant={getStatusVariant(pod.status)} className="capitalize">
          {pod.status}
        </Badge>
      ),
    },
    {
      key: "restarts",
      label: "RESTARTS",
      align: "center" as const,
    },
    {
      key: "age",
      label: "AGE",
      align: "center" as const,
    },
    {
      key: "ip",
      label: "IP",
    },
    {
      key: "node",
      label: "NODE",
    },
    {
      key: "nominatedNode",
      label: "NOMINATED NODE",
      render: (pod: Pod) => pod.nominatedNode ?? "-",
    },
    {
      key: "readinessGates",
      label: "READINESS GATES",
      render: (pod: Pod) =>
        pod.readinessGates && pod.readinessGates.length > 0
          ? pod.readinessGates.join(", ")
          : "-",
    },
  ];

  return (
    <>
      <ResourceTable
        title="Pods"
        columns={columns}
        data={pods}
        loading={loading}
        onAdd={() => {
          resetCreateState();
          setCreateDialogOpen(true);
        }}
        onDelete={handleDelete}
        searchPlaceholder="Tìm kiếm pod..."
      />

      <Dialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) {
            resetCreateState();
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Tạo Pod mới</DialogTitle>
          </DialogHeader>

          <Tabs value={createMode} onValueChange={(value) => setCreateMode(value as "yaml" | "form")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="yaml">Tải YAML</TabsTrigger>
              <TabsTrigger value="form">Nhập thông tin</TabsTrigger>
            </TabsList>

            <TabsContent value="yaml" className="space-y-4 pt-4">
              <div className="text-sm text-muted-foreground">
                Dán nội dung YAML Pod của bạn và hệ thống sẽ áp dụng để tạo pod mới.
              </div>
              <Textarea
                placeholder="apiVersion: v1&#10;kind: Pod&#10;metadata:..."
                value={yamlContent}
                onChange={(e) => setYamlContent(e.target.value)}
                className="min-h-[200px]"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleCreatePod} disabled={isSubmitting}>
                  {isSubmitting ? "Đang tạo..." : "Tạo từ YAML"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="form" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pod-name">Tên</Label>
                  <Input
                    id="pod-name"
                    value={formData.name}
                    onChange={(e) => updateFormField("name", e.target.value)}
                    placeholder="pod-example"
                  />
                </div>
                <div>
                  <Label htmlFor="pod-namespace">Namespace</Label>
                  <Input
                    id="pod-namespace"
                    value={formData.namespace}
                    onChange={(e) => updateFormField("namespace", e.target.value)}
                    placeholder="default"
                  />
                </div>
                <div>
                  <Label htmlFor="pod-ready-ready">Ready</Label>
                  <Input
                    id="pod-ready-ready"
                    type="number"
                    min={0}
                    value={formData.readyReady}
                    onChange={(e) => updateFormField("readyReady", Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="pod-ready-total">Total</Label>
                  <Input
                    id="pod-ready-total"
                    type="number"
                    min={1}
                    value={formData.readyTotal}
                    onChange={(e) => updateFormField("readyTotal", Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="pod-status">Status</Label>
                  <select
                    id="pod-status"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.status}
                    onChange={(e) => updateFormField("status", e.target.value as Pod["status"])}
                  >
                    <option value="running">running</option>
                    <option value="pending">pending</option>
                    <option value="failed">failed</option>
                    <option value="succeeded">succeeded</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="pod-restarts">Restarts</Label>
                  <Input
                    id="pod-restarts"
                    type="number"
                    min={0}
                    value={formData.restarts}
                    onChange={(e) => updateFormField("restarts", Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="pod-ip">IP</Label>
                  <Input
                    id="pod-ip"
                    value={formData.ip}
                    onChange={(e) => updateFormField("ip", e.target.value)}
                    placeholder="10.244.0.15"
                  />
                </div>
                <div>
                  <Label htmlFor="pod-node">Node</Label>
                  <Input
                    id="pod-node"
                    value={formData.node}
                    onChange={(e) => updateFormField("node", e.target.value)}
                    placeholder="node-01"
                  />
                </div>
                <div>
                  <Label htmlFor="pod-age">Age</Label>
                  <Input
                    id="pod-age"
                    value={formData.age}
                    onChange={(e) => updateFormField("age", e.target.value)}
                    placeholder="5m"
                  />
                </div>
                <div>
                  <Label htmlFor="pod-nominated-node">Nominated Node</Label>
                  <Input
                    id="pod-nominated-node"
                    value={formData.nominatedNode}
                    onChange={(e) => updateFormField("nominatedNode", e.target.value)}
                    placeholder="-"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="pod-readiness">Readiness Gates (cách nhau bởi dấu phẩy)</Label>
                  <Input
                    id="pod-readiness"
                    value={formData.readinessGates}
                    onChange={(e) => updateFormField("readinessGates", e.target.value)}
                    placeholder="istio.io/gateway-ready"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleCreatePod} disabled={isSubmitting}>
                  {isSubmitting ? "Đang tạo..." : "Tạo Pod"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}

