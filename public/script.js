// Navigation functionality
function showSection(sectionName) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
    
    document.getElementById(sectionName).classList.add('active');
    
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => link.classList.remove('active'));
    
    const targetLink = document.querySelector(`[data-section="${sectionName}"]`);
    if (targetLink) {
        targetLink.classList.add('active');
    }
}

// Load and display a single blog post
async function loadBlogPost(filename) {
    console.log('Loading post:', filename);
    
    try {
        // Fetch from your database API instead of GitHub
        const response = await fetch(`/api/posts/${filename}`);
        const post = await response.json();
        
        if (!response.ok) {
            throw new Error(post.error || 'Failed to load post');
        }
        
        // Check if marked is loaded
        if (typeof marked === 'undefined') {
            throw new Error('Markdown parser not loaded');
        }
        
        const htmlContent = marked.parse(post.content);
        
        document.getElementById('blog-post-content').innerHTML = `
            <h1>${post.title}</h1>
            <p class="post-meta">Published on ${formatDate(post.date)}</p>
            <div class="post-content">${htmlContent}</div>
        `;
        
        showSection('blog-post');
        
    } catch (error) {
        console.error('Error loading blog post:', error);
        document.getElementById('blog-post-content').innerHTML = '<p>Error loading post.</p>';
    }
}

// Load blog posts from API
async function loadBlogPosts() {
    try {
        const response = await fetch('/api/posts/public');
        const posts = await response.json();
        
        const postsContainer = document.getElementById('posts-container');
        
        if (posts.length === 0) {
            postsContainer.innerHTML = '<p>No posts yet. Check back soon!</p>';
            return;
        }
        
        // Use proper event handlers instead of inline onclick
        postsContainer.innerHTML = posts.map(post => `
            <article class="blog-post">
                <h3>${post.title}</h3>
                <p class="post-date">${formatDate(post.date)}</p>
                <p class="post-description">${post.description}</p>
                <button class="read-more" data-filename="${post.filename}">Read more →</button>
            </article>
        `).join('');
        
        // Add event listeners to all read-more buttons
        postsContainer.querySelectorAll('.read-more').forEach(button => {
            button.addEventListener('click', (e) => {
                const filename = e.target.dataset.filename;
                loadBlogPost(filename);
            });
        });
        
    } catch (error) {
        console.error('Error loading posts:', error);
        document.getElementById('posts-container').innerHTML = '<p>Error loading posts.</p>';
    }
}

// Load latest blog post for home page preview
async function loadLatestPost() {
    try {
        const response = await fetch('/api/posts/public');
        const posts = await response.json();
        
        const latestPostContainer = document.getElementById('latest-post-container');
        
        if (posts.length === 0) {
            latestPostContainer.innerHTML = '<p>No posts yet.</p>';
            return;
        }
        
        const latestPost = posts[0];
        
        latestPostContainer.innerHTML = `
            <article class="latest-post-card">
                <h3>${latestPost.title}</h3>
                <p class="post-date">${formatDate(latestPost.date)}</p>
                <p class="post-description">${latestPost.description}</p>
                <button class="read-more" data-filename="${latestPost.filename}">Read Full Post →</button>
            </article>
        `;
        
        // Add event listener to latest post button
        const latestButton = latestPostContainer.querySelector('.read-more');
        if (latestButton) {
            latestButton.addEventListener('click', (e) => {
                const filename = e.target.dataset.filename;
                loadBlogPost(filename);
            });
        }
        
    } catch (error) {
        console.error('Error loading latest post:', error);
        document.getElementById('latest-post-container').innerHTML = '<p>Error loading latest post.</p>';
    }
}

// Parse frontmatter from markdown
function parseFrontmatter(markdown) {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = markdown.match(frontmatterRegex);
    
    if (!match) {
        return { frontmatter: {}, content: markdown };
    }
    
    const frontmatterText = match[1];
    const content = match[2];
    
    const frontmatter = {};
    frontmatterText.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length > 0) {
            const value = valueParts.join(':').trim().replace(/"/g, '');
            frontmatter[key.trim()] = value;
        }
    });
    
    return { frontmatter, content };
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Add event listeners when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Navigation event listeners
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showSection(section);
        });
    });
    
    // CTA button event listener
    const ctaButton = document.querySelector('.cta-button');
    if (ctaButton) {
        ctaButton.addEventListener('click', function() {
            showSection('blog');
        });
    }
    
    // Back button event listener
    const backBtn = document.querySelector('.back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            showSection('blog');
        });
    }
    
    // Wait for marked.js to load before loading posts
    if (typeof marked !== 'undefined') {
        loadBlogPosts();
        loadLatestPost();
    } else {
        // Retry after a short delay
        setTimeout(() => {
            loadBlogPosts();
            loadLatestPost();
        }, 100);
    }
});