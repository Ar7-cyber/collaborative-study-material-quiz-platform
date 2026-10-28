const Dashboard = {
    subjects: [],
    selectedSubjectId: null,
    selectedTopicId: null,

    async init() {
        await this.loadHierarchy();
        await this.loadMaterials();
        this.updateContributorUI();
        this.setupForms();
    },

    updateContributorUI() {
        const container = document.getElementById('contributor-actions');
        if (!container) return;

        if (App.currentUser && (
            App.currentUser.role === 'Content Contributor / Quiz Creator' ||
            App.currentUser.role === 'Administrator'
        )) {
            container.style.display = 'flex';
        } else {
            container.style.display = 'none';
        }
    },

    async loadHierarchy() {
        try {
            const res = await fetch('/api/materials/hierarchy');
            const data = await res.json();
            this.subjects = data.subjects || [];
            this.renderHierarchyTree();
            this.populateFilterDropdowns();
        } catch (err) {
            console.error('Failed to load hierarchy:', err);
        }
    },

    renderHierarchyTree() {
        const treeEl = document.getElementById('hierarchy-tree');
        if (!treeEl) return;

        if (this.subjects.length === 0) {
            treeEl.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem;">No subjects registered yet.</p>';
            return;
        }

        let html = '';
        this.subjects.forEach(subject => {
            html += `
                <div class="subject-item">
                    <div class="subject-header" onclick="Dashboard.filterBySubject(${subject.id})">
                        <span>📚 ${subject.name}</span>
                        <span style="font-size: 0.75rem; color: var(--text-muted);">${subject.topics.length} topics</span>
                    </div>
                    <ul class="topic-list">
            `;

            subject.topics.forEach(topic => {
                const isActive = this.selectedTopicId === topic.id ? 'active' : '';
                html += `
                    <li>
                        <a href="javascript:void(0)" class="topic-link ${isActive}" onclick="Dashboard.filterByTopic(${subject.id}, ${topic.id})">
                            • ${topic.name}
                        </a>
                    </li>
                `;
            });

            html += `</ul></div>`;
        });

        treeEl.innerHTML = html;
    },

    populateFilterDropdowns() {
        const subSelect = document.getElementById('filter-subject');
        if (!subSelect) return;

        subSelect.innerHTML = '<option value="">All Subjects</option>';
        this.subjects.forEach(s => {
            subSelect.innerHTML += `<option value="${s.id}">${s.name} (${s.code})</option>`;
        });

        subSelect.addEventListener('change', () => {
            this.populateFilterTopics();
        });
    },

    populateFilterTopics() {
        const subId = document.getElementById('filter-subject').value;
        const topicSelect = document.getElementById('filter-topic');
        topicSelect.innerHTML = '<option value="">All Topics</option>';

        if (!subId) return;
        const sub = this.subjects.find(s => s.id === Number(subId));
        if (sub && sub.topics) {
            sub.topics.forEach(t => {
                topicSelect.innerHTML += `<option value="${t.id}">${t.name}</option>`;
            });
        }
    },

    filterBySubject(subId) {
        document.getElementById('filter-subject').value = subId;
        this.populateFilterTopics();
        document.getElementById('filter-topic').value = '';
        this.applyFilters();
    },

    filterByTopic(subId, topicId) {
        this.selectedTopicId = topicId;
        document.getElementById('filter-subject').value = subId;
        this.populateFilterTopics();
        document.getElementById('filter-topic').value = topicId;
        this.renderHierarchyTree();
        this.applyFilters();
    },

    async loadMaterials(params = {}) {
        const container = document.getElementById('materials-container');
        const countEl = document.getElementById('materials-count');
        container.innerHTML = '<p style="color: var(--text-muted);">Loading resources...</p>';

        try {
            const query = new URLSearchParams(params).toString();
            const res = await fetch(`/api/materials?${query}`);
            const data = await res.json();
            const materials = data.materials || [];

            countEl.innerText = `Showing ${materials.length} resource${materials.length === 1 ? '' : 's'}`;

            if (materials.length === 0) {
                container.innerHTML = `
                    <div style="grid-column: 1 / -1; padding: 2.5rem; text-align: center; background: #ffffff; border: 1px dashed var(--border); border-radius: var(--radius);">
                        <p style="color: var(--text-muted); font-size: 1rem;">No study materials match your search criteria.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = materials.map(item => {
                const isDoc = item.content_type === 'DOCUMENT';
                const badgeClass = isDoc ? 'badge-doc' : 'badge-note';
                const badgeLabel = isDoc ? '📄 Document (PDF/File)' : '📝 In-Platform Note';
                const dateStr = new Date(item.created_at).toLocaleDateString();

                return `
                    <a href="/material.html?id=${item.id}" class="material-card">
                        <div>
                            <span class="card-badge ${badgeClass}">${badgeLabel}</span>
                            <h3 class="card-title">${item.title}</h3>
                            <p class="card-desc">${item.description || 'No description provided.'}</p>
                            <div style="font-size: 0.8rem; color: var(--primary); font-weight: 600; margin-bottom: 0.5rem;">
                                📖 ${item.subject_name} &rsaquo; ${item.topic_name}
                            </div>
                        </div>
                        <div class="card-meta">
                            <span>👤 ${item.contributor_name} • ${dateStr}</span>
                            <span class="rating-badge">
                                ⭐ ${item.average_rating > 0 ? item.average_rating + ' (' + item.rating_count + ')' : 'No ratings'}
                            </span>
                        </div>
                    </a>
                `;
            }).join('');
        } catch (err) {
            container.innerHTML = '<p style="color: var(--danger);">Failed to load materials.</p>';
        }
    },

    applyFilters() {
        const search = document.getElementById('search-input').value.trim();
        const subject_id = document.getElementById('filter-subject').value;
        const topic_id = document.getElementById('filter-topic').value;
        const contributor = document.getElementById('filter-contributor').value.trim();

        const params = {};
        if (search) params.search = search;
        if (subject_id) params.subject_id = subject_id;
        if (topic_id) params.topic_id = topic_id;
        if (contributor) params.contributor = contributor;

        this.loadMaterials(params);
    },

    resetFilters() {
        document.getElementById('search-input').value = '';
        document.getElementById('filter-subject').value = '';
        document.getElementById('filter-topic').value = '';
        document.getElementById('filter-contributor').value = '';
        this.selectedTopicId = null;
        this.renderHierarchyTree();
        this.loadMaterials();
    },

    // Modal helpers
    openUploadModal() {
        this.populateModalSubjects('upload');
        document.getElementById('upload-modal').classList.add('active');
    },

    openNoteModal() {
        this.populateModalSubjects('note');
        document.getElementById('note-modal').classList.add('active');
    },

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    },

    populateModalSubjects(prefix) {
        const select = document.getElementById(`${prefix}-subject`);
        select.innerHTML = '<option value="">Select Subject</option>';
        this.subjects.forEach(s => {
            select.innerHTML += `<option value="${s.id}">${s.name} (${s.code})</option>`;
        });
        document.getElementById(`${prefix}-topic`).innerHTML = '<option value="">Select Topic</option>';
    },

    populateModalTopics(prefix) {
        const subId = document.getElementById(`${prefix}-subject`).value;
        const topicSelect = document.getElementById(`${prefix}-topic`);
        topicSelect.innerHTML = '<option value="">Select Topic</option>';

        if (!subId) return;
        const sub = this.subjects.find(s => s.id === Number(subId));
        if (sub && sub.topics) {
            sub.topics.forEach(t => {
                topicSelect.innerHTML += `<option value="${t.id}">${t.name}</option>`;
            });
        }
    },

    setupForms() {
        // Document Upload Form
        const uploadForm = document.getElementById('upload-form');
        if (uploadForm) {
            uploadForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData();
                formData.append('title', document.getElementById('upload-title').value.trim());
                formData.append('description', document.getElementById('upload-desc').value.trim());
                formData.append('subject_id', document.getElementById('upload-subject').value);
                formData.append('topic_id', document.getElementById('upload-topic').value);

                const fileInput = document.getElementById('upload-file');
                if (fileInput.files.length > 0) {
                    formData.append('file', fileInput.files[0]);
                }

                try {
                    const res = await fetch('/api/materials/upload', {
                        method: 'POST',
                        body: formData
                    });
                    const data = await res.json();
                    if (res.ok) {
                        App.showToast('Document uploaded successfully!', 'success');
                        Dashboard.closeModal('upload-modal');
                        uploadForm.reset();
                        Dashboard.loadMaterials();
                    } else {
                        App.showToast(data.error || 'Upload failed', 'danger');
                    }
                } catch (err) {
                    App.showToast('Network error uploading document', 'danger');
                }
            });
        }

        // Note Creation Form
        const noteForm = document.getElementById('note-form');
        if (noteForm) {
            noteForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const payload = {
                    title: document.getElementById('note-title').value.trim(),
                    description: document.getElementById('note-desc').value.trim(),
                    subject_id: document.getElementById('note-subject').value,
                    topic_id: document.getElementById('note-topic').value,
                    content: document.getElementById('note-content').value.trim()
                };

                try {
                    const res = await fetch('/api/materials/note', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    const data = await res.json();
                    if (res.ok) {
                        App.showToast('Note created successfully!', 'success');
                        Dashboard.closeModal('note-modal');
                        noteForm.reset();
                        Dashboard.loadMaterials();
                    } else {
                        App.showToast(data.error || 'Failed to create note', 'danger');
                    }
                } catch (err) {
                    App.showToast('Network error creating note', 'danger');
                }
            });
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Dashboard.init();
});
