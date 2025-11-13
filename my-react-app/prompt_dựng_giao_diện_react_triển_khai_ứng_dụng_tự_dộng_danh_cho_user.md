# 🧩 PROMPT YÊU CẦU AI TẠO GIAO DIỆN REACT — NỀN TẢNG TRIỂN KHAI ỨNG DỤNG TỰ ĐỘNG (DÀNH CHO USER)

> **Mục tiêu**: Sinh ra một giao diện web **đẹp, hiện đại** (không lỗi thời), tập trung **đơn giản hoá cho người dùng ROLE=USER** việc tạo/quan sát/triển khai project đa thành phần (database, backend, frontend) tương tự Vercel.

---

## 1) Bối cảnh & giới hạn kỹ thuật
- **Stack bắt buộc**: React + Vite, **TailwindCSS**, **shadcn/ui** (Card, Button, Tabs, Dialog, Stepper/Progress, Badge, Tooltip, Alert, Toast), **lucide-react** (icon), **framer-motion** (animation nhẹ nhàng).
- **Không dùng quá nhiều công nghệ** phức tạp. Tránh Redux, chỉ dùng **Context** hoặc **Zustand** nếu thật sự cần.
- **Màu chủ đạo**: **Trắng + Xanh** (#0ea5e9 hoặc #2563eb làm primary). Hỗ trợ **dark mode** cơ bản.
- **Đối tượng**: Người dùng có role **USER** (không phải admin). Ẩn các chức năng quản trị.
- **Ngôn ngữ UI**: Tiếng Việt (vi), văn phong thân thiện.
- **Responsive**: Mobile-first, tốt trên 1280px trở lên.

## 2) Trang & chức năng bắt buộc
### A. Trang **Quản lý Project** (Danh sách)
- Lưới/Card các project với: **Tên**, **Mô tả ngắn**, **Trạng thái** (badge: Đang chạy / Lỗi / Đang triển khai / Tạm dừng), **Số thành phần** (DB/BE/FE), **Thời gian cập nhật**, **Nút Xem chi tiết**.
- Thanh **tìm kiếm**, **lọc** theo trạng thái, **sắp xếp** theo thời gian/cái tên.
- CTA nổi **“Tạo Project”**.

### B. Trang **Chi tiết Project**
- Header: Tên, mô tả, trạng thái tổng (progress/health), các **DNS** chính.
- Tabs: **Tổng quan**, **Database**, **Backend**, **Frontend**, **Lịch sử triển khai**.
- Mỗi thành phần hiển thị: **trạng thái**, **DNS/Endpoint**, **version/tag**, **thời gian cập nhật**, **log ngắn** (nếu có), **hành động** (xem chi tiết, redeploy) — mock hành động.

### C. Trang **Tạo Project** (Wizard nhiều bước)
- Thanh **stepper**: 1) Database → 2) Backend → 3) Frontend → 4) **Tổng quan & Xác nhận**.
- **Step Database**:
  - Chọn: **Dùng DB của người dùng** _hoặc_ **Dùng DB do hệ thống cấp**.
  - Nếu **DB người dùng**: nhập **IP, Port, Username, Password**, **file dữ liệu (.zip)**. Kiểm tra định dạng file và cảnh báo.
  - Nếu **DB hệ thống**: chọn **MySQL** hoặc **MongoDB**, upload **.zip** dữ liệu (tuỳ chọn), cảnh báo: *“Chỉ thao tác qua ứng dụng, không cấp quyền đăng nhập DB”*.
  - **Nút “Thêm Database”** để thêm nhiều DB (dynamic list). Có **xoá/sửa** từng DB.
  - **Panel Hướng dẫn** bên phải: mô tả yêu cầu file, ví dụ cấu trúc **.zip** (thư mục gốc trùng tên), ví dụ **.sql**/**dump**.
- **Step Backend**:
  - Cho phép **nhiều backend**. Trường: **Tên**, **Công nghệ** (Spring Boot/Node.js), **Nguồn**: *Upload .zip* **hoặc** *Docker Image* (`repo:tag`).
  - Nếu upload: hiển thị quy định **.zip**: *tên thư mục gốc trùng tên dự án; với Spring Boot có `pom.xml`/`build.gradle`; Node có `package.json`*.
  - Nếu Docker Image: validate định dạng `owner/name:tag`.
  - **Env**: bảng key/value (thêm dòng), gợi ý `SPRING_DATASOURCE_URL`, ...
  - Hướng dẫn & ví dụ.
- **Step Frontend**:
  - Cho phép **nhiều frontend**. Trường: **Tên**, **Công nghệ** (React/Vue/Angular – chỉ dùng để hiển thị), **Nguồn**: *Upload .zip* **hoặc** *Docker Image*.
  - **Config build** (nếu .zip): **build command**, **output dir** (ví dụ `dist/`).
  - **Runtime ENV**: key/value (ví dụ `VITE_API_BASE_URL`).
  - Hướng dẫn & ví dụ.
- **Step Tổng quan**:
  - Bảng tổng hợp: danh sách DB/BE/FE đã khai báo, hiển thị tóm tắt cấu hình.
  - Checkbox **xác nhận điều khoản** mock.
  - **Nút “Xác nhận triển khai”** (gọi **API mock**; hiển thị toast thành công + điều hướng tới chi tiết project).
- Mỗi step có **Back/Next**, **Auto-save draft** vào localStorage.

## 3) UX/UI & tương tác
- Sử dụng **Card** + **Grid** cho danh sách, **Tabs** cho chi tiết, **Drawer/Dialog** cho thêm/sửa thành phần.
- **Empty state** có minh hoạ icon + hướng dẫn.
- **Skeleton**/loading shimmer; **Toast** cho thông báo; **Tooltip** giải thích trường khó.
- **Form validation**: yup/react-hook-form hoặc kiểm tra thủ công (email/IP/port, định dạng `repo:tag`, kích thước file, bắt buộc `.zip`).
- **Accessiblity**: keyboard navigation cơ bản, focus ring.
- **Animation nhẹ** với framer-motion (fade/slide trong modal, step chuyển cảnh).

