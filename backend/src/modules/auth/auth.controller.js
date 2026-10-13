const authService = require('./auth.service');
const googleService = require('./google.service');
const { sendSuccess, sendError } = require('../../utils/response');

async function register(req, res, next) {
    try {
        const { email, password, fullName, studentId } = req.body;
        if (!email || !password || !fullName) {
            return sendError(res, 'Vui lòng cung cấp email, họ tên và mật khẩu!', 400);
        }
        if (password.length < 6) {
            return sendError(res, 'Mật khẩu phải chứa ít nhất 6 ký tự!', 400);
        }

        const result = await authService.register({ email, password, fullName, studentId });
        return sendSuccess(res, result, 'Đăng ký tài khoản thành công!', 201);
    } catch (err) {
        next(err);
    }
}

async function login(req, res, next) {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return sendError(res, 'Vui lòng nhập email/MSSV và mật khẩu!', 400);
        }

        const result = await authService.login({ username, password });
        return sendSuccess(res, result, 'Đăng nhập thành công!');
    } catch (err) {
        next(err);
    }
}

async function googleLogin(req, res, next) {
    try {
        const { idToken } = req.body;
        if (!idToken) {
            return sendError(res, 'Vui lòng cung cấp Google ID Token!', 400);
        }

        const result = await googleService.googleLogin(idToken);
        return sendSuccess(res, result, 'Đăng nhập Google Sinh viên BUH thành công!');
    } catch (err) {
        next(err);
    }
}

async function refreshToken(req, res, next) {
    try {
        const { refreshToken } = req.body;
        const result = await authService.refreshToken(refreshToken);
        return sendSuccess(res, result, 'Làm mới token thành công!');
    } catch (err) {
        next(err);
    }
}

async function getMe(req, res, next) {
    try {
        return sendSuccess(res, req.user, 'Lấy thông tin người dùng thành công!');
    } catch (err) {
        next(err);
    }
}

module.exports = {
    register,
    login,
    googleLogin,
    refreshToken,
    getMe
};
