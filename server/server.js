const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courseRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categories');
const User = require('./models/User');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000 // Increased limit to 1000 requests per windowMs
});
app.use(limiter);

// Request logging
app.use(morgan('dev'));

// Configure CORS
app.use(cors({
    origin: ['http://localhost:3000', 'http://192.168.219.119:3000', 'exp://192.168.219.119:19000', 'exp://192.168.219.119:8081', 'http://192.168.219.119:5000', 'http://localhost:5000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://santhoshcursor:Sandyyunus03@lmsyunus.u3i9jfr.mongodb.net/lmsyunus', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Direct route for all users - place this BEFORE other routes
app.get('/api/allusers', async (req, res) => {
    console.log('=== All Users Route Hit ===');
    try {
        console.log('Fetching users from database...');
        const users = await User.find()
            .select('-password -subscription -progress -preferences')
            .sort({ createdAt: -1 });

        console.log(`Found ${users.length} users`);
        res.json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            error: error.message
        });
    }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/devices', require('./routes/deviceRoutes'));
app.use('/api/subscriptions', require('./routes/subscription'));
app.use('/api/analytics', require('./routes/analytics'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '192.168.219.119', () => {
    console.log(`Server is running on http://192.168.219.119:${PORT}`);
});