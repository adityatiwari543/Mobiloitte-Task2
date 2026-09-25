# JobConnect — Enterprise Full-Stack Job Portal

A production-style, scalable, and secure full-stack Job Portal built using **React, TypeScript, Node.js, Express, MongoDB, Redis, Socket.IO, and AI Integration**.

JobConnect connects **Job Seekers / Candidates**, **Employers / Recruiters**, **Companies**, and **Platform Administrators** in a real-time, zero-trust, high-performance ecosystem.

---

## 1. High-Level Architecture

```text
+--------------------------------------------------------------+
|                    Client Tier (React + Vite)                |
|  - React Hook Form + Zod Shared Schemas (UX validation)       |
|  - TanStack Query (Server State, Caching, Stale-While-Reval) |
|  - Socket.IO Client (Real-time notifications & updates)      |
+--------------------------------------------------------------+
                               |
                               | HTTPS / WSS
                               v
+--------------------------------------------------------------+
|                    Security & Gateway Tier                   |
|  - Helmet (CSP, HSTS, X-Content-Type-Options)                |
|  - Strict CORS (Explicit trusted origin + credentials)       |
|  - Redis Rate Limiter (Per-IP & Per-User sliding limits)     |
|  - CSRF Protection (Custom header validation)                |
+--------------------------------------------------------------+
                               |
                               v
+--------------------------------------------------------------+
|                    Application Tier (Express)                |
|  - Auth Middleware (JWT Cookie & Session Revocation check)    |
|  - RBAC & IDOR Ownership Guards                              |
|  - Zod Backend Validation Pipeline (Authoritative check)     |
|  - Feature Domain Controllers & Services                     |
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

## 2. Key Features

### For Candidates
- **Search & Discovery**: Faceted filtering by remote type, employment type, salary, experience, and debounced keyword search.
- **Strict Section 6A Registration**: Form validation parity with capitalized first name (`^[A-Z][a-zA-Z]+$`), single-space last name, normalized email with disposable/dummy domain rejection, international telephone selector (50+ countries with national format validation and E.164 canonicalization), exact age 13–120 check, and live password checklist.
- **6-Digit OTP Verification**: Stored securely in Redis with SHA-256 hash, 5-minute expiration, 60-second resend cooldown, and 5-attempt brute-force limit.
- **Candidate Dashboard**: Profile completion progress bar (0–100%), application metrics, and deterministic skills recommendations.
- **Profile & Resume Management**: Add skills tags, experience, and upload PDF/DOCX resumes validated by MIME magic numbers and safe disk isolation.
- **Application Pipeline**: Submit applications (protected against duplicate submissions at both service and DB index levels), track stage progression in real time, or withdraw.
- **AI Career Assistant**: Contextual Q&A grounded in platform jobs, profile optimization advice, and interview preparation tips.
- **AI Job Description Summarizer**: Instant breakdown of core responsibilities, must-have skills, and missing information.
- **AI Candidate-Job Matching**: Semantic match assessment with skills gap identification.

### For Recruiters
- **Company Management**: Maintain company profiles, logos, and verified status.
- **Job Lifecycle**: Create, draft, publish, pause, close, or delete job postings with automatic cache invalidation.
- **Hiring Pipeline Pipeline**: Move applicants through stages (`applied`, `under_review`, `shortlisted`, `interview`, `selected`, `rejected`), add private recruiter notes, and view candidate resumes.
- **Interview Scheduling**: Schedule interviews with date/time, duration, meeting links, and prep notes with instant candidate notifications.
- **Recruiter Dashboard**: Live analytics with hiring funnel stage breakdown and candidate volume.
- **AI Job Description Generator**: Transform brief recruiter bullet points into structured job descriptions ready for publication.

### For Platform Administrators
- **Executive Dashboard**: High-level platform KPIs (total users, active jobs, applications count, company counts).
- **User Moderation**: Filter user directories by role/status and suspend or reactivate accounts. Suspending a user immediately revokes all their active sessions.
- **Content Moderation**: Take down or pause offensive/violating job postings.
- **Immutable Audit Logs**: Queryable security audit trail logging every administrative intervention with actor IDs, actions, and timestamps.

---

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, TanStack Query v5, React Hook Form, Zod, Socket.IO Client, Lucide React |
| **Backend** | Node.js, Express, TypeScript, Mongoose, Redis (`ioredis`), Zod, bcrypt, JWT, Socket.IO, Helmet, CORS, Multer |
| **Database** | MongoDB 8.x with compound & unique indexes |
| **Caching & Pub/Sub** | Redis 7.x (with resilient automatic in-memory fallback for local dev) |
| **AI Integration** | Provider abstraction layer supporting Google Gemini, OpenAI, and Deterministic offline adapter |
| **Testing** | Vitest test runner with automated security & validation test suite |
| **DevOps** | Multi-stage Dockerfiles and `docker-compose.yml` orchestration |

---

## 4. Authentication & Security Architecture

1. **Short-Lived Access Tokens (15 min)** & **Long-Lived Refresh Tokens (7 days)**.
2. **HttpOnly, Secure, SameSite Cookies**: Tokens are never stored in `localStorage` or `sessionStorage`, protecting against script-based token extraction.
3. **Refresh Token Rotation with Reuse Detection**: Every refresh rotates credentials. If a previously rotated token is re-submitted, the entire session family is revoked.
4. **Session Registry**: Fast $O(1)$ revocation checks in Redis on every authenticated API request.
5. **CSRF Protection**: Double-submit cookie with custom header (`X-CSRF-Token`, `X-Requested-With`) validation on all state-changing mutations.
6. **NoSQL Injection Defense**: Untrusted user filter objects are strictly sanitized and schema-whitelisted.
7. **Strict Rate Limiting**: Redis sliding-window limiters on auth, OTP verification, and AI endpoints.

---

## 5. Redis Strategy

| Key Namespace | TTL | Description |
|---|---|---|
| `jobs:list:<sha256>` | 60s | Cached job search result pages (invalidated on job mutation) |
| `jobs:item:<jobId>` | 120s | Cached single job detail |
| `otp:<purpose>:<userId>` | 300s | Hashed 6-digit verification code |
| `otp:cooldown:<purpose>:<userId>` | 60s | Resend OTP cooldown lock |
| `otp:attempts:<purpose>:<userId>` | 300s | Attempt counter (max 5) |
| `session:active:<sessionId>` | 7 days | Active authenticated session marker |
| `revoked:session:<sessionId>` | 7 days | Instant revocation marker |
| `ratelimit:<prefix>:<key>` | Window | Sliding-window request counter |
| `jobconnect:events` | N/A | Pub/Sub channel for real-time WebSocket distribution |

---

## 6. Monorepo Structure

```text
Task2/
├── docs/                     # Architecture, Database, API, Security, Redis, AI, Deployment docs
├── shared/                   # Shared validation schemas, enums, country data, and types
│   ├── src/constants/        # roles, countries (50+), qualifications, validation rules
│   ├── src/schemas/          # Zod schemas (auth, user, job, profile, application)
│   └── src/types/            # TypeScript interfaces
├── backend/                  # Express REST API & Socket.IO server
│   ├── src/config/           # Environment and MongoDB connections
│   ├── src/models/           # Mongoose schemas & compound indexes
│   ├── src/services/         # Business domain logic (Auth, Jobs, Apps, Sessions, Redis)
│   ├── src/controllers/      # HTTP request handlers
│   ├── src/middlewares/      # Auth, RBAC, CSRF, Rate Limiter, Zod Validation
│   ├── src/ai/               # AI Service, Prompts, and Provider Adapters
│   ├── src/realtime/         # Socket.IO gateway with Redis Pub/Sub subscriber
│   └── src/__tests__/        # Automated security test suite
├── frontend/                 # React + Vite SaaS Client
│   ├── src/components/       # Layout, Navbar, Footer, Buttons, Inputs, Modals, Badges
│   ├── src/context/          # AuthContext provider
│   ├── src/lib/              # Axios instance & Socket.IO client
│   └── src/pages/            # Home, Jobs, JobDetail, Auth, Candidate, Recruiter, Admin pages
├── docker-compose.yml        # Multi-container orchestration (Mongo, Redis, Backend, Frontend)
├── tsconfig.base.json        # Base TypeScript compiler options
└── package.json              # Root npm workspaces definition
```

---

## 7. Running Locally

### Prerequisites
- Node.js >= 18
- MongoDB (running locally on port 27017 or via Docker)
- Redis (running locally on port 6379, or using the built-in resilient in-memory fallback)

### Installation
```bash
# Clone and install all workspace dependencies
npm install

# Build shared package
npm run build --workspace=shared

# Start backend & frontend concurrently in development mode
npm run dev
```

The services will be available at:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- API Health Check: `http://localhost:5000/health`
- API Readiness Check: `http://localhost:5000/ready`

---

## 8. Running with Docker Compose

```bash
# Build and launch all 4 containers in the background
docker-compose up -d --build

# Inspect logs
docker-compose logs -f backend

# Tear down
docker-compose down
```

---

## 9. Running Tests

```bash
# Run security & Section 6A validation automated test suite
npm run test:security
```
