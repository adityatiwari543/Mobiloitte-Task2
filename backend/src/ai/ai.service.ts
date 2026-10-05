import crypto from 'crypto';
import mongoose from 'mongoose';
import { IAIProvider } from './interfaces/aiProvider.interface.js';
import { DeterministicAIProvider } from './providers/deterministicProvider.js';
import { GeminiAIProvider } from './providers/geminiProvider.js';
import { createJobSummaryPrompt } from './prompts/jobSummary.prompt.js';
import { createCandidateMatchPrompt } from './prompts/candidateMatch.prompt.js';
import { createJobDescriptionPrompt } from './prompts/jobDescription.prompt.js';
import { createCareerAssistantPrompt } from './prompts/careerAssistant.prompt.js';
import { Job } from '../models/Job.js';
import { CandidateProfile } from '../models/CandidateProfile.js';
import { User } from '../models/User.js';
import { redisService } from '../services/redis.service.js';
import { env } from '../config/env.js';

class AIService {
  private provider: IAIProvider;

  constructor() {
    if (env.AI_PROVIDER === 'gemini' && env.AI_API_KEY) {
      this.provider = new GeminiAIProvider();
    } else {
      this.provider = new DeterministicAIProvider();
    }
  }

  // 1. Job Description Summarizer (Section 15.2) with Redis response caching
  async summarizeJob(jobId: string) {
    const cacheKey = `ai:cache:summary:${jobId}`;
    const cached = await redisService.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // Fallback
      }
    }

    const job = await Job.findById(jobId);
    if (!job) throw { statusCode: 404, message: 'Job not found.' };

    const prompt = createJobSummaryPrompt(job.title, job.description, job.skills);
    const rawResponse = await this.provider.generateText(prompt, { temperature: 0.2 });

    let parsedResult;
    try {
      // Clean possible markdown code fences
      const cleanJson = rawResponse.replace(/```json\n?|\n?```/g, '').trim();
      parsedResult = JSON.parse(cleanJson);
    } catch {
      parsedResult = { rawSummary: rawResponse };
    }

    // Cache summary in Redis for 24 hours (Section 13.1, 54)
    await redisService.set(cacheKey, JSON.stringify(parsedResult), 24 * 60 * 60);

    return parsedResult;
  }

  // 2. Candidate-Job Semantic Matching Explanation (Section 15.3)
  async explainMatch(jobId: string, candidateUserId: string) {
    const [job, profile] = await Promise.all([
      Job.findById(jobId),
      CandidateProfile.findOne({ userId: new mongoose.Types.ObjectId(candidateUserId) }),
    ]);

    if (!job) throw { statusCode: 404, message: 'Job not found.' };

    const prompt = createCandidateMatchPrompt({
      jobTitle: job.title,
      jobSkills: job.skills,
      jobDescription: job.description,
      candidateSkills: profile?.skills || [],
      candidateHeadline: profile?.headline,
      candidateBio: profile?.bio,
    });

    const rawResponse = await this.provider.generateText(prompt, { temperature: 0.3 });

    try {
      const cleanJson = rawResponse.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch {
      return { rawMatch: rawResponse };
    }
  }

  // 3. Recruiter Job Description Draft Generator (Section 15.4)
  async generateJobDescription(params: {
    title: string;
    notes: string;
    skills: string[];
    experienceYears?: number;
  }) {
    const prompt = createJobDescriptionPrompt(params);
    const rawResponse = await this.provider.generateText(prompt, { temperature: 0.5 });

    try {
      const cleanJson = rawResponse.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch {
      return { rawDraft: rawResponse };
    }
  }

  // 4. Interactive AI Career Assistant (Section 15.6)
  async askCareerAssistant(
    userQuery: string,
    candidateUserId?: string,
    history?: Array<{ sender: string; text: string }>
  ) {
    // PII Redaction Guardrail (DPDP Act & OWASP ASVS V8)
    const sanitizedQuery = (userQuery || '')
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]')
      .replace(/\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[REDACTED_PHONE]');

    let candidateSkills: string[] = [];
    let candidateName = '';
    let candidateHeadline = '';
    let hasResume = false;
    let profileCompleteness = 50;

    if (candidateUserId) {
      const [user, profile] = await Promise.all([
        User.findById(candidateUserId).select('name firstName lastName'),
        CandidateProfile.findOne({ userId: new mongoose.Types.ObjectId(candidateUserId) }),
      ]);
      if (user) {
        candidateName = user.firstName || user.name || '';
      }
      if (profile) {
        candidateSkills = profile.skills || [];
        candidateHeadline = profile.headline || '';
        hasResume = Boolean(profile.resumeUrl);
        profileCompleteness = profile.calculateCompleteness();
      }
    }

    // Direct Context-Injected Retrieval Pipeline via MongoDB Semantic Filter & In-Memory Match Scoring
    const activeJobs = await Job.find({ status: 'published' })
      .sort({ createdAt: -1 })
      .limit(12)
      .populate('companyId', 'name logoUrl location isVerified')
      .select('title slug skills location remoteType employmentType salaryMin salaryMax currency companyId');

    // In-memory semantic match scoring based on candidate skills and query tokens
    const queryTokens = (sanitizedQuery || '').toLowerCase().split(/\W+/).filter(Boolean);
    const candidateSkillsLower = candidateSkills.map((s) => s.toLowerCase());

    const scoredJobs = activeJobs.map((j) => {
      let score = 0;
      const jobSkillsLower = (j.skills || []).map((s) => s.toLowerCase());
      const jobTitleLower = (j.title || '').toLowerCase();

      // Candidate skills overlap bonus (Weight: 3)
      for (const skill of jobSkillsLower) {
        if (candidateSkillsLower.includes(skill)) score += 3;
        if (queryTokens.includes(skill)) score += 2;
      }
      // Job title token relevance (Weight: 2)
      for (const token of queryTokens) {
        if (token.length > 2 && jobTitleLower.includes(token)) score += 2;
      }
      return { job: j, score };
    });

    scoredJobs.sort((a, b) => b.score - a.score);
    const topContextJobs = scoredJobs.slice(0, 4).map((item) => item.job);

    const recentJobsSnippet = topContextJobs
      .map((j) => `- ${j.title} (${j.remoteType}, ${j.employmentType}): Skills: [${(j.skills || []).join(', ')}] in ${j.location}`)
      .join('\n');

    // If candidate asks for jobs or matching roles, provide the top semantically scored active jobs
    const isJobSearchIntent = /\b(job|jobs|hiring|role|roles|opening|openings|opportunity|opportunities|work|vacancy|vacancies|recommend|match)\b/i.test(userQuery);
    let matchedJobs: any[] = [];
    if (isJobSearchIntent) {
      matchedJobs = topContextJobs.slice(0, 3);
    }

    const prompt = createCareerAssistantPrompt({
      userQuery: sanitizedQuery,
      candidateName,
      userSkills: candidateSkills,
      candidateHeadline,
      hasResume,
      profileCompleteness,
      recentJobsSnippet,
      history,
    });

    const rawResponse = await this.provider.generateText(prompt, { temperature: 0.5, maxTokens: 3000 });

    let response = rawResponse;
    const suggestions: string[] = [];

    const match = rawResponse.match(/<<<SUGGESTIONS>>>([\s\S]*?)<<<END_SUGGESTIONS>>>/);
    if (match) {
      response = rawResponse.replace(/<<<SUGGESTIONS>>>[\s\S]*?<<<END_SUGGESTIONS>>>/, '').trim();
      const lines = match[1].split('\n');
      for (const line of lines) {
        const cleaned = line.replace(/^[\s*\-•\d.)]+/, '').trim();
        if (cleaned && cleaned.length > 5) {
          suggestions.push(cleaned);
        }
      }
    }

    return {
      response,
      suggestions: suggestions.slice(0, 4),
      matchedJobs,
      provider: this.provider.providerName,
    };
  }
}

export const aiService = new AIService();
