const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes - verify JWT token
 */
const protect = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized, no token'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Decoded token in authMiddleware:', decoded);

            // Get user from token using id
            const userId = decoded.id;
            if (!userId) {
                console.log('No user ID in token:', decoded);
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token format'
                });
            }

            req.user = await User.findById(userId).select('-password');
            if (!req.user) {
                console.log('User not found for ID:', userId);
                return res.status(401).json({
                    success: false,
                    message: 'Not authorized, user not found'
                });
            }

            next();
        } catch (error) {
            console.error('Error verifying token:', error);
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expired'
                });
            }
            res.status(401).json({
                success: false,
                message: 'Not authorized, token failed',
                error: error.message
            });
        }
    } catch (error) {
        console.error('Error in protect middleware:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Admin middleware - check if user is admin
 */
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Not authorized as admin'
        });
    }
};

/**
 * Role-based authorization middleware
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized, no user'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user.role} is not authorized to access this route`
            });
        }

        next();
    };
};

module.exports = { protect, admin, authorize }; 