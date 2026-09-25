# JobConnect Architecture

## 1. System Overview
JobConnect is a production-style, scalable, and secure full-stack Job Portal built using a modular monolith pattern in TypeScript.

### Primary Actors
- **Candidate**: Discovers jobs, applies, manages profile, tracks applications, interacts with AI Career Assistant, receives real-time notifications.
- **Recruiter**: Creates company profile, posts and moderates jobs, reviews applicant pipelines, moves applicants through stages, schedules interviews, leverages AI JD Generator.
- **Admin**: Oversees platform integrity, manages users and recruiters, moderates jobs, inspects immutable audit logs.

---

## 2. High-Level Architecture

```text
+--------------------------------------------------------------+
|                     Client Tier (React)                     |
|  - React Hook Form + Zod Shared Schemas (UX validation)       |
|  - TanStack Query (Server State, Caching, Stale-While-Reval) |
|  - Socket.IO Client (Real-time events)                       |
+--------------------------------------------------------------+
                               |
                               | HTTPS / WSS
                               v
+--------------------------------------------------------------+
|                    Security & Gateway Tier                   |
|  - Helmet (CSP, HSTS, X-Content-Type-Options)                |
|  - CORS (Strict whitelisted frontend origin)                |
|  - Redis Rate Limiter (Per-IP & Per-User throttling)         |
|  - CSRF Protection (Custom header validation)                |
+--------------------------------------------------------------+
                               |
                               v
+--------------------------------------------------------------+
|                    Application Tier (Express)                |
|  - Auth Middleware (JWT Cookie & Session Revocation check)    |
|  - RBAC & IDOR Ownership Guards                              |
|  - Zod Backend Validation Pipeline (Authoritative check)     |
|  - Feature Controllers (Auth, Jobs, Apps, Admin, AI)         |
|  - Domain Services (Business logic)                          |
|  - AI Abstraction Layer (Gemini, OpenAI, Deterministic)      |
|  - Socket.IO Gateway (Authenticated rooms)                   |
+--------------------------------------------------------------+
                               |
            +------------------+------------------+
            |                                     |
            v                                     v
+-----------------------+             +-----------------------+
|      MongoDB 8+       |             |         Redis         |
| - Mongoose Schemas    |             | - Cache (Jobs, Search)|
| - Compound Indexes    |             | - OTP Store (5m TTL)  |
| - Transactions        |             | - Active Sessions     |
| - Data Integrity      |             | - Pub/Sub for Events  |
+-----------------------+             +-----------------------+
```

---

## 3. Communication Strategy
- **REST APIs (`/api/v1`)**: Versioned HTTP APIs following uniform envelope format `{ success: true, data: ..., message: ... }`.
- **WebSocket (Socket.IO)**: Secured via JWT cookie handshake for bi-directional real-time events (`notification:new`, `application:status_updated`, `interview:scheduled`).
- **Redis Pub/Sub**: Multi-instance event bus ensuring Socket.IO instances can scale horizontally.
