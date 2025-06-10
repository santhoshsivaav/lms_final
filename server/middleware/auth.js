const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const auth = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.header('Authorization');
        if (!authHeader) {
            console.log('No Authorization header provided');
            return res.status(401).json({
                success: false,
                message: 'No authentication token provided'
            });
        }

        // Remove 'Bearer ' from token
        const token = authHeader.replace('Bearer ', '');
        if (!token) {
            console.log('No token found in Authorization header');
            return res.status(401).json({
                success: false,
                message: 'No authentication token provided'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Decoded token:', decoded);

            // Find user using id from token
            const userId = decoded.id;
            if (!userId) {
                console.log('No user ID found in token:', decoded);
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token format'
                });
            }

            const user = await User.findById(userId);
            if (!user) {
                console.log('User not found for ID:', userId);
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Verify token payload matches user
            if (decoded.email !== user.email || decoded.role !== user.role) {
                console.log('Token payload mismatch:', {
                    token: { email: decoded.email, role: decoded.role },
                    user: { email: user.email, role: user.role }
                });
                return res.status(401).json({
                    success: false,
                    message: 'Token invalid - user data mismatch'
                });
            }

            // Set user in request
            req.user = user;
            console.log('User authenticated:', { id: user._id, email: user.email, role: user.role });
            req.token = token;
            req.hasActiveSubscription = user.hasActiveSubscription();
            next();
        } catch (error) {
            console.error('Token verification error:', error);
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expired'
                });
            }
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Middleware to check if user is admin
const adminAuth = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

// Middleware to check if user has active subscription
const subscriptionAuth = (req, res, next) => {
    // Allow access to preview content without subscription
    if (req.query.preview === 'true') {
        req.previewOnly = true;
        return next();
    }

    // For video routes, check is done in the controller
    if (req.path.includes('/videos/')) {
        return next();
    }

    // For course routes, allow access but mark as subscription required
    // The controller will filter content based on subscription status
    next();
};

// Protect routes
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
            console.log('Decoded token in protect middleware:', decoded);

            // Get user from token
            const userId = decoded.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token format'
                });
            }

            // Find user with populated fields if needed
            req.user = await User.findById(userId).select('-password');
            if (!req.user) {
                console.log('User not found for ID:', userId);
                return res.status(401).json({
                    success: false,
                    message: 'Not authorized, user not found'
                });
            }

            // Add subscription status to request
            if (typeof req.user.hasActiveSubscription === 'function') {
                req.hasActiveSubscription = req.user.hasActiveSubscription();
            }

            next();
        } catch (error) {
            console.error('Error verifying token in protect middleware:', error);
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

// Admin middleware
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as admin' });
    }
};

// Optional auth middleware - allows access but adds user if authenticated
const optionalAuth = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.id).select('-password');

                if (user) {
                    req.user = user;
                    req.hasActiveSubscription = user.hasActiveSubscription();
                }
            } catch (error) {
                console.error('Error verifying token in optional auth:', error);
            }
        }

        next();
    } catch (error) {
        console.error('Error in optional auth middleware:', error);
        next();
    }
};

// Role-based authorization middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Role ${req.user.role} is not authorized to access this resource`
            });
        }

        next();
    };
};

module.exports = {
    auth,
    adminAuth,
    subscriptionAuth,
    protect,
    admin,
    optionalAuth,
    authorize
}; 