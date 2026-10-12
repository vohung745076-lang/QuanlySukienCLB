const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../database/db');
const config = require('../../config');

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

async function register({ email, password, fullName, studentId }) {
    // 1. Check existing email or student_id
    const existing = await db.query(
        'SELECT id, email, student_id FROM users WHERE email = $1 OR student_id = $2',
        [email.toLowerCase().trim(), studentId ? studentId.trim() : null]
    );

    if (existing.rowCount > 0) {
        const found = existing.rows[0];
        if (found.email === email.toLowerCase().trim()) {
            const err = new Error('Email này đã được sử dụng!');
            err.statusCode = 409;
            throw err;
        }
        if (studentId && found.student_id === studentId.trim()) {
            const err = new Error('Mã số sinh viên (MSSV) này đã được liên kết với tài khoản khác!');
            err.statusCode = 409;
            throw err;
        }
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Insert user
    const insertRes = await db.query(
        `INSERT INTO users (email, password_hash, full_name, student_id, role, status, category)
         VALUES ($1, $2, $3, $4, 'user', 'active', 'REGULAR')
         RETURNING id, email, student_id, full_name, role, status, category, created_at`,
        [email.toLowerCase().trim(), passwordHash, fullName.trim(), studentId ? studentId.trim() : null]
    );

    const newUser = insertRes.rows[0];
    const tokens = generateTokens(newUser);

    // Store refresh token
    await db.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
        [newUser.id, tokens.refreshToken]
    );

    return { user: newUser, ...tokens };
}

async function login({ username, password }) {
    const identifier = username.trim();

    // Support login via email or student_id
    const userRes = await db.query(
        `SELECT id, email, student_id, password_hash, full_name, role, status, category, avatar_url
         FROM users
         WHERE LOWER(email) = LOWER($1) OR UPPER(student_id) = UPPER($1)`,
        [identifier]
    );

    if (userRes.rowCount === 0) {
        const err = new Error('Tài khoản hoặc mật khẩu không chính xác!');
        err.statusCode = 401;
        throw err;
    }

    const user = userRes.rows[0];

    if (user.status === 'suspended') {
        const err = new Error('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin!');
        err.statusCode = 403;
        throw err;
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
        const err = new Error('Tài khoản hoặc mật khẩu không chính xác!');
        err.statusCode = 401;
        throw err;
    }

    delete user.password_hash;
    const tokens = generateTokens(user);

    // Save refresh token
    await db.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
        [user.id, tokens.refreshToken]
    );

    return { user, ...tokens };
}

async function refreshToken(token) {
    if (!token) {
        const err = new Error('Thiếu refresh token');
        err.statusCode = 401;
        throw err;
    }

    let decoded;
    try {
        decoded = jwt.verify(token, config.jwt.refreshSecret);
    } catch (e) {
        const err = new Error('Refresh token không hợp lệ hoặc đã hết hạn');
        err.statusCode = 401;
        throw err;
    }

    // Verify in db
    const tokenRecord = await db.query(
        'SELECT id, is_revoked FROM refresh_tokens WHERE token_hash = $1 AND user_id = $2',
        [token, decoded.userId]
    );

    if (tokenRecord.rowCount === 0 || tokenRecord.rows[0].is_revoked) {
        const err = new Error('Refresh token đã bị thu hồi hoặc không hợp lệ');
        err.statusCode = 401;
        throw err;
    }

    const userRes = await db.query(
        'SELECT id, email, student_id, full_name, role, status, category FROM users WHERE id = $1',
        [decoded.userId]
    );

    if (userRes.rowCount === 0) {
        const err = new Error('Người dùng không còn tồn tại');
        err.statusCode = 401;
        throw err;
    }

    const user = userRes.rows[0];
    const newTokens = generateTokens(user);

    // Revoke old and insert new
    await db.query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE id = $1', [tokenRecord.rows[0].id]);
    await db.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
        [user.id, newTokens.refreshToken]
    );

    return { user, ...newTokens };
}

module.exports = {
    register,
    login,
    refreshToken
};
