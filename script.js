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
    event.target.classList.add('active');
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
                <a href="/posts/${post.filename}" class="read-more">Read more →</a>
            </article>
        `).join('');
        
    } catch (error) {
        console.error('Error loading posts:', error);
        document.getElementById('posts-container').innerHTML = '<p>Error loading posts.</p>';
    }
}

// Load posts when page loads
document.addEventListener('DOMContentLoaded', loadBlogPosts);