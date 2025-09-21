const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Middleware to verify a JWT from the request's Authorization header.
 */
const authMiddleware = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Extract the token from the "Bearer <token>" string
            token = req.headers.authorization.split(' ')[1];

            // Verify the token using your secret
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attach the entire decoded payload to the request object.
            // The payload contains { userId, role }.
            req.user = decoded;

            // Proceed to the protected route
            next();
        } catch (error) {
            console.error('Token verification failed:', error.message);
            return res.status(401).json({ msg: 'Token is not valid' });
        }
    }

    // If the header is missing or doesn't start with "Bearer"
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }
};

module.exports = authMiddleware;