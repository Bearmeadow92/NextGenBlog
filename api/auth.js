const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const router = express.Router();

// Test route
router.get('/status', (req, res) => {
    res.json({ message: 'Auth API working' });
});

// GitHub OAuth login
router.get('/github', (req, res) => {
    console.log('GitHub OAuth route hit');
    console.log('GITHUB_CLIENT_ID:', process.env.GITHUB_CLIENT_ID ? 'Set' : 'Missing');
    
    if (!process.env.GITHUB_CLIENT_ID) {
        return res.status(500).send('GitHub Client ID not configured');
    }
    
    const redirectUri = process.env.NEXTAUTH_URL 
        ? `${process.env.NEXTAUTH_URL}/api/auth/github/callback`
        : 'http://localhost:3000/api/auth/github/callback';
    
    const githubAuthURL = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=repo&redirect_uri=${redirectUri}`;
    
    console.log('Redirecting to:', githubAuthURL);
    res.redirect(githubAuthURL);
});

// GitHub OAuth callback
router.get('/github/callback', async (req, res) => {
    const { code } = req.query;
    
    try {
        console.log('OAuth callback received with code:', code ? 'Present' : 'Missing');
        
        // Exchange code for access token
        const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code
        }, {
            headers: { Accept: 'application/json' }
        });
        
        const { access_token } = tokenResponse.data;
        console.log('Access token received:', access_token ? 'Present' : 'Missing');
        
        // Get user info to verify it's you
        const userResponse = await axios.get('https://api.github.com/user', {
            headers: { Authorization: `token ${access_token}` }
        });
        
        console.log('GitHub user:', userResponse.data.login);
        
        // Check if user is you (replace with your GitHub username)
        if (userResponse.data.login !== 'Bearmeadow92') {
            return res.status(403).send('Unauthorized - not the blog owner');
        }
        
        // Create JWT token
        const token = jwt.sign(
            { userId: userResponse.data.id, username: userResponse.data.login },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        // Redirect to admin with token
        res.redirect(`/admin?token=${token}`);
        
    } catch (error) {
        console.error('Auth error:', error.response?.data || error.message);
        res.status(500).send('Authentication failed');
    }
});

module.exports = router;