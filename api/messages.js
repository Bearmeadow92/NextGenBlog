const express = require('express');
const { Message } = require('../models/Post');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

// Get all messages
router.get('/', authenticateToken, async (req, res) => {
    try {
        const messages = await Message.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Get single message
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const message = await Message.findByPk(id);
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }
        res.json(message);
    } catch (error) {
        console.error('Error fetching message:', error);
        res.status(500).json({ error: 'Failed to fetch message' });
    }
});

// Delete message
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const message = await Message.findByPk(id);
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }
        await message.destroy();
        res.json({ success: true, message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ error: 'Failed to delete message' });
    }
});

module.exports = router;