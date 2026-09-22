# Security Policy & Guidelines - AstroVitals Neuro-Shield

AstroVitals is designed to monitor astronaut health metrics during long-duration spaceflight. Operational safety, cryptographic integrity, and data privacy are core tenets of the platform architecture.

---

## 1. Secrets Management Policy

1. **Zero Hardcoded Credentials**: No private API keys, passwords, bearer tokens, or encryption secrets may ever be committed to git repositories.
2. **Environment Isolation**:
   - Production secrets reside strictly in platform environment managers (Vercel and Render).
   - Local secrets reside strictly in `.env` files that are ignored by `.gitignore`.
3. **Template Integrity**:
   - Only `.env.example` files are committed to version control.
   - Example files MUST only contain empty strings or non-sensitive default configurations (e.g. ports, localhost URLs).

---

## 2. `.env` Best Practices

- **Never stage `.env` files**: Run `git status` before every commit to confirm no `.env` or credential files appear in the staging area.
- **Frontend vs Backend Variables**:
  - Only variables prefixed with `VITE_` are exposed to the client.
  - Never prefix sensitive credentials (database URLs, Gemini keys, Resend keys, JWT secrets) with `VITE_`.
- **Restrict File Permissions**: In production or self-hosted environments, restrict `.env` file read access:
  ```bash
  chmod 600 .env
  ```

---

## 3. Cryptographic Standards & Telemetry Privacy

1. **Password Storage**: Passwords are cryptographically salted and hashed using `bcrypt` (work factor 12). Raw passwords are never logged, transmitted in error messages, or stored in plaintext.
2. **JWT Authentication**:
   - Signed with HMAC-SHA256 (`HS256`) using a 256-bit minimum key length.
   - Access tokens expire automatically after 7 days (`10080` minutes).
3. **Mission Zero-Knowledge Privacy**:
   - Astronaut psychological chat text and private health logs are inaccessible to administrative accounts.
   - The admin dashboard only monitors sanitized telemetry counts, alert metadata, and partial masked IPs (e.g. `192.168.x.x`).
4. **Rate Limiting**: Critical endpoints (login, register, password reset, chat, telemetry ingestion) are protected against brute-force attacks via SlowAPI token-bucket rate limiters.

---

## 4. API Key Rotation Procedures

If an API key is suspected of being compromised or during routine quarterly rotations:

### Google Gemini API Key
1. Navigate to [Google AI Studio $\rightarrow$ Get API Key](https://aistudio.google.com/app/apikey).
2. Create a new API key.
3. In Render: **Environment** $\rightarrow$ update `GEMINI_API_KEY` $\rightarrow$ **Save Changes** (triggers rolling restart).
4. Delete the deprecated key from Google AI Studio.

### NASA Open Data Key
1. Generate a new key at [api.nasa.gov](https://api.nasa.gov/).
2. Update `NASA_API_KEY` in Render environment variables.

### Resend API Key
1. Go to [resend.com/api-keys](https://resend.com/api-keys) $\rightarrow$ Create API Key.
2. Update `RESEND_API_KEY` in Render.
3. Revoke the old key.

### JWT Secret Key
1. Generate a fresh 64-character cryptographic string:
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```
2. Update `JWT_SECRET_KEY` in Render.
3. *Note*: Rotating the JWT secret immediately invalidates all active user sessions, requiring astronauts to log in again with their password.

---

## 5. Vulnerability Disclosure

If you discover a potential security vulnerability in AstroVitals, please do not open a public issue. Instead, report it directly to the system architect:

- **Lead Architect:** MD Tanvir Ahmmed
- **Team:** Team Orbitrix
- **Email:** `tanvirahmmed13579@gmail.com`
- **Response SLA:** Within 24 hours for security inquiries.

Please include:
- Description of the vulnerability and attack vector
- Reproduction steps or proof of concept
- Potential impact on telemetry or system integrity

---

## 6. Pre-Flight Production Security Checklist

- [x] All `.env` files added to `.gitignore`.
- [x] Zero hardcoded passwords or API keys in source code.
- [x] Single admin policy strictly enforced (`tanvirahmmed13579@gmail.com`).
- [x] `verify_sanitization.py` passes with zero violations.
- [x] Global React `<ErrorBoundary>` configured to prevent application crashes.
- [x] Server-side 500 error handler masks stack traces and internal diagnostics.
- [x] Rate limiting active on all authentication and ingestion endpoints.
- [x] CORS origins restricted to approved production domains.

---

*Made by MD Tanvir Ahmmed · Team Orbitrix · NASA Space Apps Challenge 2026*
