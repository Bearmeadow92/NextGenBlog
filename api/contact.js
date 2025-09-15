const express = require('express');
const { Message } = require('../models/Post');
const router = express.Router();

// Contact form submission
router.post('/', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Validate required fields
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ 
                error: 'All fields are required' 
            });
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                error: 'Please provide a valid email address' 
            });
        }

        // Create message in database (WITH isArchived field)
        const newMessage = await Message.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            subject: subject.trim(),
            message: message.trim(),
            isRead: false,
            isArchived: false
        });

        console.log('Contact form submitted:', {
            id: newMessage.id,
            name: newMessage.name,
            email: newMessage.email,
            subject: newMessage.subject
        });

        res.json({ 
            success: true, 
            message: 'Thank you for your message! I\'ll get back to you soon.' 
        });

    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({ 
            error: 'Something went wrong. Please try again later.' 
        });
    }
});

module.exports = router;