## 4) Dữ liệu & API (mock trước, thật sau)
- Thiết kế **model** (TypeScript) và seed **mock data** để demo UI.
```ts
// Project tổng quan
export type Project = {
  id: string;
  name: string;
  description?: string;
  status: "running" | "deploying" | "error" | "paused";
  updatedAt: string; // ISO
  endpoints?: { label: string; url: string }[];
  components: {
    databases: DatabaseItem[];
    backends: BackendItem[];
    frontends: FrontendItem[];
  };
};

export type DatabaseItem = {
  id: string;
  name: string;
  type: "mysql" | "mongodb";
  provision: "user" | "system";
  endpoint?: string; // host:port
  username?: string;
  hasSeedZip?: boolean;
  status: ComponentStatus;
};

export type BackendItem = {
  id: string;
  name: string;
  tech: "spring" | "node";
  source: { kind: "zip" | "image"; ref: string }; // path hoặc repo:tag
  env?: Record<string, string>;
  dns?: string;
  version?: string;
  status: ComponentStatus;
};

export type FrontendItem = {
  id: string;
  name: string;
  tech: "react" | "vue" | "angular";
  source: { kind: "zip" | "image"; ref: string };
  runtimeEnv?: Record<string, string>;
  publicUrl?: string;
  status: ComponentStatus;
};

export type ComponentStatus = "pending" | "building" | "deployed" | "error";
```

- Chuẩn bị **service giả**: `GET /api/projects`, `GET /api/projects/:id`, `POST /api/projects` (tạo + trả id), `POST /api/projects/:id/deploy` (mock).

## 5) Yêu cầu output từ AI
- **Sinh mã nguồn đầy đủ chạy ngay** (Vite + React + Tailwind đã cấu hình). Dùng **shadcn/ui** đúng chuẩn import. Có `README.md` hướng dẫn `pnpm i && pnpm dev`.
- Tối thiểu các **route**:
  - `/projects` — Danh sách project
  - `/projects/:id` — Chi tiết project
  - `/projects/new` — Wizard tạo project
