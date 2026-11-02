const MaterialView = {
    materialId: null,
    material: null,

    async init() {
        const urlParams = new URLSearchParams(window.location.search);
        this.materialId = urlParams.get('id');

        if (!this.materialId) {
            window.location.href = '/';
            return;
        }

        await this.loadMaterial();
        this.setupCommentForm();
    },

    async loadMaterial() {
        try {
            const res = await fetch(`/api/materials/${this.materialId}`);
            if (!res.ok) {
                document.getElementById('material-box').innerHTML = `
                    <div style="text-align: center; padding: 2rem;">
                        <h2 style="color: var(--danger);">Material Not Found</h2>
                        <p style="color: var(--text-muted); margin: 1rem 0;">The requested study material may have been deleted or does not exist.</p>
                        <a href="/" class="btn btn-primary">Return to Dashboard</a>
                    </div>
                `;
                return;
            }

            const data = await res.json();
            this.material = data.material;
            this.renderDetails();
            this.renderRating();
            this.renderComments();
        } catch (err) {
            console.error('Error loading material:', err);
        }
    },

    renderDetails() {
        const box = document.getElementById('material-box');
        const m = this.material;
        const isDoc = m.content_type === 'DOCUMENT';
        const dateStr = new Date(m.created_at).toLocaleString();

        const isOwnerOrAdmin = App.currentUser && (
            App.currentUser.id === m.contributor_id ||
            App.currentUser.role === 'Administrator'
        );

        let bodyContent = '';
        if (isDoc) {
            bodyContent = `
                <div style="background: var(--bg-main); border: 1px dashed var(--border); border-radius: var(--radius); padding: 2rem; text-align: center; margin: 1.5rem 0;">
                    <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📄</div>
                    <h4 style="font-size: 1.1rem; margin-bottom: 0.25rem;">${m.file_name || 'Document File'}</h4>
                    <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1.25rem;">
                        Type: ${m.mime_type || 'PDF/Document'} • Size: ${(m.file_size / 1024).toFixed(1)} KB
                    </p>
                    <a href="/api/materials/${m.id}/download" class="btn btn-primary">
                        ⬇️ Download Document (TC-MAT-05)
                    </a>
                </div>
            `;
        } else {
            bodyContent = `
                <div class="content-viewer">${m.content}</div>
                <div style="text-align: right; margin-top: 0.5rem;">
                    <a href="/api/materials/${m.id}/download" class="btn btn-outline btn-sm">
                        ⬇️ Download Notes as Markdown (.md)
                    </a>
                </div>
            `;
        }

        let managementControls = '';
        managementControls = `
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                ${isOwnerOrAdmin ? '<button class="btn btn-danger btn-sm" onclick="MaterialView.deleteMaterial()">Delete Resource</button>' : ''}
                <button class="btn btn-outline btn-sm" onclick="MaterialView.flagMaterial()">Report Material</button>
            </div>
        `;

        box.innerHTML = `
            <div class="detail-header">
                <div>
                    <span class="card-badge ${isDoc ? 'badge-doc' : 'badge-note'}">
                        ${isDoc ? '📄 Document (PDF/File)' : '📝 In-Platform Note'}
                    </span>
                    <h1 style="font-size: 1.75rem; font-weight: 700; margin-top: 0.25rem; color: var(--text-main);">${m.title}</h1>
                    <div style="color: var(--primary); font-weight: 600; font-size: 0.9rem; margin-top: 0.35rem;">
                        📖 ${m.subject_name} &rsaquo; ${m.topic_name}
                    </div>
                </div>
                ${managementControls}
            </div>

            <p style="font-size: 1rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 1rem;">
                ${m.description || 'No additional description provided.'}
            </p>

            ${bodyContent}

            <div style="font-size: 0.85rem; color: var(--text-muted); border-top: 1px solid var(--border); padding-top: 1rem; display: flex; justify-content: space-between;">
                <span>Author: <strong>${m.contributor_name}</strong></span>
                <span>Published: ${dateStr}</span>
            </div>
        `;
    },

    renderRating() {
        const ratingText = document.getElementById('current-user-rating');
        if (!ratingText) return;

        const m = this.material;
        let info = `Overall: ⭐ ${m.average_rating} (${m.rating_count} rating${m.rating_count === 1 ? '' : 's'})`;
        if (m.user_rating) {
            info += ` | Your Rating: ★ ${m.user_rating}`;
        }
        ratingText.innerText = info;
    },

    async submitRating(score) {
        if (!App.currentUser) {
            App.showToast('Please log in to submit a rating', 'danger');
            return;
        }

        try {
            const res = await fetch(`/api/materials/${this.materialId}/rate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rating: score })
            });
            const data = await res.json();
            if (res.ok) {
                App.showToast(`Rating of ${score} recorded!`, 'success');
                this.material.average_rating = data.average_rating;
                this.material.rating_count = data.rating_count;
                this.material.user_rating = data.user_rating;
                this.renderRating();
            } else {
                App.showToast(data.error || 'Failed to submit rating', 'danger');
            }
        } catch (err) {
            App.showToast('Network error submitting rating', 'danger');
        }
    },

    renderComments() {
        const list = document.getElementById('comments-list');
        if (!list) return;

        const comments = this.material.comments || [];
        if (comments.length === 0) {
            list.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">No comments yet. Start the conversation!</p>';
            return;
        }

        list.innerHTML = comments.map(c => `
            <div class="comment-card">
                <div class="comment-meta">
                    <strong>👤 ${c.author_name}</strong>
                    <span class="badge" style="font-size: 0.75rem; background: var(--bg-main); padding: 0.15rem 0.4rem; border-radius: 4px;">${c.author_role}</span>
                    <span>• ${new Date(c.created_at).toLocaleString()}</span>
                </div>
                <div style="font-size: 0.95rem; color: var(--text-main);">${c.comment_text}</div>
                <button class="btn btn-outline btn-sm" style="margin-top:0.5rem" onclick="MaterialView.flagComment(${c.id})">Report Comment</button>
            </div>
        `).join('');
    },

    setupCommentForm() {
        const form = document.getElementById('comment-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!App.currentUser) {
                App.showToast('Please log in to participate in discussions', 'danger');
                return;
            }

            const input = document.getElementById('comment-text');
            const comment_text = input.value.trim();
            if (!comment_text) return;

            try {
                const res = await fetch(`/api/materials/${this.materialId}/comments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ comment_text })
                });
                const data = await res.json();
                if (res.ok) {
                    App.showToast('Comment posted!', 'success');
                    input.value = '';
                    if (!this.material.comments) this.material.comments = [];
                    this.material.comments.push(data.comment);
                    this.renderComments();
                } else {
                    App.showToast(data.error || 'Failed to post comment', 'danger');
                }
            } catch (err) {
                App.showToast('Network error posting comment', 'danger');
            }
        });
    },

    async flagMaterial() {
        await this.submitFlag(`/api/materials/${this.materialId}/flag`, 'Material reported for review');
    },

    async flagComment(commentId) {
        await this.submitFlag(`/api/materials/${this.materialId}/comments/${commentId}/flag`, 'Comment reported for review');
    },

    async submitFlag(url, successMessage) {
        if (!App.currentUser) {
            App.showToast('Please log in to report content', 'danger');
            return;
        }
        const reason = prompt('Why are you reporting this content?');
        if (reason === null) return;
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: reason.trim() || 'Inappropriate or policy-violating content' })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Unable to submit report');
            App.showToast(data.duplicate ? 'You have already reported this content' : successMessage, 'success');
        } catch (err) {
            App.showToast(err.message || 'Network error submitting report', 'danger');
        }
    },

    async deleteMaterial() {
        if (!confirm('Are you sure you want to delete this study material? This cannot be undone.')) {
            return;
        }

        try {
            const res = await fetch(`/api/materials/${this.materialId}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (res.ok) {
                App.showToast('Study material deleted successfully', 'success');
                setTimeout(() => {
                    window.location.href = '/';
                }, 800);
            } else {
                App.showToast(data.error || 'Failed to delete material', 'danger');
            }
        } catch (err) {
            App.showToast('Network error deleting material', 'danger');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    MaterialView.init();
});
