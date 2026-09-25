# JobConnect API Documentation

All APIs follow the `/api/v1` namespace and standard response envelope:
```json
// Success Response
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}

// Error Response
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_STRING",
    "message": "Human-readable safe explanation"
  }
}
```

---

## 1. Authentication Endpoints (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required | Rate Limit |
|---|---|---|---|---|
| `POST` | `/register` | Register new user (with strict section 6A checks) | None | Strict (10/min) |
| `POST` | `/verify-otp` | Verify 6-digit OTP stored in Redis | None | Strict (5 attempts) |
| `POST` | `/resend-otp` | Resend OTP with 60s cooldown | None | Strict (3/hour) |
| `POST` | `/login` | Authenticate credentials & issue HttpOnly JWT cookies | None | Strict (5-10/15m) |
| `POST` | `/refresh` | Rotate refresh token and issue new access token | Refresh Cookie | Moderate |
| `POST` | `/logout` | Revoke session and clear cookies | Authenticated | None |
| `GET` | `/me` | Get currently authenticated user profile | Authenticated | None |
| `POST` | `/forgot-password` | Request password reset token / OTP | None | Strict |
| `POST` | `/reset-password` | Reset password using verified reset token | None | Strict |
| `POST` | `/change-password`| Change current password | Authenticated | Strict |

---

## 2. Candidate Endpoints (`/api/v1/candidate`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/profile` | Retrieve candidate profile | Candidate |
| `PATCH` | `/profile` | Update candidate profile & recalculate score | Candidate |
| `POST` | `/resume` | Upload PDF/DOCX resume (sanitized file validation) | Candidate |
| `DELETE` | `/resume` | Remove existing resume | Candidate |
| `GET` | `/dashboard` | Retrieve candidate summary & recommendations | Candidate |

---

## 3. Job Endpoints (`/api/v1/jobs`)

| Method | Endpoint | Description | Auth Required | Caching |
|---|---|---|---|---|
| `GET` | `/` | Paginated search & filter jobs | None | Redis (60s TTL) |
| `GET` | `/:id` | Get job details | None | Redis (120s TTL) |
| `POST` | `/` | Create new job posting | Recruiter | Invalidate list |
| `PATCH` | `/:id` | Update job posting (ownership verified) | Recruiter (Owner) | Invalidate detail+list |
| `DELETE` | `/:id` | Delete or archive job | Recruiter (Owner) | Invalidate cache |
| `POST` | `/:id/publish` | Set job status to published | Recruiter (Owner) | Invalidate cache |
| `POST` | `/:id/pause` | Set job status to paused | Recruiter (Owner) | Invalidate cache |
| `POST` | `/:id/close` | Set job status to closed | Recruiter (Owner) | Invalidate cache |
| `POST` | `/:id/save` | Bookmark a job | Candidate | None |
| `DELETE` | `/:id/save` | Remove bookmark | Candidate | None |

---

## 4. Application Endpoints (`/api/v1/applications`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/jobs/:jobId/apply` | Apply to job (duplicate prevented at DB) | Candidate |
| `GET` | `/me` | View all candidate applications | Candidate |
| `GET` | `/:id` | View application details (IDOR checked) | Candidate/Recruiter |
| `PATCH` | `/:id/withdraw` | Withdraw application | Candidate (Owner) |
| `GET` | `/jobs/:jobId/applicants` | View applicants for a job | Recruiter (Owner) |
| `PATCH` | `/:id/status` | Advance application stage in pipeline | Recruiter (Owner) |

---

## 5. Recruiter & Company Endpoints (`/api/v1/recruiter`, `/api/v1/companies`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/companies` | Create company profile | Recruiter |
| `GET` | `/companies/:id` | View company profile & open jobs | None |
| `PATCH` | `/companies/:id` | Edit company details (ownership checked) | Recruiter (Member) |
| `GET` | `/recruiter/dashboard` | Recruiter metrics & funnel aggregation | Recruiter |
| `POST` | `/interviews` | Schedule candidate interview | Recruiter |

---

## 6. AI Endpoints (`/api/v1/ai`)

| Method | Endpoint | Description | Auth Required | Rate Limit |
|---|---|---|---|---|
| `POST` | `/ai/job-summary` | Summarize job description | Candidate/Recruiter | 10 req/hour |
| `POST` | `/ai/match-score` | Compute profile-to-job semantic match | Candidate | 10 req/hour |
| `POST` | `/ai/generate-jd` | Draft job description from short prompt | Recruiter | 15 req/hour |
| `POST` | `/ai/candidate-summary` | Summarize applicant against JD | Recruiter | 20 req/hour |
| `POST` | `/ai/chat` | Interactive Career & Recruitment Assistant | Authenticated | 20 req/hour |

---

## 7. Admin Endpoints (`/api/v1/admin`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/admin/dashboard` | High-level system statistics | Admin |
| `GET` | `/admin/users` | List users with pagination and search | Admin |
| `PATCH` | `/admin/users/:id/status`| Suspend or reactivate user | Admin |
| `GET` | `/admin/jobs` | Moderate job postings | Admin |
| `PATCH` | `/admin/jobs/:id/moderate` | Admin override/takedown of job | Admin |
| `GET` | `/admin/audit-logs` | Query immutable audit logs | Admin |
