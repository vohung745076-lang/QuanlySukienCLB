const express = require('express');
const router = express.Router();
const eventsController = require('./events.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRoles } = require('../../middlewares/rbac.middleware');

// Public route: list events and get single event (can be filtered by user)
router.get('/stats', authenticate, requireRoles('admin'), eventsController.getStats);
router.get('/', eventsController.listEvents);
router.get('/:id', eventsController.getEvent);

// Protected routes (Admin)
router.post('/', authenticate, requireRoles('admin'), eventsController.createEvent);
router.put('/:id', authenticate, requireRoles('admin'), eventsController.updateEvent);
router.delete('/:id', authenticate, requireRoles('admin'), eventsController.deleteEvent);

module.exports = router;
