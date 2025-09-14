const express = require('express');
const nodemailer = require('nodemailer');
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

        // Configure email transporter (using Gmail as example)
        const transporter = nodemailer.createTransporter({
            service: 'gmail',
            auth: {
                user: process.env.CONTACT_EMAIL, // Your Gmail address
                pass: process.env.CONTACT_EMAIL_PASSWORD // App-specific password
            }
        });

        // Email content
        const mailOptions = {
            from: process.env.CONTACT_EMAIL,
            to: 'hello@nextgentechnologist.com',
            subject: `Contact Form: ${subject}`,
            html: `
                <h3>New Contact Form Submission</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong></p>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
                    ${message.replace(/\n/g, '<br>')}
                </div>
                <hr>
                <p><small>Sent from NextGenTechnologist.com contact form</small></p>
            `,
            replyTo: email
        };

        // Send email
        await transporter.sendMail(mailOptions);

        res.json({ 
            success: true, 
            message: 'Message sent successfully!' 
        });

    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to send message. Please try again later.' 
        });
    }
});

module.exports = router;