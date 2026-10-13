const db = require('../../database/db');

async function getDashboardStats() {
    const statsQuery = `
        SELECT 
            COUNT(*) as total_events,
            COALESCE(SUM(registered_count), 0) as total_registrations,
            COALESCE(SUM(checkin_count), 0) as total_checkins,
            COALESCE(SUM(capacity), 0) as total_capacity
        FROM events
    `;

    const res = await db.query(statsQuery);
    const row = res.rows[0];

    const totalEvents = parseInt(row.total_events, 10);
    const totalRegistrations = parseInt(row.total_registrations, 10);
    const totalCheckins = parseInt(row.total_checkins, 10);
    const totalCapacity = parseInt(row.total_capacity, 10);
    const fillRate = totalCapacity > 0 ? Math.round((totalRegistrations / totalCapacity) * 100) : 0;

    return {
        totalEvents,
        totalRegistrations,
        totalCheckins,
        totalCapacity,
        fillRate
    };
}

async function getAllEvents({ search = '', status = 'all', page = 1, limit = 20 }) {
    const conditions = [];
    const params = [];

    if (search && search.trim()) {
        params.push(`%${search.trim()}%`);
        conditions.push(`(title ILIKE $${params.length} OR code ILIKE $${params.length} OR location ILIKE $${params.length})`);
    }

    if (status && status !== 'all') {
        params.push(status);
        conditions.push(`status = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await db.query(`SELECT COUNT(*) as total FROM events ${whereClause}`, params);
    const total = parseInt(countRes.rows[0].total, 10);

    const offset = (page - 1) * limit;
    const selectQuery = `
        SELECT id, code, title, description, location, start_time, end_time, capacity, 
               registered_count, checkin_count, status, benefits, sponsors, created_at
        FROM events
        ${whereClause}
        ORDER BY start_time ASC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const eventsRes = await db.query(selectQuery, [...params, limit, offset]);

    return {
        items: eventsRes.rows,
        total
    };
}

async function getEventById(id) {
    const res = await db.query('SELECT * FROM events WHERE id = $1', [id]);
    if (res.rowCount === 0) {
        const err = new Error('Sự kiện không tồn tại!');
        err.statusCode = 404;
        throw err;
    }
    return res.rows[0];
}

async function createEvent(data, creatorId) {
    const {
        code: customCode,
        title,
        description,
        location,
        startTime,
        endTime,
        capacity = 1000,
        benefits,
        sponsors
    } = data;

    // Generate unique event code
    let code = customCode ? customCode.trim().toUpperCase() : null;
    if (!code) {
        const countRes = await db.query('SELECT COUNT(*) as count FROM events');
        const seq = String(parseInt(countRes.rows[0].count, 10) + 1).padStart(3, '0');
        code = `BUH-${new Date().getFullYear()}-${seq}`;
    }

    const insertRes = await db.query(
        `INSERT INTO events 
         (code, title, description, location, start_time, end_time, capacity, benefits, sponsors, created_by, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'upcoming')
         RETURNING *`,
        [code, title, description, location, startTime, endTime, capacity, benefits, sponsors, creatorId]
    );

    return insertRes.rows[0];
}

async function updateEvent(id, data) {
    const {
        title,
        description,
        location,
        startTime,
        endTime,
        capacity,
        status,
        benefits,
        sponsors
    } = data;

    const res = await db.query(
        `UPDATE events
         SET title = COALESCE($1, title),
             description = COALESCE($2, description),
             location = COALESCE($3, location),
             start_time = COALESCE($4, start_time),
             end_time = COALESCE($5, end_time),
             capacity = COALESCE($6, capacity),
             status = COALESCE($7, status),
             benefits = COALESCE($8, benefits),
             sponsors = COALESCE($9, sponsors)
         WHERE id = $10
         RETURNING *`,
        [title, description, location, startTime, endTime, capacity, status, benefits, sponsors, id]
    );

    if (res.rowCount === 0) {
        const err = new Error('Sự kiện không tồn tại!');
        err.statusCode = 404;
        throw err;
    }

    return res.rows[0];
}

async function deleteEvent(id) {
    const res = await db.query('DELETE FROM events WHERE id = $1 RETURNING id', [id]);
    if (res.rowCount === 0) {
        const err = new Error('Không tìm thấy sự kiện để xóa!');
        err.statusCode = 404;
        throw err;
    }
    return { deletedId: id };
}

module.exports = {
    getDashboardStats,
    getAllEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent
};
