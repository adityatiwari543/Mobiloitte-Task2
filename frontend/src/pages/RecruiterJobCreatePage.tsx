import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { Button } from '../components/common/Button.js';
import { Input } from '../components/common/Input.js';
import { Modal } from '../components/common/Modal.js';
import { BackButton } from '../components/common/BackButton.js';
import {
  Sparkles,
  ArrowLeft,
  X,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { REMOTE_TYPES, EMPLOYMENT_TYPES } from '@jobconnect/shared';

export const RecruiterJobCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiTitle, setAiTitle] = useState('');
  const [aiNotes, setAiNotes] = useState('');
  const [aiSkills, setAiSkills] = useState('');
  const [aiExperience, setAiExperience] = useState(2);

  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      location: '',
      remoteType: REMOTE_TYPES.ONSITE,
      employmentType: EMPLOYMENT_TYPES.FULL_TIME,
      experienceMin: '',
      experienceMax: '',
      salaryMin: '',
      salaryMax: '',
      currency: 'INR',
      applicationDeadline: '',
    },
  });

  // AI JD Generator Mutation (Section 15.4)
  const aiGenerateMutation = useMutation({
    mutationFn: async () => {
      const skillsArray = aiSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await api.post('/ai/generate-jd', {
        title: aiTitle,
        notes: aiNotes,
        skills: skillsArray.length > 0 ? skillsArray : ['React', 'TypeScript'],
        experienceYears: aiExperience,
      });
      return res.data?.data;
    },
    onSuccess: (data) => {
      if (data) {
        if (data.title) setValue('title', data.title);
        if (data.overview && data.responsibilities && data.requirements) {
          const formatted = `${data.overview}\n\nKey Responsibilities:\n${data.responsibilities
            .map((r: string) => `• ${r}`)
            .join('\n')}\n\nRequirements:\n${data.requirements
            .map((req: string) => `• ${req}`)
            .join('\n')}`;
          setValue('description', formatted);
        }
        if (data.preferredSkills) {
          const newSkills = Array.from(new Set([...skillsList, ...data.preferredSkills.map((s: string) => s.toLowerCase())]));
          setSkillsList(newSkills);
        }
      }
      setAiModalOpen(false);
    },
  });

  const onSubmit = async (formData: any) => {
    setServerError(null);

    if (!profile?._id) {
      setServerError('Company profile is not initialized for this recruiter account.');
      return;
    }

    if (skillsList.length === 0) {
      setServerError('Please specify at least 1 technical skill.');
      return;
    }

    try {
      const res = await api.post('/jobs', {
        ...formData,
        companyId: profile._id,
        skills: skillsList,
        experienceMin: Number(formData.experienceMin),
        experienceMax: Number(formData.experienceMax),
        salaryMin: formData.salaryMin ? Number(formData.salaryMin) : undefined,
        salaryMax: formData.salaryMax ? Number(formData.salaryMax) : undefined,
      });

      if (res.data?.success) {
        navigate(`/jobs/${res.data.data._id}`);
      }
    } catch (err: any) {
      setServerError(err.response?.data?.error?.message || 'Failed to create job posting.');
    }
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newSkill.trim().toLowerCase();
    if (clean && !skillsList.includes(clean)) {
      setSkillsList([...skillsList, clean]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkillsList(skillsList.filter((s) => s !== skill));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <BackButton label="Back to Dashboard" fallbackUrl="/recruiter/dashboard" />

        <Button
          variant="outline"
          size="sm"
          onClick={() => setAiModalOpen(true)}
          className="border-purple-200 text-purple-700 hover:bg-purple-50"
        >
          <Sparkles className="w-4 h-4 mr-1 text-purple-600" /> Draft JD with AI
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm transition-colors">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Create Job Posting</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Publish an engineering role with detailed compensation and technical requirements
        </p>

        {serverError && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-medium flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="Job Title"
            placeholder="e.g. Senior Full-Stack Engineer"
            required
            {...register('title', { required: 'Job title is required' })}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Job Description (Min 50 characters) <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={8}
              placeholder="Outline the responsibilities, tech stack, day-to-day work, and qualifications..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed font-mono"
              {...register('description', { required: 'Description is required' })}
            />
          </div>

          {/* Skills Tag Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Required Technical Skills <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2 min-h-[32px] items-center">
              {skillsList.length === 0 ? (
                <span className="text-xs text-slate-400 dark:text-slate-500 italic">No skills added yet. Type below and click "Add".</span>
              ) : (
                skillsList.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-800"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-1.5 text-blue-400 hover:text-blue-600 dark:hover:text-blue-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))
              )}
            </div>

            <div className="flex gap-2 max-w-sm">
              <input
                type="text"
                placeholder="Add skill (e.g. Python, Docker, React)"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill(e);
                  }
                }}
                className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button type="button" variant="secondary" size="sm" onClick={handleAddSkill}>
                Add
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Location"
              placeholder="e.g. Bengaluru, India or Remote"
              required
              {...register('location', { required: 'Location is required' })}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Work Mode <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('remoteType')}
              >
                <option value={REMOTE_TYPES.ONSITE}>On-site</option>
                <option value={REMOTE_TYPES.REMOTE}>Remote</option>
                <option value={REMOTE_TYPES.HYBRID}>Hybrid</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Employment Type <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('employmentType')}
              >
                <option value={EMPLOYMENT_TYPES.FULL_TIME}>Full-Time</option>
                <option value={EMPLOYMENT_TYPES.PART_TIME}>Part-Time</option>
                <option value={EMPLOYMENT_TYPES.CONTRACT}>Contract</option>
                <option value={EMPLOYMENT_TYPES.INTERNSHIP}>Internship</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Input
              label="Min Experience (Yrs)"
              type="number"
              min={0}
              placeholder="e.g. 0"
              required
              {...register('experienceMin', { required: 'Min experience is required' })}
            />
            <Input
              label="Max Experience (Yrs)"
              type="number"
              min={0}
              placeholder="e.g. 3"
              required
              {...register('experienceMax', { required: 'Max experience is required' })}
            />
            <Input
              label="Min Annual Salary (INR)"
              type="number"
              step={50000}
              placeholder="e.g. 600000 (optional)"
              {...register('salaryMin')}
            />
            <Input
              label="Max Annual Salary (INR)"
              type="number"
              step={50000}
              placeholder="e.g. 1500000 (optional)"
              {...register('salaryMax')}
            />
          </div>

          <div className="max-w-xs">
            <Input
              label="Application Deadline"
              type="date"
              min={new Date().toISOString().split('T')[0]}
              required
              {...register('applicationDeadline', { required: 'Deadline is required' })}
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-3">
            <Button variant="ghost" size="md" onClick={() => navigate('/recruiter/dashboard')}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
              Publish Job Listing
            </Button>
          </div>
        </form>
      </div>

      {/* AI Draft Generator Modal (Section 15.4) */}
      <Modal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        title="AI Job Description Generator"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-500 dark:text-slate-400">
            Enter brief bullet points or keywords about the opening. The AI will draft a complete job description with responsibilities and requirements for your review.
          </p>

          <Input
            label="Role Title"
            placeholder="e.g. Senior Frontend Engineer"
            value={aiTitle}
            onChange={(e) => setAiTitle(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Raw Recruiter Notes / Key Priorities
            </label>
            <textarea
              rows={3}
              placeholder="e.g. We need someone strong in React, Tailwind, and WebSocket real-time dashboards with 3+ years experience..."
              value={aiNotes}
              onChange={(e) => setAiNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <Input
            label="Target Skills (comma separated)"
            placeholder="React, TypeScript, Redux, WebSocket"
            value={aiSkills}
            onChange={(e) => setAiSkills(e.target.value)}
          />

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setAiModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => aiGenerateMutation.mutate()}
              isLoading={aiGenerateMutation.isPending}
              disabled={!aiTitle.trim() || !aiNotes.trim() || aiGenerateMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Generate Draft
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
