# JobConnect Security Architecture & Controls

## 1. Zero Trust & Security Principles
Security is engineered into every tier rather than bolted on:
- Never trust client inputs (frontend validation is purely UX; backend validation is mandatory and authoritative).
- Never trust client-provided IDs or roles (ownership and RBAC checks guard every entity modification).
- Never leak sensitive secrets, tokens, password hashes, or internal database exceptions.

---

## 2. Authentication & Credential Hardening

### Password Security
- Passwords are encrypted using Argon2id or bcrypt (cost factor 12).
- Passwords require min 6, max 50 characters, at least one letter, one number, and one special character.
- Account lockout and Redis-backed rate limiting after repeated failures.

### Token & Cookie Architecture
- **Access Token**: Short-lived (15 minutes), signed with `JWT_ACCESS_SECRET`.
- **Refresh Token**: Long-lived (7 days), signed with `JWT_REFRESH_SECRET`, stored in Redis with session reference.
- **Cookies**:
  - `HttpOnly = true` (Inaccessible to browser JavaScript, mitigating XSS token theft).
  - `Secure = true` in production (Transmitted only over HTTPS).
  - `SameSite = 'lax'` or `'strict'` depending on auth redirect requirements.
- **Refresh Token Rotation & Reuse Detection**:
  - Every refresh rotation issues a new refresh token and revokes the predecessor.
  - If a revoked token is re-submitted, the entire session family is revoked as a compromised credential indicator.

---

## 3. Strict Input Validation (Section 6A Compliance)
- **First Name**: Required, 2-50 chars, English-only `^[A-Z][a-zA-Z]+$`, no numbers, spaces, or symbols.
- **Last Name**: Required, 2-50 chars, alphabetic words with single spaces allowed (`^[a-zA-Z]+(?: [a-zA-Z]+)*$`).
- **Email**: Normalized to lowercase, trimmed, disposable email domain blocking, reserved domain blocking, dummy username blocking (`test`, `dummy`, `admin`), database-level unique constraint.
- **Phone Number**: Canonical E.164 representation (`phoneE164`), country selector, country-specific rules (India `^[6-9][0-9]{9}$`, USA `^[2-9][0-9]{9}$`, etc.), database-level unique constraint.
- **Date of Birth**: Age strictly calculated; must be between 13 and 120 years old; future dates rejected.
- **OTP Verification**: 6 numeric digits, stored in Redis with SHA-256 hash, 5-minute TTL, 60s resend cooldown, maximum 5 attempts.

---

## 4. Web Application Security Controls

### CSRF Defense
- State-changing mutations verify the presence of custom Anti-CSRF headers (`x-csrf-token`) or SameSite cookie policies.

### CORS & Security Headers
- Helmet enforces strict HTTP response headers: Content-Security-Policy (CSP), X-Frame-Options (`DENY`), X-Content-Type-Options (`nosniff`), Referrer-Policy, Strict-Transport-Security (HSTS).
- CORS is strictly locked to trusted `FRONTEND_URL` origins with credentials enabled; no wildcard `*` allowed on authenticated routes.

### NoSQL Injection & Sanitization
- MongoDB queries explicitly sanitize user inputs (stripping `$` and `.` operators).
- User query objects are never passed directly to Mongoose finders without schema field whitelisting.

### XSS & Content Sanitization
- Rich-text fields (such as job descriptions, candidate bio, recruiter notes) are sanitized on write and read using DOMPurify / sanitize-html.
- Links are validated to ensure only `https://` schemes are rendered, blocking `javascript:` and `data:` URIs.

### IDOR (Insecure Direct Object Reference) Protection
- Direct database lookups verify entity ownership:
  - Candidates can only view/withdraw their own applications.
  - Recruiters can only modify jobs and applicants belonging to their registered company.

### File Upload Security
- Resumes and logos are validated by file size (maximum 5MB for resumes, 2MB for logos), allowed MIME types (`application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`), file magic number inspection, and randomized storage keys to avoid path traversal.
