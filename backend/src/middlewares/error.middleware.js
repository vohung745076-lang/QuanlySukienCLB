const { sendError } = require('../utils/response');

function notFoundHandler(req, res, next) {
    sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
}

function errorHandler(err, req, res, next) {
    console.error('Unhandled Server Error:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        url: req.originalUrl,
        method: req.method
    });

    const statusCode = err.statusCode || 500;
    const message = err.isOperational ? err.message : (statusCode === 500 ? 'Internal Server Error' : err.message);

    sendError(res, message, statusCode, err.errors || null);
}

module.exports = {
    notFoundHandler,
    errorHandler
};
