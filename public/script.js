// Navigation functionality - updated to use event listeners
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

// Rest of your existing functions stay the same...
// (loadBlogPost, loadBlogPosts, loadLatestPost functions)

// Load and display a single blog post
async function loadBlogPost(filename) {
    try {
        const response = await fetch(`/posts/${filename}`);
        const markdownContent = await response.text();
        
        // Parse markdown to HTML
        const htmlContent = marked.parse(markdownContent);
        
        // Display in blog post section
        document.getElementById('blog-post-content').innerHTML = htmlContent;
        
        // Show the blog post section
        showSection('blog-post');
        
    } catch (error) {
        console.error('Error loading blog post:', error);
        document.getElementById('blog-post-content').innerHTML = '<p>Error loading post.</p>';
    }
}

// Load blog posts from JSON index
async function loadBlogPosts() {
    try {
        const response = await fetch('/posts.json');
        const posts = await response.json();
        
        const postsContainer = document.getElementById('posts-container');
        
        if (posts.length === 0) {
            postsContainer.innerHTML = '<p>No posts yet. Check back soon!</p>';
            return;
        }
        
        postsContainer.innerHTML = posts.map(post => `
            <article class="blog-post">
                <h3>${post.title}</h3>
                <p class="post-date">${new Date(post.date).toLocaleDateString()}</p>
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
        const response = await fetch('/posts.json');
        const posts = await response.json();
        
        const latestPostContainer = document.getElementById('latest-post-container');
        
        if (posts.length === 0) {
            latestPostContainer.innerHTML = '<p>No posts yet.</p>';
            return;
        }
        
        const latestPost = posts[0]; // First post is newest due to sorting
        
        latestPostContainer.innerHTML = `
            <article class="latest-post-card">
                <h3>${latestPost.title}</h3>
                <p class="post-date">${new Date(latestPost.date).toLocaleDateString()}</p>
                <p class="post-description">${latestPost.description}</p>
                <button class="read-more" onclick="loadBlogPost('${latestPost.filename}')">Read Full Post →</button>
            </article>
        `;
        
    } catch (error) {
        console.error('Error loading latest post:', error);
        document.getElementById('latest-post-container').innerHTML = '<p>Error loading latest post.</p>';
    }
}

// Load posts when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadBlogPosts();
    loadLatestPost();
});