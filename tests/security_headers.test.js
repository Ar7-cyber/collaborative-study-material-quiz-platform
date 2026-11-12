const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');

describe('Security Headers & OWASP Compliance Test Suite', () => {
    let server;
    let port;

    before(() => {
        const app = require('../server');
        return new Promise((resolve) => {
            server = http.createServer(app).listen(0, () => {
                port = server.address().port;
                resolve();
            });
        });
    });

    after(() => {
        return new Promise((resolve) => {
            server.close(resolve);
        });
    });

    test('TC-SEC-HD-01: Express security middleware injects X-Content-Type-Options nosniff', async () => {
        const res = await fetch(`http://localhost:${port}/api/health`);
        assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff');
    });

    test('TC-SEC-HD-02: Express security middleware injects X-Frame-Options DENY preventing clickjacking', async () => {
        const res = await fetch(`http://localhost:${port}/api/health`);
        assert.strictEqual(res.headers.get('x-frame-options'), 'DENY');
    });

    test('TC-SEC-HD-03: Express security middleware injects X-XSS-Protection mode=block', async () => {
        const res = await fetch(`http://localhost:${port}/api/health`);
        assert.strictEqual(res.headers.get('x-xss-protection'), '1; mode=block');
    });
});
