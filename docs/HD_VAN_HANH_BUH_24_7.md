# 🐝 Hướng Dẫn Vận Hành & Triển Khai Hệ Thống BUH 24/7 Miễn Phí

Tài liệu này hướng dẫn chi tiết quy trình đưa hệ thống **BEECLUB - Trường Đại Học Ngân Hàng TP.HCM (BUH)** lên môi trường Cloud hoạt động liên tục 24/7 với chi phí **0 VNĐ**, bảo vệ chống lộ API Key và chống DDoS bằng Cloudflare.

---

## 📌 BƯỚC 1: KHỞI TẠO CƠ SỞ DỮ LIỆU SẠCH TRÊN SUPABASE (1-CLICK)

1. Đăng nhập vào [Supabase Dashboard](https://supabase.com/dashboard).
2. Chọn dự án của bạn (ví dụ: `davxzhiyegkufjgoxluv`).
3. Ở thanh menu bên trái, chọn **SQL Editor** > Bấm **New query**.
4. Mở file [database/clean_schema.sql](file:///c:/Users/HUNG/Desktop/CLB/database/clean_schema.sql) trong dự án, copy toàn bộ nội dung và dán vào ô SQL Editor.
5. Bấm nút **Run** (màu xanh lá).
6. **Kết quả:** Toàn bộ bảng cũ/dư thừa được xóa sạch, 5 bảng chuẩn 3NF được tạo kèm tài khoản Admin trường:
   * **Email:** `admin@buh.edu.vn`
   * **Mật khẩu:** `Password123!`
   * **Role:** `admin` (Toàn quyền quản trị)
7. Vào **Project Settings** > **Database** > Kéo xuống mục **Connection string** > Chọn tab **URI**:
   * Copy chuỗi kết nối có dạng:  
     `postgresql://postgres:[YOUR-PASSWORD]@db.davxzhiyegkufjgoxluv.supabase.co:5432/postgres`  
     *(Thay `[YOUR-PASSWORD]` bằng mật khẩu database Supabase của bạn)*.

---

## 📌 BƯỚC 2: CẤU HÌNH GOOGLE OAUTH DÀNH CHO SINH VIÊN BUH

1. Truy cập [Google Cloud Console](https://console.cloud.google.com).
2. Tạo mới một Project: Đặt tên `BEECLUB-BUH`.
3. Vào **APIs & Services** > **OAuth consent screen**:
   * Chọn **External** > Bấm **Create**.
   * App name: `Hệ Thống Sự Kiện BEECLUB BUH`
   * User support email: Email của bạn.
   * Developer contact information: Email của bạn > Bấm **Save and Continue** qua các bước.
4. Vào **Credentials** > Bấm **Create Credentials** > Chọn **OAuth client ID**:
   * Application type: **Web application**.
   * Name: `BEECLUB Web Client`.
   * **Authorized JavaScript origins:** Thêm các địa chỉ sau:
     * `http://localhost:3000`
     * `http://localhost:5000`
     * `https://your-app.vercel.app` *(Domain Vercel sau khi deploy ở Bước 4)*
5. Bấm **Create**. Bạn sẽ nhận được chuỗi **Client ID** (dạng `xxxx.apps.googleusercontent.com`).
6. Mở file [js/config.js](file:///c:/Users/HUNG/Desktop/CLB/js/config.js), dán Client ID này vào biến `GOOGLE_CLIENT_ID`.

---

## 📌 BƯỚC 3: DEPLOY BACKEND LÊN RENDER (NODE.JS EXPRESS - MIỄN PHÍ)

1. Đăng ký/Đăng nhập tại [Render.com](https://render.com).
2. Bấm **New +** > Chọn **Web Service**.
3. Kết nối với GitHub Repository của dự án này.
4. Cấu hình dịch vụ:
   * **Name:** `beeclub-backend`
   * **Region:** Singapore (Southeast Asia - gần Việt Nam nhất)
   * **Root Directory:** `backend`
   * **Environment:** `Node`
   * **Build Command:** `npm install`
   * **Start Command:** `node src/server.js`
   * **Instance Type:** `Free`
5. Kéo xuống mục **Environment Variables**, thêm các biến sau:
   * `DATABASE_URL`: Dán chuỗi kết nối Supabase đã lấy ở Bước 1.
   * `JWT_SECRET`: Nhập chuỗi bảo mật ngẫu nhiên (ví dụ: `BUH_SECRET_KEY_PROD_2026`).
   * `NODE_ENV`: `production`
6. Bấm **Create Web Service**. Đợi 2-3 phút, Render sẽ cấp cho bạn một URL có dạng:  
   `https://beeclub-backend.onrender.com`
7. Mở file [js/config.js](file:///c:/Users/HUNG/Desktop/CLB/js/config.js), cập nhật `API_BASE_URL` trỏ về link Render này kèm đuôi `/api/v1`.

---

## 📌 BƯỚC 4: DEPLOY FRONTEND LÊN VERCEL (GLOBAL CDN - MIỄN PHÍ)

1. Đăng ký/Đăng nhập tại [Vercel.com](https://vercel.com).
2. Bấm **Add New...** > Chọn **Project**.
3. Import GitHub repository của dự án.
4. **Root Directory:** Để nguyên mặc định `./` (Thư mục gốc).
5. Vercel sẽ tự động đọc file [vercel.json](file:///c:/Users/HUNG/Desktop/CLB/vercel.json) để cấu hình định tuyến tĩnh.
6. Bấm **Deploy**. Sau 30 giây, bạn sẽ nhận được URL chính thức dạng:  
   `https://beeclub-buh.vercel.app`
7. Quay lại Bước 2, thêm domain Vercel này vào mục **Authorized JavaScript origins** của Google Cloud Console.

---

## 📌 BƯỚC 5: GIỮ BACKEND THỨC 24/7 BẰNG UPTIMEROBOT (CHỐNG SLEEP)

*Render gói miễn phí sẽ tự động "ngủ đông" nếu không có truy cập trong 15 phút. Chúng ta giải quyết triệt để bằng dịch vụ giám sát miễn phí UptimeRobot:*

1. Đăng ký tài khoản miễn phí tại [UptimeRobot.com](https://uptimerobot.com).
2. Tại trang Dashboard, bấm nút **+ Add New Monitor**.
3. Thiết lập thông số:
   * **Monitor Type:** `HTTP(s)`
   * **Friendly Name:** `BUH Backend Keep-Alive`
   * **URL (or IP):** `https://beeclub-backend.onrender.com/api/v1/health`
   * **Monitoring Interval:** `5 minutes` (cứ 5 phút ping 1 lần)
4. Bấm **Create Monitor**.
5. **Kết quả:** UptimeRobot sẽ tự động gửi request "đánh thức" server đều đặn mỗi 5 phút. Backend Render sẽ luôn luôn thức **24/7**, không bao giờ bị trễ khi người dùng quét mã vé!

---

## 📌 BƯỚC 6: BẬT CLOUDFLARE PROXY (🟠) CHỐNG DDOS 98% (MIỄN PHÍ)

1. Mua hoặc đăng ký một tên miền (Domain) riêng.
2. Thêm domain vào tài khoản [Cloudflare.com](https://cloudflare.com) (Gói Free Plan).
3. Cấu hình DNS:
   * Trỏ bản ghi `CNAME` tên miền chính (`@` hoặc `www`) về Vercel (`cname.vercel-dns.com`).
   * Trỏ subdomain `api` về Render (`beeclub-backend.onrender.com`).
   * **Quan trọng:** Bật biểu tượng **Đám mây màu cam 🟠 (Proxied)** cho toàn bộ bản ghi.
4. Vào mục **SSL/TLS**: Chọn chế độ **Full**.
5. Vào mục **Security** > **Bots**: Bật **Bot Fight Mode** (Gạt công tắc ON).
6. **Kết quả:** 100% địa chỉ IP của server Render và Vercel được ẩn giấu hoàn toàn sau lá chắn phòng thủ 280+ Tbps của Cloudflare.

---

## 🎓 QUY TRÌNH VẬN HÀNH THỰC TẾ DÀNH CHO ADMIN & SINH VIÊN

### 1. Dành cho Ban Tổ Chức (Admin):
* Đăng nhập tại `admin@buh.edu.vn` / `Password123!`.
* Vào mục **EVENTS** > Bấm **+ Tạo sự kiện mới** (ví dụ: Chào Tân Sinh Viên K40).
* Tại hàng sự kiện vừa tạo, bấm nút **📱 QR Poster** để lấy mã QR sự kiện.
* Tải mã QR này dán vào Poster thiết kế hoặc bài viết kêu gọi trên Fanpage CLB / Đoàn trường.

### 2. Dành cho Sinh Viên BUH:
* Sinh viên dùng camera điện thoại quét mã QR trên Poster.
* Trình duyệt tự động mở đúng trang sự kiện.
* Bấm **Đăng nhập Google Sinh Viên BUH** -> Chọn tài khoản trường (`@st.buh.edu.vn`).
* Hệ thống tự động điền Họ tên và MSSV.
* Sinh viên bấm **Xác Nhận Đăng Ký** -> Hệ thống tạo ngay **Vé Điện Tử kèm Mã QR**.
* Sinh viên có thể chụp màn hình vé hoặc mở lại tại mục **MY TICKETS**.

### 3. Điểm Danh Check-in Cửa Sự Kiện:
* Ban tổ chức mở trang **CHECK-IN** trên điện thoại hoặc laptop.
* Bấm nút **📸 Bật Camera Quét Mã QR Màn Hình**.
* Sinh viên giơ màn hình điện thoại có mã QR vé trước camera.
* Hệ thống nhận diện trong 200ms -> Báo âm thanh **"Bíp"** + Viền xanh lá:  
  `✅ ĐIỂM DANH THÀNH CÔNG: Nguyễn Văn A (MSSV: 050608240001)`.
* Nếu có sinh viên gian lận quét lại lần 2 -> Hệ thống lập tức cảnh báo màu vàng: `⚠️ CẢNH BÁO: Vé đã được điểm danh trước đó!`.
