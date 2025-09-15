const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

// Test route
router.get('/test', (req, res) => {
    res.json({ 
        message: 'Contact API is reachable',
        envVars: {
            emailSet: !!process.env.CONTACT_EMAIL,
            passwordSet: !!process.env.CONTACT_EMAIL_PASSWORD
        }
    });
});

// Contact form submission
router.post('/', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        console.log('Contact form submission received:', { name, email, subject });

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

        // Configure email transporter
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.CONTACT_EMAIL,
                pass: process.env.CONTACT_EMAIL_PASSWORD
            },
            tls: {
                rejectUnauthorized: false
            },
            connectionTimeout: 60000,
            greetingTimeout: 30000,
            socketTimeout: 60000
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

        // HYBRID APPROACH: Try email first, fallback to logging
        try {
            console.log('Attempting to send email...');
            await transporter.sendMail(mailOptions);
            console.log('Email sent successfully to hello@nextgentechnologist.com');
        } catch (emailError) {
            // If email fails, log the submission instead
            console.log('Email sending failed, logging submission instead');
            console.log('Email error:', emailError.message);
            console.log('=== CONTACT FORM SUBMISSION (EMAIL FAILED) ===');
            console.log(`Name: ${name}`);
            console.log(`Email: ${email}`);
            console.log(`Subject: ${subject}`);
            console.log(`Message: ${message}`);
            console.log(`Submitted: ${new Date().toISOString()}`);
            console.log('===============================================');
        }

        // Always return success to user (regardless of email success/failure)
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