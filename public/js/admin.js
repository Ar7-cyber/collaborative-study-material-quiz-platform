const AdminApp = {
    escape(value) { return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); },
    async init() {
        await App.checkAuth();
        if (!App.currentUser || App.currentUser.role !== 'Administrator') {
            document.querySelector('main').innerHTML = '<div class="detail-box" style="text-align:center;padding:3rem"><h2>Access Denied (403 Forbidden)</h2><p>You must be signed in as an Administrator.</p><a href="/login.html" class="btn btn-primary">Sign in</a></div>';
            return;
        }
        await Promise.all([this.loadUsers(), this.loadLogs(), this.loadModeration()]);
    },
    async loadUsers() {
        const body = document.getElementById('users-table-body');
        try {
            const res = await fetch('/api/admin/users'); const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            body.innerHTML = (data.users || []).map(u => `<tr><td>#${u.id}</td><td><strong>${this.escape(u.username)}</strong></td><td><select class="form-control" onchange="AdminApp.changeRole(${u.id},this.value)"><option value="Student/User" ${u.role==='Student/User'?'selected':''}>Student/User</option><option value="Content Contributor / Quiz Creator" ${u.role==='Content Contributor / Quiz Creator'?'selected':''}>Content Contributor</option><option value="Administrator" ${u.role==='Administrator'?'selected':''}>Administrator</option></select></td><td>${this.escape(u.status)}</td><td>${u.id !== App.currentUser.id ? `<button class="btn btn-outline btn-sm" onclick="AdminApp.toggleStatus(${u.id},'${u.status==='ACTIVE'?'DISABLED':'ACTIVE'}')">${u.status==='ACTIVE'?'Disable':'Activate'}</button>` : 'Current Account'}</td></tr>`).join('');
        } catch (e) { body.innerHTML = '<tr><td colspan="5">Failed to load users.</td></tr>'; }
    },
    async toggleStatus(id, status) { await this.mutate(`/api/admin/users/${id}/status`, {status}, 'User status updated'); },
    async changeRole(id, role) { await this.mutate(`/api/admin/users/${id}/role`, {role}, 'User role updated'); },
    async moderate(type, id, status) { await this.mutate(`/api/admin/${type}/${id}/moderate`, {status}, `${type.slice(0,-1)} ${status.toLowerCase()}`); await this.loadModeration(); },
    async mutate(url, body, success) {
        try { const res = await fetch(url, {method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); const data=await res.json(); if(!res.ok) throw new Error(data.error || 'Request failed'); App.showToast(success,'success'); await Promise.all([this.loadUsers(),this.loadLogs()]); }
        catch(e) { App.showToast(e.message || 'Request failed','danger'); }
    },
    async loadModeration() {
        const materialsBody=document.getElementById('flagged-materials-body'), commentsBody=document.getElementById('flagged-comments-body');
        try {
            const res=await fetch('/api/admin/moderation-queue'); const data=await res.json(); if(!res.ok) throw new Error(data.error);
            materialsBody.innerHTML=(data.materials||[]).map(m=>`<tr><td>${m.id}</td><td>${this.escape(m.title)}<br><small>${this.escape(m.flag_reasons||'')}</small></td><td>${this.escape(m.contributor_name||'')}</td><td>${m.flag_count}</td><td><button class="btn btn-outline btn-sm" onclick="AdminApp.moderate('materials',${m.id},'ACTIVE')">Restore</button> <button class="btn btn-outline btn-sm" onclick="AdminApp.moderate('materials',${m.id},'DELETED')">Remove</button></td></tr>`).join('') || '<tr><td colspan="5">No flagged materials.</td></tr>';
            commentsBody.innerHTML=(data.comments||[]).map(c=>`<tr><td>${c.id}</td><td>${this.escape(c.comment_text)}<br><small>${this.escape(c.flag_reasons||'')}</small></td><td>${this.escape(c.author_name||'')}</td><td>${c.flag_count}</td><td><button class="btn btn-outline btn-sm" onclick="AdminApp.moderate('comments',${c.id},'ACTIVE')">Restore</button> <button class="btn btn-outline btn-sm" onclick="AdminApp.moderate('comments',${c.id},'DELETED')">Remove</button></td></tr>`).join('') || '<tr><td colspan="5">No flagged comments.</td></tr>';
        } catch(e) { materialsBody.innerHTML='<tr><td colspan="5">Failed to load moderation queue.</td></tr>'; commentsBody.innerHTML=''; }
    },
    async verifyLogs() {
        const status=document.getElementById('audit-integrity-status');
        try { const res=await fetch('/api/admin/audit-logs/verify'); const data=await res.json(); status.textContent=data.valid?`SHA-256 integrity verified (${data.checked} records).`:`Integrity check failed at record #${data.invalid_record_id}.`; status.style.color=data.valid?'var(--success)':'var(--danger)'; }
        catch(e) { status.textContent='Unable to verify audit log integrity.'; }
    },
    async loadLogs() {
        const body=document.getElementById('logs-table-body');
        try { const res=await fetch('/api/admin/audit-logs'); const data=await res.json(); if(!res.ok) throw new Error(data.error);
            body.innerHTML=(data.logs||[]).map(l=>`<tr><td>${this.escape(new Date(l.created_at).toLocaleString())}</td><td>${this.escape(l.action)}</td><td>${this.escape(l.username||'System/Guest')}</td><td>${this.escape(l.details||'')}</td><td>${this.escape(l.ip_address||'')}</td></tr>`).join('') || '<tr><td colspan="5">No audit events recorded.</td></tr>';
            if(data.integrity?.valid) { const el=document.getElementById('audit-integrity-status'); el.textContent=`SHA-256 integrity verified (${data.integrity.checked} records).`; el.style.color='var(--success)'; }
        } catch(e) { body.innerHTML='<tr><td colspan="5">Failed to load audit logs.</td></tr>'; }
    }
};
document.addEventListener('DOMContentLoaded', () => AdminApp.init());
