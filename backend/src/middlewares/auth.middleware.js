const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../database/db');
const { sendError } = require('../utils/response');

async function authenticate(req, res, next) {
    try {
        let token = null;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.query && req.query.token) {
            token = req.query.token;
        }

        if (!token) {
            return sendError(res, 'Authentication required: Missing or invalid Bearer token', 401);
        }
        let decoded;
        try {
            decoded = jwt.verify(token, config.jwt.secret);
        } catch (jwtErr) {
            if (jwtErr.name === 'TokenExpiredError') {
                return sendError(res, 'Access token has expired', 401);
            }
            return sendError(res, 'Invalid access token', 401);
        }

        // Fetch user from DB
        const userRes = await db.query(
            'SELECT id, email, student_id, full_name, role, status, category FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (userRes.rowCount === 0) {
            return sendError(res, 'User account no longer exists', 401);
        }

        const user = userRes.rows[0];
        if (user.status === 'suspended') {
            return sendError(res, 'Your account has been suspended', 403);
        }

        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
}

module.exports = {
    authenticate
};
