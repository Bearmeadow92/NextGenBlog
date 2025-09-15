const express = require('express');
const { Message } = require('../models/Post');
const { authenticateToken } = require('./middleware');
const router = express.Router();

// Get all messages (authenticated - for admin)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const messages = await Message.findAll({
            where: { isArchived: false }, // Only show non-archived messages
            order: [['createdAt', 'DESC']]
        });

        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Get single message by ID
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

// Mark message as read
router.put('/:id/read', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const message = await Message.findByPk(id);

        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        await message.update({ isRead: true });

        res.json({ 
            success: true, 
            message: 'Message marked as read' 
        });

    } catch (error) {
        console.error('Error updating message:', error);
        res.status(500).json({ error: 'Failed to update message' });
    }
});

// Archive message
router.put('/:id/archive', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const message = await Message.findByPk(id);

        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        await message.update({ isArchived: true });

        res.json({ 
            success: true, 
            message: 'Message archived successfully' 
        });

    } catch (error) {
        console.error('Error archiving message:', error);
        res.status(500).json({ error: 'Failed to archive message' });
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

        res.json({ 
            success: true, 
            message: 'Message deleted successfully' 
        });

    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ error: 'Failed to delete message' });
    }
});

// Get unread message count
router.get('/count/unread', authenticateToken, async (req, res) => {
    try {
        const unreadCount = await Message.count({
            where: { 
                isRead: false,
                isArchived: false // Only count non-archived messages
            }
        });

        res.json({ unreadCount });
    } catch (error) {
        console.error('Error counting unread messages:', error);
        res.status(500).json({ error: 'Failed to count unread messages' });
    }
});

// Get archived messages
router.get('/archived/list', authenticateToken, async (req, res) => {
    try {
        const archivedMessages = await Message.findAll({
            where: { isArchived: true },
            order: [['createdAt', 'DESC']]
        });

        res.json(archivedMessages);
    } catch (error) {
        console.error('Error fetching archived messages:', error);
        res.status(500).json({ error: 'Failed to fetch archived messages' });
    }
});

module.exports = router;