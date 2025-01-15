const jwt = require('jsonwebtoken');
const config = require('../config/index.config');

// Authorization middleware to check token, userId, and role
const authorize = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            // 1. Get the token from the Authorization header
            const token = req.headers['authorization']?.split(' ')[1]; // Assumes "Bearer <token>"

            if (!token) {
                return res.status(403).json({ error: 'No token provided' });
            }

            // 2. Decode and verify the token
            const decoded = jwt.verify(token, config.dotEnv.SHORT_TOKEN_SECRET);

            // Check if token is expired or invalid
            if (!decoded) {
                return res.status(403).json({ error: 'Invalid or expired token' });
            }

            // 3. Validate userId from the headers
            // const userIdHeader = req.headers['userid'];
            // if (userIdHeader !== decoded.userId) {
            //     return res.status(403).json({ error: 'User ID mismatch or expired token' });
            // }

            // 4. Validate role from the headers
            const roleHeader = req.headers['user_role'];
            if (!roleHeader){
                return res.status(400).json({status: 'failure', message:'role header is required', data:''})
            }
            if (!allowedRoles.includes(roleHeader)) {
                return res.status(403).json({ error: 'Insufficient role permissions' });
            }

            // 5. Attach user info to the request object
            req.user = {
                userId: decoded.userId,
                userKey: decoded.userKey,
                role: roleHeader || 'user' // Default to 'user' if no role header
            };

            next(); // Proceed to the next middleware or route handler
        } catch (error) {
            // Check for token expiration error
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'Token expired' });
            }

            // General error handling
            return res.status(500).json({ error: 'Authorization failed', details: error.message });
        }
    };
};

module.exports = { authorize };
