-- ============================================================
-- HỆ THỐNG QUẢN LÝ SỰ KIỆN CLB - Supabase Setup Script
-- Chạy toàn bộ file này trong: Supabase Dashboard > SQL Editor
-- ============================================================


-- ============================================================
-- BƯỚC 1: TẠO CÁC BẢNG
-- ============================================================

-- Bảng profiles: Mở rộng từ auth.users của Supabase
CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name        TEXT NOT NULL DEFAULT 'Thành viên',
    student_id  TEXT UNIQUE,
    role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'manager', 'admin')),
    email       TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng events: Lưu thông tin sự kiện
CREATE TABLE IF NOT EXISTS public.events (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    date        TIMESTAMPTZ NOT NULL,
    end_date    TIMESTAMPTZ,
    location    TEXT,
    description TEXT,
    capacity    INT NOT NULL DEFAULT 1000,
    registered  INT NOT NULL DEFAULT 0,
    checkins    INT NOT NULL DEFAULT 0,
    creator_id  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    benefits    TEXT,
    sponsors    TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng tickets: Vé đăng ký tham gia sự kiện
CREATE TABLE IF NOT EXISTS public.tickets (
    id                  TEXT PRIMARY KEY,
    event_id            TEXT REFERENCES public.events(id) ON DELETE CASCADE,
    user_id             UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status              TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'used')),
    participant_name    TEXT,
    participant_mssv    TEXT,
    participant_email   TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng checkin_logs: Lịch sử check-in
CREATE TABLE IF NOT EXISTS public.checkin_logs (
    id          BIGSERIAL PRIMARY KEY,
    ticket_id   TEXT REFERENCES public.tickets(id) ON DELETE SET NULL,
    event_id    TEXT REFERENCES public.events(id) ON DELETE SET NULL,
    code        TEXT,
    success     BOOLEAN NOT NULL DEFAULT FALSE,
    note        TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- BƯỚC 2: BẬT ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkin_logs  ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- BƯỚC 3: TẠO RLS POLICIES
-- ============================================================

-- PROFILES --
-- Ai cũng đọc được profile (cho hiển thị tên)
CREATE POLICY "profiles: public read"
    ON public.profiles FOR SELECT USING (true);

-- User chỉ tự update profile của mình
CREATE POLICY "profiles: user can update own"
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Tự động tạo profile khi đăng ký (trigger xử lý bên dưới)
CREATE POLICY "profiles: insert own"
    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Admin xóa profile (dùng service_role từ backend nếu cần)
CREATE POLICY "profiles: admin delete"
    ON public.profiles FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );


-- EVENTS --
-- Ai cũng đọc được sự kiện
CREATE POLICY "events: public read"
    ON public.events FOR SELECT USING (true);

-- Đã đăng nhập mới tạo sự kiện
CREATE POLICY "events: auth insert"
    ON public.events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Admin/Manager mới có thể sửa sự kiện
CREATE POLICY "events: admin or creator update"
    ON public.events FOR UPDATE USING (
        auth.uid() = creator_id OR
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('admin', 'manager')
        )
    );

-- Admin/Creator xóa sự kiện
CREATE POLICY "events: admin or creator delete"
    ON public.events FOR DELETE USING (
        auth.uid() = creator_id OR
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );


-- TICKETS --
-- Ai cũng đọc được vé (để check-in)
CREATE POLICY "tickets: public read"
    ON public.tickets FOR SELECT USING (true);

-- Đã đăng nhập mới đăng ký vé
CREATE POLICY "tickets: auth insert"
    ON public.tickets FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Admin/Manager cập nhật trạng thái vé (check-in, undo)
CREATE POLICY "tickets: admin update"
    ON public.tickets FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('admin', 'manager')
        )
    );

-- Xóa vé: chỉ admin
CREATE POLICY "tickets: admin delete"
    ON public.tickets FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );


-- CHECKIN LOGS --
-- Admin/Manager đọc log
CREATE POLICY "checkin_logs: admin read"
    ON public.checkin_logs FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('admin', 'manager')
        )
    );

-- Admin/Manager ghi log
CREATE POLICY "checkin_logs: admin insert"
    ON public.checkin_logs FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('admin', 'manager')
        )
    );

-- Admin/Manager xóa log
CREATE POLICY "checkin_logs: admin delete"
    ON public.checkin_logs FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('admin', 'manager')
        )
    );


-- ============================================================
-- BƯỚC 4: AUTO-CREATE PROFILE KHI USER ĐĂNG KÝ
-- (Trigger tự chạy sau khi auth.users có user mới)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, student_id, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Thành viên mới'),
        NEW.email,
        NEW.raw_user_meta_data->>'student_id',
        'user'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gắn trigger vào auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- BƯỚC 5: DỮ LIỆU MẪU (Demo Events - Tuỳ chọn)
-- Bỏ comment phần này nếu muốn có data mẫu để test
-- ============================================================

/*
INSERT INTO public.events (id, name, date, end_date, location, description, capacity, registered, benefits, sponsors) VALUES
(
    'EVT-1',
    'Đại hội thường niên 2026',
    '2026-05-15 08:00:00+07',
    '2026-05-15 12:00:00+07',
    'Hội trường lớn',
    'Đại hội tổng kết hoạt động năm.',
    1000, 850,
    'Cộng 5 ĐRL, Giấy chứng nhận',
    'Đoàn trường'
),
(
    'EVT-2',
    'Gala Dinner Kỷ niệm',
    '2026-06-20 18:30:00+07',
    '2026-06-20 22:30:00+07',
    'Nhà hàng Ruby',
    'Tiệc kỷ niệm thành lập câu lạc bộ.',
    500, 120,
    'Ăn tối, Bốc thăm trúng thưởng',
    'Highlands Coffee'
),
(
    'EVT-3',
    'Workshop Kỹ năng mềm',
    '2026-04-20 14:00:00+07',
    '2026-04-20 17:00:00+07',
    'Phòng học 302',
    'Chia sẻ kỹ năng giao tiếp và làm việc nhóm.',
    200, 198,
    'Sổ tay, Bút, Cơ hội thực tập',
    'Google, VNPT'
);
*/


-- ============================================================
-- HOÀN TẤT!
-- Sau khi chạy xong, cung cấp cho developer:
--   - Project URL: Dashboard > Settings > API > Project URL
--   - Anon Key:    Dashboard > Settings > API > anon (public)
-- ============================================================
