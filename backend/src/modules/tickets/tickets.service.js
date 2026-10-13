const db = require('../../database/db');
const crypto = require('crypto');

async function registerTicket(eventId, user, participantInfo = {}) {
    return await db.transaction(async (client) => {
        // 1. Lock the event row for update (Row-level ACID locking)
        const eventRes = await client.query(
            'SELECT id, code, title, capacity, registered_count, status FROM events WHERE id = $1 FOR UPDATE',
            [eventId]
        );

        if (eventRes.rowCount === 0) {
            const err = new Error('Sự kiện không tồn tại!');
            err.statusCode = 404;
            throw err;
        }

        const event = eventRes.rows[0];

        // 2. Check event status
        if (event.status === 'cancelled' || event.status === 'completed') {
            const err = new Error('Sự kiện này đã kết thúc hoặc bị hủy!');
            err.statusCode = 400;
            throw err;
        }

        // 3. Check capacity
        if (event.registered_count >= event.capacity) {
            const err = new Error('Sự kiện đã hết vé (đạt tối đa sức chứa)!');
            err.statusCode = 409;
            throw err;
        }

        // 4. Check if user already has a ticket for this event
        const existingTicket = await client.query(
            'SELECT id, ticket_code FROM tickets WHERE event_id = $1 AND user_id = $2',
            [eventId, user.id]
        );

        if (existingTicket.rowCount > 0) {
            const err = new Error('Bạn đã đăng ký vé cho sự kiện này rồi!');
            err.statusCode = 409;
            throw err;
        }

        // 5. Generate secure guaranteed unique ticket code
        const seq = String(event.registered_count + 1).padStart(4, '0');
        const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
        const mssvCode = (user.student_id || participantInfo.studentId || seq).replace(/[^a-zA-Z0-9]/g, '');
        const ticketCode = `BUH-${event.code}-${mssvCode}-${randomSuffix}`;

        const name = participantInfo.fullName || user.full_name;
        const mssv = participantInfo.studentId || user.student_id || 'KHÁCH';
        const email = participantInfo.email || user.email;

        // 6. Insert ticket
        const ticketRes = await client.query(
            `INSERT INTO tickets 
             (ticket_code, event_id, user_id, participant_name, participant_mssv, participant_email, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'valid')
             RETURNING *`,
            [ticketCode, eventId, user.id, name, mssv, email]
        );

        // 7. Increment event registered_count atomically
        await client.query(
            'UPDATE events SET registered_count = registered_count + 1 WHERE id = $1',
            [eventId]
        );

        const ticket = ticketRes.rows[0];
        ticket.event = {
            id: event.id,
            code: event.code,
            title: event.title
        };

        return ticket;
    });
}

async function getMyTickets(userId) {
    const query = `
        SELECT t.id, t.ticket_code, t.status, t.checked_in_at, t.created_at,
               t.participant_name, t.participant_mssv, t.participant_email,
               e.id as event_id, e.code as event_code, e.title as event_title,
               e.location as event_location, e.start_time, e.end_time, e.benefits
        FROM tickets t
        JOIN events e ON t.event_id = e.id
        WHERE t.user_id = $1
        ORDER BY t.created_at DESC
    `;

    const res = await db.query(query, [userId]);
    return res.rows.map((row) => ({
        id: row.id,
        ticketCode: row.ticket_code,
        status: row.status,
        checkedInAt: row.checked_in_at,
        createdAt: row.created_at,
        participantName: row.participant_name,
        participantMssv: row.participant_mssv,
        participantEmail: row.participant_email,
        event: {
            id: row.event_id,
            code: row.event_code,
            title: row.event_title,
            location: row.event_location,
            startTime: row.start_time,
            endTime: row.end_time,
            benefits: row.benefits
        }
    }));
}

async function getEventTickets(eventId) {
    const query = `
        SELECT t.id, t.ticket_code, t.status, t.checked_in_at, t.created_at,
               t.participant_name, t.participant_mssv, t.participant_email,
               u.id as user_id, u.category as user_category
        FROM tickets t
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.event_id = $1
        ORDER BY t.created_at ASC
    `;

    const res = await db.query(query, [eventId]);
    return res.rows;
}

module.exports = {
    registerTicket,
    getMyTickets,
    getEventTickets
};
