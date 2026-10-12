const express = require('express');
const router = express.Router();
const exportController = require('./export.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRoles } = require('../../middlewares/rbac.middleware');

router.get('/excel', authenticate, requireRoles('admin', 'manager'), exportController.exportRegistrations);

module.exports = router;
