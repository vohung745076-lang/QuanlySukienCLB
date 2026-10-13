const express = require('express');
const router = express.Router();
const checkinController = require('./checkin.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRoles } = require('../../middlewares/rbac.middleware');

router.use(authenticate);
router.use(requireRoles('admin'));

router.post('/', checkinController.handleCheckin);
router.get('/logs', checkinController.getLogs);
router.delete('/logs', checkinController.clearLogs);

module.exports = router;
