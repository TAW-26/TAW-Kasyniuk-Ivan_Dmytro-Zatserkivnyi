const autocannon = require('autocannon');

const TARGET = process.env.TARGET || 'http://localhost:5000';
const DURATION = Number(process.env.DURATION) || 20;
const CONNECTIONS = Number(process.env.CONNECTIONS) || 50;
const PIPELINING = Number(process.env.PIPELINING) || 1;

const scenarios = [
  { name: 'GET / (health-ish root)', url: `${TARGET}/`, method: 'GET' },
  { name: 'GET /health', url: `${TARGET}/health`, method: 'GET' },
  { name: 'GET /api/listings', url: `${TARGET}/api/listings?limit=20`, method: 'GET' },
  { name: 'GET /api/categories', url: `${TARGET}/api/categories`, method: 'GET' },
];

const THRESHOLDS = {
  errorsMax: 0.01,
  p99MaxMs: Number(process.env.P99_MAX_MS) || 4000,
  rpsMin: Number(process.env.RPS_MIN) || 20,
};

function formatResult(label, r) {
  return {
    scenario: label,
    duration_s: r.duration,
    requests: r.requests.total,
    rps_avg: Math.round(r.requests.average),
    p50_ms: r.latency.p50,
    p95_ms: r.latency.p97_5,
    p99_ms: r.latency.p99,
    max_ms: r.latency.max,
    errors: (r.errors || 0) + (r.timeouts || 0),
    non2xx: r.non2xx,
    errors_ratio: ((r.errors + r.timeouts + r.non2xx) / Math.max(r.requests.total, 1)).toFixed(4),
  };
}

function passes(s) {
  const errorsRatio = Number(s.errors_ratio);
  return {
    errors: errorsRatio <= THRESHOLDS.errorsMax,
    p99: s.p99_ms <= THRESHOLDS.p99MaxMs,
    rps: s.rps_avg >= THRESHOLDS.rpsMin,
  };
}

(async () => {
  console.log(`\n=== Load test ${TARGET} ===`);
  console.log(`Duration: ${DURATION}s | Connections: ${CONNECTIONS} | Pipelining: ${PIPELINING}\n`);

  const results = [];
  let allPassed = true;

  for (const sc of scenarios) {
    process.stdout.write(`▶ ${sc.name} ... `);
    const result = await autocannon({
      url: sc.url,
      method: sc.method,
      duration: DURATION,
      connections: CONNECTIONS,
      pipelining: PIPELINING,
    });
    const summary = formatResult(sc.name, result);
    const checks = passes(summary);
    summary.passes = checks;
    summary.ok = checks.errors && checks.p99 && checks.rps;
    if (!summary.ok) allPassed = false;
    results.push(summary);
    console.log(summary.ok ? 'OK' : 'FAIL');
  }

  console.log('\n=== Summary ===');
  console.table(
    results.map((r) => ({
      scenario: r.scenario,
      RPS: r.rps_avg,
      'p50(ms)': r.p50_ms,
      'p95(ms)': r.p95_ms,
      'p99(ms)': r.p99_ms,
      errors: `${(Number(r.errors_ratio) * 100).toFixed(2)}%`,
      pass: r.ok ? '✓' : '✗',
    })),
  );

  console.log('\nThresholds: errors<=' + (THRESHOLDS.errorsMax * 100).toFixed(0) + '%, p99<=' + THRESHOLDS.p99MaxMs + 'ms, RPS>=' + THRESHOLDS.rpsMin);
  console.log(allPassed ? '\n✓ STABILITY: PASSED' : '\n✗ STABILITY: FAILED');
  process.exit(allPassed ? 0 : 1);
})();
