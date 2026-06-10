const fs = require('fs');
const http = require('http');
const path = require('path');
const express = require('express');

const app = express();
const port = Number(process.env.DEMO_PORT || 4201);
const backendPort = Number(process.env.BACKEND_PORT || 5001);
const frontendDir = path.resolve(__dirname, '../../frontend/dist/frontend/browser');
const indexFile = path.join(frontendDir, 'index.html');

if (!fs.existsSync(indexFile)) {
  console.error(`Production frontend build not found: ${indexFile}`);
  console.error('Run: cd frontend && npm run build -- --configuration production');
  process.exit(1);
}

function proxyToBackend(req, res) {
  const headers = { ...req.headers, host: `127.0.0.1:${backendPort}` };
  delete headers.connection;

  const proxyReq = http.request(
    {
      hostname: '127.0.0.1',
      port: backendPort,
      path: req.originalUrl,
      method: req.method,
      headers,
    },
    (proxyRes) => {
      res.status(proxyRes.statusCode || 502);
      for (const [name, value] of Object.entries(proxyRes.headers)) {
        if (value !== undefined && name !== 'connection') res.setHeader(name, value);
      }
      proxyRes.pipe(res);
    },
  );

  proxyReq.on('error', (error) => {
    if (!res.headersSent) res.status(502).json({ message: 'Backend unavailable' });
    console.error(`Proxy error: ${error.message}`);
  });

  req.pipe(proxyReq);
}

app.use((req, res, next) => {
  if (
    req.path === '/health' ||
    req.path === '/metrics' ||
    req.path === '/api' ||
    req.path.startsWith('/api/')
  ) {
    proxyToBackend(req, res);
    return;
  }
  next();
});

app.use(express.static(frontendDir));
app.use((req, res) => res.sendFile(indexFile));

app.listen(port, '127.0.0.1', () => {
  console.log(`Production demo server: http://127.0.0.1:${port}`);
  console.log(`Proxy target: http://127.0.0.1:${backendPort}`);
});
