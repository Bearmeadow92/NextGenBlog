require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database with error handling
async function initializeDatabaseSafely() {
    try {
        if (process.env.DATABASE_URL) {
            const { initDatabase } = require('./models/Post');
            await initDatabase();
            console.log('Database connected successfully');
        } else {
            console.log('DATABASE_URL not found - running without database');
        }
    } catch (error) {
        console.error('Database connection failed, continuing without database:', error.message);
    }
}

// Trust proxy for Railway
app.set('trust proxy', 1);

// Security middleware with proper CSP
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.github.com", "https://github.com"],
            formAction: ["'self'", "https://github.com"],
        },
    },
}));

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://www.nextgentechnologist.com', 'https://nextgentechnologist.com']
        : 'http://localhost:3000',
    credentials: true
}));

// Rate limiting for API routes
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve admin assets (BEFORE admin routes)
app.use('/admin.css', express.static(path.join(__dirname, 'admin', 'admin.css')));
app.use('/admin.js', express.static(path.join(__dirname, 'admin', 'admin.js')));

// API routes
app.use('/api/auth', require('./api/auth'));
app.use('/api/contact', require('./api/contact'));
app.use('/api/messages', require('./api/messages'));
app.use('/api/posts', require('./api/posts'));

// Admin interface route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// Fallback to serve public site (MUST be last)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server and initialize database
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await initializeDatabaseSafely();
});