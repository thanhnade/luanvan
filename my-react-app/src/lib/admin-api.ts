/**
 * Mock API cho Admin Dashboard
 */

import api from "@/services/api";

/**
 * Parse giá trị từ string có đơn vị (ví dụ: "8.0Gi", "50.0Gi") và trả về số GiB
 * Backend trả về GiB, frontend chỉ cần parse và hiển thị
 */
function parseSizeToGiB(value: string | null | undefined): number {
  if (!value) return 0;
  
  const cleaned = value.trim();
  
  // Kiểm tra nếu có đơn vị GiB
  if (cleaned.endsWith("Gi") || cleaned.endsWith("GiB")) {
    const num = parseFloat(cleaned.replace(/[^0-9.]/g, ""));
    if (isNaN(num)) return 0;
    return num; // Đã là GiB, không cần convert
  }
  
  // Kiểm tra nếu có đơn vị GB (fallback - không nên xảy ra)
  if (cleaned.endsWith("G") || cleaned.endsWith("GB")) {
    const num = parseFloat(cleaned.replace(/[^0-9.]/g, ""));
    if (isNaN(num)) return 0;
    // Convert GB sang GiB: GB * 1000^3 / 1024^3 = GB * 0.9313225746154785
    return num * 0.9313225746154785;
  }
  
  // Nếu không có đơn vị, giả sử đã là GiB
  const num = parseFloat(cleaned.replace(/[^0-9.]/g, ""));
  return isNaN(num) ? 0 : num;
}

import type {
  Server,
  Cluster,
  Node,
  Namespace,
  Deployment,
  Pod,
  Statefulset,
  Service,
  Ingress,
  PVC,
  PV,
  DashboardMetrics,
  AdminUser,
  AdminUserProject,
  AdminProjectDetail,
  AdminAccount,
  AdminOverviewResponse,
  AdminUserUsageResponse,
  ClusterCapacityResponse,
  ClusterAllocatableResponse,
  AdminUserProjectSummaryResponse,
  AdminUserProjectListResponse,
  AdminProjectResourceDetailResponse,
  AdminDatabaseDetailResponse,
  AdminBackendDetailResponse,
  AdminFrontendDetailResponse,
} from "@/types/admin";

// Mock data - Tạo nhiều server để test
const mockServers: Server[] = Array.from({ length: 25 }, (_, i) => {
  const index = i + 1;
  return {
    id: String(index),
    name: `server-${String(index).padStart(2, "0")}`,
    ipAddress: `192.168.1.${10 + i}`,
    port: 22,
    status: i % 5 === 0 ? "offline" : "online",
    cpu: { 
      used: Math.floor(Math.random() * 50) + 10, 
      total: 100 
    },
    memory: { 
      used: Math.floor(Math.random() * 60) + 20, 
      total: 128 
    },
    disk: { 
      used: Math.floor(Math.random() * 300) + 100, 
      total: 500 
    },
    os: i % 3 === 0 ? "Ubuntu 22.04" : i % 3 === 1 ? "Ubuntu 20.04" : "CentOS 8",
    updatedAt: new Date().toISOString(),
  };
});

// Chỉ quản lý 1 cluster duy nhất
let currentCluster: Cluster | null = null;

const mockNodes: Node[] = [
  {
    id: "1",
    name: "node-01",
    status: "ready",
    role: "master",
    cpu: { requested: 20, limit: 50, capacity: 100 },
    memory: { requested: 32, limit: 64, capacity: 128 },
    disk: { requested: 100, limit: 200, capacity: 500 },
    podCount: 12,
    os: "linux",
    kernel: "5.15.0",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "node-02",
    status: "ready",
    role: "worker",
    cpu: { requested: 15, limit: 40, capacity: 100 },
    memory: { requested: 24, limit: 48, capacity: 128 },
    disk: { requested: 80, limit: 150, capacity: 500 },
    podCount: 8,
    os: "linux",
    kernel: "5.15.0",
    updatedAt: new Date().toISOString(),
  },
];

const mockNamespaces: Namespace[] = [
  {
    id: "1",
    name: "default",
    status: "active",
    labels: { "kubernetes.io/metadata.name": "default" },
    resourceQuota: {
      cpu: { limit: 100, used: 45 },
      memory: { limit: 200, used: 80 },
    },
    age: "30d",
  },
  {
    id: "2",
    name: "kube-system",
    status: "active",
    labels: { "kubernetes.io/metadata.name": "kube-system" },
    resourceQuota: {
      cpu: { limit: 50, used: 20 },
      memory: { limit: 100, used: 40 },
    },
    age: "30d",
  },
];

const mockDeployments: Deployment[] = [
  {
    id: "1",
    name: "nginx-deployment",
    namespace: "default",
    replicas: { desired: 3, ready: 3, updated: 3, available: 3 },
    status: "running",
    containers: ["nginx"],
    images: ["nginx:1.21"],
    selector: "app=nginx",
    age: "5d",
  },
  {
    id: "2",
    name: "api-deployment",
    namespace: "default",
    replicas: { desired: 4, ready: 2, updated: 3, available: 2 },
    status: "error",
    containers: ["api", "sidecar"],
    images: ["api:latest", "logging-sidecar:1.0"],
    selector: "app=api",
    age: "2d",
  },
];

const mockPods: Pod[] = [
  {
    id: "1",
    name: "nginx-deployment-abc123",
    namespace: "default",
    ready: { ready: 1, total: 1 },
    node: "node-01",
    status: "running",
    restarts: 0,
    ip: "10.244.0.12",
    nominatedNode: "-",
    readinessGates: [],
    age: "5d",
  },
  {
    id: "2",
    name: "api-deployment-xyz789",
    namespace: "default",
    ready: { ready: 1, total: 2 },
    node: "node-02",
    status: "failed",
    restarts: 3,
    ip: "10.244.0.34",
    nominatedNode: "node-03",
    readinessGates: ["istio.io/gateway-ready"],
    age: "2d",
  },
];

function createPodEntry(data: Omit<Pod, "id">): Pod {
  return {
    ...data,
    id: String(mockPods.length + 1),
  };
}

function extractYamlValue(yaml: string, regex: RegExp, fallback = ""): string {
  const match = yaml.match(regex);
  return match ? match[1].trim() : fallback;
}

function extractYamlList(yaml: string, regex: RegExp): string[] {
  return Array.from(yaml.matchAll(regex)).map((match) => match[1].trim());
}

const mockStatefulsets: Statefulset[] = [
  {
    id: "1",
    name: "mysql-statefulset",
    namespace: "default",
    replicas: { desired: 3, ready: 3 },
    status: "running",
    service: "mysql-service",
    containers: ["mysql"],
    images: ["mysql:8.0"],
    age: "10d",
  },
];

const mockServices: Service[] = [
  {
    id: "1",
    name: "nginx-service",
    namespace: "default",
    type: "ClusterIP",
    clusterIP: "10.96.0.1",
    externalIP: "-",
    ports: [{ port: 80, targetPort: 8080, protocol: "TCP" }],
    selector: { app: "nginx" },
    age: "5d",
  },
];

const mockIngress: Ingress[] = [
  {
    id: "1",
    name: "nginx-ingress",
    namespace: "default",
    ingressClass: "nginx",
    hosts: ["example.com", "www.example.com"],
    address: "192.168.1.100",
    ports: [80, 443],
    age: "5d",
  },
];

const mockPVCs: PVC[] = [
  {
    id: "1",
    name: "mysql-pvc",
    namespace: "default",
    status: "bound",
    volume: "pvc-abc123",
    capacity: "20Gi",
    accessModes: ["ReadWriteOnce"],
    storageClass: "standard",
    volumeAttributesClass: "fast",
    volumeMode: "Filesystem",
    age: "10d",
  },
];

const mockPVs: PV[] = [
  {
    id: "1",
    name: "pv-001",
    capacity: "50Gi",
    accessModes: ["ReadWriteOnce"],
    reclaimPolicy: "Retain",
    status: "bound",
    storageClass: "standard",
    claim: { namespace: "default", name: "mysql-pvc" },
    volumeAttributesClass: "fast",
    reason: "-",
    volumeMode: "Filesystem",
    age: "10d",
  },
];

const mockAdminUsers: AdminUser[] = [
  {
    id: "user-1",
    name: "Nguyễn Văn An",
    username: "an.nguyen",
    tier: "premium",
    email: "an@example.com",
    projectCount: 2,
    cpuUsage: { used: 60, total: 160 },
    memoryUsage: { used: 96, total: 256 },
  },
  {
    id: "user-2",
    name: "Trần Thị Bình",
    username: "binh.tran",
    tier: "standard",
    email: "binh@example.com",
    projectCount: 1,
    cpuUsage: { used: 35, total: 120 },
    memoryUsage: { used: 72, total: 192 },
  },
  {
    id: "user-3",
    name: "Lê Hoàng",
    username: "hoang.le",
    tier: "premium",
    email: "hoang@example.com",
    projectCount: 3,
    cpuUsage: { used: 90, total: 200 },
    memoryUsage: { used: 140, total: 320 },
  },
  {
    id: "user-4",
    name: "Phạm Thị Cúc",
    username: "cuc.pham",
    tier: "standard",
    email: "cuc@example.com",
    projectCount: 1,
    cpuUsage: { used: 25, total: 100 },
    memoryUsage: { used: 48, total: 128 },
  },
  {
    id: "user-5",
    name: "Hoàng Văn Đức",
    username: "duc.hoang",
    tier: "premium",
    email: "duc@example.com",
    projectCount: 4,
    cpuUsage: { used: 120, total: 240 },
    memoryUsage: { used: 180, total: 384 },
  },
  {
    id: "user-6",
    name: "Vũ Thị Em",
    username: "em.vu",
    tier: "standard",
    email: "em@example.com",
    projectCount: 2,
    cpuUsage: { used: 45, total: 120 },
    memoryUsage: { used: 64, total: 192 },
  },
  {
    id: "user-7",
    name: "Đỗ Văn Phúc",
    username: "phuc.do",
    tier: "premium",
    email: "phuc@example.com",
    projectCount: 5,
    cpuUsage: { used: 150, total: 280 },
    memoryUsage: { used: 220, total: 448 },
  },
  {
    id: "user-8",
    name: "Bùi Thị Giang",
    username: "giang.bui",
    tier: "standard",
    email: "giang@example.com",
    projectCount: 1,
    cpuUsage: { used: 30, total: 100 },
    memoryUsage: { used: 56, total: 128 },
  },
  {
    id: "user-9",
    name: "Ngô Văn Hùng",
    username: "hung.ngo",
    tier: "premium",
    email: "hung@example.com",
    projectCount: 3,
    cpuUsage: { used: 100, total: 200 },
    memoryUsage: { used: 160, total: 320 },
  },
  {
    id: "user-10",
    name: "Lý Thị Hoa",
    username: "hoa.ly",
    tier: "standard",
    email: "hoa@example.com",
    projectCount: 2,
    cpuUsage: { used: 50, total: 120 },
    memoryUsage: { used: 80, total: 192 },
  },
  {
    id: "user-11",
    name: "Đinh Văn Khoa",
    username: "khoa.dinh",
    tier: "premium",
    email: "khoa@example.com",
    projectCount: 4,
    cpuUsage: { used: 110, total: 240 },
    memoryUsage: { used: 170, total: 384 },
  },
];

