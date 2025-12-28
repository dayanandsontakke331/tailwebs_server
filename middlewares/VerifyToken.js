const jwt = require('jsonwebtoken');
const User = require('../models/User.js');

async function verifyToken(req, res, next) {
    const { authorization } = req.headers;
    if (!authorization || !authorization.startsWith('Bearer ')) {
        return res.status(401).json({ status: 'failed', message: 'Unauthorized No token provided' });
    }

    const token = authorization.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded._id).select('-password');

        if (!user || user.role !== decoded.role) {
            return res.status(401).json({ status: 'failed', message: 'Unauthorized Invalid user or role mismatch' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.log('JWT Error:', error.message);
        return res.status(401).json({ status: 'failed', message: 'Unauthorized Invalid or expired token' });
    }
}

module.exports = verifyToken;