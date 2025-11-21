import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminAPI } from "@/lib/admin-api";
import type { DashboardMetrics } from "@/types/admin";
import { Server, Container, Layers } from "lucide-react";

/**
 * Trang Cluster Overview - tương tự Dashboard nhưng tập trung vào cluster
 */
export function ClusterOverview() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getDashboardMetrics();
      setMetrics(data);
    } catch (error) {
      console.error("Failed to load metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse">Đang tải...</div>;
  }

  if (!metrics) {
    return <div>Không thể tải dữ liệu</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cluster Overview</h1>
        <p className="text-muted-foreground mt-1">
          Tổng quan về cluster và resources
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nodes</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.nodes.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.nodes.healthy} healthy, {metrics.nodes.unhealthy} unhealthy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pods</CardTitle>
            <Container className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pods.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.pods.running} running, {metrics.pods.pending} pending, {metrics.pods.failed} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deployments</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.deployments.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.deployments.active} active, {metrics.deployments.error} error
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

