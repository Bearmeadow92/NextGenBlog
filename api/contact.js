const express = require('express');
const { Message } = require('../models/Post');
const router = express.Router();

// Contact form submission
router.post('/', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Basic validation
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ 
                success: false, 
                error: 'All fields are required' 
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Please enter a valid email address' 
            });
        }

        // Save message to database
        const newMessage = await Message.create({
            name,
            email,
            subject,
            message
        });

        console.log('New contact message saved:', newMessage.id);

        res.json({ 
            success: true, 
            message: 'Message received! I\'ll get back to you soon.' 
        });

    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to process message. Please try again later.' 
        });
    }
});

module.exports = router;