# 🧩 PROMPT YÊU CẦU AI TẠO GIAO DIỆN REACT — DASHBOARD ADMIN QUẢN LÝ INFRASTRUCTURE

> **Mục tiêu**: Sinh ra một giao diện web **đẹp, hiện đại** (không lỗi thời), tập trung **quản lý infrastructure và cluster** cho người dùng **ROLE=ADMIN**, tương tự Kubernetes Dashboard hoặc Rancher UI.

---

## 1) Bối cảnh & giới hạn kỹ thuật
- **Stack bắt buộc**: React + Vite, **TailwindCSS**, **shadcn/ui** (Card, Button, Tabs, Dialog, Table, Badge, Tooltip, Alert, Toast, Sidebar/Navigation), **lucide-react** (icon), **framer-motion** (animation nhẹ nhàng).
- **Không dùng quá nhiều công nghệ** phức tạp. Tránh Redux, chỉ dùng **Context** hoặc **Zustand** nếu thật sự cần.
- **Màu chủ đạo**: **Trắng + Xanh** (#0ea5e9 hoặc #2563eb làm primary). Hỗ trợ **dark mode** cơ bản.
- **Đối tượng**: Người dùng có role **ADMIN** (quản trị hệ thống). Hiển thị đầy đủ chức năng quản lý infrastructure.
- **Ngôn ngữ UI**: Tiếng Việt (vi), văn phong chuyên nghiệp.
- **Responsive**: Mobile-first, tốt trên 1280px trở lên. **Sidebar có thể thu gọn** trên mobile.

## 2) Trang & chức năng bắt buộc

### A. **Layout chính với Sidebar Navigation**
- **Sidebar bên trái** (có thể thu gọn): Logo, menu điều hướng với **các danh mục cha và con**:
  - **Infrastructure**
    - Server
    - Cluster
  - **Cluster & Overview**
    - Overview
    - Nodes
    - Namespace
  - **Workloads**
    - Deployments
    - Pods
    - Statefulset
  - **Service Discovery**
    - Services
    - Ingress
  - **Storage**
    - PVC (PersistentVolumeClaim)
    - PV (PersistentVolume)
- **Header phía trên**: Breadcrumb, thông tin user (avatar, role=ADMIN), toggle dark mode, logout.
- **Content area**: Hiển thị nội dung trang tương ứng với menu đã chọn.

### B. **Trang Dashboard/Overview** (`/admin/overview`)
- **Metrics tổng quan**: Cards hiển thị số liệu:
  - Tổng số **Nodes** (Healthy/Unhealthy)
  - Tổng số **Pods** (Running/Pending/Failed)
  - Tổng số **Deployments** (Active/Error)
  - **CPU/Memory usage** (progress bar hoặc chart)
- **Biểu đồ**: CPU/Memory usage theo thời gian (mock chart với recharts hoặc chart.js).
- **Danh sách nhanh**: Top 5 Pods đang chạy, Top 5 Namespace theo resource usage.
- **Timeline sự kiện gần đây**: Lịch sử thay đổi (mock).

### C. **Trang Infrastructure**

#### C1. **Server** (`/admin/infrastructure/servers`)
- **Bảng danh sách servers**: 
  - Cột: **Tên**, **IP Address**, **Status** (Online/Offline), **CPU/Memory**, **OS**, **Thời gian cập nhật**, **Hành động** (Xem chi tiết, Sửa, Xóa).
- **Thanh công cụ**: Tìm kiếm, lọc theo status, sắp xếp, **Nút "Thêm Server"**.
- **Modal/Dialog thêm/sửa Server**: Form với các trường: Tên, IP, Port SSH, Username, Key/Password, OS Type, Tags.
- **Trang chi tiết Server**: Tabs (Thông tin, Metrics, Logs, Services đang chạy).

#### C2. **Cluster** (`/admin/infrastructure/clusters`)
- **Bảng danh sách clusters**:
  - Cột: **Tên**, **Version** (K8s version), **Nodes** (số lượng), **Status** (Healthy/Unhealthy), **Provider** (Local/Cloud), **Thời gian tạo**, **Hành động**.
- **Thanh công cụ**: Tìm kiếm, lọc, **Nút "Tạo Cluster"**.
- **Modal tạo Cluster**: Form cấu hình cluster (tên, version, provider, nodes ban đầu).
- **Trang chi tiết Cluster**: Tabs (Thông tin, Nodes, Workloads, Services, Storage).

### D. **Trang Cluster & Overview**

#### D1. **Overview** (`/admin/cluster/overview`)
- Tương tự trang Dashboard nhưng tập trung vào **một cluster cụ thể** (nếu có nhiều cluster).
- Hiển thị: Resource usage của cluster, danh sách nodes, workloads summary.

#### D2. **Nodes** (`/admin/cluster/nodes`)
- **Bảng danh sách nodes**:
  - Cột: **Tên**, **Status** (Ready/NotReady), **Roles** (Master/Worker), **CPU** (requested/limit), **Memory** (requested/limit), **Pods** (số lượng), **OS**, **Kernel**, **Thời gian cập nhật**, **Hành động**.
- **Thanh công cụ**: Tìm kiếm, lọc theo status/role, **Nút "Thêm Node"** (nếu có quyền).
- **Trang chi tiết Node**: Tabs (Thông tin, Pods, Metrics, Events, Logs).

#### D3. **Namespace** (`/admin/cluster/namespaces`)
- **Bảng danh sách namespaces**:
  - Cột: **Tên**, **Status** (Active/Terminating), **Labels**, **Age**, **Resource Quota** (CPU/Memory), **Hành động**.
- **Thanh công cụ**: Tìm kiếm, lọc, **Nút "Tạo Namespace"**.
- **Modal tạo Namespace**: Form (tên, labels, resource quota).
- **Trang chi tiết Namespace**: Tabs (Thông tin, Workloads, Services, Storage, Events).

### E. **Trang Workloads**

#### E1. **Deployments** (`/admin/workloads/deployments`)
- **Bảng danh sách deployments**:
  - Cột: **Tên**, **Namespace**, **Replicas** (desired/ready), **Status** (Running/Error), **Image**, **Age**, **Hành động** (Scale, Restart, Edit, Delete, View Logs).
- **Thanh công cụ**: Tìm kiếm, lọc theo namespace/status, **Nút "Tạo Deployment"**.
- **Modal tạo/sửa Deployment**: Form với các trường: Tên, Namespace, Replicas, Image, Ports, Env vars, Resource limits/requests, Labels.
- **Trang chi tiết Deployment**: Tabs (Thông tin, Pods, Replica Sets, Events, Logs).

#### E2. **Pods** (`/admin/workloads/pods`)
- **Bảng danh sách pods**:
  - Cột: **Tên**, **Namespace**, **Node**, **Status** (Running/Pending/Failed/Succeeded), **Restarts**, **CPU/Memory**, **Age**, **Hành động** (View Logs, Describe, Delete, Exec vào pod).
- **Thanh công cụ**: Tìm kiếm, lọc theo namespace/status/node, **Refresh**.
- **Trang chi tiết Pod**: Tabs (Thông tin, Containers, Logs, Events, YAML).

#### E3. **Statefulset** (`/admin/workloads/statefulsets`)
- **Bảng danh sách statefulsets**:
  - Cột: **Tên**, **Namespace**, **Replicas**, **Status**, **Service**, **Age**, **Hành động**.
- **Thanh công cụ**: Tìm kiếm, lọc, **Nút "Tạo Statefulset"**.
- **Modal tạo/sửa Statefulset**: Form tương tự Deployment nhưng có thêm Volume Claims.
- **Trang chi tiết Statefulset**: Tabs (Thông tin, Pods, Volume Claims, Events).

### F. **Trang Service Discovery**

#### F1. **Services** (`/admin/services`)
- **Bảng danh sách services**:
  - Cột: **Tên**, **Namespace**, **Type** (ClusterIP/NodePort/LoadBalancer), **Cluster IP**, **Ports**, **Selector**, **Age**, **Hành động**.
- **Thanh công cụ**: Tìm kiếm, lọc, **Nút "Tạo Service"**.
- **Modal tạo/sửa Service**: Form (tên, namespace, type, ports, selector, labels).
- **Trang chi tiết Service**: Tabs (Thông tin, Endpoints, Events).

#### F2. **Ingress** (`/admin/ingress`)
- **Bảng danh sách ingress**:
  - Cột: **Tên**, **Namespace**, **Hosts**, **Address**, **Ports**, **Age**, **Hành động**.
- **Thanh công cụ**: Tìm kiếm, lọc, **Nút "Tạo Ingress"**.
- **Modal tạo/sửa Ingress**: Form (tên, namespace, rules, tls, annotations).
- **Trang chi tiết Ingress**: Tabs (Thông tin, Rules, Events).

### G. **Trang Storage**

#### G1. **PVC** (`/admin/storage/pvc`)
- **Bảng danh sách PVCs**:
  - Cột: **Tên**, **Namespace**, **Status** (Bound/Pending), **Volume**, **Capacity**, **Access Modes**, **Storage Class**, **Age**, **Hành động**.
- **Thanh công cụ**: Tìm kiếm, lọc, **Nút "Tạo PVC"**.
- **Modal tạo/sửa PVC**: Form (tên, namespace, storage class, access modes, size).
- **Trang chi tiết PVC**: Tabs (Thông tin, Pods sử dụng, Events).

#### G2. **PV** (`/admin/storage/pv`)
- **Bảng danh sách PVs**:
  - Cột: **Tên**, **Capacity**, **Access Modes**, **Reclaim Policy**, **Status** (Available/Bound/Released), **Storage Class**, **Claim**, **Age**, **Hành động**.
- **Thanh công cụ**: Tìm kiếm, lọc, **Nút "Tạo PV"**.
- **Modal tạo/sửa PV**: Form (tên, storage class, capacity, access modes, reclaim policy, nfs/hostPath config).
- **Trang chi tiết PV**: Tabs (Thông tin, Claims, Events).

## 3) UX/UI & tương tác
- **Sidebar Navigation**: 
  - Menu cha có thể **mở rộng/thu gọn** (accordion).
  - **Highlight** menu item đang active.
  - **Icon** cho mỗi menu item.
  - **Badge** hiển thị số lượng (nếu có, ví dụ: số pods đang lỗi).
- Sử dụng **Table** với sorting, pagination, row selection.
- **Card** cho metrics, **Tabs** cho chi tiết, **Dialog/Modal** cho form thêm/sửa.
- **Empty state** có minh hoạ icon + hướng dẫn.
- **Skeleton**/loading shimmer; **Toast** cho thông báo; **Tooltip** giải thích thuật ngữ.
- **Form validation**: Kiểm tra định dạng IP, port, resource limits hợp lệ.
- **Accessibility**: Keyboard navigation, focus ring, ARIA labels.
- **Animation nhẹ** với framer-motion (fade/slide trong modal, sidebar collapse).

## 4) Dữ liệu & API (mock trước, thật sau)
- Thiết kế **model** (TypeScript) và seed **mock data** để demo UI.
```ts
// Server
export type Server = {
  id: string;
  name: string;
  ipAddress: string;
  port?: number;
  status: "online" | "offline";
  cpu: { used: number; total: number };
  memory: { used: number; total: number };
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
  createdAt: string;
};

// Node
export type Node = {
  id: string;
  name: string;
  status: "ready" | "notready";
  roles: ("master" | "worker")[];
  cpu: { requested: number; limit: number; capacity: number };
  memory: { requested: number; limit: number; capacity: number };
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
  replicas: { desired: number; ready: number };
  status: "running" | "error" | "pending";
  image: string;
  age: string;
};

// Pod
export type Pod = {
  id: string;
  name: string;
  namespace: string;
  node: string;
  status: "running" | "pending" | "failed" | "succeeded";
  restarts: number;
  cpu?: number;
  memory?: number;
  age: string;
};

// Statefulset
export type Statefulset = {
  id: string;
  name: string;
  namespace: string;
  replicas: { desired: number; ready: number };
  status: "running" | "error";
  service: string;
  age: string;
};

// Service
export type Service = {
  id: string;
  name: string;
  namespace: string;
  type: "ClusterIP" | "NodePort" | "LoadBalancer";
  clusterIP: string;
  ports: { port: number; targetPort: number; protocol: string }[];
  selector?: Record<string, string>;
  age: string;
};

// Ingress
export type Ingress = {
  id: string;
  name: string;
  namespace: string;
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
  age: string;
};
```

- Chuẩn bị **service giả** cho mỗi resource:
  - `GET /api/admin/servers`, `GET /api/admin/servers/:id`, `POST /api/admin/servers`, `PUT /api/admin/servers/:id`, `DELETE /api/admin/servers/:id`
  - `GET /api/admin/clusters`, `GET /api/admin/clusters/:id`, `POST /api/admin/clusters`
  - `GET /api/admin/nodes`, `GET /api/admin/nodes/:id`
  - `GET /api/admin/namespaces`, `POST /api/admin/namespaces`
  - `GET /api/admin/deployments`, `GET /api/admin/deployments/:id`, `POST /api/admin/deployments`, `PUT /api/admin/deployments/:id`, `DELETE /api/admin/deployments/:id`
  - `GET /api/admin/pods`, `GET /api/admin/pods/:id`, `DELETE /api/admin/pods/:id`
  - `GET /api/admin/statefulsets`, `POST /api/admin/statefulsets`
  - `GET /api/admin/services`, `POST /api/admin/services`
  - `GET /api/admin/ingress`, `POST /api/admin/ingress`
  - `GET /api/admin/pvc`, `POST /api/admin/pvc`
  - `GET /api/admin/pv`, `POST /api/admin/pv`

## 5) Yêu cầu output từ AI
- **Sinh mã nguồn đầy đủ chạy ngay** (Vite + React + Tailwind đã cấu hình). Dùng **shadcn/ui** đúng chuẩn import. Có `README.md` hướng dẫn `pnpm i && pnpm dev`.
- Tối thiểu các **route**:
  - `/admin/overview` — Dashboard tổng quan
  - `/admin/infrastructure/servers` — Quản lý servers
  - `/admin/infrastructure/clusters` — Quản lý clusters
  - `/admin/cluster/nodes` — Quản lý nodes
  - `/admin/cluster/namespaces` — Quản lý namespaces
  - `/admin/workloads/deployments` — Quản lý deployments
  - `/admin/workloads/pods` — Quản lý pods
  - `/admin/workloads/statefulsets` — Quản lý statefulsets
  - `/admin/services` — Quản lý services
  - `/admin/ingress` — Quản lý ingress
  - `/admin/storage/pvc` — Quản lý PVCs
  - `/admin/storage/pv` — Quản lý PVs
- **Thư mục đề xuất**:
```
src/
  components/
    admin/
      Sidebar.tsx
      Header.tsx
      ResourceTable.tsx
      MetricsCard.tsx
      ResourceForm.tsx
  pages/
    admin/
      Overview.tsx
      infrastructure/
        Servers.tsx
        Clusters.tsx
      cluster/
        Nodes.tsx
        Namespaces.tsx
      workloads/
        Deployments.tsx
        Pods.tsx
        Statefulsets.tsx
      services/
        Services.tsx
        Ingress.tsx
      storage/
        PVC.tsx
        PV.tsx
  stores/ (zustand hoặc context cho admin state)
  lib/
    admin-api.ts (mock API)
    utils.ts
  types/
    admin.ts (types cho admin resources)
```
- **Chú thích code bằng tiếng Việt ngắn gọn**, tập trung vào logic và luồng dữ liệu.
- **Đảm bảo không lỗi build**, có **eslint cấu hình cơ bản** (không bắt buộc cứng nhắc).

## 6) Ràng buộc & kiểm thử UI
- **Sidebar** phải có thể **collapse/expand** (thu gọn/mở rộng).
- **Menu cha** phải có thể **mở rộng/thu gọn** để hiển thị menu con.
- **Breadcrumb** phải hiển thị đúng đường dẫn hiện tại.
- Form **validation** đầy đủ (IP, port, resource limits hợp lệ).
- **Table** phải có pagination, sorting, filtering.
- **Modal/Dialog** phải có thể đóng bằng ESC hoặc click outside.
- **Responsive**: Sidebar chuyển thành drawer trên mobile.

## 7) Nội dung hiển thị trong UI
- **Tooltip** giải thích các thuật ngữ Kubernetes (Pod, Deployment, Service, Ingress, PVC, PV).
- **Badge** hiển thị status với màu sắc phù hợp:
  - Running/Ready/Healthy: Xanh lá
  - Pending: Vàng
  - Error/Failed/Unhealthy: Đỏ
  - Terminating: Cam
- **Empty state** có hướng dẫn tạo resource đầu tiên.
- **Loading state** với skeleton cho table và cards.

## 8) Những gì **KHÔNG** cần làm
- Không cài Kubernetes thật / kubeconfig thật. Chỉ **mock** API.
- Không cần auth phức tạp — giả lập user đã đăng nhập & role=ADMIN.
- Không cần tích hợp thật với kubectl hoặc Kubernetes API server.

---

## 📝 CÂU LỆNH PROMPT GỢI Ý (DÁN THẲNG CHO AI)

**Hãy tạo cho tôi một ứng dụng React Dashboard Admin (Vite + Tailwind + shadcn/ui + lucide-react + framer-motion) với các yêu cầu sau:**

1) **Layout & Navigation**
- **Sidebar bên trái** với menu điều hướng có **danh mục cha và con**:
  - Infrastructure: Server, Cluster
  - Cluster & Overview: Overview, Nodes, Namespace
  - Workloads: Deployments, Pods, Statefulset
  - Service Discovery: Services, Ingress
  - Storage: PVC, PV
