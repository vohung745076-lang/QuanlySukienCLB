const db = require('../../database/db');
const config = require('../../config');
const jwt = require('jsonwebtoken');

function generateTokens(user) {
    const payload = {
        userId: user.id,
        email: user.email,
        role: user.role
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn
    });

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpiresIn
    });

    return { accessToken, refreshToken };
}

async function verifyGoogleToken(idToken) {
    if (!idToken) {
        const err = new Error('Thiếu Google ID Token');
        err.statusCode = 400;
        throw err;
    }

    try {
        const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            const err = new Error(errData.error_description || 'Mã xác thực Google không hợp lệ hoặc đã hết hạn');
            err.statusCode = 401;
            throw err;
        }

        const data = await res.json();
        return data;
    } catch (e) {
        if (e.statusCode) throw e;
        const err = new Error('Không thể kết nối đến máy chủ Google để xác thực: ' + e.message);
        err.statusCode = 502;
        throw err;
    }
}

async function googleLogin(idToken) {
    const payload = await verifyGoogleToken(idToken);
    const email = (payload.email || '').toLowerCase().trim();

    if (!email) {
        const err = new Error('Tài khoản Google không cung cấp địa chỉ email');
        err.statusCode = 400;
        throw err;
    }

    // Kiểm tra domain trường BUH (@st.buh.edu.vn, @buh.edu.vn, @st.buh.com)
    const emailParts = email.split('@');
    const domain = (emailParts[1] || '').toLowerCase();
    const rawMssv = emailParts[0];

    const isAllowedDomain = config.google.allowedDomains.some(
        allowed => domain === allowed || domain.endsWith('.' + allowed)
    );

    // Ở môi trường production, yêu cầu nghiêm ngặt email sinh viên trường BUH
    if (!isAllowedDomain && config.env === 'production') {
        const err = new Error(`Chỉ chấp nhận tài khoản Google sinh viên BUH (@${config.google.allowedDomains.join(', @')})!`);
        err.statusCode = 403;
        throw err;
    }

    // Trích xuất MSSV từ email (Ví dụ: 050608240001@st.buh.edu.vn -> MSSV: 050608240001)
    const studentId = rawMssv.toUpperCase();
    const googleId = payload.sub;
    const fullName = payload.name || 'Sinh viên BUH';
    const avatarUrl = payload.picture || null;

    // Tìm kiếm xem user đã tồn tại chưa (qua google_id, email hoặc student_id)
    const existing = await db.query(
        `SELECT id, email, student_id, full_name, role, status, category, avatar_url, google_id 
         FROM users 
         WHERE google_id = $1 OR LOWER(email) = $2 OR UPPER(student_id) = $3`,
        [googleId, email, studentId]
    );

    let user;
    if (existing.rowCount > 0) {
        user = existing.rows[0];

        if (user.status === 'suspended') {
            const err = new Error('Tài khoản sinh viên đã bị tạm khóa. Vui lòng liên hệ Ban Tổ Chức!');
            err.statusCode = 403;
            throw err;
        }

        // Cập nhật thông tin Google mới nhất
        const updateRes = await db.query(
            `UPDATE users 
             SET google_id = COALESCE(google_id, $1),
                 avatar_url = COALESCE($2, avatar_url),
                 full_name = COALESCE($3, full_name),
                 student_id = COALESCE(student_id, $4),
                 updated_at = NOW()
             WHERE id = $5
             RETURNING id, email, student_id, full_name, role, status, category, avatar_url`,
            [googleId, avatarUrl, fullName, studentId, user.id]
        );
        user = updateRes.rows[0];
    } else {
        // Tạo tài khoản sinh viên mới
        const insertRes = await db.query(
            `INSERT INTO users (email, student_id, full_name, google_id, avatar_url, role, status, category)
             VALUES ($1, $2, $3, $4, $5, 'user', 'active', 'REGULAR')
             RETURNING id, email, student_id, full_name, role, status, category, avatar_url, created_at`,
            [email, studentId, fullName, googleId, avatarUrl]
        );
        user = insertRes.rows[0];
    }

    const tokens = generateTokens(user);

    // Lưu refresh token
    await db.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
        [user.id, tokens.refreshToken]
    );

    return { user, ...tokens };
}

module.exports = {
    verifyGoogleToken,
    googleLogin
};
