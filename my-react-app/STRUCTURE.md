# 📁 Cấu Trúc Thư Mục Dự Án React

```
src/
├── apps/                          # Phần ứng dụng được tách biệt theo role
│   ├── admin/                     # Phần dành cho Admin
│   │   ├── components/            # Component riêng cho admin
│   │   └── pages/                 # Trang admin
│   │       └── index.tsx          # Trang admin (placeholder)
│   │
│   └── user/                      # Phần dành cho User
│       ├── components/            # Component riêng cho user
│       │   ├── Footer.tsx
│       │   ├── HintBox.tsx
│       │   ├── Navbar.tsx
│       │   ├── Stepper.tsx
│       │   └── index.ts
│       │
│       ├── pages/                 # Trang user
│       │   └── projects/
│       │       ├── Detail.tsx     # Chi tiết project
│       │       ├── List.tsx       # Danh sách projects
│       │       └── New/           # Wizard tạo project mới
│       │           ├── index.tsx
│       │           ├── StepBackend.tsx
│       │           ├── StepDatabase.tsx
│       │           ├── StepFrontend.tsx
│       │           ├── StepProjectInfo.tsx
│       │           └── StepSummary.tsx
│       │
│       └── stores/                # Store riêng cho user
│           └── wizard-store.ts    # Store quản lý wizard tạo project
│
├── components/                    # Component dùng chung cho toàn app
│   ├── auth/                      # Component authentication
│   │   └── ProtectedRoute.tsx
│   │
│   ├── common/                    # Component dùng chung (user + admin)
│   │   ├── CreateProjectModal.tsx
│   │   ├── EmptyState.tsx
│   │   ├── StatsChart.tsx
│   │   └── index.ts
│   │
│   └── ui/                        # UI components (shadcn/ui)
│       ├── alert.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── checkbox.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── tabs.tsx
│       ├── textarea.tsx
│       └── tooltip.tsx
│
├── contexts/                      # React Context
│   └── AuthContext.tsx            # Context quản lý authentication
│
├── lib/                           # Thư viện utility và API client
│   ├── auth-api.ts                # API client cho authentication
│   ├── mock-api.ts                # Mock API (development)
│   ├── project-api.ts             # API client cho projects
│   ├── utils.ts                   # Utility functions
│   └── validators.ts              # Validation functions
│
├── pages/                         # Trang public (dùng chung user + admin)
│   └── auth/
│       ├── Login.tsx              # Trang đăng nhập
│       └── Register.tsx           # Trang đăng ký
│
├── services/                      # Services
│   └── api.js                     # API service base
│
├── types/                         # TypeScript type definitions
│   └── index.ts
│
├── assets/                        # Static assets
│   └── react.svg
│
├── App.tsx                        # Root component với routing
├── main.tsx                       # Entry point
├── main.jsx                       # Entry point (backup)
├── index.css                      # Global styles
├── App.css                        # App styles
└── vite-env.d.ts                  # Vite type definitions
```

## 📋 Giải Thích

### 🎯 `apps/`
- **Mục đích**: Tách biệt phần user và admin theo domain
- **Cấu trúc**: Mỗi app có `components/`, `pages/`, `stores/` riêng

### 📦 `components/`
- **Mục đích**: Component dùng chung cho toàn app
- **Phân loại**:
  - `ui/`: UI components cơ bản (shadcn/ui)
  - `common/`: Component dùng chung (user + admin)
  - `auth/`: Component authentication

### 🌐 `pages/auth/`
- **Mục đích**: Trang authentication dùng chung (Login, Register)
- **Lý do**: User và Admin đều dùng chung trang đăng nhập/đăng ký

### 🛠 `lib/`, `contexts/`, `types/`
- **Mục đích**: Utilities, contexts, và type definitions dùng chung

## 🔄 So Sánh Trước Và Sau

**Trước:**
```
src/
├── components/user/     ❌ Component user nằm trong components/
├── pages/projects/      ❌ Trang user nằm trong pages/
└── stores/wizard-store.ts ❌ Store user nằm trong stores/
```

**Sau:**
```
src/
├── apps/user/           ✅ Tất cả code user nằm trong apps/user/
│   ├── components/
│   ├── pages/
│   └── stores/
└── apps/admin/          ✅ Chuẩn bị sẵn cho admin
    ├── components/
    └── pages/
```

## ✅ Lợi Ích

1. **Tách biệt rõ ràng**: User và Admin code không lẫn lộn
2. **Dễ mở rộng**: Thêm admin không ảnh hưởng đến code user
3. **Dễ maintain**: Tìm code theo domain (user/admin) thay vì theo loại (component/page)
4. **Chuẩn bị sẵn**: Cấu trúc admin đã được tạo sẵn để phát triển sau

