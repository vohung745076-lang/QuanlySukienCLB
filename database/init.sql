-- ============================================================
-- BEECLUB - PRODUCTION DATABASE INITIALIZATION (PostgreSQL 16)
-- Quản lý quan hệ thực thể, ràng buộc toàn vẹn & Seed Data mẫu
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. BẢNG USERS (Tài khoản, Hồ sơ, Phân quyền RBAC)
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    student_id      VARCHAR(50) UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(150) NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'manager', 'admin')),
    avatar_url      TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_duty', 'suspended')),
    category        VARCHAR(20) NOT NULL DEFAULT 'REGULAR' CHECK (category IN ('VIP', 'STAFF', 'REGULAR')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. BẢNG EVENTS (Sự kiện, Sức chứa, Tiến độ)
CREATE TABLE IF NOT EXISTS events (
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
    created_by        UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. BẢNG TICKETS (Vé tham gia, Mã định danh duy nhất)
CREATE TABLE IF NOT EXISTS tickets (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_code       VARCHAR(100) UNIQUE NOT NULL,
    event_id          UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant_name  VARCHAR(150) NOT NULL,
    participant_mssv  VARCHAR(50) NOT NULL,
    participant_email VARCHAR(255) NOT NULL,
    status            VARCHAR(20) NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'used', 'cancelled')),
    checked_in_at     TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_event_user UNIQUE (event_id, user_id)
);

