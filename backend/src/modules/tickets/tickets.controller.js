const ticketsService = require('./tickets.service');
const { sendSuccess, sendError } = require('../../utils/response');

async function bookTicket(req, res, next) {
    try {
        const { eventId, fullName, studentId, email } = req.body;
        if (!eventId) {
            return sendError(res, 'Vui lòng chọn sự kiện để đăng ký vé!', 400);
        }

        const ticket = await ticketsService.registerTicket(eventId, req.user, {
            fullName,
            studentId,
            email
        });

        return sendSuccess(res, ticket, 'Đăng ký vé thành công! Chúc mừng bạn.', 201);
    } catch (err) {
        next(err);
    }
}

async function getMyTickets(req, res, next) {
    try {
        const tickets = await ticketsService.getMyTickets(req.user.id);
        return sendSuccess(res, tickets, 'Lấy danh sách vé thành công');
    } catch (err) {
        next(err);
    }
}

async function getEventTickets(req, res, next) {
    try {
        const { eventId } = req.params;
        const tickets = await ticketsService.getEventTickets(eventId);
        return sendSuccess(res, tickets, 'Lấy danh sách vé của sự kiện thành công');
    } catch (err) {
        next(err);
    }
}

module.exports = {
    bookTicket,
    getMyTickets,
    getEventTickets
};