- Sidebar có thể **collapse/expand**, menu cha có thể **mở rộng/thu gọn**.
- **Header** với breadcrumb, user info, dark mode toggle.

2) **Trang & chức năng**
- **Dashboard/Overview**: Metrics tổng quan, biểu đồ CPU/Memory, danh sách nhanh.
- **Infrastructure**: Quản lý Servers và Clusters (CRUD đầy đủ).
- **Cluster & Overview**: Quản lý Nodes, Namespaces (CRUD).
- **Workloads**: Quản lý Deployments, Pods, Statefulsets (CRUD, scale, restart, logs).
- **Service Discovery**: Quản lý Services, Ingress (CRUD).
- **Storage**: Quản lý PVC, PV (CRUD).

3) **UI/UX**
- Màu **Trắng + Xanh**, hiện đại, responsive, có dark mode.
- Dùng **Table** với sorting/pagination, **Card** cho metrics, **Tabs** cho chi tiết, **Dialog** cho form.
- **Badge** status với màu sắc phù hợp, **Tooltip** giải thích thuật ngữ.
- **Skeleton** loading, **Toast** thông báo, **Empty state** có hướng dẫn.

4) **Tính năng**
- Mock API cho tất cả resources (GET/POST/PUT/DELETE).
- Seed data đầy đủ để demo UI.
- Form validation (IP, port, resource limits).
- **Breadcrumb** tự động theo route.

