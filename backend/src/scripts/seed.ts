import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { Job } from '../models/Job.js';
import { CandidateProfile } from '../models/CandidateProfile.js';
import { ROLES, ACCOUNT_STATUS, REMOTE_TYPES, EMPLOYMENT_TYPES, JOB_STATUS } from '@jobconnect/shared';

export async function seedDatabase() {
  console.log('🌱 Starting JobConnect database seeding...');
  await connectDB();

  try {
    // 1. Check if jobs already exist
    const existingJobsCount = await Job.countDocuments();
    if (existingJobsCount > 0) {
      console.log(`ℹ️ Database already has ${existingJobsCount} job(s). Skipping seed.`);
      return;
    }

    const hashedPassword = await bcrypt.hash('Admin123!', 12);
    const recruiterPassword = await bcrypt.hash('Recruiter123!', 12);
    const candidatePassword = await bcrypt.hash('Candidate123!', 12);

    // 2. Create or find Admin User
    let admin = await User.findOne({ email: 'admin@jobconnect.dev' });
    if (!admin) {
      admin = await User.create({
        name: 'Super Admin',
        firstName: 'Super',
        lastName: 'Admin',
        email: 'admin@jobconnect.dev',
        phoneE164: '+919999999991',
        countryCode: '+91',
        nationalNumber: '9999999991',
        passwordHash: hashedPassword,
        role: ROLES.ADMIN,
        isEmailVerified: true,
        isPhoneVerified: true,
        isActive: true,
        status: ACCOUNT_STATUS.ACTIVE,
        termsAcceptedAt: new Date(),
        privacyAcceptedAt: new Date(),
      });
      console.log('✅ Created Admin: admin@jobconnect.dev / Admin123!');
    }

    // 3. Create or find Recruiter User
    let recruiter = await User.findOne({ email: 'recruiter@jobconnect.dev' });
    if (!recruiter) {
      recruiter = await User.create({
        name: 'Sarah Connor',
        firstName: 'Sarah',
        lastName: 'Connor',
        email: 'recruiter@jobconnect.dev',
        phoneE164: '+919999999992',
        countryCode: '+91',
        nationalNumber: '9999999992',
        passwordHash: recruiterPassword,
        role: ROLES.RECRUITER,
        isEmailVerified: true,
        isPhoneVerified: true,
        isActive: true,
        status: ACCOUNT_STATUS.ACTIVE,
        termsAcceptedAt: new Date(),
        privacyAcceptedAt: new Date(),
      });
      console.log('✅ Created Recruiter: recruiter@jobconnect.dev / Recruiter123!');
    }

    // 4. Create or find Candidate User
    let candidate = await User.findOne({ email: 'candidate@jobconnect.dev' });
    if (!candidate) {
      candidate = await User.create({
        name: 'Aditya Sharma',
        firstName: 'Aditya',
        lastName: 'Sharma',
        email: 'candidate@jobconnect.dev',
        phoneE164: '+919999999993',
        countryCode: '+91',
        nationalNumber: '9999999993',
        passwordHash: candidatePassword,
        role: ROLES.CANDIDATE,
        isEmailVerified: true,
        isPhoneVerified: true,
        isActive: true,
        status: ACCOUNT_STATUS.ACTIVE,
        highestQualification: "Bachelor's",
        termsAcceptedAt: new Date(),
        privacyAcceptedAt: new Date(),
      });

      await CandidateProfile.create({
        userId: candidate._id,
        title: 'Full Stack Engineer',
        bio: 'Passionate MERN & TypeScript developer building scalable distributed systems.',
        skills: [
          { name: 'react', level: 'advanced' },
          { name: 'typescript', level: 'advanced' },
          { name: 'node.js', level: 'advanced' },
          { name: 'mongodb', level: 'intermediate' },
          { name: 'redis', level: 'intermediate' },
        ],
        experienceYears: 3,
        currentLocation: 'Bangalore, India',
        preferredLocations: ['Bangalore', 'Remote'],
        expectedSalaryMin: 1200000,
        expectedSalaryMax: 2000000,
        currency: 'INR',
        profileCompletionPercentage: 90,
      });
      console.log('✅ Created Candidate: candidate@jobconnect.dev / Candidate123!');
    }

    // 5. Create Companies
    let company1 = await Company.findOne({ slug: 'stripe-india' });
    if (!company1) {
      company1 = await Company.create({
        name: 'Stripe',
        slug: 'stripe-india',
        description: 'Financial infrastructure for the internet. Millions of companies use Stripe to accept payments.',
        website: 'https://stripe.com',
        industry: 'Fintech',
        companySize: '1000-5000',
        location: 'Bangalore, India',
        recruiterIds: [recruiter._id],
        isVerified: true,
        isActive: true,
      });
    }

    let company2 = await Company.findOne({ slug: 'razorpay' });
    if (!company2) {
      company2 = await Company.create({
        name: 'Razorpay',
        slug: 'razorpay',
        description: 'Payments, Banking and Credit solutions for businesses in India.',
        website: 'https://razorpay.com',
        industry: 'Fintech & Banking',
        companySize: '1000+',
        location: 'Bangalore / Remote',
        recruiterIds: [recruiter._id],
        isVerified: true,
        isActive: true,
      });
    }

    let company3 = await Company.findOne({ slug: 'google-cloud' });
    if (!company3) {
      company3 = await Company.create({
        name: 'Google Cloud Platform',
        slug: 'google-cloud',
        description: 'Global cloud computing, big data solutions, and enterprise scale infrastructure.',
        website: 'https://cloud.google.com',
        industry: 'Cloud & Internet',
        companySize: '10000+',
        location: 'Hyderabad, India',
        recruiterIds: [recruiter._id],
        isVerified: true,
        isActive: true,
      });
    }

    // 6. Create Featured Job Openings
    const jobsData = [
      {
        title: 'Senior Full Stack Engineer (React + Node.js)',
        slug: 'senior-full-stack-engineer-react-node',
        description: 'We are seeking an experienced Full Stack Engineer proficient in React, TypeScript, Node.js, and MongoDB to lead key customer-facing payment workflows. You will design resilient APIs and responsive user interfaces.',
        companyId: company1._id,
        recruiterId: recruiter._id,
        skills: ['react', 'typescript', 'node.js', 'mongodb', 'redis'],
        location: 'Bangalore, India',
        remoteType: REMOTE_TYPES.HYBRID,
        employmentType: EMPLOYMENT_TYPES.FULL_TIME,
        experienceMin: 3,
        experienceMax: 7,
        salaryMin: 1800000,
        salaryMax: 3000000,
        currency: 'INR',
        status: JOB_STATUS.PUBLISHED,
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Frontend Lead Architect (TypeScript & Next.js)',
        slug: 'frontend-lead-architect-typescript-nextjs',
        description: 'Lead our next-generation merchant dashboard and checkout widgets. Drive performance optimizations, web vitals, design system implementations, and component libraries.',
        companyId: company2._id,
        recruiterId: recruiter._id,
        skills: ['react', 'typescript', 'tailwind css', 'next.js', 'vite'],
        location: 'Remote, India',
        remoteType: REMOTE_TYPES.REMOTE,
        employmentType: EMPLOYMENT_TYPES.FULL_TIME,
        experienceMin: 5,
        experienceMax: 10,
        salaryMin: 2500000,
        salaryMax: 4200000,
        currency: 'INR',
        status: JOB_STATUS.PUBLISHED,
        applicationDeadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Distributed Systems & Backend Engineer',
        slug: 'distributed-systems-backend-engineer',
        description: 'Design and operate ultra-low latency, mission-critical ledger and checkout services handling billions of dollars in daily volume. Requires strong concurrency and caching experience.',
        companyId: company1._id,
        recruiterId: recruiter._id,
        skills: ['node.js', 'redis', 'kafka', 'distributed systems', 'mongodb'],
        location: 'Bangalore, India',
        remoteType: REMOTE_TYPES.ONSITE,
        employmentType: EMPLOYMENT_TYPES.FULL_TIME,
        experienceMin: 4,
        experienceMax: 8,
        salaryMin: 2200000,
        salaryMax: 3600000,
        currency: 'INR',
        status: JOB_STATUS.PUBLISHED,
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'AI / Machine Learning Engineer (LLM & GenAI)',
        slug: 'ai-ml-engineer-llm-genai',
        description: 'Build enterprise AI assistants, candidate-matching recommendation algorithms, and automated resume parsing pipelines using modern LLMs, embeddings, and vector databases.',
        companyId: company3._id,
        recruiterId: recruiter._id,
        skills: ['python', 'llm', 'gemini', 'embeddings', 'docker'],
        location: 'Hyderabad, India',
        remoteType: REMOTE_TYPES.HYBRID,
        employmentType: EMPLOYMENT_TYPES.FULL_TIME,
        experienceMin: 2,
        experienceMax: 6,
        salaryMin: 2000000,
        salaryMax: 3500000,
        currency: 'INR',
        status: JOB_STATUS.PUBLISHED,
        applicationDeadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'DevOps & Site Reliability Engineer (Kubernetes/AWS)',
        slug: 'devops-sre-kubernetes-aws',
        description: 'Manage production Kubernetes clusters, multi-region deployments, automated CI/CD pipelines, Grafana observability dashboards, and zero-trust VPC security.',
        companyId: company3._id,
        recruiterId: recruiter._id,
        skills: ['kubernetes', 'docker', 'aws', 'terraform', 'ci/cd'],
        location: 'Hyderabad, India',
        remoteType: REMOTE_TYPES.REMOTE,
        employmentType: EMPLOYMENT_TYPES.FULL_TIME,
        experienceMin: 3,
        experienceMax: 8,
        salaryMin: 1800000,
        salaryMax: 3200000,
        currency: 'INR',
        status: JOB_STATUS.PUBLISHED,
        applicationDeadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Product Design & UI/UX Specialist',
        slug: 'product-design-ui-ux-specialist',
        description: 'Create intuitive, accessible, and delightful design systems for job discovery, interactive applications, and recruiter candidate management dashboards.',
        companyId: company2._id,
        recruiterId: recruiter._id,
        skills: ['figma', 'design systems', 'ui/ux', 'prototyping', 'wireframing'],
        location: 'Bangalore, India',
        remoteType: REMOTE_TYPES.HYBRID,
        employmentType: EMPLOYMENT_TYPES.FULL_TIME,
        experienceMin: 2,
        experienceMax: 5,
        salaryMin: 1400000,
        salaryMax: 2400000,
        currency: 'INR',
        status: JOB_STATUS.PUBLISHED,
        applicationDeadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
      },
    ];

    for (const job of jobsData) {
      await Job.create(job);
    }

    console.log(`🎉 Successfully seeded ${jobsData.length} published jobs!`);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}

// Standalone execution check
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase().then(async () => {
    await disconnectDB();
    process.exit(0);
  });
}
