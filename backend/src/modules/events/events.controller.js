const eventsService = require('./events.service');
const { sendSuccess, sendError, sendPagination } = require('../../utils/response');

async function getStats(req, res, next) {
    try {
        const stats = await eventsService.getDashboardStats();
        return sendSuccess(res, stats, 'Lấy thống kê dashboard thành công');
    } catch (err) {
        next(err);
    }
}

async function listEvents(req, res, next) {
    try {
        const { search = '', status = 'all', page = 1, limit = 20 } = req.query;
        const result = await eventsService.getAllEvents({
            search,
            status,
            page: parseInt(page, 10) || 1,
            limit: parseInt(limit, 10) || 20
        });

        return sendPagination(res, result.items, result.total, page, limit, 'Lấy danh sách sự kiện thành công');
    } catch (err) {
        next(err);
    }
}

async function getEvent(req, res, next) {
    try {
        const { id } = req.params;
        const event = await eventsService.getEventById(id);
        return sendSuccess(res, event, 'Chi tiết sự kiện');
    } catch (err) {
        next(err);
    }
}

async function createEvent(req, res, next) {
    try {
        const { title, location, startTime, endTime, capacity } = req.body;
        if (!title || !location || !startTime || !endTime) {
            return sendError(res, 'Vui lòng cung cấp tiêu đề, địa điểm và thời gian tổ chức!', 400);
        }

        const newEvent = await eventsService.createEvent(req.body, req.user.id);
        return sendSuccess(res, newEvent, 'Tạo sự kiện mới thành công!', 201);
    } catch (err) {
        next(err);
    }
}

async function updateEvent(req, res, next) {
    try {
        const { id } = req.params;
        const updated = await eventsService.updateEvent(id, req.body);
        return sendSuccess(res, updated, 'Cập nhật sự kiện thành công!');
    } catch (err) {
        next(err);
    }
}

async function deleteEvent(req, res, next) {
    try {
        const { id } = req.params;
        const result = await eventsService.deleteEvent(id);
        return sendSuccess(res, result, 'Xóa sự kiện thành công!');
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getStats,
    listEvents,
    getEvent,
    createEvent,
    updateEvent,
    deleteEvent
};