const mockUserProjects: Record<string, AdminUserProject[]> = {
  "user-1": [
    {
      id: "proj-1",
      name: "Thanh toán trực tuyến",
      databaseCount: 2,
      backendCount: 2,
      frontendCount: 1,
      cpuUsage: { used: 40, total: 80 },
      memoryUsage: { used: 48, total: 128 },
    },
    {
      id: "proj-2",
      name: "Hệ thống báo cáo",
      databaseCount: 1,
      backendCount: 1,
      frontendCount: 1,
      cpuUsage: { used: 20, total: 80 },
      memoryUsage: { used: 48, total: 128 },
    },
    {
      id: "proj-47",
      name: "Hệ thống quản lý đơn hàng",
      databaseCount: 2,
      backendCount: 2,
      frontendCount: 1,
      cpuUsage: { used: 30, total: 80 },
      memoryUsage: { used: 40, total: 128 },
    },
    {
      id: "proj-48",
      name: "API Gateway Service",
      databaseCount: 1,
      backendCount: 1,
      frontendCount: 0,
      cpuUsage: { used: 15, total: 80 },
      memoryUsage: { used: 20, total: 128 },
    },
    {
      id: "proj-49",
      name: "Notification Service",
      databaseCount: 1,
      backendCount: 1,
      frontendCount: 0,
      cpuUsage: { used: 10, total: 80 },
      memoryUsage: { used: 16, total: 128 },
    },
    {
      id: "proj-50",
      name: "Analytics Dashboard",
      databaseCount: 1,
      backendCount: 1,
      frontendCount: 1,
      cpuUsage: { used: 25, total: 80 },
      memoryUsage: { used: 32, total: 128 },
    },
  ],
  "user-2": [
    {
      id: "proj-3",
      name: "Ứng dụng loyalty",
      databaseCount: 1,
      backendCount: 1,
      frontendCount: 1,
      cpuUsage: { used: 35, total: 120 },
      memoryUsage: { used: 72, total: 192 },
    },
    {
      id: "proj-51",
      name: "Customer Portal",
      databaseCount: 1,
      backendCount: 1,
      frontendCount: 1,
      cpuUsage: { used: 25, total: 120 },
      memoryUsage: { used: 48, total: 192 },
    },
    {
      id: "proj-52",
      name: "Reward Points System",
      databaseCount: 1,
      backendCount: 1,
      frontendCount: 1,
      cpuUsage: { used: 20, total: 120 },
      memoryUsage: { used: 40, total: 192 },
    },
    {
      id: "proj-53",
      name: "Mobile App Backend",
      databaseCount: 1,
      backendCount: 1,
      frontendCount: 0,
      cpuUsage: { used: 15, total: 120 },
      memoryUsage: { used: 32, total: 192 },
    },
    {
      id: "proj-54",
      name: "Admin Dashboard",
      databaseCount: 0,
      backendCount: 1,
      frontendCount: 1,
      cpuUsage: { used: 10, total: 120 },
      memoryUsage: { used: 24, total: 192 },
    },
    {
      id: "proj-55",
      name: "Reporting Service",
      databaseCount: 1,
      backendCount: 1,
      frontendCount: 1,
      cpuUsage: { used: 15, total: 120 },
      memoryUsage: { used: 28, total: 192 },
    },
  ],
  "user-3": [
    {
      id: "proj-4",
      name: "Quản lý kho",
      databaseCount: 2,
      backendCount: 2,
      frontendCount: 1,
      cpuUsage: { used: 35, total: 70 },
      memoryUsage: { used: 60, total: 120 },
    },
    {
      id: "proj-5",
      name: "Sàn thương mại điện tử",
      databaseCount: 3,
      backendCount: 3,
      frontendCount: 2,
      cpuUsage: { used: 40, total: 80 },
      memoryUsage: { used: 50, total: 120 },
    },
    {
      id: "proj-6",
      name: "Hệ thống đặt vé",
      databaseCount: 1,
      backendCount: 1,
      frontendCount: 1,
      cpuUsage: { used: 15, total: 50 },
      memoryUsage: { used: 30, total: 80 },
    },
    {
      id: "proj-56",
      name: "Inventory Management",
      databaseCount: 2,
      backendCount: 2,
      frontendCount: 1,
      cpuUsage: { used: 30, total: 200 },
      memoryUsage: { used: 50, total: 320 },
    },
    {
      id: "proj-57",
      name: "Order Processing System",
      databaseCount: 1,
      backendCount: 2,
      frontendCount: 1,
      cpuUsage: { used: 25, total: 200 },
      memoryUsage: { used: 40, total: 320 },
    },
    {
      id: "proj-58",
      name: "Shipping Integration",
      databaseCount: 1,
      backendCount: 1,
      frontendCount: 0,
      cpuUsage: { used: 20, total: 200 },
      memoryUsage: { used: 30, total: 320 },
    },
  ],
  "user-4": [
    {
      id: "proj-7",
      name: "Hệ thống quản lý học tập",
      databaseCount: 1,
      backendCount: 1,
      frontendCount: 1,
      cpuUsage: { used: 20, total: 100 },
      memoryUsage: { used: 40, total: 128 },
    },
    {
      id: "proj-8",
      name: "Ứng dụng chat",
      databaseCount: 1,
      backendCount: 2,
      frontendCount: 1,
      cpuUsage: { used: 5, total: 100 },
      memoryUsage: { used: 8, total: 128 },
    },
    {
      id: "proj-59",
      name: "Student Management System",
      databaseCount: 1,
      backendCount: 1,
      frontendCount: 1,
      cpuUsage: { used: 15, total: 100 },
      memoryUsage: { used: 30, total: 128 },
    },
    {
      id: "proj-60",
      name: "Grade Tracking System",
      databaseCount: 1,
      backendCount: 1,
      frontendCount: 1,
      cpuUsage: { used: 10, total: 100 },
      memoryUsage: { used: 20, total: 128 },
    },
    {
      id: "proj-61",
      name: "Assignment Submission Portal",
      databaseCount: 1,
      backendCount: 1,
      frontendCount: 1,
      cpuUsage: { used: 12, total: 100 },
      memoryUsage: { used: 18, total: 128 },
    },
    {
      id: "proj-62",
      name: "Attendance System",
      databaseCount: 1,
      backendCount: 1,
      frontendCount: 1,
      cpuUsage: { used: 8, total: 100 },
      memoryUsage: { used: 12, total: 128 },
    },
  ],
  "user-5": [
    {
      id: "proj-9",
      name: "Nền tảng streaming",
      databaseCount: 2,
      backendCount: 3,
      frontendCount: 2,
      cpuUsage: { used: 80, total: 240 },
      memoryUsage: { used: 120, total: 384 },
    },
    {
      id: "proj-10",
      name: "Hệ thống phân tích dữ liệu",
      databaseCount: 3,
      backendCount: 2,
      frontendCount: 1,
      cpuUsage: { used: 30, total: 240 },
      memoryUsage: { used: 50, total: 384 },
    },
    {
      id: "proj-11",
      name: "API Gateway",
      databaseCount: 1,
      backendCount: 1,
      frontendCount: 0,
      cpuUsage: { used: 10, total: 240 },
      memoryUsage: { used: 10, total: 384 },
    },
    {
      id: "proj-12",
      name: "Microservices Platform",
      databaseCount: 4,
      backendCount: 5,
      frontendCount: 2,
      cpuUsage: { used: 100, total: 240 },
      memoryUsage: { used: 150, total: 384 },
    },
    {
      id: "proj-13",
      name: "Mobile App Backend",
      databaseCount: 2,
      backendCount: 3,
      frontendCount: 1,
      cpuUsage: { used: 50, total: 240 },
      memoryUsage: { used: 80, total: 384 },
    },
    {
      id: "proj-14",
      name: "Content Management System",
      databaseCount: 2,
      backendCount: 2,
      frontendCount: 1,
      cpuUsage: { used: 40, total: 240 },
      memoryUsage: { used: 60, total: 384 },
    },
  ],
  "user-6": [
    {
      id: "proj-15",
      name: "Website bán hàng",
      databaseCount: 1,
      backendCount: 1,
      frontendCount: 1,
      cpuUsage: { used: 30, total: 120 },
      memoryUsage: { used: 48, total: 192 },
    },
    {
      id: "proj-16",
      name: "Blog cá nhân",
      databaseCount: 1,
      backendCount: 1,
      frontendCount: 1,
      cpuUsage: { used: 15, total: 120 },
      memoryUsage: { used: 16, total: 192 },
    },
    {
      id: "proj-17",
      name: "Portfolio Website",
      databaseCount: 0,
      backendCount: 1,
      frontendCount: 1,
      cpuUsage: { used: 10, total: 120 },
      memoryUsage: { used: 12, total: 192 },
    },
    {
      id: "proj-18",
      name: "Landing Page",
      databaseCount: 0,
      backendCount: 0,
      frontendCount: 1,
      cpuUsage: { used: 5, total: 120 },
      memoryUsage: { used: 8, total: 192 },
    },
    {
      id: "proj-19",
      name: "E-commerce Platform",
      databaseCount: 2,
      backendCount: 2,
      frontendCount: 2,
      cpuUsage: { used: 35, total: 120 },
      memoryUsage: { used: 56, total: 192 },
    },
    {
      id: "proj-20",
      name: "Customer Portal",
      databaseCount: 1,
      backendCount: 1,
      frontendCount: 1,
      cpuUsage: { used: 25, total: 120 },
      memoryUsage: { used: 40, total: 192 },
    },
  ],
  "user-7": [
    {
      id: "proj-21",
      name: "Enterprise Resource Planning",
      databaseCount: 5,
      backendCount: 6,
      frontendCount: 3,
      cpuUsage: { used: 100, total: 280 },
      memoryUsage: { used: 150, total: 448 },
    },
    {
      id: "proj-22",
      name: "Customer Relationship Management",
      databaseCount: 3,
      backendCount: 4,
      frontendCount: 2,
      cpuUsage: { used: 80, total: 280 },
      memoryUsage: { used: 120, total: 448 },
    },
    {
      id: "proj-23",
      name: "Business Intelligence Dashboard",
      databaseCount: 2,
      backendCount: 2,
      frontendCount: 1,
      cpuUsage: { used: 40, total: 280 },
      memoryUsage: { used: 60, total: 448 },
    },
    {
      id: "proj-24",
      name: "Supply Chain Management",
      databaseCount: 4,
      backendCount: 5,
      frontendCount: 2,
      cpuUsage: { used: 90, total: 280 },
      memoryUsage: { used: 140, total: 448 },
    },
    {
      id: "proj-25",
      name: "Financial Management System",
      databaseCount: 3,
      backendCount: 3,
      frontendCount: 2,
      cpuUsage: { used: 70, total: 280 },
      memoryUsage: { used: 110, total: 448 },
    },
    {
      id: "proj-26",
      name: "HR Management Platform",
      databaseCount: 2,
      backendCount: 2,
      frontendCount: 1,
      cpuUsage: { used: 50, total: 280 },
      memoryUsage: { used: 80, total: 448 },
    },
  ],
  "user-8": [
    {
      id: "proj-27",
      name: "Personal Finance Tracker",
      databaseCount: 1,
      backendCount: 1,
      frontendCount: 1,
      cpuUsage: { used: 20, total: 100 },
      memoryUsage: { used: 40, total: 128 },
    },
    {
      id: "proj-28",
      name: "Task Management App",
      databaseCount: 1,
      backendCount: 1,
      frontendCount: 1,
      cpuUsage: { used: 10, total: 100 },
      memoryUsage: { used: 16, total: 128 },
    },
    {
      id: "proj-63",
      name: "Expense Tracker",
      databaseCount: 1,
      backendCount: 1,
      frontendCount: 1,
      cpuUsage: { used: 15, total: 100 },
      memoryUsage: { used: 24, total: 128 },
    },
    {
      id: "proj-64",
      name: "Budget Planner",
      databaseCount: 1,
      backendCount: 1,
      frontendCount: 1,
      cpuUsage: { used: 12, total: 100 },
      memoryUsage: { used: 20, total: 128 },
    },
    {
      id: "proj-65",
      name: "Investment Portfolio",
      databaseCount: 1,
      backendCount: 1,
      frontendCount: 1,
      cpuUsage: { used: 18, total: 100 },
      memoryUsage: { used: 28, total: 128 },
    },
    {
      id: "proj-66",
      name: "Bill Reminder Service",
      databaseCount: 1,
      backendCount: 1,
      frontendCount: 0,
      cpuUsage: { used: 8, total: 100 },
      memoryUsage: { used: 12, total: 128 },
    },
  ],
  "user-9": [
    {
      id: "proj-29",
      name: "Social Media Platform",
      databaseCount: 3,
      backendCount: 4,
      frontendCount: 2,
      cpuUsage: { used: 60, total: 200 },
      memoryUsage: { used: 100, total: 320 },
    },
    {
      id: "proj-30",
      name: "Video Sharing Platform",
      databaseCount: 2,
      backendCount: 3,
      frontendCount: 2,
      cpuUsage: { used: 50, total: 200 },
      memoryUsage: { used: 80, total: 320 },
    },
    {
      id: "proj-31",
      name: "Real-time Collaboration Tool",
      databaseCount: 2,
      backendCount: 2,
      frontendCount: 1,
      cpuUsage: { used: 40, total: 200 },
      memoryUsage: { used: 60, total: 320 },
    },
    {
      id: "proj-32",
      name: "News Aggregator",
      databaseCount: 1,
      backendCount: 2,
      frontendCount: 1,
      cpuUsage: { used: 30, total: 200 },
      memoryUsage: { used: 50, total: 320 },
    },
    {
      id: "proj-33",
      name: "Event Management System",
      databaseCount: 2,
      backendCount: 2,
      frontendCount: 1,
      cpuUsage: { used: 35, total: 200 },
      memoryUsage: { used: 55, total: 320 },
    },
    {
      id: "proj-34",
      name: "Community Forum",
      databaseCount: 1,
      backendCount: 1,
      frontendCount: 1,
      cpuUsage: { used: 25, total: 200 },
      memoryUsage: { used: 45, total: 320 },
    },
  ],
  "user-10": [
    {
      id: "proj-35",
      name: "Online Learning Platform",
      databaseCount: 2,
      backendCount: 2,
      frontendCount: 1,
      cpuUsage: { used: 35, total: 120 },
      memoryUsage: { used: 60, total: 192 },
    },
    {
      id: "proj-36",
      name: "Course Management System",
      databaseCount: 1,
      backendCount: 1,
      frontendCount: 1,
      cpuUsage: { used: 25, total: 120 },
      memoryUsage: { used: 40, total: 192 },
    },
    {
      id: "proj-37",
      name: "Student Portal",
      databaseCount: 1,
      backendCount: 1,
      frontendCount: 1,
      cpuUsage: { used: 20, total: 120 },
      memoryUsage: { used: 30, total: 192 },
    },
    {
      id: "proj-38",
      name: "Teacher Dashboard",
      databaseCount: 1,
      backendCount: 1,
      frontendCount: 1,
      cpuUsage: { used: 15, total: 120 },
      memoryUsage: { used: 20, total: 192 },
    },
    {
      id: "proj-39",
      name: "Assessment System",
      databaseCount: 1,
      backendCount: 1,
      frontendCount: 1,
      cpuUsage: { used: 10, total: 120 },
      memoryUsage: { used: 15, total: 192 },
    },
    {
      id: "proj-40",
      name: "Certificate Generator",
      databaseCount: 0,
      backendCount: 1,
      frontendCount: 1,
      cpuUsage: { used: 5, total: 120 },
      memoryUsage: { used: 10, total: 192 },
    },
  ],
  "user-11": [
    {
      id: "proj-41",
      name: "Cloud Infrastructure Manager",
      databaseCount: 2,
      backendCount: 3,
      frontendCount: 2,
      cpuUsage: { used: 70, total: 240 },
      memoryUsage: { used: 110, total: 384 },
    },
    {
      id: "proj-42",
      name: "Container Orchestration Platform",
      databaseCount: 1,
      backendCount: 2,
      frontendCount: 1,
      cpuUsage: { used: 60, total: 240 },
      memoryUsage: { used: 100, total: 384 },
    },
    {
      id: "proj-43",
      name: "Monitoring & Alerting System",
      databaseCount: 2,
      backendCount: 2,
      frontendCount: 1,
      cpuUsage: { used: 50, total: 240 },
      memoryUsage: { used: 80, total: 384 },
    },
    {
      id: "proj-44",
      name: "CI/CD Pipeline Manager",
      databaseCount: 1,
      backendCount: 2,
      frontendCount: 1,
      cpuUsage: { used: 40, total: 240 },
      memoryUsage: { used: 70, total: 384 },
    },
    {
      id: "proj-45",
      name: "Log Aggregation System",
      databaseCount: 2,
      backendCount: 2,
      frontendCount: 1,
      cpuUsage: { used: 35, total: 240 },
      memoryUsage: { used: 60, total: 384 },
    },
    {
      id: "proj-46",
      name: "Security Scanner",
      databaseCount: 1,
      backendCount: 1,
      frontendCount: 1,
      cpuUsage: { used: 30, total: 240 },
      memoryUsage: { used: 50, total: 384 },
    },
  ],
};

