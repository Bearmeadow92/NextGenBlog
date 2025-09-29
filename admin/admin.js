class BlogAdmin {
    constructor() {
        this.token = localStorage.getItem('admin_token');
        this.currentView = 'posts';
        this.posts = [];
        this.messages = [];
        this.archivedMessages = [];
        this.currentMessage = null;
        this.editingPost = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        
        if (this.token) {
            this.showDashboard();
            this.loadPosts();
            this.loadMessages();
            this.loadUnreadCount();
        } else {
            this.showLogin();
        }
    }

    setupEventListeners() {
        // Login
        const loginBtn = document.getElementById('github-login');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.login());
        }

        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Navigation
        document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchView(e.target.dataset.view);
            });
        });

        // Refresh buttons
        const refreshPostsBtn = document.getElementById('refresh-posts');
        if (refreshPostsBtn) {
            refreshPostsBtn.addEventListener('click', () => this.loadPosts());
        }

        const refreshMessagesBtn = document.getElementById('refresh-messages');
        if (refreshMessagesBtn) {
            refreshMessagesBtn.addEventListener('click', () => this.loadMessages());
        }

        const refreshArchivedBtn = document.getElementById('refresh-archived');
        if (refreshArchivedBtn) {
            refreshArchivedBtn.addEventListener('click', () => this.loadArchivedMessages());
        }

        // Back to messages
        const backToMessagesBtn = document.getElementById('back-to-messages');
        if (backToMessagesBtn) {
            backToMessagesBtn.addEventListener('click', () => {
                this.switchView('messages');
            });
        }

        // Message actions
        const replyBtn = document.getElementById('reply-message');
        if (replyBtn) {
            replyBtn.addEventListener('click', () => {
                this.replyToCurrentMessage();
            });
        }

        const archiveBtn = document.getElementById('archive-message');
        if (archiveBtn) {
            archiveBtn.addEventListener('click', () => {
                this.archiveCurrentMessage();
            });
        }

        const unarchiveBtn = document.getElementById('unarchive-message');
        if (unarchiveBtn) {
            unarchiveBtn.addEventListener('click', () => {
                this.unarchiveCurrentMessage();
            });
        }

        const deleteBtn = document.getElementById('delete-message');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.deleteCurrentMessage();
            });
        }

        // Post forms
        const newPostForm = document.getElementById('new-post-form');
        if (newPostForm) {
            newPostForm.addEventListener('submit', (e) => this.handleNewPost(e));
        }

        const editPostForm = document.getElementById('edit-post-form');
        if (editPostForm) {
            editPostForm.addEventListener('submit', (e) => this.handleEditPost(e));
        }

        // Cancel edit
        const cancelEditBtn = document.getElementById('cancel-edit');
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => {
                this.switchView('posts');
            });
        }

        // Preview buttons
        const previewBtn = document.getElementById('preview-post');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => this.previewPost());
        }

        const previewEditBtn = document.getElementById('preview-edit');
        if (previewEditBtn) {
            previewEditBtn.addEventListener('click', () => this.previewEditPost());
        }

        // Modal close
        const modal = document.getElementById('preview-modal');
        if (modal) {
            const closeBtn = modal.querySelector('.close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    modal.style.display = 'none';
                });
            }
            
            window.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }

        // Set today's date as default
        const dateInputs = document.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
            if (!input.value) {
                input.value = new Date().toISOString().split('T')[0];
            }
        });
    }

