# JobConnect Database Design & Indexing Strategy

## 1. Overview
The database layer is powered by MongoDB and modeled with Mongoose schemas. Strict compound indexes are utilized to support high-throughput filtering, prevent race conditions (such as duplicate applications), and guarantee $O(\log N)$ lookups on high-cardinality collections.

---

## 2. Collections and Schema Definitions

### 2.1 User
Stores authentication credentials, basic persona identity, account lifecycle state, and timestamps.
- `_id`: ObjectId
- `name`: String (Trimmed, capitalized)
- `firstName`: String (Section 6A: English-only `^[A-Z][a-zA-Z]+$`)
- `lastName`: String (Section 6A: single space allowed between words)
- `email`: String (Unique normalized lowercase)
- `phoneE164`: String (Unique canonical E.164 phone representation)
- `passwordHash`: String (Argon2id / bcrypt)
- `role`: Enum [`candidate`, `recruiter`, `admin`]
- `avatar`: String (URL)
- `dateOfBirth`: Date (Age 13 to 120 verification)
- `gender`: Enum [`Male`, `Female`, `Other`]
- `highestQualification`: Enum
- `isEmailVerified`: Boolean (Default false)
- `isPhoneVerified`: Boolean (Default false)
- `isActive`: Boolean (Default true)
- `status`: Enum [`active`, `pending_verification`, `suspended`, `deactivated`]
- `lastLoginAt`: Date
- `createdAt`, `updatedAt`: Timestamps

**Indexes:**
- `User.createIndex({ email: 1 }, { unique: true })`
- `User.createIndex({ phoneE164: 1 }, { unique: true })`
- `User.createIndex({ role: 1, status: 1 })`

---

### 2.2 CandidateProfile
- `userId`: ObjectId (Ref User, Unique)
- `headline`: String (e.g. "Senior Frontend Engineer")
- `bio`: String
- `location`: String
- `skills`: [String]
- `education`: [{ degree, institution, fieldOfStudy, startYear, endYear, grade }]
- `experience`: [{ title, company, location, startDate, endDate, isCurrent, description }]
- `resumeUrl`: String
- `resumeOriginalName`: String
- `portfolioUrl`: String
- `githubUrl`: String
- `linkedinUrl`: String
- `preferredJobTypes`: [String]
- `preferredLocations`: [String]
- `expectedSalary`: { min: Number, max: Number, currency: String }
- `noticePeriod`: String

**Indexes:**
- `CandidateProfile.createIndex({ userId: 1 }, { unique: true })`
- `CandidateProfile.createIndex({ skills: 1 })`

---

### 2.3 Company
- `name`: String (Required, trimmed)
- `slug`: String (Unique, url-safe)
- `logoUrl`: String
- `description`: String
- `website`: String
- `industry`: String
- `companySize`: String
- `location`: String
- `foundedYear`: Number
- `recruiterIds`: [ObjectId] (Ref User)
- `isVerified`: Boolean (Admin vetted)
- `isActive`: Boolean (Default true)

**Indexes:**
- `Company.createIndex({ slug: 1 }, { unique: true })`
- `Company.createIndex({ recruiterIds: 1 })`

---

### 2.4 Job
- `title`: String
- `slug`: String
- `description`: String
- `companyId`: ObjectId (Ref Company)
- `recruiterId`: ObjectId (Ref User)
- `skills`: [String]
- `location`: String
- `remoteType`: Enum [`onsite`, `remote`, `hybrid`]
- `employmentType`: Enum [`full-time`, `part-time`, `contract`, `internship`]
- `experienceMin`: Number
- `experienceMax`: Number
- `salaryMin`: Number
- `salaryMax`: Number
- `currency`: String (Default "INR" / "USD")
- `status`: Enum [`draft`, `published`, `paused`, `closed`, `expired`]
- `applicationDeadline`: Date
- `viewsCount`: Number (Default 0)
- `applicantsCount`: Number (Default 0)

**Compound & Query Indexes:**
- `Job.createIndex({ status: 1, createdAt: -1 })` (For public job listing)
- `Job.createIndex({ companyId: 1, status: 1 })`
- `Job.createIndex({ recruiterId: 1, status: 1 })`
- `Job.createIndex({ skills: 1 })` (For candidate matching)
- `Job.createIndex({ location: 1, remoteType: 1 })`
- `Job.createIndex({ title: "text", description: "text" })` (Full-text search)

---

### 2.5 Application
- `candidateId`: ObjectId (Ref User)
- `jobId`: ObjectId (Ref Job)
- `resumeUrl`: String
- `coverLetter`: String
- `status`: Enum [`applied`, `under_review`, `shortlisted`, `interview`, `selected`, `rejected`, `withdrawn`]
- `recruiterNotes`: [{ authorId, note, createdAt }]
- `appliedAt`: Date (Default Date.now)

**Compound Indexes:**
- `Application.createIndex({ candidateId: 1, jobId: 1 }, { unique: true })` (Prevents duplicate applications at DB layer)
- `Application.createIndex({ jobId: 1, status: 1, appliedAt: -1 })` (For recruiter applicant pipeline)
- `Application.createIndex({ candidateId: 1, appliedAt: -1 })` (For candidate applications page)

---

### 2.6 SavedJob
- `userId`: ObjectId (Ref User)
- `jobId`: ObjectId (Ref Job)
- `createdAt`: Date

**Compound Index:**
- `SavedJob.createIndex({ userId: 1, jobId: 1 }, { unique: true })`

---

### 2.7 Notification
- `userId`: ObjectId (Ref User)
- `type`: Enum [`application_update`, `interview_scheduled`, `job_alert`, `system`]
- `title`: String
- `message`: String
- `data`: Object (metadata such as jobId, applicationId)
- `isRead`: Boolean (Default false)
- `createdAt`: Date

**Index:**
- `Notification.createIndex({ userId: 1, isRead: 1, createdAt: -1 })`

---

### 2.8 Interview
- `applicationId`: ObjectId (Ref Application)
- `candidateId`: ObjectId (Ref User)
- `recruiterId`: ObjectId (Ref User)
- `scheduledAt`: Date
- `duration`: Number (minutes)
- `meetingUrl`: String
- `status`: Enum [`scheduled`, `completed`, `cancelled`, `rescheduled`]
- `notes`: String

**Index:**
- `Interview.createIndex({ candidateId: 1, scheduledAt: 1 })`
- `Interview.createIndex({ recruiterId: 1, scheduledAt: 1 })`

---

### 2.9 Session
- `sessionId`: String (UUID v4, Unique)
- `userId`: ObjectId (Ref User)
- `userAgentMetadata`: { browser, os, device, rawUserAgent }
- `ipMetadata`: { ip }
- `expiresAt`: Date
- `revokedAt`: Date

**Index:**
- `Session.createIndex({ sessionId: 1 }, { unique: true })`
- `Session.createIndex({ userId: 1, revokedAt: 1 })`
- `Session.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })` (TTL index for automatic purge)

---

### 2.10 AuditLog
- `actorUserId`: ObjectId (Ref User)
- `action`: String (e.g. `USER_SUSPENDED`, `JOB_MODERATED`, `PASSWORD_CHANGED`)
- `resourceType`: String (e.g. `User`, `Job`, `Application`)
- `resourceId`: String
- `metadata`: Object (Safe non-secret payload)
- `createdAt`: Date

**Index:**
- `AuditLog.createIndex({ actorUserId: 1, createdAt: -1 })`
- `AuditLog.createIndex({ action: 1, createdAt: -1 })`
