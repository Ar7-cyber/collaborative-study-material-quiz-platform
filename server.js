const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const { getDb } = require('./db/database');
const { seedDatabase } = require('./db/seed');

const authRoutes = require('./routes/authRoutes');
const materialRoutes = require('./routes/materialRoutes');
const quizRoutes = require('./routes/quizRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Security Headers (CSQP-SR-002, CSQP-SR-004)
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Serve frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// API Routes (Layered Architecture: I1 & I2 interfaces)
app.use('/api/auth', authRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'UP',
        timestamp: new Date().toISOString(),
        service: 'Collaborative Study Material & Quiz Platform (CSQP)'
    });
});

// Fallback route for SPA / clean navigation
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Endpoint not found' });
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Centralized error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error'
    });
});

// Start server
if (process.env.NODE_ENV !== 'test') {
    getDb();
    seedDatabase();
    app.listen(PORT, () => {
        console.log(`=======================================================`);
        console.log(` CSQP Platform Running on: http://localhost:${PORT}`);
        console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(` Architecture: Layered Architecture (Web UI / Express / SQLite)`);
        console.log(`=======================================================`);
    });
}

module.exports = app;
