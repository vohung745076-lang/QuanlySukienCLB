const checkinService = require('./checkin.service');
const { sendSuccess, sendError } = require('../../utils/response');

async function handleCheckin(req, res, next) {
    try {
        const { eventId, code } = req.body;
        if (!eventId || !code) {
            return sendError(res, 'Vui lòng chọn sự kiện và nhập mã vé/MSSV!', 400);
        }

        const result = await checkinService.processCheckin({
            eventId,
            code,
            staffId: req.user.id
        });

        return sendSuccess(res, result, result.message);
    } catch (err) {
        next(err);
    }
}

async function getLogs(req, res, next) {
    try {
        const { eventId, limit } = req.query;
        const logs = await checkinService.getRecentLogs(eventId || null, parseInt(limit, 10) || 30);
        return sendSuccess(res, logs, 'Lấy lịch sử check-in thành công');
    } catch (err) {
        next(err);
    }
}

async function clearLogs(req, res, next) {
    try {
        const { eventId } = req.query;
        await checkinService.clearLogs(eventId || null);
        return sendSuccess(res, null, 'Đã làm sạch nhật ký check-in');
    } catch (err) {
        next(err);
    }
}

module.exports = {
    handleCheckin,
    getLogs,
    clearLogs
};
