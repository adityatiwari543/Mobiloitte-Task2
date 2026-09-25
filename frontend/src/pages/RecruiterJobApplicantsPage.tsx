import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { BackButton } from '../components/common/BackButton.js';
import {
  Users,
  Calendar,
  FileText,
  Mail,
  Phone,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { APPLICATION_STATUS } from '@jobconnect/shared';

export const RecruiterJobApplicantsPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState('');
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);

  // Status transition state
  const [newStatus, setNewStatus] = useState<string>(APPLICATION_STATUS.SHORTLISTED);
  const [recruiterNote, setRecruiterNote] = useState('');

  // Interview schedule state
  const [scheduledAt, setScheduledAt] = useState('');
  const [duration, setDuration] = useState(45);
  const [meetingUrl, setMeetingUrl] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');

  // Fetch applicants
  const { data: applicants, isLoading } = useQuery({
    queryKey: ['jobApplicants', jobId, statusFilter],
    queryFn: async () => {
      const q = statusFilter ? `?status=${statusFilter}` : '';
      const res = await api.get(`/applications/jobs/${jobId}/applicants${q}`);
      return res.data?.data || [];
    },
    enabled: !!jobId,
  });

  // Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/applications/${selectedApp._id}/status`, {
        status: newStatus,
        note: recruiterNote.trim() || undefined,
      });
    },
    onSuccess: () => {
      setStatusModalOpen(false);
      setRecruiterNote('');
      queryClient.invalidateQueries({ queryKey: ['jobApplicants', jobId] });
    },
  });

  // Schedule Interview Mutation
  const scheduleMutation = useMutation({
    mutationFn: async () => {
      await api.post('/applications/interviews', {
        applicationId: selectedApp._id,
        candidateId: selectedApp.candidateId._id,
        scheduledAt,
        duration: Number(duration),
        meetingUrl: meetingUrl.trim() || undefined,
        notes: interviewNotes.trim() || undefined,
      });
    },
    onSuccess: () => {
      setInterviewModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['jobApplicants', jobId] });
    },
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading job applicants..." />;
  }

  const stages = [
    { label: 'All Stages', value: '' },
    { label: 'Applied', value: APPLICATION_STATUS.APPLIED },
    { label: 'Under Review', value: APPLICATION_STATUS.UNDER_REVIEW },
    { label: 'Shortlisted', value: APPLICATION_STATUS.SHORTLISTED },
    { label: 'Interview', value: APPLICATION_STATUS.INTERVIEW },
    { label: 'Selected', value: APPLICATION_STATUS.SELECTED },
    { label: 'Rejected', value: APPLICATION_STATUS.REJECTED },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <BackButton label="Back to Postings" fallbackUrl="/recruiter/jobs" className="mb-3" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Applicant Pipeline</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Manage candidate progressions and schedule interviews</p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors">
          {stages.map((st) => (
            <button
              key={st.value}
              onClick={() => setStatusFilter(st.value)}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                statusFilter === st.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {applicants.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No candidates found in this stage"
          description="Candidates who apply for this position will appear here in the hiring pipeline."
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {applicants.map((app: any) => {
              const candidate = app.candidateId;
              return (
                <div
                  key={app._id}
                  className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                        {candidate?.name ? candidate.name[0] : 'U'}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{candidate?.name || 'Applicant'}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3">
                          <span className="flex items-center">
                            <Mail className="w-3.5 h-3.5 mr-1 text-slate-400" />
                            {candidate?.email}
                          </span>
                          <span className="flex items-center">
                            <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                            {candidate?.phoneE164}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 pt-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>Applied on {new Date(app.appliedAt).toLocaleDateString()}</span>
                      {app.resumeUrl && (
                        <a
                          href={app.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline flex items-center font-semibold"
                        >
                          <FileText className="w-3.5 h-3.5 mr-1" /> View Resume
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      )}
                    </div>

                    {app.coverLetter && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 max-w-2xl mt-2 italic">
                        "{app.coverLetter}"
                      </p>
                    )}
                  </div>

                  {/* Stage & Action Controls */}
                  <div className="flex items-center space-x-3">
                    <Badge
                      variant={
                        app.status === 'shortlisted' || app.status === 'selected'
                          ? 'green'
                          : app.status === 'interview'
                          ? 'purple'
                          : app.status === 'rejected'
                          ? 'red'
                          : 'blue'
                      }
                    >
                      {app.status.toUpperCase().replace('_', ' ')}
                    </Badge>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedApp(app);
                        setNewStatus(app.status);
                        setStatusModalOpen(true);
                      }}
                    >
                      Update Stage
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setSelectedApp(app);
                        setScheduledAt(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16));
                        setInterviewModalOpen(true);
                      }}
                    >
                      <Calendar className="w-3.5 h-3.5 mr-1" /> Schedule
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 1. Update Stage Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Move Candidate Through Hiring Stage"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-500 dark:text-slate-400">
            Updating the hiring stage will automatically notify the candidate via email and real-time alerts.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Select New Stage</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value={APPLICATION_STATUS.APPLIED}>Applied</option>
              <option value={APPLICATION_STATUS.UNDER_REVIEW}>Under Review</option>
              <option value={APPLICATION_STATUS.SHORTLISTED}>Shortlisted</option>
              <option value={APPLICATION_STATUS.INTERVIEW}>Interview</option>
              <option value={APPLICATION_STATUS.SELECTED}>Selected / Hired</option>
              <option value={APPLICATION_STATUS.REJECTED}>Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Private Recruiter Note (Optional)
            </label>
            <textarea
              rows={3}
              value={recruiterNote}
              onChange={(e) => setRecruiterNote(e.target.value)}
              placeholder="Add internal evaluation feedback or notes..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => updateStatusMutation.mutate()}
              isLoading={updateStatusMutation.isPending}
            >
              Confirm Stage Update
            </Button>
          </div>
        </div>
      </Modal>

      {/* 2. Schedule Interview Modal */}
      <Modal
        isOpen={interviewModalOpen}
        onClose={() => setInterviewModalOpen(false)}
        title="Schedule Candidate Interview"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Date and Time</label>
            <div
              onClick={(e) => {
                const inputEl = e.currentTarget.querySelector('input');
                try {
                  inputEl?.showPicker?.();
                } catch {}
              }}
              className="relative cursor-pointer"
            >
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                onClick={(e) => {
                  try {
                    (e.target as HTMLInputElement).showPicker?.();
                  } catch {}
                }}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Duration (Minutes)</label>
            <input
              type="number"
              min={15}
              max={240}
              step={15}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Meeting URL (Google Meet / Zoom)</label>
            <input
              type="url"
              placeholder="https://meet.google.com/xyz-abc"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Interview Prep Notes (Optional)</label>
            <textarea
              rows={3}
              placeholder="Topics to be covered: system design, live coding, team introduction..."
              value={interviewNotes}
              onChange={(e) => setInterviewNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setInterviewModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => scheduleMutation.mutate()}
              isLoading={scheduleMutation.isPending}
              disabled={!scheduledAt || scheduleMutation.isPending}
            >
              Send Interview Invitation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
