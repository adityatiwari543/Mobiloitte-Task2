import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { LoadingSpinner } from '../components/common/LoadingSpinner.js';
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
} from 'lucide-react';
import { REMOTE_TYPES, EMPLOYMENT_TYPES } from '@jobconnect/shared';

export const JobsPage: React.FC = () => {
  const navigate = useNavigate();
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

  // Debounced search effect (Section 12: Do not query DB on every keystroke)
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <BackButton label="Back" fallbackUrl="/" />
      </div>

      {/* Top Search Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-8 transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-center px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by title, skills, keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <MapPin className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              placeholder="Filter location..."
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setPage(1);
              }}
              className="w-full bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-700 dark:text-slate-200 font-medium focus:outline-none"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="salary_high">Sort: Highest Salary</option>
              <option value="salary_low">Sort: Lowest Salary</option>
              <option value="deadline">Sort: Closing Soon</option>
            </select>
          </div>
        </div>

        {/* Facet Filters */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-slate-500 dark:text-slate-400 mr-1 flex items-center">
            <Filter className="w-3.5 h-3.5 mr-1" /> Filters:
          </span>

          <select
            value={remoteType}
            onChange={(e) => {
              setRemoteType(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-slate-700 dark:text-slate-200 font-medium"
          >
            <option value="">Work Mode: All</option>
            <option value={REMOTE_TYPES.ONSITE}>On-site</option>
            <option value={REMOTE_TYPES.REMOTE}>Remote</option>
            <option value={REMOTE_TYPES.HYBRID}>Hybrid</option>
          </select>

          <select
            value={employmentType}
            onChange={(e) => {
              setEmploymentType(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-slate-700 dark:text-slate-200 font-medium"
          >
            <option value="">Type: All</option>
            <option value={EMPLOYMENT_TYPES.FULL_TIME}>Full-Time</option>
            <option value={EMPLOYMENT_TYPES.PART_TIME}>Part-Time</option>
            <option value={EMPLOYMENT_TYPES.CONTRACT}>Contract</option>
            <option value={EMPLOYMENT_TYPES.INTERNSHIP}>Internship</option>
          </select>

          {(search || location || remoteType || employmentType) && (
            <button
              onClick={() => {
                setSearch('');
                setDebouncedSearch('');
                setLocation('');
                setRemoteType('');
                setEmploymentType('');
                setPage(1);
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline ml-auto font-medium cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Job Card Grid */}
      {isLoading ? (
        <LoadingSpinner message="Searching verified jobs..." />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No matching job postings found"
          description="Try broadening your search keywords or removing some filters to explore more opportunities."
          actionText="Clear All Filters"
          onAction={() => {
            setSearch('');
            setDebouncedSearch('');
            setLocation('');
            setRemoteType('');
            setEmploymentType('');
          }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job: any) => (
              <div
                key={job._id}
                onClick={() => navigate(`/jobs/${job._id}`)}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {job.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{job.companyId?.name || 'Company'}</p>
                    </div>
                    <Badge variant={job.remoteType === 'remote' ? 'green' : 'blue'}>
                      {job.remoteType}
                    </Badge>
                  </div>

                  <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {job.skills?.slice(0, 4).map((s: string) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300 font-medium"
                      >
                        {s}
                      </span>
                    ))}
                    {job.skills?.length > 4 && (
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 self-center">
                        +{job.skills.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {job.location}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {job.salaryMin && job.salaryMax
                      ? `${job.currency} ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}`
                      : 'Competitive'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-10 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasPrevPage}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>

              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total jobs)
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
