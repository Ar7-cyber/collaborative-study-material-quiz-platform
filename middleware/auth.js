const authService = require('../services/authService');

function extractToken(req) {
    if (req.cookies && req.cookies.csqp_session) {
        return req.cookies.csqp_session;
    }
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7).trim();
    }
    return null;
}

function authenticate(req, res, next) {
    const token = extractToken(req);
    if (!token) {
        req.user = null;
        return next();
    }

    const user = authService.validateSession(token);
    req.user = user || null;
    req.token = token;
    next();
}

function requireAuth(req, res, next) {
    const token = extractToken(req);
    if (!token) {
        return res.status(401).json({
            error: 'Authentication required. Please log in.'
        });
    }

    const user = authService.validateSession(token);
    if (!user) {
        return res.status(401).json({
            error: 'Session expired or invalid. Please re-authenticate.'
        });
    }

    req.user = user;
    req.token = token;
    next();
}

// CSQP-F-002 & CSQP-SR-003: Server-side role-based authorization check
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required.'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            authService.logAudit(
                req.user.id,
                'UNAUTHORIZED_ACCESS_ATTEMPT',
                `User with role '${req.user.role}' attempted action requiring [${allowedRoles.join(', ')}]`,
                req.ip || '127.0.0.1'
            );
            return res.status(403).json({
                error: `Forbidden: Access restricted. Requires one of [${allowedRoles.join(', ')}].`
            });
        }

        next();
    };
}

module.exports = {
    authenticate,
    requireAuth,
    requireRole,
    extractToken
};