const mockProjectDetails: Record<string, AdminProjectDetail> = {
  "proj-1": {
    id: "proj-1",
    name: "Thanh toán trực tuyến",
    databases: [
      {
        id: "db-1",
        name: "payments-db",
        status: "running",
        cpu: "2 cores",
        memory: "8 GB",
        projectName: "Thanh toán trực tuyến",
        cpuUsed: "2 cores",
        memoryUsed: "8 GB",
        ip: "10.10.1.10",
        port: 5432,
        databaseName: "payments",
        dbUsername: "payments_user",
        dbPassword: "secure-pay",
        node: "node-01",
        pvc: "pvc-payments-db",
        pv: "pv-payments-db",
      },
      {
        id: "db-2",
        name: "audit-db",
        status: "running",
        cpu: "1 core",
        memory: "4 GB",
        projectName: "Thanh toán trực tuyến",
        cpuUsed: "1 core",
        memoryUsed: "4 GB",
        ip: "10.10.1.11",
        port: 3306,
        databaseName: "audit_log",
        dbUsername: "audit_user",
        dbPassword: "audit-123",
        node: "node-02",
        pvc: "pvc-audit-db",
        pv: "pv-audit-db",
      },
    ],
    backends: [
      { id: "be-1", name: "payment-api", status: "running", cpu: "4 cores", memory: "8 GB", replicas: "4/4" },
      { id: "be-2", name: "notification-service", status: "running", cpu: "2 cores", memory: "4 GB", replicas: "2/2" },
    ],
    frontends: [
      { id: "fe-1", name: "payment-portal", status: "running", cpu: "2 cores", memory: "4 GB", replicas: "3/3" },
    ],
  },
  "proj-2": {
    id: "proj-2",
    name: "Hệ thống báo cáo",
    databases: [
      {
        id: "db-3",
        name: "reporting-db",
        status: "running",
        cpu: "1 core",
        memory: "4 GB",
        projectName: "Hệ thống báo cáo",
        cpuUsed: "1 core",
        memoryUsed: "4 GB",
        ip: "10.10.2.10",
        port: 5432,
        databaseName: "reporting",
        dbUsername: "report_user",
        dbPassword: "report-456",
        node: "node-01",
        pvc: "pvc-reporting-db",
        pv: "pv-reporting-db",
      },
    ],
    backends: [{ id: "be-3", name: "report-service", status: "running", cpu: "2 cores", memory: "4 GB", replicas: "2/2" }],
    frontends: [{ id: "fe-2", name: "report-dashboard", status: "running", cpu: "1 core", memory: "2 GB", replicas: "1/1" }],
  },
  "proj-3": {
    id: "proj-3",
    name: "Ứng dụng loyalty",
    databases: [
      {
        id: "db-4",
        name: "loyalty-db",
        status: "running",
        cpu: "1 core",
        memory: "2 GB",
        projectName: "Ứng dụng loyalty",
        cpuUsed: "1 core",
        memoryUsed: "2 GB",
        ip: "10.10.3.10",
        port: 5432,
        databaseName: "loyalty",
        dbUsername: "loyalty_user",
        dbPassword: "loyalty-789",
        node: "node-02",
        pvc: "pvc-loyalty-db",
        pv: "pv-loyalty-db",
      },
    ],
    backends: [{ id: "be-4", name: "loyalty-api", status: "running", cpu: "2 cores", memory: "4 GB", replicas: "2/2" }],
    frontends: [{ id: "fe-3", name: "loyalty-app", status: "running", cpu: "1 core", memory: "2 GB", replicas: "1/1" }],
  },
  "proj-4": {
    id: "proj-4",
    name: "Quản lý kho",
    databases: [
      {
        id: "db-5",
        name: "warehouse-db",
        status: "running",
        cpu: "2 cores",
        memory: "8 GB",
        projectName: "Quản lý kho",
        cpuUsed: "2 cores",
        memoryUsed: "8 GB",
        ip: "10.10.4.10",
        port: 3306,
        databaseName: "warehouse",
        dbUsername: "warehouse_user",
        dbPassword: "warehouse-321",
        node: "node-03",
        pvc: "pvc-warehouse-db",
        pv: "pv-warehouse-db",
      },
    ],
    backends: [{ id: "be-5", name: "inventory-service", status: "running", cpu: "3 cores", memory: "6 GB", replicas: "3/3" }],
    frontends: [{ id: "fe-4", name: "inventory-dashboard", status: "running", cpu: "2 cores", memory: "4 GB", replicas: "2/2" }],
  },
  "proj-5": {
    id: "proj-5",
    name: "Sàn thương mại điện tử",
    databases: [
      {
        id: "db-6",
        name: "orders-db",
        status: "running",
        cpu: "3 cores",
        memory: "12 GB",
        projectName: "Sàn thương mại điện tử",
        cpuUsed: "3 cores",
        memoryUsed: "12 GB",
        ip: "10.10.5.10",
        port: 5432,
        databaseName: "orders",
        dbUsername: "orders_user",
        dbPassword: "orders-654",
        node: "node-01",
        pvc: "pvc-orders-db",
        pv: "pv-orders-db",
      },
      {
        id: "db-7",
        name: "catalog-db",
        status: "running",
        cpu: "2 cores",
        memory: "8 GB",
        projectName: "Sàn thương mại điện tử",
        cpuUsed: "2 cores",
        memoryUsed: "8 GB",
        ip: "10.10.5.11",
        port: 3306,
        databaseName: "catalog",
        dbUsername: "catalog_user",
        dbPassword: "catalog-987",
        node: "node-02",
        pvc: "pvc-catalog-db",
        pv: "pv-catalog-db",
      },
      {
        id: "db-8",
        name: "users-db",
        status: "running",
        cpu: "2 cores",
        memory: "8 GB",
        projectName: "Sàn thương mại điện tử",
        cpuUsed: "2 cores",
        memoryUsed: "8 GB",
        ip: "10.10.5.12",
        port: 5432,
        databaseName: "users",
        dbUsername: "users_user",
        dbPassword: "users-159",
        node: "node-03",
        pvc: "pvc-users-db",
        pv: "pv-users-db",
      },
    ],
    backends: [
      { id: "be-6", name: "orders-service", status: "running", cpu: "4 cores", memory: "8 GB", replicas: "4/4" },
      { id: "be-7", name: "catalog-service", status: "running", cpu: "3 cores", memory: "6 GB", replicas: "3/3" },
      { id: "be-8", name: "user-service", status: "running", cpu: "2 cores", memory: "4 GB", replicas: "2/2" },
    ],
    frontends: [
      { id: "fe-5", name: "storefront", status: "running", cpu: "3 cores", memory: "6 GB", replicas: "4/4" },
      { id: "fe-6", name: "seller-portal", status: "running", cpu: "2 cores", memory: "4 GB", replicas: "2/2" },
    ],
  },
  "proj-6": {
    id: "proj-6",
    name: "Hệ thống đặt vé",
    databases: [
      {
        id: "db-9",
        name: "booking-db",
        status: "running",
        cpu: "1 core",
        memory: "4 GB",
        projectName: "Hệ thống đặt vé",
        cpuUsed: "1 core",
        memoryUsed: "4 GB",
        ip: "10.10.6.10",
        port: 5432,
        databaseName: "booking",
        dbUsername: "booking_user",
        dbPassword: "booking-753",
        node: "node-01",
        pvc: "pvc-booking-db",
        pv: "pv-booking-db",
      },
    ],
    backends: [{ id: "be-9", name: "booking-service", status: "running", cpu: "2 cores", memory: "4 GB", replicas: "2/2" }],
    frontends: [{ id: "fe-7", name: "booking-website", status: "running", cpu: "1 core", memory: "2 GB", replicas: "1/1" }],
  },
};

