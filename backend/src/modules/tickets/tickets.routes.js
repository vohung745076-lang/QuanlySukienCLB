const express = require('express');
const router = express.Router();
const ticketsController = require('./tickets.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRoles } = require('../../middlewares/rbac.middleware');

router.use(authenticate);

// User routes
router.post('/book', ticketsController.bookTicket);
router.get('/my-tickets', ticketsController.getMyTickets);

// Admin routes
router.get('/event/:eventId', requireRoles('admin'), ticketsController.getEventTickets);

module.exports = router;
