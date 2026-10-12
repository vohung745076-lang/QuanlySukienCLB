const usersService = require('./users.service');
const { sendSuccess, sendError, sendPagination } = require('../../utils/response');

async function getStats(req, res, next) {
    try {
        const stats = await usersService.getMemberHubStats();
        return sendSuccess(res, stats, 'Lấy thống kê Member Hub thành công');
    } catch (err) {
        next(err);
    }
}

async function listMembers(req, res, next) {
    try {
        const { search = '', category = 'All', page = 1, limit = 10 } = req.query;
        const result = await usersService.getMembers({
            search,
            category,
            page: parseInt(page, 10) || 1,
            limit: parseInt(limit, 10) || 10
        });

        return sendPagination(res, result.items, result.total, page, limit, 'Lấy danh sách thành viên thành công');
    } catch (err) {
        next(err);
    }
}

async function createMember(req, res, next) {
    try {
        const { fullName, email, studentId, role, category, status, password } = req.body;
        if (!fullName || !email) {
            return sendError(res, 'Vui lòng cung cấp họ tên và email!', 400);
        }

        const newMember = await usersService.addMember({
            fullName,
            email,
            studentId,
            role,
            category,
            status,
            password
        });

        return sendSuccess(res, newMember, 'Thêm thành viên thành công!', 201);
    } catch (err) {
        next(err);
    }
}

async function updateRole(req, res, next) {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (!role) {
            return sendError(res, 'Vui lòng chỉ định vai trò (role)!', 400);
        }

        const updated = await usersService.updateMemberRole(id, role);
        return sendSuccess(res, updated, 'Cập nhật quyền thành công!');
    } catch (err) {
        next(err);
    }
}

async function deleteMember(req, res, next) {
    try {
        const { id } = req.params;
        const result = await usersService.deleteMember(id, req.user.id);
        return sendSuccess(res, result, 'Xóa thành viên thành công!');
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getStats,
    listMembers,
    createMember,
    updateRole,
    deleteMember
};