-- 4. BẢNG CHECKIN_LOGS (Lịch sử điểm danh chi tiết thời gian thực)
CREATE TABLE IF NOT EXISTS checkin_logs (
    id              BIGSERIAL PRIMARY KEY,
    event_id        UUID REFERENCES events(id) ON DELETE CASCADE,
    ticket_id       UUID REFERENCES tickets(id) ON DELETE SET NULL,
    staff_id        UUID REFERENCES users(id) ON DELETE SET NULL,
    input_code      VARCHAR(100) NOT NULL,
    is_success      BOOLEAN NOT NULL DEFAULT FALSE,
    result_message  TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. BẢNG REFRESH_TOKENS (Xác thực an toàn JWT đa phiên)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT UNIQUE NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    is_revoked  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES TỐI ƯU HÓA HIỆU NĂNG TRUY VẤN
CREATE INDEX IF NOT EXISTS idx_users_search ON users (email, student_id, full_name);
CREATE INDEX IF NOT EXISTS idx_events_status_time ON events (status, start_time);
CREATE INDEX IF NOT EXISTS idx_tickets_code ON tickets (ticket_code);
CREATE INDEX IF NOT EXISTS idx_tickets_event ON tickets (event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets (user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_mssv ON tickets (participant_mssv);
CREATE INDEX IF NOT EXISTS idx_checkin_logs_event ON checkin_logs (event_id, created_at DESC);

-- TRIGGER TỰ ĐỘNG CẬP NHẬT UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_events_updated_at ON events;
CREATE TRIGGER trg_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_tickets_updated_at ON tickets;
CREATE TRIGGER trg_tickets_updated_at BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SEED DATA BAN ĐẦU (Khớp với UI Mockup BeeClub & Mật khẩu mặc định: Password123!)
-- Hash bcrypted của "Password123!": $2b$10$wEeVq0h0yv3fG4yJ3N0G1e5z5xXwXg1k8bI5mH2jV1rV4cZ5aA7lC
-- ============================================================

INSERT INTO users (id, email, student_id, password_hash, full_name, role, status, category, created_at) VALUES
('a0000000-0000-0000-0000-000000000001', 'admin@beeclub.com', 'ADMIN-01', '$2a$10$nlIihB9iJsOWygOx0NUe/ea3DS9hem5rz2ihgF23hwSngGaMQvKTe', 'Super Admin Bee', 'admin', 'on_duty', 'STAFF', NOW() - INTERVAL '30 days'),
('a0000000-0000-0000-0000-000000000002', 'julian.t@hive-net.com', 'VIP-001', '$2a$10$nlIihB9iJsOWygOx0NUe/ea3DS9hem5rz2ihgF23hwSngGaMQvKTe', 'Julian Thorne', 'user', 'active', 'VIP', '2023-10-12 10:00:00+07'),
('a0000000-0000-0000-0000-000000000003', 'e.vance@hive-staff.net', 'STF-042', '$2a$10$nlIihB9iJsOWygOx0NUe/ea3DS9hem5rz2ihgF23hwSngGaMQvKTe', 'Elena Vance', 'admin', 'on_duty', 'STAFF', '2024-02-05 14:30:00+07'),
('a0000000-0000-0000-0000-000000000004', 'm.reed@gmail.com', '20240101', '$2a$10$nlIihB9iJsOWygOx0NUe/ea3DS9hem5rz2ihgF23hwSngGaMQvKTe', 'Marcus Reed', 'user', 'inactive', 'REGULAR', '2024-01-22 09:15:00+07'),
('a0000000-0000-0000-0000-000000000005', 'sasha.g@vip.hive.com', 'VIP-002', '$2a$10$nlIihB9iJsOWygOx0NUe/ea3DS9hem5rz2ihgF23hwSngGaMQvKTe', 'Sasha Grey', 'user', 'active', 'VIP', '2023-12-30 16:45:00+07')
ON CONFLICT (email) DO NOTHING;

INSERT INTO events (id, code, title, description, location, start_time, end_time, capacity, registered_count, checkin_count, status, benefits, sponsors, created_by) VALUES
('b0000000-0000-0000-0000-000000000001', 'EVT-BEE-01', 'Đại Hội Thường Niên BEECLUB 2026', 'Tổng kết hoạt động năm và định hướng chiến lược thế hệ mới cho toàn thể thành viên hive.', 'Hội trường Grand Sapphire - Tầng 3', NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days 4 hours', 1000, 850, 12, 'upcoming', 'Cộng 10 ĐRL, Giấy chứng nhận Membership Gold', 'Google Developers, VNPT', 'a0000000-0000-0000-0000-000000000001'),
('b0000000-0000-0000-0000-000000000002', 'EVT-BEE-02', 'Gala Dinner Kỷ Niệm 5 Năm Hive', 'Dạ tiệc tri ân ban điều hành, cựu thành viên và các nhà tài trợ chiến lược.', 'Nhà hàng Skyview Amber', NOW() + INTERVAL '20 days', NOW() + INTERVAL '20 days 5 hours', 300, 298, 0, 'upcoming', 'Tiệc Buffet 5 sao, Bốc thăm trúng thưởng MacBook Air', 'Highlands Coffee, FPT Software', 'a0000000-0000-0000-0000-000000000001'),
('b0000000-0000-0000-0000-000000000003', 'EVT-BEE-03', 'Workshop: Kiến Trúc AI Agent & Microservices', 'Chuyên đề kỹ thuật chuyên sâu về Agentic Workflow và triển khai hệ thống quy mô lớn.', 'Phòng Lab Kỹ thuật 401', NOW() + INTERVAL '12 days', NOW() + INTERVAL '12 days 3 hours', 150, 150, 0, 'upcoming', 'Bộ tài liệu độc quyền, Khóa học Certificate', 'Google DeepMind Network', 'a0000000-0000-0000-0000-000000000001')
ON CONFLICT (code) DO NOTHING;

INSERT INTO tickets (id, ticket_code, event_id, user_id, participant_name, participant_mssv, participant_email, status, checked_in_at) VALUES
('c0000000-0000-0000-0000-000000000001', 'BEE-EVT01-0001', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'Julian Thorne', 'VIP-001', 'julian.t@hive-net.com', 'used', NOW() - INTERVAL '1 hour'),
('c0000000-0000-0000-0000-000000000002', 'BEE-EVT01-0002', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', 'Sasha Grey', 'VIP-002', 'sasha.g@vip.hive.com', 'used', NOW() - INTERVAL '30 minutes'),
('c0000000-0000-0000-0000-000000000003', 'BEE-EVT01-0003', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'Marcus Reed', '20240101', 'm.reed@gmail.com', 'valid', NULL)
ON CONFLICT (ticket_code) DO NOTHING;

INSERT INTO checkin_logs (event_id, ticket_id, staff_id, input_code, is_success, result_message, created_at) VALUES
('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'BEE-EVT01-0001', true, 'Check-in thành công (VIP)', NOW() - INTERVAL '1 hour'),
('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', 'VIP-002', true, 'Check-in thành công qua MSSV (VIP)', NOW() - INTERVAL '30 minutes')
ON CONFLICT DO NOTHING;
