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
  async askCareerAssistant(userQuery: string, candidateUserId?: string) {
    let candidateSkills: string[] = [];
    if (candidateUserId) {
      const profile = await CandidateProfile.findOne({
        userId: new mongoose.Types.ObjectId(candidateUserId),
      });
      if (profile) candidateSkills = profile.skills;
    }

    // Retrieve up to 3 recent platform jobs for grounded context (anti-hallucination)
    const recentJobs = await Job.find({ status: 'published' })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('title skills location remoteType');

    const recentJobsSnippet = recentJobs
      .map((j) => `- ${j.title} (${j.remoteType}): Skills: [${j.skills.join(', ')}]`)
      .join('\n');

    const prompt = createCareerAssistantPrompt({
      userQuery,
      userSkills: candidateSkills,
      recentJobsSnippet,
    });

    const response = await this.provider.generateText(prompt, { temperature: 0.6 });
    return { response, provider: this.provider.providerName };
  }
}

export const aiService = new AIService();
