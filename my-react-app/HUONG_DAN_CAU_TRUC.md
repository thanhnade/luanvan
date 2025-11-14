# 📚 Hướng Dẫn Cấu Trúc Dự Án React - Cho Người Mới Bắt Đầu

## 🎯 Mục Đích File Này

File này giúp bạn hiểu rõ:
- **URL nào** → **Trang nào** → **File nào**
- **Component nào** thuộc **trang nào**
- **Cách các phần kết nối** với nhau

---

## 🗺️ Sơ Đồ Tổng Quan

```
Người dùng truy cập URL
    ↓
App.tsx (điều phối routing)
    ↓
┌─────────────────────────────────────┐
│  Navbar (luôn hiển thị ở trên)     │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  Routes (chọn trang hiển thị)      │
│  - /projects → ProjectsList         │
│  - /projects/:id → ProjectDetail    │
│  - /projects/new → ProjectNew        │
└─────────────────────────────────────┘
    ↓
Trang cụ thể (Pages)
    ↓
Sử dụng Components (UI, Common, User)
```

---

## 📁 Cấu Trúc Thư Mục Chi Tiết

### 1. **`src/main.tsx`** - Điểm Khởi Đầu
```typescript
// File này chạy đầu tiên khi ứng dụng khởi động
// Nó "render" (hiển thị) component App vào màn hình
```

**Vai trò**: Khởi động ứng dụng React, render `App.tsx` vào DOM

---

### 2. **`src/App.tsx`** - Trung Tâm Điều Phối

**Vai trò**: Quyết định URL nào hiển thị trang nào

```typescript
// Khi người dùng truy cập:
"/projects"           → Hiển thị <ProjectsList />
"/projects/123"       → Hiển thị <ProjectDetail /> (với id = 123)
"/projects/new"       → Hiển thị <ProjectNew />
"/" hoặc bất kỳ       → Tự động chuyển về "/projects"
```

**Các phần trong App.tsx:**
- `<Navbar />` - Thanh điều hướng (luôn hiển thị)
- `<Routes>` - Danh sách các route (URL → Component)
- `<Toaster />` - Hiển thị thông báo toast

---

### 3. **`src/pages/`** - Các Trang Chính

Mỗi file trong đây là một **trang hoàn chỉnh** mà người dùng thấy.

#### 📄 **`pages/projects/List.tsx`** - Trang Danh Sách Projects

**URL**: `/projects`

**Chức năng:**
- Hiển thị danh sách tất cả projects
- Tìm kiếm projects
- Lọc theo trạng thái
- Click vào project → chuyển sang trang chi tiết

**Components sử dụng:**
- `@/components/ui/card` - Hiển thị card project
- `@/components/ui/button` - Nút "Tạo Project"
- `@/components/ui/input` - Ô tìm kiếm
- `@/components/common/EmptyState` - Hiển thị khi không có project

**Dữ liệu lấy từ:** `@/lib/mock-api.ts` → `getProjects()`

---

#### 📄 **`pages/projects/Detail.tsx`** - Trang Chi Tiết Project

**URL**: `/projects/:id` (ví dụ: `/projects/1`)

**Chức năng:**
- Hiển thị thông tin chi tiết 1 project
- Hiển thị Databases, Backends, Frontends của project
- Xem logs (giả lập)
- Copy DNS

**Components sử dụng:**
- `@/components/ui/tabs` - Tab Databases/Backends/Frontends/Logs
- `@/components/ui/card` - Card hiển thị từng component
- `@/components/ui/dialog` - Modal xem logs
- `@/components/ui/badge` - Badge trạng thái

**Dữ liệu lấy từ:** `@/lib/mock-api.ts` → `getProjectById(id)`

---

#### 📄 **`pages/projects/New/index.tsx`** - Trang Tạo Project (Wizard)

**URL**: `/projects/new`

**Chức năng:**
- Wizard 4 bước: Database → Backend → Frontend → Tổng quan
- Điều hướng giữa các bước (Back/Next)
- Lưu draft vào localStorage

**Components sử dụng:**
- `@/components/user/Stepper` - Hiển thị tiến trình các bước
- `@/components/ui/card` - Card chứa form
- `@/components/ui/button` - Nút Back/Next

**Các bước con:**
- `StepDatabase.tsx` - Bước 1: Cấu hình Database
- `StepBackend.tsx` - Bước 2: Cấu hình Backend
- `StepFrontend.tsx` - Bước 3: Cấu hình Frontend
- `StepSummary.tsx` - Bước 4: Xem lại và xác nhận

**State quản lý:** `@/stores/wizard-store.ts` (Zustand)

---

### 4. **`src/components/`** - Các Component Tái Sử Dụng

#### 🎨 **`components/ui/`** - UI Components Cơ Bản

**Vai trò**: Các component UI cơ bản từ thư viện shadcn/ui

