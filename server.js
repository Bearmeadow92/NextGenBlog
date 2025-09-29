const express = require('express');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const session = require('express-session');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    logging: console.log
});

// Define Message model
const Message = sequelize.define('Message', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    subject: {
        type: DataTypes.STRING,
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isArchived: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'isArchived'  // Explicitly map to the correct column name
    }
}, {
    tableName: 'messages',
    timestamps: true
});

// Define Post model (if you have one)
const Post = sequelize.define('Post', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    excerpt: {
        type: DataTypes.TEXT
    },
    published: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'posts',
    timestamps: true
});



// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/admin', express.static('admin')); 

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.NODE_ENV === 'development' 
        ? "https://www.nextgentechnologist.com/api/auth/github/callback"
        : "http://localhost:3000/auth/github/callback"
}, async (accessToken, refreshToken, profile, done) => {
    // Only allow your GitHub username
    const ALLOWED_USERS = [process.env.GITHUB_USERNAME || 'Bearmeadow92'];
    
    if (ALLOWED_USERS.includes(profile.username)) {
        return done(null, profile);
    } else {
        return done(null, false, { message: 'Unauthorized user' });
    }
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

// Authentication middleware
const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: 'Unauthorized' });
};

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Contact form submission
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        
        const newMessage = await Message.create({
            name,
            email,
            subject,
            message
        });
        
        console.log('Contact form submitted:', {
            id: newMessage.id,
            name: newMessage.name,
            email: newMessage.email,
            subject: newMessage.subject
        });
        
        res.json({ success: true, message: 'Message sent successfully!' });
    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).json({ success: false, message: 'Failed to send message' });
    }
});

// Admin routes
// Serve static files
app.use(express.static('public'));
app.use('/admin-assets', express.static('admin'));  // Changed path to avoid conflict

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// GitHub OAuth routes
app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));

app.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/admin' }),
    (req, res) => {
        res.redirect('/admin');
    }
);

app.get('/auth/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.redirect('/admin');
    });
});

app.get('/auth/status', (req, res) => {
    res.json({ authenticated: req.isAuthenticated() });
});

// API routes for messages
app.get('/api/messages', ensureAuthenticated, async (req, res) => {
    try {
        const messages = await Message.findAll({
            where: { isArchived: false },
            order: [['createdAt', 'DESC']]
        });
        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

app.get('/api/messages/:id', ensureAuthenticated, async (req, res) => {
    try {
        const message = await Message.findByPk(req.params.id);
        if (message) {
            await message.update({ isRead: true });
            res.json(message);
        } else {
            res.status(404).json({ error: 'Message not found' });
        }
    } catch (error) {
        console.error('Error fetching message:', error);
        res.status(500).json({ error: 'Failed to fetch message' });
    }
});

app.delete('/api/messages/:id', ensureAuthenticated, async (req, res) => {
    try {
        const message = await Message.findByPk(req.params.id);
        if (message) {
            await message.destroy();
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Message not found' });
        }
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ error: 'Failed to delete message' });
    }
});

app.put('/api/messages/:id/archive', ensureAuthenticated, async (req, res) => {
    try {
        const message = await Message.findByPk(req.params.id);
        if (message) {
            await message.update({ isArchived: true });
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Message not found' });
        }
    } catch (error) {
        console.error('Error archiving message:', error);
        res.status(500).json({ error: 'Failed to archive message' });
    }
});

app.get('/api/messages/unread/count', ensureAuthenticated, async (req, res) => {
    try {
        const count = await Message.count({
            where: { 
                isRead: false,
                isArchived: false 
            }
        });
        res.json({ count });
    } catch (error) {
        console.error('Error counting unread messages:', error);
        res.status(500).json({ error: 'Failed to count unread messages' });
    }
});

// Serve blog posts and other static files
app.get('*', (req, res) => {
    const filePath = path.join(__dirname, 'public', req.path);
    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, sequelize, Message, Post };