async login() {
    // OAuth requires a browser redirect, not a fetch request
    window.location.href = '/auth/github';
}

    logout() {
        this.token = null;
        localStorage.removeItem('admin_token');
        this.showLogin();
    }

    showLogin() {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('admin-dashboard').style.display = 'none';
    }

    showDashboard() {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'flex';
    }

    switchView(viewName) {
        // Hide all views
        document.querySelectorAll('.admin-view').forEach(view => {
            view.style.display = 'none';
        });

        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected view
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.style.display = 'block';
        }

        // Mark active nav button
        const activeBtn = document.querySelector(`[data-view="${viewName}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        this.currentView = viewName;

        // Load data if needed
        if (viewName === 'messages') {
            this.loadMessages();
        } else if (viewName === 'archived') {
            this.loadArchivedMessages();
        }
    }

    async loadPosts() {
        try {
            console.log('Loading posts...');
            const response = await fetch('/api/admin/posts', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                this.posts = await response.json();
                this.renderPosts();
                console.log('Posts loaded:', this.posts.length);
            } else {
                console.error('Failed to load posts:', response.status);
            }
        } catch (error) {
            console.error('Error loading posts:', error);
        }
    }

    async loadMessages() {
        try {
            console.log('Loading active messages...');
            const response = await fetch('/api/messages', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                this.messages = await response.json();
                this.renderMessages();
                this.loadUnreadCount();
                console.log('Active messages loaded:', this.messages.length);
            } else {
                console.error('Failed to load messages:', response.status);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    async loadArchivedMessages() {
        try {
            console.log('Loading archived messages...');
            const response = await fetch('/api/messages?includeArchived=true', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const allMessages = await response.json();
                this.archivedMessages = allMessages.filter(m => m.isArchived);
                this.renderArchivedMessages();
                console.log('Archived messages loaded:', this.archivedMessages.length);
            } else {
                console.error('Failed to load archived messages:', response.status);
            }
        } catch (error) {
            console.error('Error loading archived messages:', error);
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

    renderPosts() {
        const container = document.getElementById('posts-list');
        if (!container) return;

        if (this.posts.length === 0) {
            container.innerHTML = '<p class="no-content">No posts found.</p>';
            return;
        }

        container.innerHTML = this.posts.map(post => `
            <div class="post-item">
                <div class="post-info">
                    <h3>${post.title}</h3>
                    <p class="post-meta">
                        <span class="post-date">${new Date(post.date).toLocaleDateString()}</span>
                        <span class="post-slug">/${post.slug}</span>
                    </p>
                    <p class="post-description">${post.description}</p>
                </div>
                <div class="post-actions">
                    <button class="btn btn-sm btn-secondary edit-post-btn" data-post-id="${post.id}">
                        Edit
                    </button>
                    <button class="btn btn-sm btn-danger delete-post-btn" data-post-id="${post.id}">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');

        // Add event listeners for post buttons
        container.querySelectorAll('.edit-post-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const postId = parseInt(e.target.dataset.postId);
                this.editPost(postId);
            });
        });

        container.querySelectorAll('.delete-post-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const postId = parseInt(e.target.dataset.postId);
                this.deletePost(postId);
            });
        });
    }

    renderMessages() {
        const container = document.getElementById('messages-list');
        if (!container) return;

        if (this.messages.length === 0) {
            container.innerHTML = '<p class="no-content">No active messages found.</p>';
            return;
        }

        const activeMessages = this.messages.filter(m => !m.isArchived);

        container.innerHTML = activeMessages.map(message => `
            <div class="message-item ${message.isRead ? 'read' : 'unread'}" data-message-id="${message.id}">
                <div class="message-header">
                    <span class="message-name">${message.name}</span>
                    <span class="message-email">${message.email}</span>
                    <span class="message-date">${new Date(message.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="message-subject">${message.subject}</div>
                <div class="message-preview">${message.message.substring(0, 100)}${message.message.length > 100 ? '...' : ''}</div>
                ${!message.isRead ? '<div class="unread-indicator"></div>' : ''}
                <div class="message-hover-arrow">→</div>
                <div class="message-actions-quick">
                    <button class="btn btn-xs btn-warning archive-btn" data-message-id="${message.id}">Archive</button>
                    <button class="btn btn-xs btn-danger delete-msg-btn" data-message-id="${message.id}">Delete</button>
                </div>
            </div>
        `).join('');

        // Add event listeners for message interactions
        container.querySelectorAll('.message-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Don't trigger if clicking on action buttons
                if (e.target.classList.contains('btn')) return;
                
                const messageId = parseInt(item.dataset.messageId);
                this.viewMessage(messageId);
            });
        });

        container.querySelectorAll('.archive-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const messageId = parseInt(e.target.dataset.messageId);
                this.archiveMessage(messageId);
            });
        });

        container.querySelectorAll('.delete-msg-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const messageId = parseInt(e.target.dataset.messageId);
                this.deleteMessage(messageId);
            });
        });
    }

    renderArchivedMessages() {
        const container = document.getElementById('archived-list');
        if (!container) return;

        if (this.archivedMessages.length === 0) {
            container.innerHTML = '<p class="no-content">No archived messages found.</p>';
            return;
        }

        container.innerHTML = this.archivedMessages.map(message => `
            <div class="message-item archived" data-message-id="${message.id}">
                <div class="message-header">
                    <span class="message-name">${message.name}</span>
                    <span class="message-email">${message.email}</span>
                    <span class="message-date">${new Date(message.createdAt).toLocaleDateString()}</span>
                    <span class="archived-label">Archived</span>
                </div>
                <div class="message-subject">${message.subject}</div>
                <div class="message-preview">${message.message.substring(0, 100)}${message.message.length > 100 ? '...' : ''}</div>
                <div class="message-hover-arrow">→</div>
                <div class="message-actions-quick">
                    <button class="btn btn-xs btn-info unarchive-btn" data-message-id="${message.id}">Unarchive</button>
                    <button class="btn btn-xs btn-danger delete-msg-btn" data-message-id="${message.id}">Delete</button>
                </div>
            </div>
        `).join('');

        // Add event listeners for archived message interactions
        container.querySelectorAll('.message-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('btn')) return;
                
                const messageId = parseInt(item.dataset.messageId);
                this.viewMessage(messageId, true);
            });
        });

        container.querySelectorAll('.unarchive-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const messageId = parseInt(e.target.dataset.messageId);
                this.unarchiveMessage(messageId);
            });
        });

        container.querySelectorAll('.delete-msg-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const messageId = parseInt(e.target.dataset.messageId);
                this.deleteMessage(messageId);
            });
        });
    }

    async viewMessage(messageId, isArchived = false) {
        const messageList = isArchived ? this.archivedMessages : this.messages;
        const message = messageList.find(m => m.id === messageId);
        if (!message) return;

        this.currentMessage = message;

        console.log('Viewing message:', messageId);

        // Mark as read if not already
        if (!message.isRead) {
            try {
                await fetch(`/api/messages/${messageId}/read`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                });
                message.isRead = true;
                this.loadUnreadCount();
            } catch (error) {
                console.error('Error marking message as read:', error);
            }
        }

        // Show/hide archive buttons
        const archiveBtn = document.getElementById('archive-message');
        const unarchiveBtn = document.getElementById('unarchive-message');
        
        if (message.isArchived) {
            archiveBtn.style.display = 'none';
            unarchiveBtn.style.display = 'inline-block';
        } else {
            archiveBtn.style.display = 'inline-block';
            unarchiveBtn.style.display = 'none';
        }

        // Render message details
        const container = document.getElementById('message-detail-content');
        if (container) {
            container.innerHTML = `
                <div class="message-detail">
                    <div class="message-meta">
                        <div class="meta-item">
                            <label>From:</label>
                            <span>${message.name} &lt;${message.email}&gt;</span>
                        </div>
                        <div class="meta-item">
                            <label>Subject:</label>
                            <span>${message.subject}</span>
                        </div>
                        <div class="meta-item">
                            <label>Date:</label>
                            <span>${new Date(message.createdAt).toLocaleString()}</span>
                        </div>
                        <div class="meta-item">
                            <label>Status:</label>
                            <span class="status-badges">
                                ${message.isRead ? '<span class="status-badge read">Read</span>' : '<span class="status-badge unread">Unread</span>'}
                                ${message.isArchived ? '<span class="status-badge archived">Archived</span>' : '<span class="status-badge active">Active</span>'}
                            </span>
                        </div>
                    </div>
                    <div class="message-body">
                        <label>Message:</label>
                        <div class="message-text">${message.message.replace(/\n/g, '<br>')}</div>
                    </div>
                </div>
            `;
        }

        this.switchView('message-detail');
    }

    replyToCurrentMessage() {
        if (!this.currentMessage) return;

        const subject = this.currentMessage.subject.startsWith('Re:') 
            ? this.currentMessage.subject 
            : `Re: ${this.currentMessage.subject}`;

        const mailtoLink = `mailto:${this.currentMessage.email}?subject=${encodeURIComponent(subject)}`;
        window.open(mailtoLink);
    }

    async archiveMessage(messageId) {
        try {
            console.log('Archiving message:', messageId);
            const response = await fetch(`/api/messages/${messageId}/archive`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const message = this.messages.find(m => m.id === messageId);
                if (message) message.isArchived = true;
                this.loadMessages();
                this.loadUnreadCount();
                console.log('Message archived successfully');
            } else {
                alert('Error archiving message');
            }
        } catch (error) {
            console.error('Error archiving message:', error);
            alert('Error archiving message');
        }
    }

    async unarchiveMessage(messageId) {
        try {
            console.log('Unarchiving message:', messageId);
            const response = await fetch(`/api/messages/${messageId}/unarchive`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                this.loadArchivedMessages();
                this.loadMessages();
                this.loadUnreadCount();
                console.log('Message unarchived successfully');
            } else {
                alert('Error unarchiving message');
            }
        } catch (error) {
            console.error('Error unarchiving message:', error);
            alert('Error unarchiving message');
        }
    }

    async deleteMessage(messageId) {
        if (!confirm('Are you sure you want to delete this message?')) return;

        try {
            console.log('Deleting message:', messageId);
            const response = await fetch(`/api/messages/${messageId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                this.messages = this.messages.filter(m => m.id !== messageId);
                this.archivedMessages = this.archivedMessages.filter(m => m.id !== messageId);
                
                if (this.currentView === 'messages') {
                    this.renderMessages();
                } else if (this.currentView === 'archived') {
                    this.renderArchivedMessages();
                }
                
                this.loadUnreadCount();
                console.log('Message deleted successfully');
            } else {
                alert('Error deleting message');
            }
        } catch (error) {
            console.error('Error deleting message:', error);
            alert('Error deleting message');
        }
    }

    async archiveCurrentMessage() {
        if (!this.currentMessage) return;
        await this.archiveMessage(this.currentMessage.id);
        this.switchView('messages');
    }

    async unarchiveCurrentMessage() {
        if (!this.currentMessage) return;
        await this.unarchiveMessage(this.currentMessage.id);
        this.switchView('archived');
    }

    async deleteCurrentMessage() {
        if (!this.currentMessage) return;
        
        if (await this.deleteMessage(this.currentMessage.id)) {
            const returnView = this.currentMessage.isArchived ? 'archived' : 'messages';
            this.switchView(returnView);
        }
    }

    // Post management methods
    async handleNewPost(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const postData = {
            title: formData.get('title'),
            date: formData.get('date'),
            description: formData.get('description'),
            content: formData.get('content')
        };

        try {
            const response = await fetch('/api/admin/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(postData)
            });

            if (response.ok) {
                alert('Post created successfully!');
                e.target.reset();
                this.loadPosts();
                this.switchView('posts');
            } else {
                const error = await response.json();
                alert(`Error: ${error.error}`);
            }
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Error creating post');
        }
    }

    async editPost(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (!post) return;

        this.editingPost = post;

        // Populate edit form
        document.getElementById('edit-post-title').value = post.title;
        document.getElementById('edit-post-date').value = post.date;
        document.getElementById('edit-post-description').value = post.description;
        document.getElementById('edit-post-content').value = post.content;

        this.switchView('edit-post');
    }

    async handleEditPost(e) {
        e.preventDefault();
        
        if (!this.editingPost) return;

        const formData = new FormData(e.target);
        const postData = {
            title: formData.get('title'),
            date: formData.get('date'),
            description: formData.get('description'),
            content: formData.get('content')
        };

        try {
            const response = await fetch(`/api/admin/posts/${this.editingPost.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(postData)
            });

            if (response.ok) {
                alert('Post updated successfully!');
                this.loadPosts();
                this.switchView('posts');
                this.editingPost = null;
            } else {
                const error = await response.json();
                alert(`Error: ${error.error}`);
            }
        } catch (error) {
            console.error('Error updating post:', error);
            alert('Error updating post');
        }
    }

    async deletePost(postId) {
        if (!confirm('Are you sure you want to delete this post?')) return;

        try {
            const response = await fetch(`/api/admin/posts/${postId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                alert('Post deleted successfully!');
                this.loadPosts();
            } else {
                alert('Error deleting post');
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('Error deleting post');
        }
    }

    previewPost() {
        const title = document.getElementById('post-title').value;
        const content = document.getElementById('post-content').value;
        this.showPreview(title, content);
    }

    previewEditPost() {
        const title = document.getElementById('edit-post-title').value;
        const content = document.getElementById('edit-post-content').value;
        this.showPreview(title, content);
    }

    showPreview(title, content) {
        const modal = document.getElementById('preview-modal');
        const previewContent = document.getElementById('preview-content');
        
        // Simple markdown-to-HTML conversion for preview
        const htmlContent = content
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*)\*/gim, '<em>$1</em>')
            .replace(/\n/gim, '<br>');

        previewContent.innerHTML = `
            <h1>${title}</h1>
            <div class="preview-body">${htmlContent}</div>
        `;

        modal.style.display = 'block';
    }
}

// Initialize the admin interface
const blogAdmin = new BlogAdmin();