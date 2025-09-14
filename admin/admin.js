class AdminApp {
    constructor() {
        this.token = null;
        this.currentView = 'posts';
        this.init();
    }

    init() {
        // Check for token in URL (from OAuth callback)
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        if (token) {
            this.token = token;
            localStorage.setItem('admin_token', token);
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } else {
            // Check for stored token
            this.token = localStorage.getItem('admin_token');
        }

        if (this.token) {
            this.showDashboard();
        } else {
            this.showLogin();
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Login button
        const loginBtn = document.getElementById('github-login');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                window.location.href = '/api/auth/github';
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        // Navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!e.target.classList.contains('logout-btn')) {
                    this.switchView(e.target.dataset.view);
                }
            });
        });

        // Post form
        const postForm = document.getElementById('post-form');
        if (postForm) {
            postForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePostSubmit();
            });
        }

        // Preview button
        const previewBtn = document.querySelector('.preview-btn');
        if (previewBtn) {
            previewBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.previewPost();
            });
        }

        // Event delegation for dynamic buttons (Edit/Delete)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-btn')) {
                const filename = e.target.dataset.filename;
                this.editPost(filename);
            }
            
            if (e.target.classList.contains('delete-btn')) {
                const filename = e.target.dataset.filename;
                this.deletePost(filename);
            }
        });
    }

    showLogin() {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('admin-dashboard').style.display = 'none';
    }

    showDashboard() {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'flex';
        this.loadPosts();
    }

    logout() {
        this.token = null;
        localStorage.removeItem('admin_token');
        this.showLogin();
    }

    switchView(view) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');

        // Show/hide views
        document.querySelectorAll('.admin-view').forEach(viewEl => {
            viewEl.style.display = 'none';
        });
        document.getElementById(`${view}-view`).style.display = 'block';

        this.currentView = view;

        // Load data for specific views
        if (view === 'posts') {
            this.loadPosts();
        } else if (view === 'new-post') {
            this.resetPostForm();
        }
    }

    async loadPosts() {
        try {
            const response = await fetch('/api/posts', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const posts = await response.json();
                this.renderPostsList(posts);
            } else if (response.status === 401) {
                // Token expired or invalid
                console.error('Authentication failed, redirecting to login');
                this.logout();
            } else {
                console.error('Failed to load posts:', response.status);
                document.getElementById('posts-list').innerHTML = '<p>Error loading posts. Please try again.</p>';
            }
        } catch (error) {
            console.error('Error loading posts:', error);
            document.getElementById('posts-list').innerHTML = '<p>Error loading posts. Please check your connection.</p>';
        }
    }

    renderPostsList(posts) {
        const container = document.getElementById('posts-list');
        
        if (posts.length === 0) {
            container.innerHTML = '<p>No posts yet. Create your first post!</p>';
            return;
        }

        // Use data attributes instead of inline onclick handlers
        container.innerHTML = posts.map(post => `
            <div class="post-item">
                <div class="post-info">
                    <h3>${post.title}</h3>
                    <p>${post.date} • ${post.description}</p>
                </div>
                <div class="post-actions">
                    <button class="edit-btn" data-filename="${post.filename}">Edit</button>
                    <button class="delete-btn" data-filename="${post.filename}">Delete</button>
                </div>
            </div>
        `).join('');
    }

    resetPostForm() {
        document.getElementById('post-form').reset();
        document.getElementById('post-date').value = new Date().toISOString().split('T')[0];
    }

    previewPost() {
        const title = document.getElementById('post-title').value;
        const date = document.getElementById('post-date').value;
        const description = document.getElementById('post-description').value;
        const content = document.getElementById('post-content').value;

        if (!title || !content) {
            alert('Please fill in title and content to preview.');
            return;
        }

        // Create preview window
        const previewWindow = window.open('', 'preview', 'width=800,height=600,scrollbars=yes');
        
        const previewHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Preview: ${title}</title>
                <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
                <style>
                    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                    h1 { color: #333; }
                    .meta { color: #666; font-style: italic; margin-bottom: 20px; }
                    .content { line-height: 1.6; }
                </style>
            </head>
            <body>
                <h1>${title}</h1>
                <div class="meta">Published: ${date}</div>
                <div class="meta">${description}</div>
                <div class="content" id="content"></div>
                <script>
                    document.getElementById('content').innerHTML = marked.parse(\`${content.replace(/`/g, '\\`')}\`);
                </script>
            </body>
            </html>
        `;
        
        previewWindow.document.write(previewHTML);
        previewWindow.document.close();
    }

    async handlePostSubmit() {
        const title = document.getElementById('post-title').value;
        const date = document.getElementById('post-date').value;
        const description = document.getElementById('post-description').value;
        const content = document.getElementById('post-content').value;

        if (!title || !date || !description || !content) {
            alert('Please fill in all fields.');
            return;
        }

        const postData = {
            title,
            date,
            description,
            body: content
        };

        try {
            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(postData)
            });

            if (response.ok) {
                alert('Post published successfully!');
                this.switchView('posts');
            } else if (response.status === 401) {
                alert('Authentication failed. Please log in again.');
                this.logout();
            } else {
                const errorData = await response.json();
                alert(`Failed to publish post: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error publishing post:', error);
            alert('Error publishing post. Please check your connection.');
        }
    }

    async deletePost(filename) {
        if (!confirm('Are you sure you want to delete this post?')) {
            return;
        }

        try {
            const response = await fetch(`/api/posts/${filename}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                alert('Post deleted successfully!');
                this.loadPosts();
            } else if (response.status === 401) {
                alert('Authentication failed. Please log in again.');
                this.logout();
            } else {
                const errorData = await response.json();
                alert(`Failed to delete post: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('Error deleting post. Please check your connection.');
        }
    }

    async editPost(filename) {
        try {
            // Fetch the post content from GitHub
            const response = await fetch(`https://api.github.com/repos/Bearmeadow92/NextGenBlog/contents/posts/${filename}`);
            const data = await response.json();
            
            // Decode the content
            const markdownContent = atob(data.content);
            
            // Parse frontmatter
            const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
            const match = markdownContent.match(frontmatterRegex);
            
            if (match) {
                const frontmatterText = match[1];
                const content = match[2];
                
                // Parse frontmatter fields
                const frontmatter = {};
                frontmatterText.split('\n').forEach(line => {
                    const [key, ...valueParts] = line.split(':');
                    if (key && valueParts.length > 0) {
                        const value = valueParts.join(':').trim().replace(/"/g, '');
                        frontmatter[key.trim()] = value;
                    }
                });
                
                // Fill the form with existing data
                document.getElementById('post-title').value = frontmatter.title || '';
                document.getElementById('post-date').value = frontmatter.date || '';
                document.getElementById('post-description').value = frontmatter.description || '';
                document.getElementById('post-content').value = content.trim();
                
                // Switch to new post view for editing
                this.switchView('new-post');
                
                // Note: This is basic edit - doesn't handle updating existing posts
                // You'd need to modify the handlePostSubmit to detect edit mode
                alert('Post loaded for editing. Note: This will create a new post when submitted.');
            }
        } catch (error) {
            console.error('Error loading post for editing:', error);
            alert('Error loading post for editing.');
        }
    }
}

// Initialize admin app when page loads
const adminApp = new AdminApp();