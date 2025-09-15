// Global state
let currentSection = 'home';
let blogPosts = [];

// Navigation and section management
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    
    // Initialize navigation
    setupNavigation();
    
    // Load initial content
    loadLatestPost();
    
    // Setup contact form
    setupContactForm();
    
    // Set initial state
    showSection('home');
});

function setupNavigation() {
    // Navigation click handlers
    document.querySelectorAll('[data-section]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showSection(section);
        });
    });

    // CTA button
    const ctaButton = document.querySelector('.cta-button');
    if (ctaButton) {
        ctaButton.addEventListener('click', function() {
            showSection('blog');
        });
    }

    // Back button for blog post view
    const backBtn = document.querySelector('.back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            showSection('blog');
        });
    }
}

function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update navigation
    document.querySelectorAll('[data-section]').forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    currentSection = sectionName;
    
    // Load content for specific sections
    if (sectionName === 'blog') {
        loadBlogPosts();
    }
}

// Blog functionality
async function loadLatestPost() {
    try {
        const response = await fetch('/api/posts/public');
        if (response.ok) {
            const posts = await response.json();
            if (posts.length > 0) {
                displayLatestPost(posts[0]);
            }
        }
    } catch (error) {
        console.error('Error loading latest post:', error);
        document.getElementById('latest-post-container').innerHTML = '<p>Unable to load latest post.</p>';
    }
}

function displayLatestPost(post) {
    const container = document.getElementById('latest-post-container');
    container.innerHTML = `
        <div class="latest-post-card" onclick="loadBlogPost('${post.filename}')">
            <h3>${post.title}</h3>
            <div class="post-date">${post.date}</div>
            <div class="post-description">${post.description}</div>
            <button class="read-more">Read More</button>
        </div>
    `;
}

async function loadBlogPosts() {
    try {
        const response = await fetch('/api/posts/public');
        if (response.ok) {
            const posts = await response.json();
            blogPosts = posts;
            displayBlogPosts(posts);
        } else {
            document.getElementById('posts-container').innerHTML = '<p>Error loading posts.</p>';
        }
    } catch (error) {
        console.error('Error loading posts:', error);
        document.getElementById('posts-container').innerHTML = '<p>Unable to load posts. Please check your connection.</p>';
    }
}

function displayBlogPosts(posts) {
    const container = document.getElementById('posts-container');
    
    if (posts.length === 0) {
        container.innerHTML = '<p>No posts available yet.</p>';
        return;
    }

    container.innerHTML = posts.map(post => `
        <article class="blog-post" onclick="loadBlogPost('${post.filename}')">
            <h3>${post.title}</h3>
            <div class="post-date">${post.date}</div>
            <div class="post-description">${post.description}</div>
            <button class="read-more">Read More</button>
        </article>
    `).join('');
}

async function loadBlogPost(filename) {
    try {
        const response = await fetch(`/api/posts/${filename}`);
        if (response.ok) {
            const post = await response.json();
            displayBlogPost(post);
            showSection('blog-post');
        } else {
            alert('Error loading post');
        }
    } catch (error) {
        console.error('Error loading blog post:', error);
        alert('Error loading post. Please check your connection.');
    }
}

function displayBlogPost(post) {
    const container = document.getElementById('blog-post-content');
    
    // Convert markdown to HTML
    const htmlContent = marked.parse(post.content);
    
    container.innerHTML = `
        <h1>${post.title}</h1>
        <div class="post-date">${post.date}</div>
        <div class="post-description">${post.description}</div>
        <div class="post-content">${htmlContent}</div>
    `;
}

// Contact form functionality
function setupContactForm() {
    console.log('Setting up contact form...');
    
    const contactForm = document.getElementById('contact-form');
    const submitBtn = document.getElementById('contact-submit');
    const feedback = document.getElementById('contact-feedback');

    console.log('Contact form elements:', { contactForm, submitBtn, feedback });

    if (contactForm) {
        console.log('Contact form found, adding event listener...');
        
        contactForm.addEventListener('submit', async function(e) {
            console.log('Form submitted!');
            e.preventDefault();

            // Get form data
            const formData = new FormData(contactForm);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                subject: formData.get('subject'),
                message: formData.get('message')
            };

            console.log('Form data:', data);

            // Disable submit button and show loading
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
            if (feedback) {
                feedback.style.display = 'none';
            }

            try {
                console.log('Sending POST request to /api/contact...');
                
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                console.log('Response received:', response.status);

                const result = await response.json();
                console.log('Response data:', result);

                if (result.success) {
                    // Success
                    if (feedback) {
                        feedback.className = 'contact-feedback success';
                        feedback.textContent = result.message;
                        feedback.style.display = 'block';
                    }
                    
                    // Reset form
                    contactForm.reset();
                } else {
                    // Error from server
                    if (feedback) {
                        feedback.className = 'contact-feedback error';
                        feedback.textContent = result.error || 'Failed to send message';
                        feedback.style.display = 'block';
                    }
                }

            } catch (error) {
                console.error('Network error:', error);
                // Network error
                if (feedback) {
                    feedback.className = 'contact-feedback error';
                    feedback.textContent = 'Network error. Please check your connection and try again.';
                    feedback.style.display = 'block';
                }
            }

            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Message';
        });
    } else {
        console.log('Contact form not found!');
    }
}