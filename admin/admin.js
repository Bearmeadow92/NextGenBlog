class AdminApp {
    constructor() {
        this.token = null;
        this.currentView = 'posts';
        this.editingPost = null;
        this.currentMessage = null;
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

        // Messages buttons
        const refreshBtn = document.getElementById('refresh-messages');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadMessages();
            });
        }

        const markAllReadBtn = document.getElementById('mark-all-read');
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', () => {
                this.markAllMessagesRead();
            });
        }

        const backToMessagesBtn = document.getElementById('back-to-messages');
        if (backToMessagesBtn) {
            backToMessagesBtn.addEventListener('click', () => {
                this.switchView('messages');
            });
        }

        const replyBtn = document.getElementById('reply-message');
        if (replyBtn) {
            replyBtn.addEventListener('click', () => {
                this.replyToMessage();
            });
        }

        const deleteMessageBtn = document.getElementById('delete-message');
        if (deleteMessageBtn) {
            deleteMessageBtn.addEventListener('click', () => {
                this.deleteCurrentMessage();
            });
        }

        // Event delegation for dynamic buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-btn')) {
                const filename = e.target.dataset.filename;
                this.editPost(filename);
            }
            
            if (e.target.classList.contains('delete-btn')) {
                const filename = e.target.dataset.filename;
                this.deletePost(filename);
            }

            if (e.target.classList.contains('message-item')) {
                const messageId = e.target.dataset.messageId;
                this.viewMessage(messageId);
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
        this.loadUnreadCount();
    }

    logout() {
        this.token = null;
        localStorage.removeItem('admin_token');
        this.showLogin();
    }

    switchView(view) {
        // Hide all views
        document.querySelectorAll('.admin-view').forEach(viewEl => {
            viewEl.style.display = 'none';
        });
        
        // Show target view
        const targetView = document.getElementById(`${view}-view`);
        if (targetView) {
            targetView.style.display = 'block';
        }

        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[data-view="${view}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        this.currentView = view;

        // Load data for specific views
        if (view === 'posts') {
            this.loadPosts();
        } else if (view === 'messages') {
            this.loadMessages();
        } else if (view === 'new-post') {
            this.resetPostForm();
        }
    }

    // Posts functionality (existing code)
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
                this.logout();
            } else {
                document.getElementById('posts-list').innerHTML = '<p>Error loading posts.</p>';
            }
        } catch (error) {
            console.error('Error loading posts:', error);
            document.getElementById('posts-list').innerHTML = '<p>Error loading posts.</p>';
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
                    <button class="edit-btn" data-filename="${post.filename}">Edit</button>
                    <button class="delete-btn" data-filename="${post.filename}">Delete</button>
                </div>
            </div>
        `).join('');
    }

    // Messages functionality (new)
    async loadMessages() {
        try {
            const response = await fetch('/api/messages', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const messages = await response.json();
                this.renderMessagesList(messages);
            } else if (response.status === 401) {
                this.logout();
            } else {
                document.getElementById('messages-list').innerHTML = '<p>Error loading messages.</p>';
            }
        } catch (error) {
            console.error('Error loading messages:', error);
            document.getElementById('messages-list').innerHTML = '<p>Error loading messages.</p>';
        }
    }

    renderMessagesList(messages) {
        const container = document.getElementById('messages-list');
        
        if (messages.length === 0) {
            container.innerHTML = '<p>No messages yet.</p>';
            return;
        }

        container.innerHTML = messages.map(message => `
            <div class="message-item ${message.isRead ? 'read' : 'unread'}" data-message-id="${message.id}">
                <div class="message-info">
                    <div class="message-header">
                        <strong>${message.name}</strong>
                        <span class="message-email">${message.email}</span>
                        <span class="message-date">${new Date(message.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div class="message-subject">${message.subject}</div>
                    <div class="message-preview">${message.message.substring(0, 100)}...</div>
                </div>
                ${!message.isRead ? '<div class="unread-indicator"></div>' : ''}
            </div>
        `).join('');
    }

    async viewMessage(messageId) {
        try {
            const response = await fetch(`/api/messages/${messageId}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const message = await response.json();
                this.currentMessage = message;
                this.renderMessageDetail(message);
                this.switchView('message-detail');
                
                // Mark as read if unread
                if (!message.isRead) {
                    await this.markMessageRead(messageId);
                }
            } else {
                alert('Error loading message');
            }
        } catch (error) {
            console.error('Error loading message:', error);
            alert('Error loading message');
        }
    }

    renderMessageDetail(message) {
        const container = document.getElementById('message-detail-content');
        
        container.innerHTML = `
            <div class="message-detail">
                <div class="message-meta">
                    <div class="meta-row">
                        <strong>From:</strong> ${message.name} &lt;${message.email}&gt;
                    </div>
                    <div class="meta-row">
                        <strong>Subject:</strong> ${message.subject}
                    </div>
                    <div class="meta-row">
                        <strong>Date:</strong> ${new Date(message.createdAt).toLocaleString()}
                    </div>
                </div>
                <div class="message-content">
                    <h4>Message:</h4>
                    <div class="message-body">${message.message.replace(/\n/g, '<br>')}</div>
                </div>
            </div>
        `;
    }

    async markMessageRead(messageId) {
        try {
            await fetch(`/api/messages/${messageId}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            this.loadUnreadCount();
        } catch (error) {
            console.error('Error marking message as read:', error);
        }
    }

    async markAllMessagesRead() {
        // This would require a new API endpoint, or we can iterate through unread messages
        alert('Mark all read functionality - would need additional API endpoint');
    }

    replyToMessage() {
        if (this.currentMessage) {
            const mailtoLink = `mailto:${this.currentMessage.email}?subject=Re: ${this.currentMessage.subject}&body=Hi ${this.currentMessage.name},%0A%0A`;
            window.open(mailtoLink);
        }
    }

    async deleteCurrentMessage() {
        if (!this.currentMessage) return;
        
        if (!confirm('Are you sure you want to delete this message?')) return;

        try {
            const response = await fetch(`/api/messages/${this.currentMessage.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                alert('Message deleted successfully');
                this.switchView('messages');
                this.loadUnreadCount();
            } else {
                alert('Error deleting message');
            }
        } catch (error) {
            console.error('Error deleting message:', error);
            alert('Error deleting message');
        }
    }

    async loadUnreadCount() {
        try {
            const response = await fetch('/api/messages/count/unread', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const badge = document.getElementById('unread-badge');
                if (data.unreadCount > 0) {
                    badge.textContent = data.unreadCount;
                    badge.style.display = 'inline';
                } else {
                    badge.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Error loading unread count:', error);
        }
    }

    // Existing post functionality continues...
    resetPostForm() {
        document.getElementById('post-form').reset();
        document.getElementById('post-date').value = new Date().toISOString().split('T')[0];
        this.editingPost = null;
        
        document.querySelector('#new-post-view h2').textContent = 'Create New Post';
        document.querySelector('.submit-btn').textContent = 'Publish Post';
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

        try {
            if (this.editingPost) {
                await this.updateExistingPost(title, date, description, content);
            } else {
                await this.createNewPost(title, date, description, content);
            }
        } catch (error) {
            console.error('Error submitting post:', error);
            alert(`Error ${this.editingPost ? 'updating' : 'publishing'} post.`);
        }
    }

    async createNewPost(title, date, description, content) {
        const postData = { title, date, description, body: content };

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
            this.logout();
        } else {
            const errorData = await response.json();
            alert(`Failed to publish post: ${errorData.error}`);
        }
    }

    async updateExistingPost(title, date, description, content) {
        const postData = { title, date, description, body: content };

        const response = await fetch(`/api/posts/${this.editingPost}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify(postData)
        });

        if (response.ok) {
            alert('Post updated successfully!');
            this.switchView('posts');
        } else if (response.status === 401) {
            this.logout();
        } else {
            const errorData = await response.json();
            alert(`Failed to update post: ${errorData.error}`);
        }
    }

    async deletePost(filename) {
        if (!confirm('Are you sure you want to delete this post?')) return;

        try {
            const response = await fetch(`/api/posts/${filename}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (response.ok) {
                alert('Post deleted successfully!');
                this.loadPosts();
            } else if (response.status === 401) {
                this.logout();
            } else {
                alert('Failed to delete post');
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('Error deleting post');
        }
    }

    async editPost(filename) {
        try {
            const response = await fetch(`/api/posts/${filename}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (response.ok) {
                const post = await response.json();
                
                document.getElementById('post-title').value = post.title || '';
                document.getElementById('post-date').value = post.date || '';
                document.getElementById('post-description').value = post.description || '';
                document.getElementById('post-content').value = post.content || '';
                
                this.editingPost = filename;
                
                document.querySelector('#new-post-view h2').textContent = 'Edit Post';
                document.querySelector('.submit-btn').textContent = 'Update Post';
                
                this.switchView('new-post');
            } else if (response.status === 401) {
                this.logout();
            } else {
                alert('Error loading post for editing.');
            }
        } catch (error) {
            console.error('Error loading post for editing:', error);
            alert('Error loading post for editing.');
        }
    }
}

const adminApp = new AdminApp();