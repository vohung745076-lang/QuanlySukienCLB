const db = require('../../database/db');

async function processCheckin({ eventId, code, staffId }) {
    const rawCode = (code || '').trim();
    if (!rawCode) {
        const err = new Error('Vui lòng nhập mã vé hoặc MSSV!');
        err.statusCode = 400;
        throw err;
    }

    return await db.transaction(async (client) => {
        // 1. Find ticket by code OR student_id within this event
        const ticketRes = await client.query(
            `SELECT t.id, t.ticket_code, t.status, t.checked_in_at, t.participant_name, 
                    t.participant_mssv, t.participant_email, t.event_id,
                    u.category as user_category
             FROM tickets t
             LEFT JOIN users u ON t.user_id = u.id
             WHERE t.event_id = $1 AND (t.ticket_code ILIKE $2 OR t.participant_mssv ILIKE $2)
             LIMIT 1
             FOR UPDATE OF t`,
            [eventId, rawCode]
        );

        if (ticketRes.rowCount === 0) {
            // Log failure
            await client.query(
                `INSERT INTO checkin_logs (event_id, staff_id, input_code, is_success, result_message)
                 VALUES ($1, $2, $3, FALSE, $4)`,
                [eventId, staffId, rawCode, 'Không tìm thấy vé hoặc MSSV không khớp']
            );

            return {
                success: false,
                message: '❌ Không tìm thấy vé hợp lệ cho sự kiện này (hoặc sai MSSV)!',
                ticket: null
            };
        }

        const ticket = ticketRes.rows[0];

        // 2. Case: Ticket already used
        if (ticket.status === 'used') {
            await client.query(
                `INSERT INTO checkin_logs (event_id, ticket_id, staff_id, input_code, is_success, result_message)
                 VALUES ($1, $2, $3, $4, TRUE, $5)`,
                [eventId, ticket.id, staffId, rawCode, 'Cảnh báo: Vé đã được điểm danh trước đó']
            );

            return {
                success: true,
                alreadyUsed: true,
                message: '⚠️ Vé này ĐÃ ĐƯỢC CHECK-IN trước đó!',
                ticket: {
                    id: ticket.id,
                    ticketCode: ticket.ticket_code,
                    participantName: ticket.participant_name,
                    participantMssv: ticket.participant_mssv,
                    category: ticket.user_category || 'REGULAR',
                    checkedInAt: ticket.checked_in_at
                }
            };
        }

        // 3. Case: Valid ticket -> Mark used & update event checkin count
        const now = new Date();
        await client.query(
            'UPDATE tickets SET status = $1, checked_in_at = $2 WHERE id = $3',
            ['used', now, ticket.id]
        );

        await client.query(
            'UPDATE events SET checkin_count = checkin_count + 1 WHERE id = $1',
            [eventId]
        );

        const categoryText = ticket.user_category ? ` (${ticket.user_category})` : '';
        await client.query(
            `INSERT INTO checkin_logs (event_id, ticket_id, staff_id, input_code, is_success, result_message)
             VALUES ($1, $2, $3, $4, TRUE, $5)`,
            [eventId, ticket.id, staffId, rawCode, `Check-in thành công${categoryText}`]
        );

        return {
            success: true,
            alreadyUsed: false,
            message: `✅ Check-in thành công${categoryText}!`,
            ticket: {
                id: ticket.id,
                ticketCode: ticket.ticket_code,
                participantName: ticket.participant_name,
                participantMssv: ticket.participant_mssv,
                category: ticket.user_category || 'REGULAR',
                checkedInAt: now
            }
        };
    });
}

async function getRecentLogs(eventId = null, limit = 30) {
    let query = `
        SELECT l.id, l.input_code, l.is_success, l.result_message, l.created_at,
               t.ticket_code, t.participant_name, t.participant_mssv,
               e.id as event_id, e.title as event_title,
               u.full_name as staff_name
        FROM checkin_logs l
        LEFT JOIN tickets t ON l.ticket_id = t.id
        LEFT JOIN events e ON l.event_id = e.id
        LEFT JOIN users u ON l.staff_id = u.id
    `;

    const params = [];
    if (eventId) {
        params.push(eventId);
        query += ` WHERE l.event_id = $1`;
    }

    query += ` ORDER BY l.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const res = await db.query(query, params);
    return res.rows;
}

async function clearLogs(eventId = null) {
    if (eventId) {
        await db.query('DELETE FROM checkin_logs WHERE event_id = $1', [eventId]);
    } else {
        await db.query('DELETE FROM checkin_logs');
    }
    return { success: true };
}

module.exports = {
    processCheckin,
    getRecentLogs,
    clearLogs
};
