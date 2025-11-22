/**
 * Types cho Admin Dashboard - Quản lý Infrastructure và Cluster
 */

// Server
export type Server = {
  id: string;
  name: string;
  ipAddress: string;
  port?: number;
  username?: string;
  password?: string; // Không hiển thị trong UI, chỉ dùng để lưu
  status: "online" | "offline";
  cpu: { used: number; total: number };
  memory: { used: number; total: number };
  disk: { used: number; total: number };
  os: string;
  updatedAt: string;
};

// Cluster
export type Cluster = {
  id: string;
  name: string;
  version: string;
  nodeCount: number;
  status: "healthy" | "unhealthy";
  provider: "local" | "aws" | "gcp" | "azure";
  serverIds: string[]; // Danh sách ID của các server trong cluster
  serverRoles: Record<string, "master" | "worker">; // Map serverId -> role
  createdAt: string;
};

// Node
export type Node = {
  id: string;
  name: string;
  status: "ready" | "notready";
  role: "master" | "worker";
  cpu: { requested: number; limit: number; capacity: number };
  memory: { requested: number; limit: number; capacity: number };
  disk: { requested: number; limit: number; capacity: number };
  podCount: number;
  os: string;
  kernel: string;
  updatedAt: string;
};

// Namespace
export type Namespace = {
  id: string;
  name: string;
  status: "active" | "terminating";
  labels?: Record<string, string>;
  resourceQuota?: {
    cpu: { limit: number; used: number };
    memory: { limit: number; used: number };
  };
  age: string;
};

// Deployment
export type Deployment = {
  id: string;
  name: string;
  namespace: string;
  replicas: { desired: number; ready: number; updated: number; available: number };
  status: "running" | "error" | "pending";
  containers: string[];
  images: string[];
  selector: string;
  age: string;
};

// Pod
export type Pod = {
  id: string;
  name: string;
  namespace: string;
  ready: { ready: number; total: number };
  node: string;
  status: "running" | "pending" | "failed" | "succeeded";
  restarts: number;
  age: string;
  ip: string;
  nominatedNode?: string;
  readinessGates?: string[];
};

// Statefulset
export type Statefulset = {
  id: string;
  name: string;
  namespace: string;
  replicas: { desired: number; ready: number };
  status: "running" | "error";
  service: string;
  containers: string[];
  images: string[];
  age: string;
};

// Service
export type Service = {
  id: string;
  name: string;
  namespace: string;
  type: "ClusterIP" | "NodePort" | "LoadBalancer";
  clusterIP: string;
  externalIP?: string;
  ports: { port: number; targetPort: number; protocol: string }[];
  selector?: Record<string, string>;
  age: string;
};

// Ingress
export type Ingress = {
  id: string;
  name: string;
  namespace: string;
  ingressClass?: string;
  hosts: string[];
  address?: string;
  ports: number[];
  age: string;
};

// PVC
export type PVC = {
  id: string;
  name: string;
  namespace: string;
  status: "bound" | "pending";
  volume?: string;
  capacity: string;
  accessModes: string[];
  storageClass: string;
  volumeAttributesClass?: string;
  volumeMode?: string;
  age: string;
};

// PV
export type PV = {
  id: string;
  name: string;
  capacity: string;
  accessModes: string[];
  reclaimPolicy: "Retain" | "Delete" | "Recycle";
  status: "available" | "bound" | "released";
  storageClass: string;
  claim?: { namespace: string; name: string };
  volumeAttributesClass?: string;
  reason?: string;
  volumeMode?: string;
  age: string;
};

// Admin User Management
export type AdminUser = {
  id: string;
  name: string;
  username: string;
  tier: "standard" | "premium";
  email: string;
  projectCount: number;
  cpuUsage: { used: number; total: number };
  memoryUsage: { used: number; total: number };
};

export type AdminUserProject = {
  id: string;
  name: string;
  databaseCount: number;
  backendCount: number;
  frontendCount: number;
  cpuUsage: { used: number; total: number };
  memoryUsage: { used: number; total: number };
};

export type AdminProjectComponent = {
  id: string;
  name: string;
  status: "running" | "stopped" | "error";
  cpu: string;
  memory: string;
  replicas?: string;
  projectName?: string;
  cpuUsed?: string;
  memoryUsed?: string;
  ip?: string;
  port?: number;
  databaseName?: string;
  dbUsername?: string;
  dbPassword?: string;
  node?: string;
  pvc?: string;
  pv?: string;
};

export type AdminProjectDetail = {
  id: string;
  name: string;
  databases: AdminProjectComponent[];
  backends: AdminProjectComponent[];
  frontends: AdminProjectComponent[];
};

export type AdminAccount = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: "ADMIN" | "DEVOPS" | "USER";
  tier: "standard" | "premium";
  status: "active" | "inactive" | "pending";
  projectCount: number;
  services: number;
  createdAt: string;
  lastLogin: string;
};

// Dashboard Overview Metrics
export type DashboardMetrics = {
  nodes: { total: number; healthy: number; unhealthy: number };
  pods: { total: number; running: number; pending: number; failed: number };
  deployments: { total: number; active: number; error: number };
  cpuUsage: { used: number; total: number };
  memoryUsage: { used: number; total: number };
};

// Admin User Services API Responses
export type AdminOverviewResponse = {
  totalUsers: number;
  totalProjects: number;
  totalCpuCores: number;
  totalMemoryGb: number;
};

export type AdminUserUsageResponse = {
  users: Array<{
    id: number;
    fullname: string;
    username: string;
    projectCount: number;
    tier: string;
    cpuCores: number;
    memoryGb: number;
  }>;
};

export type ClusterCapacityResponse = {
  totalCpuCores: number;
  totalMemoryGb: number;
};

export type ClusterAllocatableResponse = {
  totalCpuCores: number;
  totalMemoryGb: number;
};

export type AdminUserProjectSummaryResponse = {
  userId: number;
  fullname: string;
  username: string;
  projectCount: number;
  cpuCores: number;
  memoryGb: number;
};

export type AdminUserProjectListResponse = {
  userId: number;
  fullname: string;
  username: string;
  projects: Array<{
    projectId: number;
    projectName: string;
    databaseCount: number;
    backendCount: number;
    frontendCount: number;
    cpuCores: number;
    memoryGb: number;
  }>;
};

export type AdminProjectResourceDetailResponse = {
  projectId: number;
  projectName: string;
  totalCpuCores: number;
  totalMemoryGb: number;
  databases: Array<{
    id: number;
    projectName: string;
    status: string;
    cpuCores: number;
    memoryGb: number;
  }>;
  backends: Array<{
    id: number;
    projectName: string;
    status: string;
    cpuCores: number;
    memoryGb: number;
  }>;
  frontends: Array<{
    id: number;
    projectName: string;
    status: string;
    cpuCores: number;
    memoryGb: number;
  }>;
};

export type AdminDatabaseDetailResponse = {
  databaseId: number;
  databaseType: string;
  databaseIp: string;
  databasePort: number;
  databaseName: string;
  databaseUsername: string;
  databasePassword: string;
  podName?: string;
  podNode?: string;
  podStatus?: string;
  serviceName?: string;
  serviceExternalIp?: string;
  servicePort?: number;
  statefulSetName?: string;
  pvcName?: string;
  pvcStatus?: string;
  pvcVolume?: string;
  pvcCapacity?: string;
  pvName?: string;
  pvCapacity?: string;
  pvNode?: string;
};

