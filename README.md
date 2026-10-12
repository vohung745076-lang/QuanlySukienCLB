# 🐝 BEECLUB - Hệ Thống Quản Lý Sự Kiện & Hội Viên Production-Grade

Hệ thống được thiết kế và xây dựng theo mô hình kiến trúc **Full-stack Monorepo Modular**, chuẩn hoá bảo mật, toàn vẹn dữ liệu (ACID Transactions), và tối ưu sẵn sàng deploy lên Server thông qua **Docker Compose & Nginx Reverse Proxy** (theo quy chuẩn triển khai 5 bước).

---

## 🏗️ Cấu Trúc Tổng Thể Hệ Thống

```
CLB/
├── docker-compose.yml         # Điều phối toàn bộ hạ tầng containers
├── .env.example               # Template biến môi trường
├── README.md                  # Hướng dẫn chi tiết vận hành & deploy
│
├── database/
│   └── init.sql               # PostgreSQL Schema, Constraints & Seed Data mẫu
│
├── backend/                   # Node.js / Express Clean Layered Architecture
│   ├── Dockerfile             # Multi-stage image Alpine
│   ├── package.json
│   └── src/
│       ├── app.js             # Cấu hình Express, CORS, Helmet, Morgan
│       ├── server.js          # Entrypoint & Graceful Shutdown
│       ├── config/            # Quản lý cấu hình tập trung
│       ├── database/          # PostgreSQL Connection Pool & Transaction Helper
│       ├── middlewares/       # Auth (JWT Bearer), RBAC (Role checks), Error handlers
│       ├── modules/
│       │   ├── auth/          # Đăng nhập (Email/MSSV), Đăng ký, Refresh token, Me
│       │   ├── users/         # Member Hub (All/VIP/Staff, Filters, Thêm/Sửa quyền)
│       │   ├── events/        # CRUD Sự kiện, Dashboard Stats, Thống kê sức chứa
│       │   ├── tickets/       # Đặt vé Atomic Transaction (Chống Race condition & Overbooking)
│       │   ├── checkin/       # Quét mã QR/MSSV tức thì, Ghi log thời gian thực
│       │   └── export/        # Xuất dữ liệu Excel chuẩn (.xlsx) bằng ExcelJS
│       └── utils/             # Chuẩn hóa JSON Response & Logging
│
├── frontend/                  # React / Vite SPA (Giao diện chuẩn Mockup BEECLUB)
│   ├── Dockerfile             # Multi-stage build + Nginx Alpine
│   ├── nginx.conf             # Định tuyến SPA internal container
│   ├── package.json
│   └── src/
│       ├── components/        # Navbar, Toast Notifications, Modals
│       ├── views/
│       │   ├── AuthView.jsx        # Đăng nhập & Đăng ký mượt mà
│       │   ├── MemberHubView.jsx   # Khớp 100% Mockup PDF (WIBI7903, VIP, Staff)
│       │   ├── DashboardView.jsx   # Tổng quan vận hành, Quản lý sự kiện, Xuất Excel
│       │   ├── CheckinView.jsx     # Quét laser/nhập mã vé, Realtime logs
│       │   ├── ExploreView.jsx     # Khám phá sự kiện & Đặt vé
│       │   └── MyTicketsView.jsx   # Vé điện tử của tôi kèm mã QR
│       ├── services/          # Unified API Client (/api/v1)
│       └── styles/main.css    # Dark Obsidian, Amber Gold (#F5C518), Outfit Typography
│
├── nginx/
│   └── nginx.conf             # Gateway Reverse Proxy (Cổng 80/443, Cache, Gzip)
│
└── legacy/                    # Lưu trữ nguyên vẹn các file mã nguồn cũ để đối chiếu
```

---

## 🚀 Hướng Dẫn Triển Khai Lên Server (Theo 5 Bước Chuẩn Production)

### 📌 Bước 1: Lưu code & Clone về Server (VPS / Cloud Ubuntu)
```bash
git clone <repository_url> CLB
cd CLB
```

### 📌 Bước 2: Thiết lập biến môi trường
```bash
cp .env.example .env
```

### 📌 Bước 3: Khởi chạy toàn bộ hệ thống bằng Docker Compose
Chỉ cần **duy nhất 1 câu lệnh**:
```bash
docker compose up --build -d
```

Hệ thống sẽ tự động khởi động 4 containers liên kết chặt chẽ:
1. `beeclub_postgres`: Database PostgreSQL 16 (tự động chạy file `init.sql` tạo bảng, indexes và seed data).
2. `beeclub_backend`: Express API Service chạy tại cổng nội bộ `5000`.
3. `beeclub_frontend`: React Web App chạy tại cổng nội bộ `80`.
4. `beeclub_nginx`: Reverse Proxy mở cổng `80` tiếp nhận người dùng, tự động điều hướng:
   - Các yêu cầu `/api/*` -> Backend Container
   - Các yêu cầu `/*` -> Frontend Container

### 📌 Bước 4: Kiểm tra trạng thái các Services
```bash
docker compose ps
docker compose logs -f
```

### 📌 Bước 5: Truy cập hệ thống
- Mở trình duyệt truy cập: `http://<IP_SERVER>` hoặc `http://localhost`
- Tài khoản quản trị khởi tạo sẵn:
  - **Email:** `admin@beeclub.com`
  - **Mật khẩu:** `Password123!`
  - **Quyền:** `Super Admin` (toàn quyền quản lý Member Hub, Events, Check-in, Export Excel).

---

## 💻 Hướng Dẫn Chạy Cục Bộ (Local Development Không Cần Docker)

### 1. Khởi chạy Backend API:
```bash
cd backend
npm install
npm start
# API chạy tại: http://localhost:5000/api/v1/health
```

### 2. Khởi chạy Frontend React:
```bash
cd frontend
npm install
npm run dev
# Giao diện chạy tại: http://localhost:3000
```
