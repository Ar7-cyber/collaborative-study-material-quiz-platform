// Global Client Script for CSQP Platform
const App = {
    currentUser: null,

    async init() {
        await this.checkAuth();
        this.renderNav();
    },

    async checkAuth() {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                this.currentUser = data.user;
            } else {
                this.currentUser = null;
            }
        } catch (err) {
            this.currentUser = null;
        }
    },

    renderNav() {
        const navAuth = document.getElementById('nav-auth');
        if (!navAuth) return;

        if (this.currentUser) {
            const adminLink = this.currentUser.role === 'Administrator'
                ? '<a href="/admin.html" class="btn btn-outline btn-sm" style="margin-right: 0.5rem;">Admin Console</a>'
                : '';
            navAuth.innerHTML = `
                ${adminLink}
                <span class="user-badge" title="Role: ${this.currentUser.role}">
                    👤 ${this.currentUser.username} (${this.getRoleShort(this.currentUser.role)})
                </span>
                <button class="btn btn-outline btn-sm" onclick="App.logout()">Logout</button>
            `;
        } else {
            navAuth.innerHTML = `
                <a href="/login.html" class="btn btn-outline btn-sm">Login</a>
                <a href="/register.html" class="btn btn-primary btn-sm">Register</a>
            `;
        }
    },

    getRoleShort(role) {
        if (role === 'Administrator') return 'Admin';
        if (role === 'Content Contributor / Quiz Creator') return 'Contributor';
        return 'Student';
    },

    async logout() {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            this.showToast('Logged out successfully', 'success');
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 600);
        } catch (err) {
            this.showToast('Logout failed', 'danger');
        }
    },

    showToast(message, type = 'info') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            container.setAttribute('role', 'status');
            container.setAttribute('aria-live', 'polite');
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerText = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 4000);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