**Các file:**
- `button.tsx` - Nút bấm
- `card.tsx` - Thẻ/card
- `input.tsx` - Ô nhập liệu
- `badge.tsx` - Nhãn/badge
- `tabs.tsx` - Tab
- `dialog.tsx` - Modal/popup
- ... và nhiều hơn

**Sử dụng ở đâu:** TẤT CẢ các trang đều dùng

**Ví dụ:**
```typescript
// Trong List.tsx
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

// Sử dụng
<Button>Click me</Button>
<Card>Nội dung</Card>
```

---

#### 👤 **`components/user/`** - Component Dành Cho User

**Vai trò**: Component chỉ dùng cho trang user (không dùng cho admin)

**Các file:**
- `Navbar.tsx` - Thanh điều hướng (dùng ở App.tsx)
- `Stepper.tsx` - Hiển thị tiến trình wizard (dùng ở New/index.tsx)
- `HintBox.tsx` - Hộp hướng dẫn (dùng ở các Step)

**Sử dụng ở đâu:**
- `Navbar` → `App.tsx` (luôn hiển thị)
- `Stepper` → `pages/projects/New/index.tsx`
- `HintBox` → `StepDatabase.tsx`, `StepBackend.tsx`, `StepFrontend.tsx`

---

#### 🔄 **`components/common/`** - Component Dùng Chung

**Vai trò**: Component có thể dùng ở cả user và admin

**Các file:**
- `EmptyState.tsx` - Hiển thị khi không có dữ liệu

**Sử dụng ở đâu:**
- `List.tsx` - Khi không có project nào

---

### 5. **`src/lib/`** - Thư Viện & Utilities

#### 📡 **`lib/mock-api.ts`** - API Giả Lập

**Vai trò**: Giả lập API calls (không có backend thật)

**Các hàm:**
- `getProjects()` - Lấy danh sách projects
- `getProjectById(id)` - Lấy 1 project theo ID
- `createProject(data)` - Tạo project mới
- `validateZip()` - Validate file ZIP
- `validateImage()` - Validate Docker image

**Sử dụng ở đâu:**
- `List.tsx` → `getProjects()`
- `Detail.tsx` → `getProjectById()`
- `StepSummary.tsx` → `createProject()`

---

#### 🛠️ **`lib/utils.ts`** - Hàm Tiện Ích

**Vai trò**: Các hàm helper dùng chung

**Hàm chính:**
- `cn()` - Merge classNames (dùng với Tailwind)

**Sử dụng ở đâu:** TẤT CẢ các component

---

#### ✅ **`lib/validators.ts`** - Validation

**Vai trò**: Kiểm tra dữ liệu hợp lệ (Zod schemas)

**Sử dụng ở đâu:**
- Các Step trong wizard (StepDatabase, StepBackend, StepFrontend)

---

### 6. **`src/stores/`** - Quản Lý State

#### 📦 **`stores/wizard-store.ts`** - State Wizard

**Vai trò**: Lưu trữ dữ liệu của wizard (Database, Backend, Frontend)

**Sử dụng ở đâu:**
- `New/index.tsx` - Lấy/set currentStep
- `StepDatabase.tsx` - Lưu/tải dữ liệu database
- `StepBackend.tsx` - Lưu/tải dữ liệu backend
- `StepFrontend.tsx` - Lưu/tải dữ liệu frontend
- `StepSummary.tsx` - Hiển thị tất cả dữ liệu

---

### 7. **`src/types/`** - Định Nghĩa Kiểu Dữ Liệu

#### 📝 **`types/index.ts`** - TypeScript Types

**Vai trò**: Định nghĩa cấu trúc dữ liệu (Project, DatabaseItem, BackendItem, ...)

**Sử dụng ở đâu:** TẤT CẢ các file TypeScript

---

## 🔄 Luồng Hoạt Động Cụ Thể

### Ví dụ 1: Người dùng truy cập `/projects`

```
1. Browser gửi request: http://localhost:5174/projects
   ↓
2. App.tsx kiểm tra Routes:
   - Tìm thấy: <Route path="/projects" element={<ProjectsList />} />
   ↓
3. Render ProjectsList component
   ↓
4. ProjectsList.tsx:
   - Gọi getProjects() từ mock-api.ts
   - Hiển thị danh sách projects bằng Card components
   - Nếu không có project → hiển thị EmptyState
```

---

### Ví dụ 2: Người dùng click vào một project

```
1. Trong List.tsx, có nút "Xem chi tiết"
   <Button onClick={() => navigate(`/projects/${project.id}`)}>
   ↓
2. React Router chuyển URL sang /projects/123
   ↓
3. App.tsx kiểm tra Routes:
   - Tìm thấy: <Route path="/projects/:id" element={<ProjectDetail />} />
   ↓
4. Render ProjectDetail component với id = "123"
   ↓
5. ProjectDetail.tsx:
   - Lấy id từ URL: useParams()
   - Gọi getProjectById("123") từ mock-api.ts
   - Hiển thị thông tin project bằng Tabs và Cards
```

