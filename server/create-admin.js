const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://santhoshcursor:Sandyyunus03@lmsyunus.u3i9jfr.mongodb.net/lmsyunus')
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Create admin user
const createAdmin = async () => {
    try {
        const adminData = {
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'admin123',
            role: 'admin',
            isAdmin: true
        };

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: adminData.email });
        if (existingAdmin) {
            console.log('Admin user already exists');
            process.exit(0);
        }

        // Create new admin user
        const admin = new User(adminData);
        await admin.save();

        console.log('Admin user created successfully:');
        console.log('Email:', adminData.email);
        console.log('Password:', adminData.password);
        console.log('Role:', adminData.role);

    } catch (err) {
        console.error('Error creating admin:', err);
    } finally {
        mongoose.connection.close();
    }
};

createAdmin(); 