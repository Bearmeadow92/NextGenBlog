// Navigation functionality
function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
    
    // Show target section
    document.getElementById(sectionName).classList.add('active');
    
    // Update navigation active state
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => link.classList.remove('active'));
    
    // Find the clicked nav link and make it active
    const targetLink = document.querySelector(`[data-section="${sectionName}"]`);
    if (targetLink) {
        targetLink.classList.add('active');
    }
}

// Load and display a single blog post
async function loadBlogPost(filename) {
    try {
        // Fetch the markdown file from GitHub API
        const response = await fetch(`https://api.github.com/repos/Bearmeadow92/NextGenBlog/contents/posts/${filename}`);
        const data = await response.json();
        
        // Decode the base64 content
        const markdownContent = atob(data.content);
        
        // Parse frontmatter
        const { frontmatter, content } = parseFrontmatter(markdownContent);
        
        // Parse markdown to HTML
        const htmlContent = marked.parse(content);
        
        // Display in blog post section
        document.getElementById('blog-post-content').innerHTML = `
            <h1>${frontmatter.title}</h1>
            <p class="post-meta">Published on ${formatDate(frontmatter.date)}</p>
            <div class="post-content">${htmlContent}</div>
        `;
        
        // Show the blog post section
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
        
        postsContainer.innerHTML = posts.map(post => `
            <article class="blog-post">
                <h3>${post.title}</h3>
                <p class="post-date">${formatDate(post.date)}</p>
                <p class="post-description">${post.description}</p>
                <button class="read-more" onclick="loadBlogPost('${post.filename}')">Read more →</button>
            </article>
        `).join('');
        
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
        
        const latestPost = posts[0]; // First post is newest
        
        latestPostContainer.innerHTML = `
            <article class="latest-post-card">
                <h3>${latestPost.title}</h3>
                <p class="post-date">${formatDate(latestPost.date)}</p>
                <p class="post-description">${latestPost.description}</p>
                <button class="read-more" onclick="loadBlogPost('${latestPost.filename}')">Read Full Post →</button>
            </article>
        `;
        
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
    
    // Simple frontmatter parser
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
    
    // Load blog posts and latest post
    loadBlogPosts();
    loadLatestPost();
});