const mockAdminAccounts: AdminAccount[] = [
  {
    id: "acc-1",
    name: "Nguyễn Văn Minh",
    username: "minh.nguyen",
    email: "minh.nguyen@example.com",
    role: "ADMIN",
    tier: "premium",
    status: "active",
    projectCount: 6,
    services: 18,
    createdAt: "2023-01-12",
    lastLogin: "2024-11-30 09:12",
  },
  {
    id: "acc-2",
    name: "Trần Thị Vân",
    username: "van.tran",
    email: "van.tran@example.com",
    role: "DEVOPS",
    tier: "standard",
    status: "active",
    projectCount: 4,
    services: 11,
    createdAt: "2023-05-03",
    lastLogin: "2024-11-29 21:40",
  },
  {
    id: "acc-3",
    name: "Phạm Quang Huy",
    username: "huy.pham",
    email: "huy.pham@example.com",
    role: "USER",
    tier: "standard",
    status: "pending",
    projectCount: 2,
    services: 5,
    createdAt: "2024-02-18",
    lastLogin: "—",
  },
  {
    id: "acc-4",
    name: "Lê Mỹ Dung",
    username: "dung.le",
    email: "dung.le@example.com",
    role: "DEVOPS",
    tier: "premium",
    status: "inactive",
    projectCount: 5,
    services: 14,
    createdAt: "2023-07-25",
    lastLogin: "2024-10-07 12:05",
  },
];

