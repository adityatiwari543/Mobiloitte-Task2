# JobConnect Redis Architecture & Caching Strategy

## 1. Role of Redis
Redis provides the low-latency caching, ephemeral storage, rate limiting, and real-time pub/sub backbone of the JobConnect platform.

```text
+--------------------------------------------------------------+
|                         Redis Engine                         |
+--------------------------------------------------------------+
   |                  |                   |                |
   v                  v                   v                v
[Job & Search]     [OTP & Verification] [Rate Limits]    [Pub/Sub]
- jobs:list:<hash> - otp:<type>:<user>  - rl:ip:<ip>     - app.events
- jobs:item:<id>   - TTL: 300s          - rl:usr:<id>    - Socket.IO
- TTL: 60s-120s    - Hash storage       - Sliding window
```

---

## 2. Key Namespaces & TTL Policy

| Purpose | Key Pattern | TTL | Invalidation Trigger |
|---|---|---|---|
| Job Listing | `jobs:list:<sha256(filterParams)>` | 60 sec | Job created, updated, status changed, deleted |
| Job Detail | `jobs:item:<jobId>` | 120 sec | Job updated, closed |
| Candidate Profile | `profile:candidate:<userId>` | 300 sec | Candidate profile updated |
| Verification OTP | `otp:<purpose>:<userId>` | 300 sec (5m) | OTP consumed or expired |
| OTP Resend Cooldown| `otp:cooldown:<purpose>:<userId>` | 60 sec | Auto expires |
| OTP Attempt Tracker| `otp:attempts:<purpose>:<userId>` | 300 sec | Reaches 5 attempts -> locked |
| Revoked Tokens | `revoked:token:<jti>` | Token expiry | Token rotation or logout |
| Active Session | `session:active:<sessionId>` | 7 days | Session explicitly revoked |
| AI Response Cache | `ai:cache:<sha256(prompt)>` | 24 hours | Non-dynamic queries (e.g. JD summary) |

---

## 3. Invalidation Rules
When a job state transition occurs:
1. `Job.create()` -> Invalidate all `jobs:list:*` keys.
2. `Job.findByIdAndUpdate()` -> Invalidate `jobs:item:<jobId>` and all `jobs:list:*` keys.
3. `Job.delete()` -> Invalidate `jobs:item:<jobId>` and all `jobs:list:*` keys.

---

## 4. Pub/Sub for Horizontal Scalability
When application events happen (e.g. application stage changes from `applied` to `interview`), the backend publishes an event to Redis channel `jobconnect:events`:
```json
{
  "event": "application:status_updated",
  "recipientUserId": "64f1...",
  "payload": {
    "applicationId": "650a...",
    "jobTitle": "Senior Full-Stack Engineer",
    "newStatus": "interview"
  }
}
```
All subscribed Socket.IO gateway instances receive the message and route it directly to the recipient's authenticated socket room (`user:64f1...`).
