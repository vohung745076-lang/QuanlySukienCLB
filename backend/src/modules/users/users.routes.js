const express = require('express');
const router = express.Router();
const usersController = require('./users.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRoles } = require('../../middlewares/rbac.middleware');

// All user management routes require login & Admin/Manager privileges
router.use(authenticate);

router.get('/stats', requireRoles('admin'), usersController.getStats);
router.get('/', requireRoles('admin'), usersController.listMembers);
router.post('/', requireRoles('admin'), usersController.createMember);
router.patch('/:id/role', requireRoles('admin'), usersController.updateRole);
router.delete('/:id', requireRoles('admin'), usersController.deleteMember);

module.exports = router;
