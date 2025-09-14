const express = require('express');
const { Post } = require('../models/Post');
const { authenticateToken } = require('./middleware');
const router = express.Router();

// Public route to get posts (no authentication required)
router.get('/public', async (req, res) => {
    try {
        const posts = await Post.findAll({
            attributes: ['title', 'date', 'description', 'slug', 'filename'],
            order: [['date', 'DESC'], ['createdAt', 'DESC']]
        });

        res.json(posts);
    } catch (error) {
        console.error('Error fetching public posts:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

// Get all posts (authenticated - for admin)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const posts = await Post.findAll({
            attributes: ['id', 'title', 'date', 'description', 'slug', 'filename', 'createdAt', 'updatedAt'],
            order: [['date', 'DESC'], ['createdAt', 'DESC']]
        });

        res.json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

// Get single post by filename (for reading full content)
router.get('/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        
        const post = await Post.findOne({
            where: { filename }
        });

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        res.json(post);
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({ error: 'Failed to fetch post' });
    }
});

// Create new post (INSTANT)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { title, date, description, body } = req.body;

        if (!title || !date || !description || !body) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const post = await Post.create({
            title,
            date,
            description,
            content: body
        });

        console.log('Post created instantly:', post.filename);

        res.json({ 
            success: true, 
            message: 'Post created successfully',
            post: {
                id: post.id,
                title: post.title,
                date: post.date,
                description: post.description,
                filename: post.filename,
                slug: post.slug
            }
        });

    } catch (error) {
        console.error('Error creating post:', error);
        
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: 'A post with this title and date already exists' });
        }
        
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// Update existing post (INSTANT)
router.put('/:filename', authenticateToken, async (req, res) => {
    try {
        const { filename } = req.params;
        const { title, date, description, body } = req.body;

        if (!title || !date || !description || !body) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const post = await Post.findOne({ where: { filename } });

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // Update the post
        await post.update({
            title,
            date,
            description,
            content: body
        });

        console.log('Post updated instantly:', post.filename);

        res.json({ 
            success: true, 
            message: 'Post updated successfully',
            post: {
                id: post.id,
                title: post.title,
                date: post.date,
                description: post.description,
                filename: post.filename,
                slug: post.slug
            }
        });

    } catch (error) {
        console.error('Error updating post:', error);
        
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: 'A post with this title and date already exists' });
        }
        
        res.status(500).json({ error: 'Failed to update post' });
    }
});

// Delete post (INSTANT)
router.delete('/:filename', authenticateToken, async (req, res) => {
    try {
        const { filename } = req.params;

        const post = await Post.findOne({ where: { filename } });

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        await post.destroy();

        console.log('Post deleted instantly:', filename);

        res.json({ 
            success: true, 
            message: 'Post deleted successfully' 
        });

    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

module.exports = router;