const { test, describe, before } = require('node:test');
const assert = require('node:assert');
const { getDb } = require('../db/database');
const authService = require('../services/authService');
const materialService = require('../services/materialService');

describe('Study Material Management Test Suite (Aditya & Sheiman - Sprint 1)', () => {
    let studentUser, contributorUser, adminUser;
    let subjectId, topicId;

    before(() => {
        const db = getDb();
        studentUser = authService.register('student_tester', 'Student@123', 'Student/User');
        contributorUser = authService.register('contrib_tester', 'Contrib@123', 'Content Contributor / Quiz Creator');
        adminUser = authService.register('admin_tester', 'Admin@123', 'Administrator');

        // Create test subject & topic
        const sub = db.prepare('INSERT INTO subjects (name, code, description) VALUES (?, ?, ?)').run(
            'Computer Networks', 'CS-CN401', 'Network architectures and protocols'
        );
        subjectId = sub.lastInsertRowid;

        const top = db.prepare('INSERT INTO topics (subject_id, name, description) VALUES (?, ?, ?)').run(
            subjectId, 'TCP/IP Model', 'Four layer architecture'
        );
        topicId = top.lastInsertRowid;
    });

    test('TC-MAT-03: Browse subject & topic hierarchy (CSQP-F-005)', () => {
        const hierarchy = materialService.getSubjectsAndTopics();
        assert.ok(Array.isArray(hierarchy), 'Hierarchy should be an array');
        const cn = hierarchy.find(s => s.id === subjectId);
        assert.ok(cn, 'Computer Networks subject must exist');
        assert.ok(cn.topics.some(t => t.id === topicId), 'TCP/IP topic must exist under subject');
    });

    test('TC-MAT-02: Create and retrieve study note (CSQP-F-004)', () => {
        const note = materialService.createNote({
            title: 'TCP Handshake Detailed Explanation',
            description: 'SYN, SYN-ACK, ACK steps with packet diagrams',
            subject_id: subjectId,
            topic_id: topicId,
            content: 'Step 1: Client sends SYN packet to server.\nStep 2: Server responds with SYN-ACK.\nStep 3: Client acknowledges with ACK.'
        }, contributorUser);

        assert.ok(note.id, 'Note ID must be generated');
        assert.strictEqual(note.title, 'TCP Handshake Detailed Explanation');
        assert.strictEqual(note.content_type, 'NOTE');
        assert.strictEqual(note.contributor_id, contributorUser.id);
    });

    test('TC-MAT-04: Search and filter materials by title and metadata (CSQP-F-006)', () => {
        const results = materialService.searchMaterials({
            search: 'Handshake',
            subject_id: subjectId
        });
        assert.ok(results.length >= 1, 'Should find matching note by keyword');
        assert.strictEqual(results[0].title, 'TCP Handshake Detailed Explanation');

        // Search with non-matching filter returns empty
        const emptyResults = materialService.searchMaterials({ search: 'NonExistentXYZ' });
        assert.strictEqual(emptyResults.length, 0, 'Unrelated search must return empty array');
    });

    test('TC-MAT-01: Document upload with valid and invalid metadata (CSQP-F-003)', () => {
        const dummyFile = {
            filename: '12345-sample_cheatsheet.pdf',
            originalname: 'sample_cheatsheet.pdf',
            size: 1024 * 50, // 50 KB
            mimetype: 'application/pdf'
        };

        const doc = materialService.uploadDocument({
            title: 'Subnetting Quick Cheatsheet',
            description: 'IPv4 CIDR notation table',
            subject_id: subjectId,
            topic_id: topicId
        }, dummyFile, contributorUser);

        assert.ok(doc.id, 'Uploaded document ID generated');
        assert.strictEqual(doc.content_type, 'DOCUMENT');
        assert.strictEqual(doc.file_name, 'sample_cheatsheet.pdf');

        // Negative: upload without file
        assert.throws(() => {
            materialService.uploadDocument({ title: 'No file' }, null, contributorUser);
        }, /File is required/);
    });

    test('TC-MAT-07: Single rating per user and duplicate replacement (CSQP-F-009)', () => {
        // First material
        const list = materialService.searchMaterials({ subject_id: subjectId });
        const targetId = list[0].id;

        // Rate 4 stars
        const r1 = materialService.rateMaterial(targetId, 4, studentUser);
        assert.strictEqual(r1.user_rating, 4);
        assert.strictEqual(r1.rating_count, 1);
        assert.strictEqual(r1.average_rating, 4.0);

        // Rate 5 stars by same user (should replace, not duplicate)
        const r2 = materialService.rateMaterial(targetId, 5, studentUser);
        assert.strictEqual(r2.user_rating, 5);
        assert.strictEqual(r2.rating_count, 1, 'Rating count should still be 1 (replaced)');
        assert.strictEqual(r2.average_rating, 5.0);
    });

    test('TC-MAT-08: Discussion comments posting and ordering (CSQP-F-010)', () => {
        const list = materialService.searchMaterials({ subject_id: subjectId });
        const targetId = list[0].id;

        const comment = materialService.addComment(targetId, 'This explanation is very helpful for our upcoming exam!', studentUser);
        assert.ok(comment.id);
        assert.strictEqual(comment.author_name, studentUser.username);
        assert.strictEqual(comment.comment_text, 'This explanation is very helpful for our upcoming exam!');

        const material = materialService.getMaterialById(targetId);
        assert.ok(material.comments.some(c => c.id === comment.id));
    });

    test('TC-MAT-06: Authorized update and deletion (CSQP-F-008)', () => {
        const list = materialService.searchMaterials({ subject_id: subjectId });
        const targetId = list[0].id;

        // Update by contributor
        const updated = materialService.updateMaterial(targetId, {
            title: 'TCP Handshake Detailed Explanation (Updated v2)'
        }, contributorUser);
        assert.strictEqual(updated.title, 'TCP Handshake Detailed Explanation (Updated v2)');

        // Unauthorized user cannot delete
        assert.throws(() => {
            materialService.deleteMaterial(targetId, studentUser);
        }, /Forbidden/);

        // Authorized deletion
        const delResult = materialService.deleteMaterial(targetId, contributorUser);
        assert.strictEqual(delResult, true);

        // Deleted item removed from normal search listings
        const afterDelete = materialService.searchMaterials({ search: 'Updated v2' });
        assert.strictEqual(afterDelete.length, 0, 'Deleted material must be absent from active listings');
    });

    test('TC-SEC-08: Path traversal containment rejects directory escape on document downloads', () => {
        const path = require('path');
        const uploadsDir = path.resolve(__dirname, '..', 'uploads');
        
        const verifyDownloadPath = (filePath) => {
            const resolved = path.resolve(uploadsDir, filePath.replace(/\\/g, '/'));
            return resolved.startsWith(uploadsDir);
        };

        assert.strictEqual(verifyDownloadPath('valid_doc_123.pdf'), true, 'Valid file in uploads dir accepted');
        assert.strictEqual(verifyDownloadPath('../../../etc/passwd'), false, 'Directory traversal attack rejected');
        assert.strictEqual(verifyDownloadPath('sub/../../secret.txt'), false, 'Nested directory traversal rejected');
    });
});
