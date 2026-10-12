const { sendError } = require('../utils/response');

/**
 * Role-Based Access Control (RBAC) Middleware
 * @param {string[]} allowedRoles - List of roles permitted to access the route
 */
function requireRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return sendError(res, 'Unauthenticated user', 401);
        }

        const userRole = req.user.role;
        if (!allowedRoles.includes(userRole)) {
            return sendError(
                res,
                `Forbidden: Requires one of [${allowedRoles.join(', ')}] permissions, but your role is '${userRole}'`,
                403
            );
        }

        next();
    };
}

module.exports = {
    requireRoles
};