- **Thư mục đề xuất**:
```
src/
  components/ (UI + forms + cards + stepper)
  pages/
    projects/
      List.tsx
      Detail.tsx
      New.tsx
  stores/ (zustand hoặc context)
  lib/ (utils: validate, format, mock-api)
  styles/
```
- **Chú thích code bằng tiếng Việt ngắn gọn**, tập trung vào logic và luồng dữ liệu.
- **Đảm bảo không lỗi build**, có **eslint cấu hình cơ bản** (không bắt buộc cứng nhắc).

## 6) Ràng buộc & kiểm thử UI
- Form **không cho Next** nếu thiếu dữ liệu bắt buộc.
- Khi thêm nhiều DB/BE/FE, phải có **UI quản lý danh sách** (thẻ có thể thu gọn/mở rộng, badge trạng thái).
- **LocalStorage autosave**: nếu F5 vẫn giữ draft wizard.
- **Tối ưu nhập liệu**: có **preset** cho Spring Boot/Node/React (gợi ý build command/output dir).

## 7) Nội dung hướng dẫn hiển thị trong UI (yêu cầu AI chèn sẵn)
- **Hộp “Hướng dẫn”** ở mỗi step, gồm:
  - Checklist yêu cầu thông tin.
  - Ví dụ **cấu trúc file .zip** hợp lệ (thư mục gốc trùng tên).
  - Lưu ý về **DNS/Endpoint**, ví dụ `api.myapp.local.test`, `fe.myapp.local.test`.
  - Lưu ý **ENV runtime** cho frontend (`VITE_API_BASE_URL`).

## 8) Những gì **KHÔNG** cần làm
- Không cài backend thật / Kubernetes thật. Chỉ **mock** API.
- Không cần auth phức tạp — giả lập user đã đăng nhập & role=USER.

---

## 📝 CÂU LỆNH PROMPT GỢI Ý (DÁN THẲNG CHO AI)

**Hãy tạo cho tôi một ứng dụng React (Vite + Tailwind + shadcn/ui + lucide-react + framer-motion) với các yêu cầu sau:**

1) **Trang & luồng**
- `/projects` (danh sách), `/projects/:id` (chi tiết), `/projects/new` (wizard 4 bước: Database → Backend → Frontend → Tổng quan & Xác nhận).
- Cho phép **nhiều** database/backend/frontend trong wizard; có Back/Next; **autosave** vào localStorage.

2) **UI/UX**
- Màu **Trắng + Xanh**, hiện đại, responsive, có dark mode cơ bản.
- Dùng **Card, Tabs, Stepper/Progress, Badge, Tooltip, Dialog, Toast**.
- Thêm **Hộp Hướng dẫn** ở mỗi step (yêu cầu thông tin, ví dụ `.zip`, lưu ý DNS/ENV).

3) **Tính năng**
- Validate form (định dạng IP/port, `owner/name:tag`, bắt buộc `.zip`).
- Mock API: `GET/POST` như phần API nêu trên; seed data để xem được UI.
- Chi tiết project hiển thị trạng thái từng thành phần + DNS/endpoint.

4) **Code**
- Viết bằng TypeScript, chú thích **tiếng Việt**.
- Cấu trúc thư mục rõ ràng; có `README.md` hướng dẫn chạy.
- Không dùng Redux; nếu cần state global thì dùng Context/Zustand nhẹ.

5) **Kết quả bàn giao**
- Repo chạy ngay: `pnpm i && pnpm dev`.
- Không mắc lỗi build/TS.

> **Lưu ý**: Đối tượng sử dụng là **USER** (không hiển thị chức năng admin). Hãy đảm bảo thiết kế hiện đại, gọn gàng, có skeleton loading, empty states, và animation nhẹ nhàng.

---

## 📦 Tuỳ chọn mở rộng (nếu có thời gian)
- Thêm **Lịch sử triển khai** (mock timeline) trong trang chi tiết.
- Modal **Xem log** (mock) cho từng component.
- Export **JSON cấu hình** project (từ wizard) để lưu trữ.
- Import lại JSON để tiếp tục chỉnh sửa.

---

### Gợi ý "chốt" khi gửi prompt
- “Nếu chỗ nào chưa rõ, **hãy tự đề xuất mặc định hợp lý** thay vì dừng lại hỏi.”
- “Hãy ưu tiên **độ mượt UI/UX** và **tính thực dụng** khi nhập liệu.”

