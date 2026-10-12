const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config');

const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');
const { sendSuccess } = require('./utils/response');

// Module routes
const authRoutes = require('./modules/auth/auth.routes');
const usersRoutes = require('./modules/users/users.routes');
const eventsRoutes = require('./modules/events/events.routes');
const ticketsRoutes = require('./modules/tickets/tickets.routes');
const checkinRoutes = require('./modules/checkin/checkin.routes');
const exportRoutes = require('./modules/export/export.routes');

const app = express();

// Security & Utility Middlewares
app.use(helmet({
    contentSecurityPolicy: false // Allows flexibility during dev & SPA serving
}));

app.use(cors({
    origin: '*', // Adjust or use [config.clientUrl] in production
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (config.env !== 'test') {
    app.use(morgan('dev'));
}

// Health Check API
app.get('/api/v1/health', (req, res) => {
    return sendSuccess(res, {
        status: 'UP',
        service: 'BEECLUB API',
        uptime: process.uptime(),
        environment: config.env
    }, 'Service is healthy and running smoothly');
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/events', eventsRoutes);
app.use('/api/v1/tickets', ticketsRoutes);
app.use('/api/v1/checkin', checkinRoutes);
app.use('/api/v1/export', exportRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
