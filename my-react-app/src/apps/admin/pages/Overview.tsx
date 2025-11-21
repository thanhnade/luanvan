import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { adminAPI } from "@/lib/admin-api";
import type { DashboardMetrics } from "@/types/admin";
import { Server, Container, Layers, Cpu, HardDrive, TrendingUp } from "lucide-react";

/**
 * Trang Dashboard/Overview cho Admin
 * Hiển thị metrics tổng quan và biểu đồ
 */
export function Overview() {
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
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-20" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return <div>Không thể tải dữ liệu</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Tổng quan về infrastructure và cluster
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Nodes Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nodes</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.nodes.total}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="success" className="text-xs">
                {metrics.nodes.healthy} Healthy
              </Badge>
              {metrics.nodes.unhealthy > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {metrics.nodes.unhealthy} Unhealthy
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pods Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pods</CardTitle>
            <Container className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pods.total}</div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="success" className="text-xs">
                {metrics.pods.running} Running
              </Badge>
              {metrics.pods.pending > 0 && (
                <Badge variant="warning" className="text-xs">
                  {metrics.pods.pending} Pending
                </Badge>
              )}
              {metrics.pods.failed > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {metrics.pods.failed} Failed
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Deployments Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deployments</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.deployments.total}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="success" className="text-xs">
                {metrics.deployments.active} Active
              </Badge>
              {metrics.deployments.error > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {metrics.deployments.error} Error
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* CPU Usage Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.cpuUsage.used}%
            </div>
            <div className="mt-2">
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${metrics.cpuUsage.used}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.cpuUsage.used} / {metrics.cpuUsage.total} cores
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resource Usage Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Memory Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Used</span>
                <span className="text-sm font-medium">
                  {metrics.memoryUsage.used} / {metrics.memoryUsage.total} GB
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-4">
                <div
                  className="bg-primary h-4 rounded-full transition-all flex items-center justify-end pr-2"
                  style={{
                    width: `${(metrics.memoryUsage.used / metrics.memoryUsage.total) * 100}%`,
                  }}
                >
                  <span className="text-xs text-primary-foreground font-medium">
                    {Math.round((metrics.memoryUsage.used / metrics.memoryUsage.total) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Namespaces</span>
                <span className="text-sm font-medium">-</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Services</span>
                <span className="text-sm font-medium">-</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Ingress</span>
                <span className="text-sm font-medium">-</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

