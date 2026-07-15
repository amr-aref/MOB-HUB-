# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| Latest (`main`) | ✅ |
| Older branches | ❌ |

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

If you discover a security vulnerability, please report it responsibly:

1. **Email** the maintainers directly (see repository contacts).
2. Include as much detail as possible:
   - A description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (optional)
3. You will receive an acknowledgement within **48 hours**.
4. We aim to release a fix within **7 days** for critical issues and **30 days** for others.

We appreciate responsible disclosure and will credit reporters (unless they prefer anonymity) in the release notes.

## Security Measures

This project implements the following backend security controls:

- **Helmet.js** — sets secure HTTP response headers (CSP, HSTS, X-Frame-Options, etc.)
- **Rate limiting** — 200 req/15 min general; 30 req/15 min for write operations
- **CORS** — configurable via `CORS_ORIGIN` environment variable
- **Body size limits** — `express.json()` capped at 1 MB
- **Error sanitisation** — stack traces are never returned to API clients
- **Pino log redaction** — `Authorization` and `Cookie` headers are redacted in logs
- **No secrets in code** — all credentials managed via environment variables

## Known Limitations

- The review ownership system uses device identifiers (AsyncStorage) rather than authenticated user sessions. This is a known design trade-off documented in the codebase.
- No authentication layer exists as of the current version — all API endpoints are publicly accessible.
