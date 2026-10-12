/**
 * Standardized API Response Helper for BEECLUB RESTful APIs
 */

function sendSuccess(res, data = null, message = 'Success', statusCode = 200, meta = {}) {
    return res.status(statusCode).json({
        success: true,
        statusCode,
        message,
        data,
        meta: {
            timestamp: new Date().toISOString(),
            ...meta
        }
    });
}

function sendError(res, message = 'An error occurred', statusCode = 500, errors = null) {
    return res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors,
        meta: {
            timestamp: new Date().toISOString()
        }
    });
}

function sendPagination(res, items = [], total = 0, page = 1, limit = 10, message = 'Success') {
    const totalPages = Math.ceil(total / limit) || 1;
    return res.status(200).json({
        success: true,
        statusCode: 200,
        message,
        data: items,
        pagination: {
            total,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        },
        meta: {
            timestamp: new Date().toISOString()
        }
    });
}

module.exports = {
    sendSuccess,
    sendError,
    sendPagination
};
