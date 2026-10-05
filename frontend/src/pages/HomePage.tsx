import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../lib/api.js';
import { Button } from '../components/common/Button.js';
import { Hero } from '../components/hero/index.js';
import {
  Search,
  MapPin,
  Briefcase,
  Building2,
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Clock,
  Target,
  Bookmark,
  ChevronDown,
  Check,
  Zap,
  FileText,
  Compass,
  AlertCircle,
} from 'lucide-react';

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

type FilterType = 'all' | 'remote' | 'full_time' | 'part_time' | 'hybrid';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');

  // Active query parameters applied on search
  const [activeSearch, setActiveSearch] = useState('');
  const [activeLocation, setActiveLocation] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Filter chips state
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');

  const jobsSectionRef = useRef<HTMLElement>(null);

  // Fetch jobs dynamically based on whether search is active or featured
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['homeJobs', activeSearch, activeLocation, hasSearched],
    queryFn: async () => {
      const q = new URLSearchParams();
      if (hasSearched) {
        if (activeSearch.trim()) q.append('search', activeSearch.trim());
        if (activeLocation.trim()) q.append('location', activeLocation.trim());
        q.append('limit', '18');
      } else {
        q.append('limit', '12');
      }

      const res = await api.get(`/jobs?${q.toString()}`);
      return res.data?.data;
    },
  });

  // Candidate saved jobs query
  const { data: savedJobsData } = useQuery({
    queryKey: ['savedJobs'],
    queryFn: async () => {
      const res = await api.get('/jobs/saved/all');
      return res.data?.data || [];
    },
    enabled: isAuthenticated && user?.role === 'candidate',
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
      // Revert optimistic state on network error
      setLocalSavedIds((prev) => ({ ...prev, [jobId]: currentlySaved }));
    }
  };

  // Candidate applications query to detect "Applied" state accurately
  const { data: myApplications } = useQuery({
    queryKey: ['myApplications'],
    queryFn: async () => {
      const res = await api.get('/applications/me');
      return res.data?.data || [];
    },
    enabled: isAuthenticated && user?.role === 'candidate',
  });

  const appliedJobIds = useMemo(() => {
    return new Set(
      (myApplications || []).map((app: any) => app.jobId?._id || app.jobId)
    );
  }, [myApplications]);

  const defaultMockJobs = [
    {
      _id: 'default-1',
      title: 'Senior Frontend Developer (React / Next.js)',
      companyId: { name: 'Google', isVerified: true },
      location: 'Remote',
      remoteType: 'remote',
      employmentType: 'full-time',
      experienceMin: 3,
      salaryMin: 2200000,
      salaryMax: 3500000,
      isFeatured: true,
      skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
      description: 'Lead modern high-concurrency UI development, optimize Core Web Vitals, and build accessible design systems.',
    },
    {
      _id: 'default-2',
      title: 'Backend Systems Engineer',
      companyId: { name: 'Microsoft', isVerified: true },
      location: 'Bangalore, India',
      remoteType: 'hybrid',
      employmentType: 'full-time',
      experienceMin: 4,
      salaryMin: 2800000,
      salaryMax: 4200000,
      isNew: true,
      skills: ['Node.js', 'TypeScript', 'Distributed Systems', 'Redis', 'PostgreSQL'],
      description: 'Design resilient microservices, distributed cache clusters, and high-throughput real-time messaging pipelines.',
    },
    {
      _id: 'default-3',
      title: 'Full Stack Cloud Architect',
      companyId: { name: 'Amazon', isVerified: true },
      location: 'Hyderabad, India',
      remoteType: 'onsite',
      employmentType: 'full-time',
      experienceMin: 5,
      salaryMin: 3200000,
      salaryMax: 5000000,
      isFeatured: true,
      skills: ['React', 'Node.js', 'AWS', 'Docker', 'MongoDB'],
      description: 'Build enterprise-grade serverless solutions, robust multi-tenant web applications, and CI/CD pipelines.',
    },
    {
      _id: 'default-4',
      title: 'AI / Machine Learning Engineer',
      companyId: { name: 'Stripe', isVerified: true },
      location: 'Remote',
      remoteType: 'remote',
      employmentType: 'full-time',
      experienceMin: 2,
      salaryMin: 2500000,
      salaryMax: 4000000,
      isNew: true,
      skills: ['Python', 'PyTorch', 'LLMs', 'FastAPI', 'Vector DB'],
      description: 'Develop intelligent LLM agent workflows, fine-tune models, and deploy low-latency inference pipelines.',
    },
    {
      _id: 'default-5',
      title: 'DevOps & Cloud Reliability Engineer',
      companyId: { name: 'Swiggy', isVerified: true },
      location: 'Bangalore, India',
      remoteType: 'hybrid',
      employmentType: 'full-time',
      experienceMin: 3,
      salaryMin: 2000000,
      salaryMax: 3400000,
      skills: ['Kubernetes', 'Terraform', 'CI/CD', 'Prometheus', 'AWS'],
      description: 'Maintain 99.99% uptime for hyper-scale consumer delivery systems with automated self-healing infrastructure.',
    },
    {
      _id: 'default-6',
      title: 'Lead Product Designer (UI/UX)',
      companyId: { name: 'Zomato', isVerified: true },
      location: 'Gurgaon, India',
      remoteType: 'hybrid',
      employmentType: 'full-time',
      experienceMin: 4,
      salaryMin: 1800000,
      salaryMax: 3000000,
      skills: ['Figma', 'Design Systems', 'UX Research', 'Prototyping'],
      description: 'Craft intuitive consumer experiences, design micro-interactions, and elevate visual brand identity.',
    },
  ];

  const rawJobsList = data?.items && data.items.length > 0
    ? data.items
    : (hasSearched ? [] : defaultMockJobs);
  const totalResults = data?.pagination?.total ?? rawJobsList.length;

  // Client-side filtering based on selected filter chips
  const jobsList = useMemo(() => {
    if (selectedFilter === 'all') return rawJobsList;
    return rawJobsList.filter((job: any) => {
      const remoteType = (job.remoteType || '').toLowerCase();
      const locationStr = (job.location || '').toLowerCase();
      const empType = (job.employmentType || job.jobType || '').toLowerCase();

      if (selectedFilter === 'remote') {
        return remoteType === 'remote' || locationStr.includes('remote');
      }
      if (selectedFilter === 'hybrid') {
        return remoteType === 'hybrid' || locationStr.includes('hybrid');
      }
      if (selectedFilter === 'full_time') {
        return empType.includes('full');
      }
      if (selectedFilter === 'part_time') {
        return empType.includes('part');
      }
      return true;
    });
  }, [rawJobsList, selectedFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(search.trim());
    setActiveLocation(location.trim());
    setHasSearched(true);

    setTimeout(() => {
      jobsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleClearSearch = () => {
    setSearch('');
    setLocation('');
    setActiveSearch('');
    setActiveLocation('');
    setHasSearched(false);
    setSelectedFilter('all');
  };

  const handleTrendingClick = (tag: string) => {
    if (tag.toLowerCase() === 'remote') {
      setLocation('Remote');
      setActiveLocation('Remote');
      setActiveSearch(search.trim());
    } else {
      setSearch(tag);
      setActiveSearch(tag);
      setActiveLocation(location.trim());
    }
    setHasSearched(true);

    setTimeout(() => {
      jobsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleOpenInCatalog = () => {
    const params = new URLSearchParams();
    if (activeSearch.trim()) params.append('search', activeSearch.trim());
    if (activeLocation.trim()) params.append('location', activeLocation.trim());
    if (selectedFilter === 'remote') params.append('remoteType', 'remote');
    if (selectedFilter === 'hybrid') params.append('remoteType', 'hybrid');
    if (selectedFilter === 'full_time') params.append('employmentType', 'full-time');
    if (selectedFilter === 'part_time') params.append('employmentType', 'part-time');
    navigate(`/jobs?${params.toString()}`);
  };

  return (
    <div className="flex flex-col bg-white dark:bg-[#080B14] transition-colors">
      {/* Hero Section according to structured component architecture */}
      <Hero
        search={search}
        onSearchChange={setSearch}
        location={location}
        onLocationChange={setLocation}
        onSearchSubmit={handleSearchSubmit}
        onTrendingClick={handleTrendingClick}
        onAIClick={() => navigate('/ai-assistant')}
        onCompaniesClick={() => navigate('/jobs')}
        onMatchScoreClick={() => navigate('/jobs')}
        onInterviewClick={() => navigate(isAuthenticated ? '/candidate/dashboard' : '/login')}
      />


      {/* Metrics Banner (Feature Highlights Bar directly matching mockup) */}
      <section className="bg-[#fffbdc] dark:bg-[#0D1220] border-y border-[#f0e9cb] dark:border-slate-800/80 py-6 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Stat 1: Active Tech Jobs */}
            <div className="flex items-center gap-3.5 justify-center sm:justify-start">
              <div className="w-10 h-10 rounded-xl bg-[#fff2dc] dark:bg-[#15203A] text-indigo-600 dark:text-indigo-400 border border-[#f5e2bf]/80 dark:border-indigo-900/50 flex items-center justify-center flex-shrink-0 shadow-xs">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xl sm:text-2xl font-black text-[#141623] dark:text-[#F8FAFC]">10,000+</p>
                <p className="text-xs text-slate-600 dark:text-[#94A3B8] font-medium">Active Tech Jobs</p>
              </div>
            </div>

            {/* Stat 2: Verified Companies */}
            <div className="flex items-center gap-3.5 justify-center sm:justify-start">
              <div className="w-10 h-10 rounded-xl bg-[#fff2dc] dark:bg-[#15203A] text-indigo-600 dark:text-indigo-400 border border-[#f5e2bf]/80 dark:border-indigo-900/50 flex items-center justify-center flex-shrink-0 shadow-xs">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xl sm:text-2xl font-black text-[#141623] dark:text-[#F8FAFC]">1,200+</p>
                <p className="text-xs text-slate-600 dark:text-[#94A3B8] font-medium">Verified Companies</p>
              </div>
            </div>

            {/* Stat 3: Profile Match Precision */}
            <div className="flex items-center gap-3.5 justify-center sm:justify-start">
              <div className="w-10 h-10 rounded-xl bg-[#fff2dc] dark:bg-[#15203A] text-indigo-600 dark:text-indigo-400 border border-[#f5e2bf]/80 dark:border-indigo-900/50 flex items-center justify-center flex-shrink-0 shadow-xs">
                <Target className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xl sm:text-2xl font-black text-[#141623] dark:text-[#F8FAFC]">95%</p>
                <p className="text-xs text-slate-600 dark:text-[#94A3B8] font-medium">Profile Match Precision</p>
              </div>
            </div>

            {/* Stat 4: Average First Response */}
            <div className="flex items-center gap-3.5 justify-center sm:justify-start">
              <div className="w-10 h-10 rounded-xl bg-[#fff2dc] dark:bg-[#15203A] text-indigo-600 dark:text-indigo-400 border border-[#f5e2bf]/80 dark:border-indigo-900/50 flex items-center justify-center flex-shrink-0 shadow-xs">
                <Clock className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xl sm:text-2xl font-black text-[#141623] dark:text-[#F8FAFC]">&lt; 24h</p>
                <p className="text-xs text-slate-600 dark:text-[#94A3B8] font-medium">Average First Response</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Jobs Section */}
      <section
        ref={jobsSectionRef}
        id="jobs-section"
        className="w-full bg-[#fdfaf5] dark:bg-[#080B14] border-b border-[#f2ede0] dark:border-slate-800/80 transition-colors py-14"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-2.5 border border-blue-200/70 dark:border-blue-800/60 w-fit">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Top Hiring Now</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-[#F8FAFC]">
                  {hasSearched ? 'Search Results' : 'Featured Job Openings'}
                </h2>
                {hasSearched && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-[#162035] text-blue-700 dark:text-indigo-300 border border-blue-200 dark:border-indigo-900/60">
                    {totalResults} {totalResults === 1 ? 'Job' : 'Jobs'} Found
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] mt-1.5 max-w-xl">
                {hasSearched ? (
                  <span>
                    Showing verified roles matching{' '}
                    <strong className="text-slate-800 dark:text-[#F8FAFC] font-semibold">
                      {activeSearch ? `"${activeSearch}"` : 'All Tech Roles'}
                    </strong>
                    {activeLocation && (
                      <span>
                        {' '}
                        in{' '}
                        <strong className="text-slate-800 dark:text-[#F8FAFC] font-semibold">
                          "{activeLocation}"
                        </strong>
                      </span>
                    )}
                  </span>
                ) : (
                  'Hand-picked engineering, cloud, and product opportunities from verified tech leaders.'
                )}
              </p>
            </div>

            <div className="flex items-center space-x-2.5 self-start md:self-auto">
              {hasSearched && (
                <Button variant="secondary" size="sm" onClick={handleClearSearch}>
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Clear Search
                </Button>
              )}
              <Button
                variant={hasSearched ? 'primary' : 'outline'}
                size="sm"
                onClick={handleOpenInCatalog}
                className="text-xs font-semibold px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-[#0D1220] text-slate-700 dark:text-slate-200 group cursor-pointer"
              >
                <span>{hasSearched ? 'View in Full Catalog' : 'View All Jobs'}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </div>
          </div>

          {/* Functional Filter Chips Row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-8 scrollbar-none">
            {[
              { id: 'all', label: 'All Jobs' },
              { id: 'remote', label: 'Remote' },
              { id: 'full_time', label: 'Full Time' },
              { id: 'part_time', label: 'Part Time' },
              { id: 'hybrid', label: 'Hybrid' },
            ].map((chip) => {
              const isActive = selectedFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setSelectedFilter(chip.id as FilterType)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20 border border-transparent'
                      : 'bg-white dark:bg-[#0D1220] text-slate-600 dark:text-[#CBD5E1] hover:text-slate-900 dark:hover:text-[#F8FAFC] border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* Error State */}
          {isError && (
            <div className="mb-8 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                <p className="text-xs text-rose-700 dark:text-rose-300 font-medium">
                  Unable to load fresh opportunities. Please verify your connection and try again.
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          )}

          {/* Jobs Grid (3-column Cards matching design) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              // Skeleton Loaders
              [1, 2, 3, 4, 5, 6].map((i) => (
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
              ))
            ) : jobsList.length > 0 ? (
              jobsList.map((job: any) => {
                const skills = job.skills && job.skills.length > 0
                  ? job.skills
                  : (job.title || '').toLowerCase().includes('frontend')
                  ? ['React', 'TypeScript', 'Tailwind']
                  : (job.title || '').toLowerCase().includes('backend')
                  ? ['Node.js', 'PostgreSQL', 'Redis']
                  : ['Full Stack', 'React', 'Node.js'];

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
                              {job.isNew && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/60">
                                  New
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
              })
            ) : (
              // Empty State
              <div className="col-span-full py-16 px-4 text-center bg-slate-50 dark:bg-[#0D1220] rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-[#162035] text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3.5">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-[#F8FAFC]">
                  {selectedFilter !== 'all'
                    ? `No roles found for filter "${selectedFilter.replace('_', ' ')}"`
                    : hasSearched
                    ? `No exact matches found for "${activeSearch}" ${activeLocation ? `in "${activeLocation}"` : ''}`
                    : 'No Job Openings Available Right Now'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1 max-w-md mx-auto leading-relaxed">
                  {selectedFilter !== 'all'
                    ? 'Try selecting "All Jobs" or exploring our full catalog to discover matching positions.'
                    : hasSearched
                    ? 'Try broadening your search keywords or clearing location filters to discover related opportunities.'
                    : 'Check back soon for newly posted engineering, design, and product listings.'}
                </p>
                <div className="mt-5 flex justify-center gap-3">
                  {selectedFilter !== 'all' ? (
                    <Button variant="secondary" size="sm" onClick={() => setSelectedFilter('all')}>
                      <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset Filter
                    </Button>
                  ) : hasSearched ? (
                    <Button variant="secondary" size="sm" onClick={handleClearSearch}>
                      <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Show All Openings
                    </Button>
                  ) : null}
                  <Button variant="primary" size="sm" onClick={handleOpenInCatalog}>
                    Explore Full Catalog
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* AI Career Assistant CTA Section (Section 32, 33) */}
          <div className="mt-14 relative overflow-hidden rounded-3xl border border-indigo-100 dark:border-indigo-950/80 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-purple-50/70 dark:from-[#0B101D] dark:via-[#0F162A] dark:to-[#131128] p-7 sm:p-10 shadow-lg shadow-indigo-500/5">
            {/* Ambient Glow */}
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 dark:from-indigo-600/10 dark:to-purple-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left side: Heading & CTA */}
              <div className="lg:col-span-7">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-100/80 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-4 border border-indigo-200 dark:border-indigo-800">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>AI Career Accelerator</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-[#F8FAFC] tracking-tight leading-snug">
                  Want better job matches?
                  <br />
                  <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Let our AI Assistant guide your career.
                  </span>
                </h3>

                <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-[#CBD5E1] max-w-xl leading-relaxed">
                  Receive personalized job recommendations, automatic resume skill-gap analysis, and deterministic scoring tailored to verified roles across top tech companies.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (isAuthenticated && user?.role === 'candidate') {
                        navigate('/candidate/ai-assistant');
                      } else if (isAuthenticated) {
                        navigate('/jobs');
                      } else {
                        navigate('/login');
                      }
                    }}
                    className="px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-500/25 flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Try AI Assistant</span>
                    <ArrowRight className="w-4 h-4 ml-0.5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenInCatalog}
                    className="px-5 py-2.5 rounded-full bg-white dark:bg-[#0D1220] hover:bg-slate-50 dark:hover:bg-[#111827] text-slate-700 dark:text-[#CBD5E1] text-xs sm:text-sm font-semibold border border-slate-200/90 dark:border-slate-800 shadow-xs cursor-pointer transition-all"
                  >
                    Browse All Jobs
                  </button>
                </div>
              </div>

              {/* Right side: 4 Feature Cards */}
              <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Feature 1 */}
                <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#101827]/90 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-[#15203A] text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2.5">
                    <Target className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">
                    Personalized Job Recommendations
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-1">
                    Deterministic matching aligned with your experience & skills.
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#101827]/90 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">
                    Resume Optimization
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-1">
                    Smart parsing and AI bullet-point improvements.
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#101827]/90 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2.5">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">
                    Skill Gap Analysis
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-1">
                    Discover what skills to acquire for your target salary.
                  </p>
                </div>

                {/* Feature 4 */}
                <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#101827]/90 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2.5">
                    <Compass className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">
                    Career Guidance
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-1">
                    Real-time interview preparation and insights.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
