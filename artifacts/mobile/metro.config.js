const { getDefaultConfig } = require('expo/metro-config');
const http = require('http');

const config = getDefaultConfig(__dirname);

/**
 * Proxy /api/* requests from the Expo web dev server to the Express API
 * server running on port 8080. This lets the browser preview make API
 * calls without requiring Replit's path-based artifact routing.
 */
config.server = config.server || {};
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    if (req.url && req.url.startsWith('/api')) {
      const options = {
        hostname: 'localhost',
        port: 8080,
        path: req.url,
        method: req.method,
        headers: { ...req.headers, host: 'localhost:8080' },
      };
      const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
      });
      proxyReq.on('error', (err) => {
        console.error('[proxy] /api error:', err.message);
        if (!res.headersSent) {
          res.writeHead(502);
          res.end('Bad Gateway');
        }
      });
      req.pipe(proxyReq, { end: true });
    } else {
      middleware(req, res, next);
    }
  };
};

module.exports = config;
