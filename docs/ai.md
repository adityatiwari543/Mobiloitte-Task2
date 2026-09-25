# JobConnect AI Service Architecture & Guardrails

## 1. Design Principles
AI in JobConnect acts as a high-value assistant rather than an autonomous decision-maker:
- **No Autonomous Hiring Decisions**: AI scores, summaries, and match suggestions are strictly assistive indicators and never automatically reject or select candidates.
- **Provider Agnostic**: The architecture abstracts LLM interactions behind the `IAIProvider` interface, allowing hot-swapping between Gemini, OpenAI, Claude, and local deterministic fallback adapters without touching application services.
- **Strict Server-Side Only**: AI API keys are never leaked to client bundles or browser responses.

---

## 2. Architecture & Adapters

```text
       +------------------------------------+
       |          JobConnect Core           |
       |  (Controllers / Business Services) |
       +------------------------------------+
                         |
                         v
       +------------------------------------+
       |             AIService              |
       |  (Prompts, Sanitization, Caching)  |
       +------------------------------------+
                         |
            +------------+------------+
            |                         |
            v                         v
+-----------------------+ +-----------------------+
|    Gemini / OpenAI    | |  Local Deterministic  |
|    Adapter (Cloud)    | |  Adapter (Offline)    |
+-----------------------+ +-----------------------+
```

---

## 3. Core AI Features

### 3.1 Job Description Summarizer
Extracts key responsibilities, required qualifications, experience expectations, and identifies missing information from long recruiter job posts.

### 3.2 Candidate-Job Match Explainer
Analyzes a candidate's verified skills, experience level, and preferred role against a job posting to provide an objective skills gap analysis and constructive preparation tips.

### 3.3 Recruiter Job Description Generator
Transforms rough recruiter bullet points into a structured, enticing job listing with standard sections (About Role, Responsibilities, Requirements, Preferred Qualifications, Interview Process).

### 3.4 AI Career & Recruitment Assistant
Interactive Q&A assistant contextualized with actual platform listings and candidate skills, preventing hallucinations.

---

## 4. Security & Cost Guardrails
- **Prompt Injection Defense**: Untrusted user inputs (resumes, notes, descriptions) are sanitized and isolated inside structured delimiters.
- **Token Limits**: Input length is bounded (max 4,000 characters) and output token limit is capped (max 800 tokens).
- **Per-User Rate Limiting**: AI endpoints are capped to 15-20 calls per hour per user.
- **Response Caching**: Deterministic outputs (such as JD summaries) are cached in Redis to minimize API spend.
