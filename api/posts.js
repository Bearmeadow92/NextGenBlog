const express = require('express');
const axios = require('axios');
const { authenticateToken } = require('./middleware');
const router = express.Router();

// Get all posts
router.get('/', authenticateToken, async (req, res) => {
    try {
        // Read posts.json from your repository
        const response = await axios.get(
            `https://api.github.com/repos/Bearmeadow92/NextGenBlog/contents/posts.json`,
            {
                headers: {
                    'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        // Decode base64 content
        const content = Buffer.from(response.data.content, 'base64').toString('utf8');
        const posts = JSON.parse(content);

        res.json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

// Create new post
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { title, date, description, body } = req.body;

        // Create filename from title and date
        const slug = title.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-');
        const filename = `${date}-${slug}.md`;

        // Create markdown content with frontmatter
        const markdownContent = `---
title: "${title}"
date: ${date}
description: "${description}"
---

${body}
`;

        // Commit to GitHub
        const commitResponse = await axios.put(
            `https://api.github.com/repos/Bearmeadow92/NextGenBlog/contents/posts/${filename}`,
            {
                message: `Add blog post: ${title}`,
                content: Buffer.from(markdownContent).toString('base64'),
                branch: 'main'
            },
            {
                headers: {
                    'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        // Trigger rebuild by updating a timestamp file or just return success
        res.json({ 
            success: true, 
            message: 'Post created successfully',
            filename: filename
        });

    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// Delete post
router.delete('/:filename', authenticateToken, async (req, res) => {
    try {
        const { filename } = req.params;

        // Get file SHA (required for deletion)
        const fileResponse = await axios.get(
            `https://api.github.com/repos/Bearmeadow92/NextGenBlog/contents/posts/${filename}`,
            {
                headers: {
                    'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        const sha = fileResponse.data.sha;

        // Delete file from GitHub
        await axios.delete(
            `https://api.github.com/repos/Bearmeadow92/NextGenBlog/contents/posts/${filename}`,
            {
                data: {
                    message: `Delete blog post: ${filename}`,
                    sha: sha,
                    branch: 'main'
                },
                headers: {
                    'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        res.json({ success: true, message: 'Post deleted successfully' });

    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

module.exports = router;