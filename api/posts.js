const express = require('express');
const axios = require('axios');
const { authenticateToken } = require('./middleware');
const router = express.Router();

// Public route to get posts (no authentication required)
router.get('/public', async (req, res) => {
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
        console.error('Error fetching public posts:', error);
        // Return empty array if posts.json doesn't exist
        res.json([]);
    }
});

// Get all posts (authenticated - for admin)
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

// Update existing post (NEW - proper edit functionality)
router.put('/:filename', authenticateToken, async (req, res) => {
    try {
        const { filename } = req.params;
        const { title, date, description, body } = req.body;

        // Get current file to get its SHA
        const fileResponse = await axios.get(
            `https://api.github.com/repos/Bearmeadow92/NextGenBlog/contents/posts/${filename}`,
            {
                headers: {
                    'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        const currentSha = fileResponse.data.sha;

        // Create updated markdown content
        const markdownContent = `---
title: "${title}"
date: ${date}
description: "${description}"
---

${body}
`;

        // Update the file in GitHub
        await axios.put(
            `https://api.github.com/repos/Bearmeadow92/NextGenBlog/contents/posts/${filename}`,
            {
                message: `Update blog post: ${title}`,
                content: Buffer.from(markdownContent).toString('base64'),
                sha: currentSha,
                branch: 'main'
            },
            {
                headers: {
                    'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        // Update posts.json index
        try {
            const postsResponse = await axios.get(
                `https://api.github.com/repos/Bearmeadow92/NextGenBlog/contents/posts.json`,
                {
                    headers: {
                        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            
            const content = Buffer.from(postsResponse.data.content, 'base64').toString('utf8');
            let currentPosts = JSON.parse(content);
            
            // Update the post in the index
            const postIndex = currentPosts.findIndex(post => post.filename === filename);
            if (postIndex !== -1) {
                currentPosts[postIndex] = {
                    title,
                    date,
                    description,
                    filename
                };
                
                // Update posts.json
                await axios.put(
                    `https://api.github.com/repos/Bearmeadow92/NextGenBlog/contents/posts.json`,
                    {
                        message: `Update posts index for: ${title}`,
                        content: Buffer.from(JSON.stringify(currentPosts, null, 2)).toString('base64'),
                        sha: postsResponse.data.sha,
                        branch: 'main'
                    },
                    {
                        headers: {
                            'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    }
                );
            }

            console.log('Successfully updated posts.json');
        } catch (error) {
            console.error('Error updating posts.json:', error);
        }

        res.json({ 
            success: true, 
            message: 'Post updated successfully',
            filename: filename
        });

    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ error: 'Failed to update post' });
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

        // Commit markdown file to GitHub
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

        // Now update posts.json index
        try {
            // First, get current posts.json
            let currentPosts = [];
            let postsJsonSha = null;
            
            try {
                const postsResponse = await axios.get(
                    `https://api.github.com/repos/Bearmeadow92/NextGenBlog/contents/posts.json`,
                    {
                        headers: {
                            'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    }
                );
                const content = Buffer.from(postsResponse.data.content, 'base64').toString('utf8');
                currentPosts = JSON.parse(content);
                postsJsonSha = postsResponse.data.sha;
            } catch (error) {
                // posts.json doesn't exist yet, start with empty array
                console.log('posts.json does not exist yet, creating new one');
                currentPosts = [];
            }

            // Add new post to the beginning of the array
            currentPosts.unshift({
                title,
                date,
                description,
                filename
            });

            // Prepare the update payload
            const updatePayload = {
                message: `Update posts index for: ${title}`,
                content: Buffer.from(JSON.stringify(currentPosts, null, 2)).toString('base64'),
                branch: 'main'
            };

            // Include SHA if file exists
            if (postsJsonSha) {
                updatePayload.sha = postsJsonSha;
            }

            // Update posts.json
            await axios.put(
                `https://api.github.com/repos/Bearmeadow92/NextGenBlog/contents/posts.json`,
                updatePayload,
                {
                    headers: {
                        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );

            console.log('Successfully updated posts.json');
        } catch (error) {
            console.error('Error updating posts.json:', error);
            // Don't fail the whole request if posts.json update fails
        }

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

        // Also remove from posts.json
        try {
            const postsResponse = await axios.get(
                `https://api.github.com/repos/Bearmeadow92/NextGenBlog/contents/posts.json`,
                {
                    headers: {
                        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            
            const content = Buffer.from(postsResponse.data.content, 'base64').toString('utf8');
            let currentPosts = JSON.parse(content);
            
            // Remove the deleted post
            currentPosts = currentPosts.filter(post => post.filename !== filename);
            
            // Update posts.json
            await axios.put(
                `https://api.github.com/repos/Bearmeadow92/NextGenBlog/contents/posts.json`,
                {
                    message: `Remove deleted post from index: ${filename}`,
                    content: Buffer.from(JSON.stringify(currentPosts, null, 2)).toString('base64'),
                    sha: postsResponse.data.sha,
                    branch: 'main'
                },
                {
                    headers: {
                        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
        } catch (error) {
            console.error('Error updating posts.json after deletion:', error);
        }

        res.json({ success: true, message: 'Post deleted successfully' });

    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

module.exports = router;