// API functions
export const adminAPI = {
  // Dashboard
  getDashboardMetrics: async (): Promise<DashboardMetrics> => {
    const response = await api.get("/admin/dashboard/metrics");
    const data = response.data;
    // Map từ backend response sang frontend type
    return {
      nodes: {
        total: data.nodes?.total || 0,
        healthy: data.nodes?.healthy || 0,
        unhealthy: data.nodes?.unhealthy || 0,
      },
      pods: {
        total: data.pods?.total || 0,
        running: data.pods?.running || 0,
        pending: data.pods?.pending || 0,
        failed: data.pods?.failed || 0,
      },
      deployments: {
        total: data.deployments?.total || 0,
        active: data.deployments?.active || 0,
        error: data.deployments?.error || 0,
      },
      cpuUsage: {
        used: data.cpuUsage?.used || 0,
        total: data.cpuUsage?.total || 0,
      },
      memoryUsage: {
        used: data.memoryUsage?.used || 0,
        total: data.memoryUsage?.total || 0,
      },
    };
  },

  // Servers - Kết nối với backend thật
  getServers: async (): Promise<Server[]> => {
    try {
      const response = await api.get("/servers");
      const servers = response.data;
      
      // Map từ backend response sang frontend Server type
      return servers.map((server: any) => {
        // Parse CPU cores, RAM, Disk từ string sang number
        const cpuCores = server.cpuCores ? parseInt(server.cpuCores) || 0 : 0;
        const cpuUsed = server.cpuUsed ? parseFloat(server.cpuUsed) || 0 : 0; // Load average hoặc cores đang dùng
        // Parse RAM và Disk từ backend (backend trả về GiB)
        const ramTotal = parseSizeToGiB(server.ramTotal);
        const ramUsed = parseSizeToGiB(server.ramUsed);
        const diskTotal = parseSizeToGiB(server.diskTotal);
        const diskUsed = parseSizeToGiB(server.diskUsed);
        
        // Map status từ backend (ONLINE/OFFLINE/DISABLED) sang frontend ("online" | "offline")
        // Nếu có status thì dùng, nếu không thì map từ serverStatus
        let status: "online" | "offline" = "offline";
        if (server.status) {
            status = server.status === "ONLINE" ? "online" : "offline";
        } else {
            status = server.serverStatus === "RUNNING" ? "online" : "offline";
        }
        
        return {
          id: String(server.id),
          name: server.name,
          ipAddress: server.ip,
          port: server.port || 22,
          username: server.username,
          status: status,
          role: server.role,
          serverStatus: server.serverStatus,
          clusterStatus: server.clusterStatus,
          cpu: {
            used: cpuUsed > 0 ? cpuUsed : "-", // Dùng giá trị thực hoặc "-"
            total: cpuCores > 0 ? cpuCores : "-", // Dùng giá trị thực hoặc "-"
          },
          memory: {
            used: ramUsed > 0 ? ramUsed : "-", // Dùng giá trị thực hoặc "-"
            total: ramTotal > 0 ? ramTotal : "-", // Dùng giá trị thực hoặc "-"
          },
          disk: {
            used: diskUsed > 0 ? diskUsed : "-", // Dùng giá trị thực hoặc "-"
            total: diskTotal > 0 ? diskTotal : "-", // Dùng giá trị thực hoặc "-"
          },
          os: "Ubuntu 22.04", // Default, có thể lấy từ server sau
          updatedAt: server.createdAt || new Date().toISOString(),
        };
      });
    } catch (error: any) {
      console.error("Error fetching servers:", error);
      // Extract error message từ backend response
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          "Không thể tải danh sách servers";
      throw new Error(errorMessage);
    }
  },
  
  getServer: async (id: string): Promise<Server> => {
    try {
      const response = await api.get(`/servers/${id}`);
      const server = response.data;
      
      // Map từ backend response sang frontend Server type
      const cpuCores = server.cpuCores ? parseInt(server.cpuCores) || 0 : 0;
      const cpuUsed = server.cpuUsed ? parseFloat(server.cpuUsed) || 0 : 0;
      // Parse RAM và Disk từ backend (có thể là GB hoặc GiB, hàm parseSizeToGB sẽ xử lý)
      const ramTotal = parseSizeToGiB(server.ramTotal);
      const ramUsed = parseSizeToGiB(server.ramUsed);
      const diskTotal = parseSizeToGiB(server.diskTotal);
      const diskUsed = parseSizeToGiB(server.diskUsed);
      const status = server.serverStatus === "RUNNING" ? "online" : "offline";
      
      return {
        id: String(server.id),
        name: server.name,
        ipAddress: server.ip,
        port: server.port || 22,
        username: server.username,
        status: status,
        role: server.role,
        serverStatus: server.serverStatus,
        clusterStatus: server.clusterStatus,
        cpu: {
          used: cpuUsed > 0 ? cpuUsed : "-",
          total: cpuCores || 100,
        },
        memory: {
          used: ramUsed > 0 ? ramUsed : "-",
          total: ramTotal || 128,
        },
        disk: {
          used: diskUsed > 0 ? diskUsed : "-",
          total: diskTotal || 500,
        },
        os: "Ubuntu 22.04",
        updatedAt: server.createdAt || new Date().toISOString(),
      };
    } catch (error: any) {
      console.error("Error fetching server:", error);
      // Extract error message từ backend response
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          "Không thể lấy thông tin server";
      throw new Error(errorMessage);
    }
  },
  
  createServer: async (data: Omit<Server, "id" | "updatedAt"> & { 
    role?: string; 
    serverStatus?: string; 
    clusterStatus?: string;
  }): Promise<Server> => {
    try {
      // Map từ frontend Server type sang backend CreateServerRequest
      const request = {
        name: data.name,
        ip: data.ipAddress,
        port: data.port || 22,
        username: data.username || "root",
        password: data.password || "",
        role: data.role || "WORKER",
        serverStatus: data.serverStatus || (data.status === "online" ? "RUNNING" : "STOPPED"),
        clusterStatus: data.clusterStatus || "UNAVAILABLE",
      };
      
      const response = await api.post("/servers", request);
      const server = response.data;
      
      // Map response về frontend Server type
      const status = server.status === "ONLINE" ? "online" : "offline";
      const cpuCores = server.cpuCores ? parseInt(server.cpuCores) || 0 : 0;
      const cpuUsed = server.cpuUsed ? parseFloat(server.cpuUsed) || 0 : 0;
      // Parse RAM và Disk từ backend (có thể là GB hoặc GiB, hàm parseSizeToGB sẽ xử lý)
      const ramTotal = parseSizeToGiB(server.ramTotal);
      const ramUsed = parseSizeToGiB(server.ramUsed);
      const diskTotal = parseSizeToGiB(server.diskTotal);
      const diskUsed = parseSizeToGiB(server.diskUsed);
      
      return {
        id: String(server.id),
        name: server.name,
        ipAddress: server.ip,
        port: server.port || 22,
        username: server.username,
        status: status,
        role: server.role,
        serverStatus: server.serverStatus,
        clusterStatus: server.clusterStatus,
        cpu: {
          used: cpuUsed > 0 ? cpuUsed : "-",
          total: cpuCores > 0 ? cpuCores : "-",
        },
        memory: {
          used: ramUsed > 0 ? ramUsed : "-",
          total: ramTotal > 0 ? ramTotal : "-",
        },
        disk: {
          used: diskUsed > 0 ? diskUsed : "-",
          total: diskTotal > 0 ? diskTotal : "-",
        },
        os: data.os || "Ubuntu 22.04",
        updatedAt: server.createdAt || new Date().toISOString(),
      };
    } catch (error: any) {
      console.error("Error creating server:", error);
      // Extract error message từ backend response
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          "Không thể tạo server";
      throw new Error(errorMessage);
    }
  },
  
  updateServer: async (id: string, data: Partial<Server> & { 
    role?: string; 
    serverStatus?: string; 
    clusterStatus?: string;
  }): Promise<Server> => {
    try {
      // Map từ frontend Server type sang backend UpdateServerRequest
      const request: any = {};
      
      if (data.name !== undefined) request.name = data.name;
      if (data.ipAddress !== undefined) request.ip = data.ipAddress;
      if (data.port !== undefined) request.port = data.port;
      if (data.username !== undefined) request.username = data.username;
      if (data.password !== undefined) request.password = data.password;
      if (data.role !== undefined) request.role = data.role;
      if (data.serverStatus !== undefined) {
        request.serverStatus = data.serverStatus;
      } else if (data.status !== undefined) {
        request.serverStatus = data.status === "online" ? "RUNNING" : "STOPPED";
      }
      if (data.clusterStatus !== undefined) request.clusterStatus = data.clusterStatus;
      
      const response = await api.put(`/servers/${id}`, request);
      const server = response.data;
      
      // Map response về frontend Server type
      const cpuCores = server.cpuCores ? parseInt(server.cpuCores) || 0 : 0;
      const cpuUsed = server.cpuUsed ? parseFloat(server.cpuUsed) || 0 : 0;
      // Parse RAM và Disk từ backend (có thể là GB hoặc GiB, hàm parseSizeToGB sẽ xử lý)
      const ramTotal = parseSizeToGiB(server.ramTotal);
      const ramUsed = parseSizeToGiB(server.ramUsed);
      const diskTotal = parseSizeToGiB(server.diskTotal);
      const diskUsed = parseSizeToGiB(server.diskUsed);
      
      // Map status từ backend (ONLINE/OFFLINE/DISABLED) sang frontend ("online" | "offline")
      let status: "online" | "offline" = "offline";
      if (server.status) {
          status = server.status === "ONLINE" ? "online" : "offline";
      } else {
          status = server.serverStatus === "RUNNING" ? "online" : "offline";
      }
      
      return {
        id: String(server.id),
        name: server.name,
        ipAddress: server.ip,
        port: server.port || 22,
        username: server.username,
        status: status,
        role: server.role,
        serverStatus: server.serverStatus,
        clusterStatus: server.clusterStatus,
        cpu: {
          used: cpuUsed > 0 ? cpuUsed : "-",
          total: cpuCores > 0 ? cpuCores : "-",
        },
        memory: {
          used: ramUsed > 0 ? ramUsed : "-",
          total: ramTotal > 0 ? ramTotal : "-",
        },
        disk: {
          used: diskUsed > 0 ? diskUsed : "-",
          total: diskTotal > 0 ? diskTotal : "-",
        },
        os: data.os || "Ubuntu 22.04",
        updatedAt: server.createdAt || new Date().toISOString(),
      };
    } catch (error: any) {
      console.error("Error updating server:", error);
      // Extract error message từ backend response
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          "Không thể cập nhật server";
      throw new Error(errorMessage);
    }
  },
  
  deleteServer: async (id: string): Promise<void> => {
    try {
      await api.delete(`/servers/${id}`);
    } catch (error: any) {
      console.error("Error deleting server:", error);
      // Extract error message từ backend response
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          "Không thể xóa server";
      throw new Error(errorMessage);
    }
  },
  
  // Test SSH connection
  testSsh: async (data: { ip: string; port: number; username: string; password: string }): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.post("/servers/test-ssh", {
        ip: data.ip,
        port: data.port,
        username: data.username,
        password: data.password,
      });
      return response.data;
    } catch (error: any) {
      console.error("Error testing SSH:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Kết nối SSH thất bại",
      };
    }
  },
  
  // Kiểm tra và cập nhật trạng thái tất cả servers
  checkAllStatuses: async (includeMetrics: boolean = false): Promise<{ servers: Server[]; message: string }> => {
    try {
      const response = await api.post("/servers/check-status", null, {
        params: { includeMetrics }
      });
      // Backend trả về { servers: [...], message: "..." }
      const serversData = response.data.servers || [];
      return {
        servers: serversData.map((server: any) => {
          const cpuCores = server.cpuCores ? parseInt(server.cpuCores) || 0 : 0;
          const cpuUsed = server.cpuUsed ? parseFloat(server.cpuUsed) || 0 : 0;
          const ramTotal = server.ramTotal ? parseFloat(server.ramTotal.replace(/[^0-9.]/g, "")) || 0 : 0;
          const ramUsed = server.ramUsed ? parseFloat(server.ramUsed.replace(/[^0-9.]/g, "")) || 0 : 0;
          const diskTotal = server.diskTotal ? parseFloat(server.diskTotal.replace(/[^0-9.]/g, "")) || 0 : 0;
          const diskUsed = server.diskUsed ? parseFloat(server.diskUsed.replace(/[^0-9.]/g, "")) || 0 : 0;
          const status = server.status === "ONLINE" ? "online" : "offline";
          
          return {
            id: String(server.id),
            name: server.name,
            ipAddress: server.ip,
            port: server.port || 22,
            username: server.username,
            status: status,
            role: server.role,
            serverStatus: server.serverStatus,
            clusterStatus: server.clusterStatus,
            cpu: {
              used: cpuUsed || Math.floor(cpuCores * 0.3),
              total: cpuCores || 100,
            },
            memory: {
              used: ramUsed || Math.floor(ramTotal * 0.4),
              total: ramTotal || 128,
            },
            disk: {
              used: diskUsed || Math.floor(diskTotal * 0.5),
              total: diskTotal || 500,
            },
            os: "Ubuntu 22.04",
            updatedAt: server.createdAt || new Date().toISOString(),
          };
        }),
        message: response.data.message || 
                (includeMetrics 
                  ? `Đã kiểm tra trạng thái và cập nhật metrics cho ${serversData.length} servers`
                  : `Đã kiểm tra và cập nhật trạng thái ${serversData.length} servers`),
      };
    } catch (error: any) {
      console.error("Error checking statuses:", error);
      // Extract error message từ backend response
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          "Không thể kiểm tra trạng thái";
      throw new Error(errorMessage);
    }
  },
  
  // Cập nhật trạng thái server (ONLINE/OFFLINE/DISABLED)
  updateServerStatus: async (id: string, status: "ONLINE" | "OFFLINE" | "DISABLED"): Promise<Server> => {
    try {
      const response = await api.put(`/servers/${id}/status`, { status });
      const server = response.data;
      
      const cpuCores = server.cpuCores ? parseInt(server.cpuCores) || 0 : 0;
      const cpuUsed = server.cpuUsed ? parseFloat(server.cpuUsed) || 0 : 0;
      // Parse RAM và Disk từ backend (có thể là GB hoặc GiB, hàm parseSizeToGB sẽ xử lý)
      const ramTotal = parseSizeToGiB(server.ramTotal);
      const ramUsed = parseSizeToGiB(server.ramUsed);
      const diskTotal = parseSizeToGiB(server.diskTotal);
      const diskUsed = parseSizeToGiB(server.diskUsed);
      const statusMapped = server.status === "ONLINE" ? "online" : "offline";
      
      return {
        id: String(server.id),
        name: server.name,
        ipAddress: server.ip,
        port: server.port || 22,
        username: server.username,
        status: statusMapped,
        role: server.role,
        serverStatus: server.serverStatus,
        clusterStatus: server.clusterStatus,
        cpu: {
          used: cpuUsed > 0 ? cpuUsed : "-",
          total: cpuCores > 0 ? cpuCores : "-",
        },
        memory: {
          used: ramUsed > 0 ? ramUsed : "-",
          total: ramTotal > 0 ? ramTotal : "-",
        },
        disk: {
          used: diskUsed > 0 ? diskUsed : "-",
          total: diskTotal > 0 ? diskTotal : "-",
        },
        os: "Ubuntu 22.04",
        updatedAt: server.createdAt || new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error updating server status:", error);
      throw error;
    }
  },

  // Clusters - chỉ quản lý 1 cluster
  getCluster: async (): Promise<Cluster | null> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return currentCluster;
  },
  createCluster: async (data: Omit<Cluster, "id" | "createdAt">): Promise<Cluster> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (currentCluster) {
      throw new Error("Đã có cluster, chỉ được phép quản lý 1 cluster");
    }
    const newCluster: Cluster = {
      ...data,
      id: "1",
      createdAt: new Date().toISOString(),
    };
    currentCluster = newCluster;
    return newCluster;
  },
  updateCluster: async (data: Partial<Cluster>): Promise<Cluster> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (!currentCluster) throw new Error("Cluster not found");
    currentCluster = { ...currentCluster, ...data };
    return currentCluster;
  },
  deleteCluster: async (): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    currentCluster = null;
  },

  // Nodes
  getNodes: async (): Promise<Node[]> => {
    const response = await api.get("/admin/cluster/nodes");
    const nodeListResponse = response.data;
    
    // Map từ backend response sang frontend type
    return nodeListResponse.nodes.map((node: any) => ({
      id: node.id || node.name,
      name: node.name,
      status: node.status === "ready" ? "ready" : "notready",
      role: node.role === "master" ? "master" : "worker",
      cpu: {
        requested: node.cpu?.requested || 0,
        limit: node.cpu?.limit || 0,
        capacity: node.cpu?.capacity || 0,
      },
      memory: {
        requested: node.memory?.requested || 0,
        limit: node.memory?.limit || 0,
        capacity: node.memory?.capacity || 0,
      },
      disk: {
        requested: node.disk?.requested || 0,
        limit: node.disk?.limit || 0,
        capacity: node.disk?.capacity || 0,
      },
      podCount: node.podCount || 0,
      os: node.os || "Unknown",
      kernel: node.kernel || "Unknown",
      updatedAt: node.updatedAt || "",
    }));
  },
  getNode: async (id: string): Promise<Node> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const node = mockNodes.find((n) => n.id === id);
    if (!node) throw new Error("Node not found");
    return node;
  },

  // Namespaces
  getNamespaces: async (): Promise<Namespace[]> => {
    const response = await api.get("/admin/cluster/namespaces");
    const namespaceListResponse = response.data;
    
    // Map từ backend response sang frontend type
    return namespaceListResponse.namespaces.map((ns: any) => ({
      id: ns.id || ns.name,
      name: ns.name,
      status: ns.status === "active" ? "active" : "terminating",
      labels: ns.labels || {},
      age: ns.age || "",
    }));
  },
  createNamespace: async (data: Omit<Namespace, "id" | "age">): Promise<Namespace> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const newNamespace: Namespace = {
      ...data,
      id: String(mockNamespaces.length + 1),
      age: "0d",
    };
    mockNamespaces.push(newNamespace);
    return newNamespace;
  },
  deleteNamespace: async (id: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const index = mockNamespaces.findIndex((ns) => ns.id === id);
    if (index === -1) throw new Error("Namespace not found");
    mockNamespaces.splice(index, 1);
  },

  // Deployments
  getDeployments: async (): Promise<Deployment[]> => {
    const response = await api.get("/admin/workloads/deployments");
    const deploymentListResponse = response.data;
    
    // Map từ backend response sang frontend type
    return deploymentListResponse.deployments.map((deployment: any) => ({
      id: deployment.id || `${deployment.name}-${deployment.namespace}`,
      name: deployment.name,
      namespace: deployment.namespace,
      replicas: {
        desired: deployment.replicas?.desired || 0,
        ready: deployment.replicas?.ready || 0,
        updated: deployment.replicas?.updated || 0,
        available: deployment.replicas?.available || 0,
      },
      status: deployment.status === "running" ? "running" : deployment.status === "error" ? "error" : "pending",
      containers: deployment.containers || [],
      images: deployment.images || [],
      selector: deployment.selector || "",
      age: deployment.age || "",
    }));
  },
  getDeployment: async (id: string): Promise<Deployment> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const deployment = mockDeployments.find((d) => d.id === id);
    if (!deployment) throw new Error("Deployment not found");
    return deployment;
  },
  createDeployment: async (data: Omit<Deployment, "id" | "age">): Promise<Deployment> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const newDeployment: Deployment = {
      ...data,
      replicas: {
        desired: data.replicas.desired,
        ready: data.replicas.ready ?? 0,
        updated: data.replicas.updated ?? data.replicas.desired,
        available: data.replicas.available ?? 0,
      },
      containers: data.containers ?? [],
      images: data.images ?? [],
      selector: data.selector ?? "",
      id: String(mockDeployments.length + 1),
      age: "0d",
    };
    mockDeployments.push(newDeployment);
    return newDeployment;
  },
  updateDeployment: async (id: string, data: Partial<Deployment>): Promise<Deployment> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const index = mockDeployments.findIndex((d) => d.id === id);
    if (index === -1) throw new Error("Deployment not found");
    mockDeployments[index] = {
      ...mockDeployments[index],
      ...data,
      replicas: {
        desired: data.replicas?.desired ?? mockDeployments[index].replicas.desired,
        ready: data.replicas?.ready ?? mockDeployments[index].replicas.ready,
        updated: data.replicas?.updated ?? mockDeployments[index].replicas.updated,
        available: data.replicas?.available ?? mockDeployments[index].replicas.available,
      },
      containers: data.containers ?? mockDeployments[index].containers,
      images: data.images ?? mockDeployments[index].images,
      selector: data.selector ?? mockDeployments[index].selector,
    };
    return mockDeployments[index];
  },
  deleteDeployment: async (id: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const index = mockDeployments.findIndex((d) => d.id === id);
    if (index === -1) throw new Error("Deployment not found");
    mockDeployments.splice(index, 1);
  },

  // Pods
  getPods: async (): Promise<Pod[]> => {
    const response = await api.get("/admin/workloads/pods");
    const podListResponse = response.data;
    
    // Map từ backend response sang frontend type
    return podListResponse.pods.map((pod: any) => ({
      id: pod.id || `${pod.name}-${pod.namespace}`,
      name: pod.name,
      namespace: pod.namespace,
      ready: {
        ready: pod.ready?.ready || 0,
        total: pod.ready?.total || 0,
      },
      node: pod.node || "",
      status: pod.status === "running" ? "running" : 
              pod.status === "pending" ? "pending" : 
              pod.status === "failed" ? "failed" : 
              pod.status === "succeeded" ? "succeeded" : "pending",
      restarts: pod.restarts || 0,
      age: pod.age || "",
      ip: pod.ip || "",
      nominatedNode: pod.nominatedNode || undefined,
      readinessGates: pod.readinessGates || undefined,
    }));
  },
  getPod: async (id: string): Promise<Pod> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const pod = mockPods.find((p) => p.id === id);
    if (!pod) throw new Error("Pod not found");
    return pod;
  },
  deletePod: async (id: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const index = mockPods.findIndex((p) => p.id === id);
    if (index === -1) throw new Error("Pod not found");
    mockPods.splice(index, 1);
  },
  createPod: async (data: Omit<Pod, "id">): Promise<Pod> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const newPod = createPodEntry(data);
    mockPods.push(newPod);
    return newPod;
  },
  createPodFromYaml: async (yaml: string): Promise<Pod> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const name =
      extractYamlValue(yaml, /metadata:\s*[\s\S]*?name:\s*([^\s]+)/) ||
      extractYamlValue(yaml, /name:\s*([^\s]+)/, `pod-${mockPods.length + 1}`);
    const namespace =
      extractYamlValue(yaml, /metadata:\s*[\s\S]*?namespace:\s*([^\s]+)/) ||
      extractYamlValue(yaml, /namespace:\s*([^\s]+)/, "default");
    const node = extractYamlValue(yaml, /nodeName:\s*([^\s]+)/, "node-01");
    const status = "pending";

    const newPod = createPodEntry({
      name,
      namespace,
      ready: { ready: 0, total: 1 },
      node,
      status: status as Pod["status"],
      restarts: 0,
      age: "0m",
      ip: "10.244.0." + (Math.floor(Math.random() * 200) + 10),
      nominatedNode: "-",
      readinessGates: [],
    });
    mockPods.push(newPod);
    return newPod;
  },
  createDeploymentFromYaml: async (yaml: string): Promise<Deployment> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const name =
      extractYamlValue(yaml, /metadata:\s*[\s\S]*?name:\s*([^\s]+)/) ||
      `deployment-${mockDeployments.length + 1}`;
    const namespace =
      extractYamlValue(yaml, /metadata:\s*[\s\S]*?namespace:\s*([^\s]+)/) ||
      "default";
    const replicas =
      parseInt(extractYamlValue(yaml, /replicas:\s*(\d+)/), 10) || 1;
    const containers =
      extractYamlList(yaml, /-\s*name:\s*([^\s]+)/g) || [];
    const images = extractYamlList(yaml, /image:\s*([^\s]+)/g);
    const newDeployment: Deployment = {
      id: String(mockDeployments.length + 1),
      name,
      namespace,
      replicas: {
        desired: replicas,
        ready: 0,
        updated: 0,
        available: 0,
      },
      status: "pending",
      containers: containers.length > 0 ? containers : ["container-1"],
      images: images.length > 0 ? images : ["image:latest"],
      selector: extractYamlValue(yaml, /selector:\s*([^\n]+)/, `app=${name}`),
      age: "0d",
    };
    mockDeployments.push(newDeployment);
    return newDeployment;
  },

  // Statefulsets
  getStatefulsets: async (): Promise<Statefulset[]> => {
    const response = await api.get("/admin/workloads/statefulsets");
    const statefulsetListResponse = response.data;
    
    // Map từ backend response sang frontend type
    return statefulsetListResponse.statefulsets.map((sts: any) => ({
      id: sts.id || `${sts.name}-${sts.namespace}`,
      name: sts.name,
      namespace: sts.namespace,
      replicas: {
        desired: sts.replicas?.desired || 0,
        ready: sts.replicas?.ready || 0,
      },
      status: sts.status === "running" ? "running" : "error",
      service: sts.service || "",
      containers: sts.containers || [],
      images: sts.images || [],
      age: sts.age || "",
    }));
  },
  createStatefulset: async (data: Omit<Statefulset, "id" | "age">): Promise<Statefulset> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const newStatefulset: Statefulset = {
      ...data,
      containers: data.containers ?? [],
      images: data.images ?? [],
      id: String(mockStatefulsets.length + 1),
      age: "0d",
    };
    mockStatefulsets.push(newStatefulset);
    return newStatefulset;
  },
  createStatefulsetFromYaml: async (yaml: string): Promise<Statefulset> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const name =
      extractYamlValue(yaml, /metadata:\s*[\s\S]*?name:\s*([^\s]+)/) ||
      `statefulset-${mockStatefulsets.length + 1}`;
    const namespace =
      extractYamlValue(yaml, /metadata:\s*[\s\S]*?namespace:\s*([^\s]+)/) ||
      "default";
    const replicas =
      parseInt(extractYamlValue(yaml, /replicas:\s*(\d+)/), 10) || 1;
    const serviceName =
      extractYamlValue(yaml, /serviceName:\s*([^\s]+)/) || `${name}-svc`;
    const containers =
      extractYamlList(yaml, /-\s*name:\s*([^\s]+)/g) || [];
    const images = extractYamlList(yaml, /image:\s*([^\s]+)/g);

    const newStatefulset: Statefulset = {
      id: String(mockStatefulsets.length + 1),
      name,
      namespace,
      replicas: { desired: replicas, ready: 0 },
      status: "running",
      service: serviceName,
      containers: containers.length > 0 ? containers : ["container-1"],
      images: images.length > 0 ? images : ["image:latest"],
      age: "0d",
    };
    mockStatefulsets.push(newStatefulset);
    return newStatefulset;
  },
  updateStatefulset: async (id: string, data: Partial<Statefulset>): Promise<Statefulset> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const index = mockStatefulsets.findIndex((s) => s.id === id);
    if (index === -1) throw new Error("Statefulset not found");
    mockStatefulsets[index] = {
      ...mockStatefulsets[index],
      ...data,
      replicas: {
        desired: data.replicas?.desired ?? mockStatefulsets[index].replicas.desired,
        ready: data.replicas?.ready ?? mockStatefulsets[index].replicas.ready,
      },
      containers: data.containers ?? mockStatefulsets[index].containers,
      images: data.images ?? mockStatefulsets[index].images,
    };
    return mockStatefulsets[index];
  },
  deleteStatefulset: async (id: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const index = mockStatefulsets.findIndex((s) => s.id === id);
    if (index === -1) throw new Error("Statefulset not found");
    mockStatefulsets.splice(index, 1);
  },

  // Services
  getServices: async (): Promise<Service[]> => {
    const response = await api.get("/admin/services");
    const serviceListResponse = response.data;
    
    // Map từ backend response sang frontend type
    return serviceListResponse.services.map((svc: any) => ({
      id: svc.id || `${svc.name}-${svc.namespace}`,
      name: svc.name,
      namespace: svc.namespace,
      type: (svc.type === "ClusterIP" || svc.type === "NodePort" || svc.type === "LoadBalancer") 
        ? svc.type 
        : "ClusterIP",
      clusterIP: svc.clusterIP || "-",
      externalIP: svc.externalIP || "-",
      ports: (svc.ports || []).map((p: any) => ({
        port: p.port || 80,
        targetPort: p.targetPort || p.port || 8080,
        protocol: p.protocol || "TCP",
      })),
      selector: svc.selector || {},
      age: svc.age || "",
    }));
  },
  createService: async (data: Omit<Service, "id" | "age">): Promise<Service> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const newService: Service = {
      ...data,
      externalIP: data.externalIP ?? "-",
      selector: data.selector ?? { app: data.name },
      id: String(mockServices.length + 1),
      age: "0d",
    };
    mockServices.push(newService);
    return newService;
  },
  createServiceFromYaml: async (yaml: string): Promise<Service> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const name =
      extractYamlValue(yaml, /metadata:\s*[\s\S]*?name:\s*([^\s]+)/) ||
      `service-${mockServices.length + 1}`;
    const namespace =
      extractYamlValue(yaml, /metadata:\s*[\s\S]*?namespace:\s*([^\s]+)/) ||
      "default";
    const type =
      (extractYamlValue(
        yaml,
        /spec:\s*[\s\S]*?type:\s*([A-Za-z]+)/,
        "ClusterIP"
      ) as Service["type"]) || "ClusterIP";
    const clusterIP =
      extractYamlValue(yaml, /clusterIP:\s*([^\s]+)/) || "None";
    const externalIP =
      extractYamlValue(yaml, /externalIP[s]?:\s*(?:- )?([^\s]+)/) || "-";
    const selectorMatches = Array.from(
      yaml.matchAll(/selector:\s*([\s\S]*?)ports:/)
    );
    let selector: Record<string, string> | undefined;
    if (selectorMatches.length > 0) {
      const block = selectorMatches[0][1];
      const pairs = Array.from(
        block.matchAll(/([A-Za-z0-9_.-]+):\s*([A-Za-z0-9_.-]+)/g)
      );
      if (pairs.length > 0) {
        selector = Object.fromEntries(
          pairs.map(([, key, value]) => [key, value])
        );
      }
    }
    const portMatches = Array.from(
      yaml.matchAll(/-?\s*port:\s*(\d+)[\s\S]*?targetPort:\s*(\d+)[\s\S]*?protocol:\s*([A-Za-z]+)/g)
    );
    const ports =
      portMatches.length > 0
        ? portMatches.map((match) => ({
            port: parseInt(match[1], 10),
            targetPort: parseInt(match[2], 10),
            protocol: match[3],
          }))
        : [
            {
              port: 80,
              targetPort: 80,
              protocol: "TCP",
            },
          ];

    const newService: Service = {
      id: String(mockServices.length + 1),
      name,
      namespace,
      type,
      clusterIP,
      externalIP,
      ports,
      selector: selector ?? { app: name },
      age: "0d",
    };
    mockServices.push(newService);
    return newService;
  },
  updateService: async (id: string, data: Partial<Service>): Promise<Service> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const index = mockServices.findIndex((s) => s.id === id);
    if (index === -1) throw new Error("Service not found");
    mockServices[index] = {
      ...mockServices[index],
      ...data,
      ports: data.ports ?? mockServices[index].ports,
      selector: data.selector ?? mockServices[index].selector,
      externalIP: data.externalIP ?? mockServices[index].externalIP ?? "-",
    };
    return mockServices[index];
  },
  deleteService: async (id: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const index = mockServices.findIndex((s) => s.id === id);
    if (index === -1) throw new Error("Service not found");
    mockServices.splice(index, 1);
  },

  // Ingress
  getIngress: async (): Promise<Ingress[]> => {
    const response = await api.get("/admin/ingress");
    const ingressListResponse = response.data;
    
    // Map từ backend response sang frontend type
    return ingressListResponse.ingress.map((ing: any) => ({
      id: ing.id || `${ing.name}-${ing.namespace}`,
      name: ing.name,
      namespace: ing.namespace,
      ingressClass: ing.ingressClass || undefined,
      hosts: ing.hosts || [],
      address: ing.address || undefined,
      ports: ing.ports || [80, 443],
      age: ing.age || "",
    }));
  },
  createIngress: async (data: Omit<Ingress, "id" | "age">): Promise<Ingress> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const newIngress: Ingress = {
      ...data,
      ingressClass: data.ingressClass ?? "nginx",
      id: String(mockIngress.length + 1),
      age: "0d",
    };
    mockIngress.push(newIngress);
    return newIngress;
  },
  deleteIngress: async (id: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const index = mockIngress.findIndex((ing) => ing.id === id);
    if (index === -1) throw new Error("Ingress not found");
    mockIngress.splice(index, 1);
  },

  // PVC
  getPVCs: async (): Promise<PVC[]> => {
    const response = await api.get("/admin/storage/pvcs");
    const pvcListResponse = response.data;
    
    // Map từ backend response sang frontend type
    return pvcListResponse.pvcs.map((pvc: any) => ({
      id: pvc.id || `${pvc.name}-${pvc.namespace}`,
      name: pvc.name,
      namespace: pvc.namespace,
      status: (pvc.status === "bound" ? "bound" : "pending") as "bound" | "pending",
      volume: pvc.volume || undefined,
      capacity: pvc.capacity || "",
      accessModes: pvc.accessModes || [],
      storageClass: pvc.storageClass || "",
      volumeAttributesClass: pvc.volumeAttributesClass || undefined,
      volumeMode: pvc.volumeMode || undefined,
      age: pvc.age || "",
    }));
  },
  createPVC: async (data: Omit<PVC, "id" | "age">): Promise<PVC> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const newPVC: PVC = {
      ...data,
      volumeAttributesClass: data.volumeAttributesClass ?? "standard",
      volumeMode: data.volumeMode ?? "Filesystem",
      id: String(mockPVCs.length + 1),
      age: "0d",
    };
    mockPVCs.push(newPVC);
    return newPVC;
  },
  deletePVC: async (id: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const index = mockPVCs.findIndex((pvc) => pvc.id === id);
    if (index === -1) throw new Error("PVC not found");
    mockPVCs.splice(index, 1);
  },

  // PV
  getPVs: async (): Promise<PV[]> => {
    const response = await api.get("/admin/storage/pvs");
    const pvListResponse = response.data;
    
    // Map từ backend response sang frontend type
    return pvListResponse.pvs.map((pv: any) => ({
      id: pv.id || pv.name,
      name: pv.name,
      capacity: pv.capacity || "",
      accessModes: pv.accessModes || [],
      reclaimPolicy: (pv.reclaimPolicy === "Retain" || pv.reclaimPolicy === "Delete" || pv.reclaimPolicy === "Recycle")
        ? pv.reclaimPolicy
        : "Retain",
      status: (pv.status === "available" || pv.status === "bound" || pv.status === "released")
        ? pv.status
        : "available",
      storageClass: pv.storageClass || "",
      claim: pv.claim ? {
        namespace: pv.claim.namespace || "",
        name: pv.claim.name || "",
      } : undefined,
      volumeAttributesClass: pv.volumeAttributesClass || undefined,
      reason: pv.reason || undefined,
      volumeMode: pv.volumeMode || undefined,
      age: pv.age || "",
    }));
  },
  createPV: async (data: Omit<PV, "id" | "age">): Promise<PV> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const newPV: PV = {
      ...data,
      volumeAttributesClass: data.volumeAttributesClass ?? "standard",
      reason: data.reason ?? "-",
      volumeMode: data.volumeMode ?? "Filesystem",
      id: String(mockPVs.length + 1),
      age: "0d",
    };
    mockPVs.push(newPV);
    return newPV;
  },
  deletePV: async (id: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const index = mockPVs.findIndex((pv) => pv.id === id);
    if (index === -1) throw new Error("PV not found");
    mockPVs.splice(index, 1);
  },
  // User Management
  getOverview: async (): Promise<AdminOverviewResponse> => {
    const response = await api.get("/admin/user-services/overview");
    return response.data;
  },
  getUserUsage: async (): Promise<AdminUserUsageResponse> => {
    const response = await api.get("/admin/user-services/users");
    return response.data;
  },
  getAdminUsers: async (): Promise<AdminUser[]> => {
    // Gọi API thật để lấy dữ liệu
    const response = await api.get("/admin/user-services/users");
    const userUsageResponse: AdminUserUsageResponse = response.data;
    
    // Map dữ liệu từ API response sang format AdminUser
    return userUsageResponse.users.map((user) => {
      const isPremium = user.tier.toLowerCase() === "premium";
      // Ước tính total dựa trên tier (vì API không trả về capacity)
      // Premium: total cao hơn, Standard: total thấp hơn
      const cpuTotal = isPremium 
        ? Math.max(user.cpuCores * 1.5, 200) // Premium: ít nhất 200 cores hoặc 1.5x used
        : Math.max(user.cpuCores * 1.3, 100); // Standard: ít nhất 100 cores hoặc 1.3x used
      const memoryTotal = isPremium
        ? Math.max(user.memoryGb * 1.5, 320) // Premium: ít nhất 320 GB hoặc 1.5x used
        : Math.max(user.memoryGb * 1.3, 128); // Standard: ít nhất 128 GB hoặc 1.3x used
      
      return {
        id: String(user.id),
        name: user.fullname,
        username: user.username,
        tier: (isPremium ? "premium" : "standard") as "premium" | "standard",
        email: "", // API không trả về email, để trống
        projectCount: user.projectCount,
        cpuUsage: {
          used: user.cpuCores,
          total: Math.round(cpuTotal),
        },
        memoryUsage: {
          used: user.memoryGb,
          total: Math.round(memoryTotal),
        },
      };
    });
  },
  getUserProjects: async (userId: string): Promise<AdminUserProject[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockUserProjects[userId] ?? [];
  },
  getProjectDetail: async (projectId: string): Promise<AdminProjectDetail> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const detail = mockProjectDetails[projectId];
    if (!detail) {
      throw new Error("Project not found");
    }
    return detail;
  },
  getAdminAccounts: async (): Promise<AdminAccount[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockAdminAccounts;
  },
  updateAdminAccountStatus: async (id: string, status: AdminAccount["status"]): Promise<AdminAccount> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const account = mockAdminAccounts.find((acc) => acc.id === id);
    if (!account) throw new Error("Account not found");
    account.status = status;
    account.lastLogin = status === "active" ? new Date().toISOString() : account.lastLogin;
    return account;
  },
  resetAdminAccountPassword: async (id: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const account = mockAdminAccounts.find((acc) => acc.id === id);
    if (!account) throw new Error("Account not found");
  },
  // Cluster Resources
  getClusterCapacity: async (): Promise<ClusterCapacityResponse> => {
    const response = await api.get("/admin/cluster/capacity");
    return response.data;
  },
  getClusterAllocatable: async (): Promise<ClusterAllocatableResponse> => {
    const response = await api.get("/admin/cluster/allocatable");
    return response.data;
  },
  getUserSummary: async (userId: string): Promise<AdminUserProjectSummaryResponse> => {
    const response = await api.get("/admin/user-services/user-summary", {
      params: { userId },
    });
    return response.data;
  },
  getUserProjectsDetail: async (userId: string): Promise<AdminUserProjectListResponse> => {
    const response = await api.get("/admin/user-services/user-projects", {
      params: { userId },
    });
    return response.data;
  },
  getProjectResources: async (projectId: string): Promise<AdminProjectResourceDetailResponse> => {
    const response = await api.get("/admin/user-services/project-resources", {
      params: { projectId },
    });
    return response.data;
  },
  getDatabaseDetail: async (databaseId: string): Promise<AdminDatabaseDetailResponse> => {
    const response = await api.get("/admin/database/detail", {
      params: { databaseId },
    });
    return response.data;
  },
  getBackendDetail: async (backendId: string): Promise<AdminBackendDetailResponse> => {
    const response = await api.get("/admin/backend/detail", {
      params: { backendId },
    });
    return response.data;
  },
  getFrontendDetail: async (frontendId: string): Promise<AdminFrontendDetailResponse> => {
    const response = await api.get("/admin/frontend/detail", {
      params: { frontendId },
    });
    return response.data;
  },
};

