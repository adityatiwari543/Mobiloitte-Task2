import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { Button } from '../components/common/Button.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { BackButton } from '../components/common/BackButton.js';
import {
  Search,
  MapPin,
  Briefcase,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  Check,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { REMOTE_TYPES, EMPLOYMENT_TYPES, ROLES } from '@jobconnect/shared';

const getCompanyIcon = (name: string, logoUrl?: string) => {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        loading="lazy"
        className="w-11 h-11 rounded-xl object-contain border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-[#0D1220] p-1 flex-shrink-0"
        onError={(e) => {
          (e.currentTarget as HTMLElement).style.display = 'none';
        }}
      />
    );
  }
  const n = (name || '').toLowerCase();
  if (n.includes('google')) {
    return (
      <div className="w-11 h-11 rounded-xl bg-white dark:bg-[#0D1220] p-2 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-lg shadow-xs flex-shrink-0">
        <span className="text-[#4285F4]">G</span>
      </div>
    );
  }
  if (n.includes('microsoft')) {
    return (
      <div className="w-11 h-11 rounded-xl bg-white dark:bg-[#0D1220] p-2.5 border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-1 shadow-xs flex-shrink-0 items-center justify-center">
        <span className="w-2.5 h-2.5 bg-[#F25022] rounded-[1px]" />
        <span className="w-2.5 h-2.5 bg-[#7FBA00] rounded-[1px]" />
        <span className="w-2.5 h-2.5 bg-[#00A4EF] rounded-[1px]" />
        <span className="w-2.5 h-2.5 bg-[#FFB900] rounded-[1px]" />
      </div>
    );
  }
  if (n.includes('amazon')) {
    return (
      <div className="w-11 h-11 rounded-xl bg-[#131921] dark:bg-[#0D1220] text-white p-2 border border-transparent dark:border-slate-700 flex items-center justify-center font-black text-sm shadow-xs flex-shrink-0">
        <span className="text-[#FF9900]">a</span>
      </div>
    );
  }
  if (n.includes('stripe')) {
    return (
      <div className="w-11 h-11 rounded-xl bg-[#635BFF] text-white p-2 flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
        <span>S</span>
      </div>
    );
  }
  if (n.includes('swiggy')) {
    return (
      <div className="w-11 h-11 rounded-xl bg-[#FC8019] text-white p-2 flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
        <span>S</span>
      </div>
    );
  }
  if (n.includes('zomato')) {
    return (
      <div className="w-11 h-11 rounded-xl bg-[#E23744] text-white p-2 flex items-center justify-center font-black text-xs shadow-xs flex-shrink-0">
        <span>Z</span>
      </div>
    );
  }
  const initial = (name || 'C').charAt(0).toUpperCase();
  return (
    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-[#15203A] dark:to-[#0D1220] text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/60 flex items-center justify-center font-bold text-base shadow-xs flex-shrink-0">
      {initial}
    </div>
  );
};

const formatSalary = (job: any) => {
  if (job.salaryMin && job.salaryMax) {
    const minL = (job.salaryMin / 100000).toFixed(0);
    const maxL = (job.salaryMax / 100000).toFixed(0);
    return `₹${minL}L - ₹${maxL}L`;
  }
  if (job.salary?.min && job.salary?.max) {
    const minL = (job.salary.min / 100000).toFixed(0);
    const maxL = (job.salary.max / 100000).toFixed(0);
    return `₹${minL}L - ₹${maxL}L`;
  }
  if (job.salaryMin) {
    return `₹${(job.salaryMin / 100000).toFixed(0)}L+`;
  }
  return 'Competitive';
};

