-- ============================================================
-- BEECLUB - HỆ THỐNG QUẢN LÝ SỰ KIỆN & HỘI VIÊN BUH
-- TÁI CẤU TRÚC DATABASE SẠCH (CLEAN 3NF SCHEMA)
-- Chạy toàn bộ file này tại: Supabase Dashboard > SQL Editor
-- ============================================================

-- BƯỚC 1: XÓA SẠCH CÁC BẢNG DƯ THỪA CŨ (NẾU CÓ)
DROP TABLE IF EXISTS public.checkin_logs CASCADE;
DROP TABLE IF EXISTS public.tickets CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.refresh_tokens CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Kích hoạt tiện ích tạo UUID và mã hóa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- BƯỚC 2: TẠO 5 BẢNG CỐT LÕI CHUẨN HÓA
-- ============================================================

-- 1. BẢNG USERS: Quản lý sinh viên BUH & Ban Quản trị
CREATE TABLE public.users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    student_id      VARCHAR(50) UNIQUE,
    full_name       VARCHAR(150) NOT NULL,
    google_id       VARCHAR(255) UNIQUE,
    avatar_url      TEXT,
    password_hash   VARCHAR(255), -- Dành cho tài khoản Admin hoặc đăng nhập thường
    role            VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'manager', 'admin')),
    status          VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    category        VARCHAR(20) NOT NULL DEFAULT 'REGULAR' CHECK (category IN ('VIP', 'STAFF', 'REGULAR')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. BẢNG REFRESH_TOKENS: Phiên làm việc JWT an toàn
CREATE TABLE public.refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL,
    is_revoked  BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. BẢNG EVENTS: Quản lý bài đăng sự kiện & sức chứa
CREATE TABLE public.events (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code              VARCHAR(50) UNIQUE NOT NULL,
    title             VARCHAR(255) NOT NULL,
    description       TEXT,
    location          VARCHAR(255) NOT NULL,
    start_time        TIMESTAMPTZ NOT NULL,
    end_time          TIMESTAMPTZ NOT NULL,
    capacity          INT NOT NULL DEFAULT 1000 CHECK (capacity > 0),
    registered_count  INT NOT NULL DEFAULT 0 CHECK (registered_count >= 0),
    checkin_count     INT NOT NULL DEFAULT 0 CHECK (checkin_count >= 0),
    status            VARCHAR(20) NOT NULL DEFAULT 'upcoming' CHECK (status IN ('draft', 'upcoming', 'live', 'completed', 'cancelled')),
    benefits          TEXT,
    sponsors          TEXT,
    created_by        UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. BẢNG TICKETS: Vé điện tử cá nhân kèm mã QR duy nhất
CREATE TABLE public.tickets (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_code       VARCHAR(100) UNIQUE NOT NULL,
    event_id          UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    participant_name  VARCHAR(150) NOT NULL,
    participant_mssv  VARCHAR(50) NOT NULL,
    participant_email VARCHAR(255) NOT NULL,
    status            VARCHAR(20) NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'used', 'cancelled')),
    checked_in_at     TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_event_user UNIQUE (event_id, user_id)
);

-- 5. BẢNG CHECKIN_LOGS: Nhật ký quét vé & điểm danh thời gian thực
CREATE TABLE public.checkin_logs (
    id              BIGSERIAL PRIMARY KEY,
    event_id        UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    ticket_id       UUID REFERENCES public.tickets(id) ON DELETE SET NULL,
    staff_id        UUID REFERENCES public.users(id) ON DELETE SET NULL,
    input_code      VARCHAR(100) NOT NULL,
    is_success      BOOLEAN NOT NULL DEFAULT FALSE,
    result_message  TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BƯỚC 3: TẠO CHỈ MỤC TĂNG TỐC TRUY VẤN (INDEXES)
-- ============================================================
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_student_id ON public.users(student_id);
CREATE INDEX idx_users_google_id ON public.users(google_id);
CREATE INDEX idx_events_code ON public.events(code);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_tickets_code ON public.tickets(ticket_code);
CREATE INDEX idx_tickets_event ON public.tickets(event_id);
CREATE INDEX idx_tickets_user ON public.tickets(user_id);
CREATE INDEX idx_checkin_logs_event ON public.checkin_logs(event_id);

-- ============================================================
-- BƯỚC 4: TẠO TRIGGER TỰ ĐỘNG CẬP NHẬT UPDATED_AT
-- ============================================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_events_updated BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_tickets_updated BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================
-- BƯỚC 5: KHỞI TẠO TÀI KHOẢN ADMIN & DỮ LIỆU SỰ KIỆN MẪU
-- Mật khẩu mặc định: Password123!
-- ============================================================
INSERT INTO public.users (
    id, email, student_id, password_hash, full_name, role, status, category
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'admin@buh.edu.vn',
    'BUH00001',
    '$2a$10$wY9kQ2QpE0eZ3pG6hC3bYeR5nZ9sA1dK7mX4vL8tP2uI6oW3yQ8mC', -- Password123!
    'Ban Quản Trị BUH',
    'admin',
    'active',
    'STAFF'
) ON CONFLICT (email) DO NOTHING;

INSERT INTO public.events (
    id, code, title, description, location, start_time, end_time, capacity, registered_count, checkin_count, status, benefits, sponsors, created_by
) VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'BUH-2026-CHAO-K40',
    'Chào Đón Tân Sinh Viên K40 BUH 2026',
    'Chương trình nghệ thuật và chào đón toàn thể tân sinh viên khóa 40 gia nhập Đại học Ngân hàng TP.HCM. Hãy quét mã QR để nhận vé điện tử ngay!',
    'Hội trường Lớn - Cơ sở 56 Hoàng Diệu 2, TP. Thủ Đức',
    NOW() + INTERVAL '3 days',
    NOW() + INTERVAL '3 days 4 hours',
    1200,
    0,
    0,
    'upcoming',
    'Cộng 10 Điểm Rèn Luyện, Quà tặng vòng tay BUH, Áo thun sự kiện',
    'Đoàn Thanh Niên BUH, Vietcombank, BIDV',
    'a0000000-0000-0000-0000-000000000001'
),
(
    'b0000000-0000-0000-0000-000000000002',
    'BUH-2026-FINTECH-SUMMIT',
    'Hội Thảo Fintech & Ngân Hàng Số 2026',
    'Chia sẻ kiến thức chuyên sâu về công nghệ tài chính, AI trong ngân hàng và định hướng nghề nghiệp tương lai cùng các chuyên gia hàng đầu.',
    'Hội trường B - Tầng 2 Nhà A',
    NOW() + INTERVAL '7 days',
    NOW() + INTERVAL '7 days 3 hours',
    300,
    0,
    0,
    'upcoming',
    'Cộng 5 Điểm Rèn Luyện, Giấy chứng nhận tham gia hội thảo',
    'Viettel Money, MoMo, Techcombank',
    'a0000000-0000-0000-0000-000000000001'
) ON CONFLICT (code) DO NOTHING;
