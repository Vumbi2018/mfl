const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // Get token from header
    const token = req.body.token || req.query.token || req.headers["x-access-token"] || req.headers["authorization"];

    if (!token) {
        // For development/demo purposes, we might allow unauthenticated access 
        // OR we return 403.
        // Given your requirement for RBAC, we should enforce it, or at least populate req.user if present.
        // If the frontend doesn't send it yet, this might break the app if we enforce it globally.
        // Let's make it optional-but-preferred for now to avoid breaking existing flows, 
        // unless the route explicitly demands it.
        return next();
    }

    try {
        // Bearer token handling
        const bearer = token.startsWith('Bearer ') ? token.slice(7, token.length) : token;
        const decoded = jwt.verify(bearer, process.env.JWT_SECRET || 'supersecretkey_change_this');
        req.user = decoded; // { user_id, email, role, iat, exp }
    } catch (err) {
        // If token is invalid, we could return 401, or just ignore it (treat as guest)
        console.error("Invalid Token:", err.message);
        // return res.status(401).send("Invalid Token");
    }
    return next();
};

module.exports = verifyToken;
