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
            } else {
                console.error('Failed to load posts');
            }
        } catch (error) {
            console.error('Error loading posts:', error);
        }
    }

    renderPostsList(posts) {
        const container = document.getElementById('posts-list');
        
        if (posts.length === 0) {
            container.innerHTML = '<p>No posts yet. Create your first post!</p>';
            return;
        }

        container.innerHTML = posts.map(post => `
            <div class="post-item">
                <div class="post-info">
                    <h3>${post.title}</h3>
                    <p>${post.date} • ${post.description}</p>
                </div>
                <div class="post-actions">
                    <button class="edit-btn" onclick="adminApp.editPost('${post.filename}')">Edit</button>
                    <button class="delete-btn" onclick="adminApp.deletePost('${post.filename}')">Delete</button>
                </div>
            </div>
        `).join('');
    }

    resetPostForm() {
        document.getElementById('post-form').reset();
        document.getElementById('post-date').value = new Date().toISOString().split('T')[0];
    }

    async handlePostSubmit() {
        const title = document.getElementById('post-title').value;
        const date = document.getElementById('post-date').value;
        const description = document.getElementById('post-description').value;
        const content = document.getElementById('post-content').value;

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
            } else {
                alert('Failed to publish post');
            }
        } catch (error) {
            console.error('Error publishing post:', error);
            alert('Error publishing post');
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
            } else {
                alert('Failed to delete post');
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('Error deleting post');
        }
    }

    editPost(filename) {
        // TODO: Implement edit functionality
        alert('Edit functionality coming soon!');
    }
}

// Initialize admin app when page loads
const adminApp = new AdminApp();