---

### Ví dụ 3: Người dùng tạo project mới

```
1. Click nút "Tạo Project" → navigate("/projects/new")
   ↓
2. App.tsx render <ProjectNew />
   ↓
3. ProjectNew/index.tsx:
   - Hiển thị Stepper (4 bước)
   - Hiển thị StepDatabase (bước 1)
   ↓
4. User điền form Database:
   - Dữ liệu lưu vào wizard-store
   - Click "Next" → chuyển sang StepBackend
   ↓
5. Tương tự cho Backend và Frontend
   ↓
6. Bước cuối: StepSummary:
   - Hiển thị tất cả dữ liệu đã nhập
   - Click "Xác nhận triển khai"
   - Gọi createProject() từ mock-api.ts
   - Chuyển về trang /projects
```

---

## 🎯 Cách Tìm Component Thuộc Trang Nào

### Phương pháp 1: Tìm trong file Pages

Mở file trong `pages/`, xem import:

```typescript
// pages/projects/List.tsx
import { EmptyState } from "@/components/common/EmptyState"
// → EmptyState được dùng trong trang List
```

---

### Phương pháp 2: Tìm trong App.tsx

Xem route nào render component nào:

```typescript
// App.tsx
<Route path="/projects" element={<ProjectsList />} />
// → ProjectsList là trang /projects
```

---

### Phương pháp 3: Tìm bằng Search

Trong VS Code/Cursor:
1. Nhấn `Cmd/Ctrl + Shift + F`
2. Tìm tên component (ví dụ: `EmptyState`)
3. Xem file nào import nó

---

## 📋 Bảng Tóm Tắt: URL → Trang → File

| URL | Trang | File Chính | Components Chính |
|-----|-------|------------|------------------|
| `/projects` | Danh sách Projects | `pages/projects/List.tsx` | Card, Button, Input, EmptyState |
| `/projects/:id` | Chi tiết Project | `pages/projects/Detail.tsx` | Tabs, Card, Dialog, Badge |
| `/projects/new` | Tạo Project | `pages/projects/New/index.tsx` | Stepper, Card, Button |
| `/projects/new` (Step 1) | Cấu hình Database | `pages/projects/New/StepDatabase.tsx` | Card, Input, Select, HintBox |
| `/projects/new` (Step 2) | Cấu hình Backend | `pages/projects/New/StepBackend.tsx` | Card, Input, Select, HintBox |
| `/projects/new` (Step 3) | Cấu hình Frontend | `pages/projects/New/StepFrontend.tsx` | Card, Input, Select, HintBox |
| `/projects/new` (Step 4) | Tổng quan | `pages/projects/New/StepSummary.tsx` | Card, Alert, Button |

---

## 🎓 Tips Cho Người Mới

### 1. Bắt đầu từ App.tsx
- Xem routing để biết URL nào → trang nào

### 2. Mở trang cụ thể
- Ví dụ: muốn sửa trang danh sách → mở `pages/projects/List.tsx`

### 3. Tìm component
- Component UI → `components/ui/`
- Component user → `components/user/`
- Component common → `components/common/`

### 4. Tìm API/data
- Mock API → `lib/mock-api.ts`
- State management → `stores/`

### 5. Debug
- Mở DevTools (F12)
- Xem Console để thấy lỗi
- Xem Network tab để thấy API calls (nếu có)

---

## ❓ Câu Hỏi Thường Gặp

**Q: Muốn thêm một trang mới thì làm sao?**
A: 
1. Tạo file trong `pages/` (ví dụ: `pages/settings/Settings.tsx`)
2. Thêm route trong `App.tsx`: `<Route path="/settings" element={<Settings />} />`
3. Thêm link trong `Navbar.tsx` nếu cần

**Q: Muốn sửa giao diện của nút thì làm sao?**
A: Sửa file `components/ui/button.tsx` (ảnh hưởng tất cả nút trong app)

**Q: Muốn thêm component mới thì đặt ở đâu?**
A: 
- Nếu dùng chung → `components/common/`
- Nếu chỉ cho user → `components/user/`
- Nếu chỉ cho admin → `components/admin/`
- Nếu là UI base → `components/ui/`

**Q: Làm sao biết component nào dùng ở đâu?**
A: Dùng Search (Cmd/Ctrl + Shift + F) tìm tên component

---

## 📚 Tài Liệu Tham Khảo

- [React Router](https://reactrouter.com/) - Routing
- [Zustand](https://zustand-demo.pmnd.rs/) - State management
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Tailwind CSS](https://tailwindcss.com/) - Styling

---

**Chúc bạn code vui vẻ! 🚀**