5) **Code**
- Viết bằng TypeScript, chú thích **tiếng Việt**.
- Cấu trúc thư mục rõ ràng; có `README.md` hướng dẫn chạy.
- Không dùng Redux; nếu cần state global thì dùng Context/Zustand nhẹ.

6) **Kết quả bàn giao**
- Repo chạy ngay: `pnpm i && pnpm dev`.
- Không mắc lỗi build/TS.
- Sidebar và menu hoạt động mượt mà.

> **Lưu ý**: Đối tượng sử dụng là **ADMIN** (quản trị hệ thống). Hãy đảm bảo thiết kế chuyên nghiệp, gọn gàng, có skeleton loading, empty states, và animation nhẹ nhàng. Menu điều hướng phải rõ ràng, dễ sử dụng.

---

## 📦 Tuỳ chọn mở rộng (nếu có thời gian)
- Thêm **YAML Editor** để xem/sửa resource dưới dạng YAML.
- Thêm **Logs Viewer** với syntax highlighting và filter.
- Thêm **Metrics Dashboard** với biểu đồ real-time (mock).
- Thêm **Events Timeline** cho từng resource.
- Thêm **Resource Quota** visualization.
- Thêm **Network Policy** management.

---

### Gợi ý "chốt" khi gửi prompt
- "Nếu chỗ nào chưa rõ, **hãy tự đề xuất mặc định hợp lý** thay vì dừng lại hỏi."
- "Hãy ưu tiên **độ mượt UI/UX** và **tính chuyên nghiệp** của dashboard admin."
- "Đảm bảo **Sidebar navigation** hoạt động mượt mà với menu cha/con và collapse/expand."

