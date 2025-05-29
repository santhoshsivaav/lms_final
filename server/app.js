const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/course');
const subscriptionRoutes = require('./routes/subscription');
 
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/subscriptions', subscriptionRoutes); 