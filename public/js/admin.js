const AdminApp = {
    async init() {
        await App.checkAuth();
        if (!App.currentUser || App.currentUser.role !== 'Administrator') {
            document.querySelector('main').innerHTML = `
                <div class="detail-box" style="text-align: center; padding: 3rem;">
                    <h2 style="color: var(--danger);">Access Denied (403 Forbidden)</h2>
                    <p style="color: var(--text-muted); margin: 1rem 0;">You must be signed in with an Administrator account to access the administration console.</p>
                    <a href="/login.html" class="btn btn-primary">Sign in as Administrator</a>
                </div>
            `;
            return;
        }

        await this.loadUsers();
        await this.loadLogs();
    },

    async loadUsers() {
        const body = document.getElementById('users-table-body');
        try {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            const users = data.users || [];

            body.innerHTML = users.map(u => `
                <tr>
                    <td>#${u.id}</td>
                    <td><strong>${u.username}</strong></td>
                    <td>
                        <select class="form-control" style="padding: 0.25rem 0.5rem; font-size: 0.85rem;" onchange="AdminApp.changeRole(${u.id}, this.value)">
                            <option value="Student/User" ${u.role === 'Student/User' ? 'selected' : ''}>Student/User</option>
                            <option value="Content Contributor / Quiz Creator" ${u.role === 'Content Contributor / Quiz Creator' ? 'selected' : ''}>Content Contributor</option>
                            <option value="Administrator" ${u.role === 'Administrator' ? 'selected' : ''}>Administrator</option>
                        </select>
                    </td>
                    <td>
                        <span style="font-weight: 700; color: ${u.status === 'ACTIVE' ? 'var(--success)' : 'var(--danger)'};">
                            ${u.status}
                        </span>
                    </td>
                    <td>
                        ${u.id !== App.currentUser.id ? `
                            <button class="btn btn-outline btn-sm" onclick="AdminApp.toggleStatus(${u.id}, '${u.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'}')">
                                ${u.status === 'ACTIVE' ? 'Disable Account' : 'Activate Account'}
                            </button>
                        ` : '<span style="color: var(--text-muted); font-size: 0.8rem;">Current Account</span>'}
                    </td>
                </tr>
            `).join('');
        } catch (err) {
            body.innerHTML = '<tr><td colspan="5" style="color: var(--danger);">Failed to load users.</td></tr>';
        }
    },

    async toggleStatus(userId, newStatus) {
        try {
            const res = await fetch(`/api/admin/users/${userId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();
            if (res.ok) {
                App.showToast(`User status set to ${newStatus}`, 'success');
                this.loadUsers();
                this.loadLogs();
            } else {
                App.showToast(data.error || 'Failed to update user', 'danger');
            }
        } catch (err) {
            App.showToast('Network error updating user', 'danger');
        }
    },

    async changeRole(userId, newRole) {
        try {
            const res = await fetch(`/api/admin/users/${userId}/role`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole })
            });
            const data = await res.json();
            if (res.ok) {
                App.showToast(`Role updated to ${newRole}`, 'success');
                this.loadUsers();
                this.loadLogs();
            } else {
                App.showToast(data.error || 'Failed to update role', 'danger');
            }
        } catch (err) {
            App.showToast('Network error updating role', 'danger');
        }
    },

    async loadLogs() {
        const body = document.getElementById('logs-table-body');
        try {
            const res = await fetch('/api/admin/audit-logs');
            const data = await res.json();
            const logs = data.logs || [];

            body.innerHTML = logs.map(l => `
                <tr>
                    <td style="color: var(--text-muted); font-size: 0.8rem;">${new Date(l.created_at).toLocaleString()}</td>
                    <td><span style="font-weight: 700; color: var(--primary);">${l.action}</span></td>
                    <td>${l.username || 'System/Guest'}</td>
                    <td>${l.details || ''}</td>
                    <td style="color: var(--text-muted); font-size: 0.8rem;">${l.ip_address}</td>
                </tr>
            `).join('');
        } catch (err) {
            body.innerHTML = '<tr><td colspan="5" style="color: var(--danger);">Failed to load audit logs.</td></tr>';
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    AdminApp.init();
});
