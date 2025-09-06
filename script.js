// Simple function to display blog posts
function loadBlogPosts() {
    const postsContainer = document.getElementById('posts-container');
    
    // For now, we'll manually add the sample post
    const samplePost = {
        title: "Welcome to NextGenBlog",
        date: "March 20, 2024", 
        description: "My first blog post on my new website",
        content: "This is my first post. I built this website myself and I'm pretty excited about it."
    };
    
    postsContainer.innerHTML = `
        <article class="blog-post">
            <h3>${samplePost.title}</h3>
            <p class="post-date">${samplePost.date}</p>
            <p class="post-description">${samplePost.description}</p>
            <p>${samplePost.content}</p>
        </article>
    `;
}

// Load posts when page loads
document.addEventListener('DOMContentLoaded', loadBlogPosts);