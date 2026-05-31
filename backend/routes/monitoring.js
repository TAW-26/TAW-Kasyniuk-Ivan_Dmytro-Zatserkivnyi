const router = require('express').Router();
const metricsAuth = require('../middleware/metricsAuthMiddleware');
const events = require('../utils/eventsBuffer');

function escapeXml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

router.get('/events.rss', metricsAuth, (req, res) => {
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers.host || 'localhost:5000';
  const base = `${proto}://${host}`;
  const items = events.list().map((e) => {
    const guid = `${base}/api/monitoring/events/${e.time}-${e.event}`;
    const desc = JSON.stringify(e.payload);
    return `    <item>
      <title>[${escapeXml(e.event)}] ${escapeXml(e.message)}</title>
      <pubDate>${new Date(e.time).toUTCString()}</pubDate>
      <guid isPermaLink="false">${escapeXml(guid)}</guid>
      <category>${escapeXml(e.event)}</category>
      <description>${escapeXml(desc)}</description>
    </item>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>List-App Monitoring Feed</title>
    <link>${base}/api/monitoring/events.rss</link>
    <description>Ostatnie zdarzenia mojej aplikacji (login, register, listing.deleted, błędy)</description>
    <language>pl-PL</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <ttl>60</ttl>
${items.join('\n')}
  </channel>
</rss>`;

  res.set('Content-Type', 'application/rss+xml; charset=utf-8');
  res.send(xml);
});

router.get('/events.json', metricsAuth, (req, res) => {
  res.json({ count: events.list().length, events: events.list() });
});

module.exports = router;
