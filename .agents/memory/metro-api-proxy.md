---
name: Metro API proxy
description: How the Expo dev server proxies /api requests to the Express API without Replit path routing
---

## Rule
The `metro.config.js` in `artifacts/mobile/` uses `config.server.enhanceMiddleware` to proxy all `/api/*` requests from the Expo Metro dev server (port 18115) to the Express API server (port 8080) using Node's built-in `http` module.

**Why:** Without proper Replit artifact registration, path-based routing (`/api` → port 8080) is inactive. The Expo web browser preview sends API calls to the Metro dev server domain (port 18115), which without the proxy returns 404. The proxy solves this transparently.

**How to apply:** Any time the mobile app's API calls are failing in the web preview (404/network errors) but `curl localhost:8080/api/...` works fine, check that `metro.config.js` still has the `enhanceMiddleware` proxy block. If it's missing, re-add it.
