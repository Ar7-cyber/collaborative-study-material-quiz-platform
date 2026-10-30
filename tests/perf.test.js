const { test, describe } = require('node:test');
const assert = require('node:assert');
const materialService = require('../services/materialService');

describe('Performance Benchmark (CSQP-NF-001 & TC-PERF-01)', () => {
    test('TC-PERF-01: 90% of search & hierarchy queries complete well within 3 seconds', () => {
        const timings = [];
        const iterations = 50;

        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            materialService.searchMaterials({ search: 'TCP' });
            materialService.getSubjectsAndTopics();
            const elapsed = performance.now() - start;
            timings.push(elapsed);
        }

        timings.sort((a, b) => a - b);
        const p90Index = Math.floor(timings.length * 0.90);
        const p90TimeMs = timings[p90Index];

        console.log(`\n  [Performance Metric] 90th percentile interaction latency: ${p90TimeMs.toFixed(2)} ms (Threshold: <= 3000 ms)`);
        assert.ok(p90TimeMs < 3000, `90th percentile latency (${p90TimeMs}ms) must be under 3000ms`);
    });
});