export const JobsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [remoteType, setRemoteType] = useState(searchParams.get('remoteType') || '');
  const [employmentType, setEmploymentType] = useState(searchParams.get('employmentType') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  // Sync state when incoming URL search params change
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    const urlLocation = searchParams.get('location') || '';
    const urlRemote = searchParams.get('remoteType') || '';
    const urlEmployment = searchParams.get('employmentType') || '';
    const urlSort = searchParams.get('sortBy') || 'newest';
    const urlPage = parseInt(searchParams.get('page') || '1', 10);

    if (urlSearch !== search) {
      setSearch(urlSearch);
      setDebouncedSearch(urlSearch);
    }
    if (urlLocation !== location) setLocation(urlLocation);
    if (urlRemote !== remoteType) setRemoteType(urlRemote);
    if (urlEmployment !== employmentType) setEmploymentType(urlEmployment);
    if (urlSort !== sortBy) setSortBy(urlSort);
    if (urlPage !== page) setPage(urlPage);
  }, [searchParams]);

  // Debounced search effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Sync to URL
  useEffect(() => {
    const params: Record<string, string> = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (location) params.location = location;
    if (remoteType) params.remoteType = remoteType;
    if (employmentType) params.employmentType = employmentType;
    if (sortBy) params.sortBy = sortBy;
    if (page > 1) params.page = page.toString();
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, location, remoteType, employmentType, sortBy, page, setSearchParams]);

  // Fetch jobs query with TanStack Query
  const { data, isLoading } = useQuery({
    queryKey: ['jobs', debouncedSearch, location, remoteType, employmentType, sortBy, page],
    queryFn: async () => {
      const q = new URLSearchParams();
      if (debouncedSearch) q.append('search', debouncedSearch);
      if (location) q.append('location', location);
      if (remoteType) q.append('remoteType', remoteType);
      if (employmentType) q.append('employmentType', employmentType);
      if (sortBy) q.append('sortBy', sortBy);
      q.append('page', page.toString());
      q.append('limit', '12');

      const res = await api.get(`/jobs?${q.toString()}`);
      return res.data?.data;
    },
    staleTime: 60 * 1000,
  });

  const jobs = data?.items || [];
  const pagination = data?.pagination;

  // Candidate saved jobs query
  const { data: savedJobsData } = useQuery({
    queryKey: ['savedJobs'],
    queryFn: async () => {
      const res = await api.get('/jobs/saved/all');
      return res.data?.data || [];
    },
    enabled: !!isAuthenticated && user?.role === ROLES.CANDIDATE,
  });

  const savedJobIds = useMemo(() => {
    return new Set(
      (savedJobsData || []).map((j: any) => j._id || j.jobId?._id || j.jobId)
    );
  }, [savedJobsData]);

  // Local optimistic save state
  const [localSavedIds, setLocalSavedIds] = useState<Record<string, boolean>>({});

  const isJobSaved = (jobId: string) => {
    if (localSavedIds[jobId] !== undefined) {
      return localSavedIds[jobId];
    }
    return savedJobIds.has(jobId);
  };

  const handleToggleSave = async (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const currentlySaved = isJobSaved(jobId);
    setLocalSavedIds((prev) => ({ ...prev, [jobId]: !currentlySaved }));

    try {
      if (currentlySaved) {
        await api.delete(`/jobs/${jobId}/save`);
      } else {
        await api.post(`/jobs/${jobId}/save`);
      }
      queryClient.invalidateQueries({ queryKey: ['savedJobs'] });
    } catch {
      setLocalSavedIds((prev) => ({ ...prev, [jobId]: currentlySaved }));
    }
  };

  // Candidate applications query to detect "Applied" status accurately
  const { data: myApplications } = useQuery({
    queryKey: ['myApplications'],
    queryFn: async () => {
      const res = await api.get('/applications/me');
      return res.data?.data || [];
    },
    enabled: !!isAuthenticated && user?.role === ROLES.CANDIDATE,
  });

  const appliedJobIds = useMemo(() => {
    return new Set(
      (myApplications || []).map((app: any) => app.jobId?._id || app.jobId)
    );
  }, [myApplications]);

  return (
    <div className="min-h-screen bg-[#fdfaf5] dark:bg-[#080B14] transition-colors py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <BackButton label="Back" fallbackUrl="/" />
          <span className="text-xs font-semibold text-slate-500 dark:text-[#94A3B8]">
            {pagination?.total ? `${pagination.total} Available Positions` : 'Explore Verified Opportunities'}
          </span>
        </div>

        {/* Top Search & Filter Card */}
        <div className="bg-white dark:bg-[#0D1220] p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-md shadow-indigo-500/5 dark:shadow-none mb-8 transition-colors">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Title / Keywords Search */}
            <div className="flex items-center px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#111827] border border-slate-200/90 dark:border-slate-700/80 focus-within:ring-2 focus-within:ring-indigo-500/30 dark:focus-within:border-indigo-500/50 transition-all">
              <Search className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mr-2.5 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search by title, skills, keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
              />
            </div>

            {/* Location Search */}
            <div className="flex items-center px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#111827] border border-slate-200/90 dark:border-slate-700/80 focus-within:ring-2 focus-within:ring-indigo-500/30 dark:focus-within:border-indigo-500/50 transition-all">
              <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mr-2.5 flex-shrink-0" />
              <input
                type="text"
                placeholder="Filter location (city, remote)..."
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
              />
            </div>

            {/* Sorting select */}
            <div className="flex items-center">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-slate-50 dark:bg-[#111827] px-4 py-2.5 text-xs sm:text-sm text-slate-700 dark:text-[#CBD5E1] font-medium focus:outline-none cursor-pointer"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="salary_high">Sort: Highest Salary</option>
                <option value="salary_low">Sort: Lowest Salary</option>
                <option value="deadline">Sort: Closing Soon</option>
              </select>
            </div>
          </div>

          {/* Facet Filters Strip */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-2.5 text-xs">
            <span className="font-semibold text-slate-500 dark:text-[#94A3B8] mr-1 flex items-center">
              <Filter className="w-3.5 h-3.5 mr-1 text-indigo-600 dark:text-indigo-400" /> Filters:
            </span>

            {/* Work Mode Dropdown */}
            <select
              value={remoteType}
              onChange={(e) => {
                setRemoteType(e.target.value);
                setPage(1);
              }}
              className="grow sm:grow-0 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#111827] px-3 py-2 sm:py-1.5 text-slate-700 dark:text-[#CBD5E1] font-medium cursor-pointer"
            >
              <option value="">Work Mode: All</option>
              <option value={REMOTE_TYPES.ONSITE}>On-site</option>
              <option value={REMOTE_TYPES.REMOTE}>Remote</option>
              <option value={REMOTE_TYPES.HYBRID}>Hybrid</option>
            </select>

            {/* Job Type Dropdown */}
            <select
              value={employmentType}
              onChange={(e) => {
                setEmploymentType(e.target.value);
                setPage(1);
              }}
              className="grow sm:grow-0 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#111827] px-3 py-2 sm:py-1.5 text-slate-700 dark:text-[#CBD5E1] font-medium cursor-pointer"
            >
              <option value="">Type: All</option>
              <option value={EMPLOYMENT_TYPES.FULL_TIME}>Full-Time</option>
              <option value={EMPLOYMENT_TYPES.PART_TIME}>Part-Time</option>
              <option value={EMPLOYMENT_TYPES.CONTRACT}>Contract</option>
              <option value={EMPLOYMENT_TYPES.INTERNSHIP}>Internship</option>
            </select>

            {(search || location || remoteType || employmentType) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setDebouncedSearch('');
                  setLocation('');
                  setRemoteType('');
                  setEmploymentType('');
                  setPage(1);
                }}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline ml-auto font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Clear all filters
              </button>
            )}
          </div>
        </div>

        {/* Job Card Grid */}
        {isLoading ? (
          // Skeleton Loaders matching card layout
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#101827] rounded-2xl border border-slate-200 dark:border-slate-800/80 p-6 animate-pulse flex flex-col justify-between h-[270px]"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 w-3/4">
                      <div className="w-11 h-11 rounded-xl bg-slate-200 dark:bg-[#162035] flex-shrink-0" />
                      <div className="space-y-1.5 w-full">
                        <div className="h-4 bg-slate-200 dark:bg-[#162035] rounded w-4/5" />
                        <div className="h-3 bg-slate-100 dark:bg-[#162035]/60 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-[#162035]" />
                  </div>
                  <div className="h-3 bg-slate-100 dark:bg-[#162035] rounded w-full" />
                  <div className="h-3 bg-slate-100 dark:bg-[#162035] rounded w-3/4" />
                  <div className="flex gap-2">
                    <div className="h-5 w-16 bg-slate-100 dark:bg-[#162035] rounded-md" />
                    <div className="h-5 w-16 bg-slate-100 dark:bg-[#162035] rounded-md" />
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div className="h-4 w-24 bg-slate-200 dark:bg-[#162035] rounded" />
                  <div className="h-8 w-24 bg-slate-200 dark:bg-[#162035] rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="py-16 px-4 text-center bg-white dark:bg-[#0D1220] rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-[#162035] text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3.5">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-[#F8FAFC]">
              No matching job postings found
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1 max-w-md mx-auto leading-relaxed">
              Try broadening your search keywords or clearing some filters to explore more opportunities.
            </p>
            <div className="mt-5 flex justify-center">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setDebouncedSearch('');
                  setLocation('');
                  setRemoteType('');
                  setEmploymentType('');
                  setPage(1);
                }}
              >
                Clear All Filters
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job: any) => {
                const skills = job.skills && job.skills.length > 0 ? job.skills : [];
                const salary = formatSalary(job);
                const companyName = job.companyId?.name || 'Verified Company';
                const logoUrl = job.companyId?.logoUrl;
                const isVerified = job.companyId?.isVerified !== false;
                const isSaved = isJobSaved(job._id);
                const hasApplied = appliedJobIds.has(job._id);

                const remoteBadgeText = job.remoteType === 'remote'
                  ? 'Remote'
                  : job.remoteType === 'hybrid'
                  ? 'Hybrid'
                  : 'On-site';

                const employmentBadgeText = job.employmentType
                  ? job.employmentType.replace('-', ' ').replace('_', ' ')
                  : job.jobType
                  ? job.jobType.replace('_', ' ')
                  : 'Full Time';

                return (
                  <div
                    key={job._id}
                    onClick={() => navigate(`/jobs/${job._id}`)}
                    className="group bg-white dark:bg-[#101827] rounded-2xl border border-slate-200/90 dark:border-slate-800/80 p-6 hover:shadow-xl dark:hover:shadow-[0_4px_24px_rgba(15,23,42,0.6)] hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-all duration-200 cursor-pointer flex flex-col justify-between gap-5 relative"
                  >
                    <div>
                      {/* Top row: Company Logo, Badges, Name, Verification, Bookmark */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3.5 min-w-0">
                          {getCompanyIcon(companyName, logoUrl)}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs text-slate-500 dark:text-[#94A3B8] font-medium truncate">
                                {companyName}
                              </span>
                              {isVerified && (
                                <CheckCircle2
                                  className="w-3.5 h-3.5 text-blue-500 flex-shrink-0"
                                  aria-label="Verified Company"
                                />
                              )}
                              {job.isFeatured && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/70 dark:border-indigo-800/60">
                                  Featured
                                </span>
                              )}
                            </div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 mt-0.5">
                              {job.title}
                            </h3>
                          </div>
                        </div>

                        {/* Bookmark Save Button */}
                        <button
                          type="button"
                          aria-label={isSaved ? 'Remove from saved' : 'Save job'}
                          onClick={(e) => handleToggleSave(e, job._id)}
                          className={`p-2 rounded-xl border transition-all cursor-pointer flex-shrink-0 ${
                            isSaved
                              ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
                              : 'bg-slate-50/80 dark:bg-[#0D1220] border-slate-200/80 dark:border-slate-700/70 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-800'
                          }`}
                          title={isSaved ? 'Saved to Bookmarks' : 'Bookmark Job'}
                        >
                          <Bookmark
                            className={`w-4 h-4 transition-transform active:scale-90 ${
                              isSaved ? 'fill-current' : ''
                            }`}
                          />
                        </button>
                      </div>

                      {/* Meta info tags (Location, Remote mode, Experience) */}
                      <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs">
                        <span className="inline-flex items-center text-slate-500 dark:text-[#94A3B8] font-medium">
                          <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 flex-shrink-0" />
                          <span className="truncate max-w-[130px]">{job.location || 'Remote'}</span>
                        </span>

                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 dark:bg-[#15203A] text-blue-700 dark:text-indigo-300 border border-blue-200/60 dark:border-indigo-900/40">
                          {remoteBadgeText}
                        </span>

                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-[#111827] text-slate-600 dark:text-[#CBD5E1] border dark:border-slate-700/40 capitalize">
                          {employmentBadgeText}
                        </span>

                        {job.experienceMin !== undefined && (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                            • {job.experienceMin}+ yrs exp
                          </span>
                        )}
                      </div>

                      {/* Short Description Preview */}
                      <p className="mt-3 text-xs text-slate-600 dark:text-[#94A3B8] line-clamp-2 leading-relaxed">
                        {job.description ||
                          'Exciting role working alongside forward-thinking engineering teams to ship high-impact technology products.'}
                      </p>

                      {/* Skills pills */}
                      <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                        {skills.slice(0, 3).map((skill: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-[#162035] text-slate-700 dark:text-[#CBD5E1] border dark:border-slate-700/50 font-medium text-[11px]"
                          >
                            {skill}
                          </span>
                        ))}
                        {skills.length > 3 && (
                          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 px-1.5 py-0.5">
                            +{skills.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Bottom Bar: Salary and Quick Apply */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 tracking-wider block">
                          Compensation
                        </span>
                        <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                          {salary}
                        </span>
                      </div>

                      {hasApplied ? (
                        <span className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />
                          <span>Applied</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/jobs/${job._id}`);
                          }}
                          className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-sm shadow-indigo-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <span>Quick Apply</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-10 flex items-center justify-between border-t border-slate-200 dark:border-slate-800/80 pt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrevPage}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  className="dark:border-slate-800 dark:bg-[#0D1220] dark:text-[#CBD5E1]"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>

                <span className="text-xs font-medium text-slate-600 dark:text-[#94A3B8]">
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} total jobs)
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPage((p) => p + 1)}
                  className="dark:border-slate-800 dark:bg-[#0D1220] dark:text-[#CBD5E1]"
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
