const { getDefaultConfig } = require('expo/metro-config');
const http = require('http');

const config = getDefaultConfig(__dirname);

/**
 * Proxy /api/* from the Expo web dev server to the Express API.
 * Default port 3000 matches root .env.example PORT.
 * Override with API_PROXY_PORT when the API listens elsewhere.
 */
const API_PROXY_PORT = Number(process.env.API_PROXY_PORT || process.env.PORT || 3000);

config.server = config.server || {};
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    if (req.url && req.url.startsWith('/api')) {
      const options = {
        hostname: 'localhost',
        port: API_PROXY_PORT,
        path: req.url,
        method: req.method,
        headers: { ...req.headers, host: `localhost:${API_PROXY_PORT}` },
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
