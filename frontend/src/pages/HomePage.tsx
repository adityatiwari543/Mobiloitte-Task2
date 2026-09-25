import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import {
  Search,
  MapPin,
  Briefcase,
  Building2,
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Filter,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');

  // Active query parameters applied on search
  const [activeSearch, setActiveSearch] = useState('');
  const [activeLocation, setActiveLocation] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const jobsSectionRef = useRef<HTMLElement>(null);

  // Fetch jobs dynamically based on whether search is active or featured
  const { data, isLoading } = useQuery({
    queryKey: ['homeJobs', activeSearch, activeLocation, hasSearched],
    queryFn: async () => {
      const q = new URLSearchParams();
      if (hasSearched) {
        if (activeSearch.trim()) q.append('search', activeSearch.trim());
        if (activeLocation.trim()) q.append('location', activeLocation.trim());
        q.append('limit', '18');
      } else {
        q.append('limit', '6');
      }

      const res = await api.get(`/jobs?${q.toString()}`);
      return res.data?.data;
    },
  });

  const jobsList = data?.items || [];
  const totalResults = data?.pagination?.total ?? jobsList.length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(search.trim());
    setActiveLocation(location.trim());
    setHasSearched(true);

    // Smooth scroll down to results
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
    navigate(`/jobs?${params.toString()}`);
  };

  return (
    <div className="flex flex-col bg-white dark:bg-slate-950 transition-colors">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-blue-50/20 to-white dark:from-slate-900/60 dark:via-slate-950 dark:to-slate-950 pt-16 pb-20 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-100/70 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-6 shadow-sm border border-blue-200/60 dark:border-blue-800">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>AI-Assisted Job Discovery & Career Matching</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight max-w-4xl mx-auto leading-tight">
            Connect with your next career opportunity on{' '}
            <span className="text-blue-600 dark:text-blue-400">JobConnect</span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Discover thousands of verified tech roles, get deterministic skills matching, and connect directly with hiring managers in real time.
          </p>

          {/* Search Form */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-10 max-w-3xl mx-auto bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-xl shadow-blue-500/5 dark:shadow-none border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-3 transition-colors"
          >
            {/* Job Role / Keyword Input */}
            <div className="flex-1 flex items-center px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus-within:border-blue-500 dark:focus-within:border-blue-500 transition-all">
              <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 mr-2.5 flex-shrink-0" />
              <input
                type="text"
                placeholder="Job title, skills, or keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
              />
            </div>

            {/* City / Location Input */}
            <div className="flex-1 flex items-center px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus-within:border-blue-500 dark:focus-within:border-blue-500 transition-all">
              <MapPin className="w-5 h-5 text-slate-400 dark:text-slate-500 mr-2.5 flex-shrink-0" />
              <input
                type="text"
                placeholder="City, remote, or country..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
              />
            </div>

            <Button type="submit" variant="primary" size="lg" className="md:w-auto shadow-md shadow-blue-500/20">
              Find Jobs
            </Button>
          </form>

          {/* Popular Search Pills */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Trending:</span>
            {['React', 'TypeScript', 'Node.js', 'Python', 'Remote', 'DevOps', 'Bangalore', 'Hyderabad'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTrendingClick(tag)}
                className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Metrics Banner */}
      <section className="bg-slate-900 dark:bg-slate-950 border-y border-slate-800 py-10 text-white transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-extrabold text-blue-400">10,000+</p>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Active Tech Jobs</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-blue-400">1,200+</p>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Verified Companies</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-blue-400">95%</p>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Profile Match Precision</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-blue-400">&lt; 24h</p>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Average First Response</p>
            </div>
          </div>
        </div>
      </section>

      {/* Jobs Section (Dynamic Search Results or Featured Jobs) */}
      <section
        ref={jobsSectionRef}
        id="jobs-section"
        className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {hasSearched ? 'Search Results' : 'Featured Job Openings'}
              </h2>
              {hasSearched && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {totalResults} {totalResults === 1 ? 'Job' : 'Jobs'} Found
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {hasSearched ? (
                <span>
                  Showing roles matching{' '}
                  <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                    {activeSearch ? `"${activeSearch}"` : 'All Tech Roles'}
                  </strong>
                  {activeLocation && (
                    <span>
                      {' '}
                      in{' '}
                      <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                        "{activeLocation}"
                      </strong>
                    </span>
                  )}
                </span>
              ) : (
                'Hand-picked engineering, cloud, and product opportunities'
              )}
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            {hasSearched && (
              <Button variant="secondary" size="sm" onClick={handleClearSearch}>
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Clear Search
              </Button>
            )}
            <Button
              variant={hasSearched ? 'primary' : 'outline'}
              size="sm"
              onClick={handleOpenInCatalog}
            >
              {hasSearched ? 'View in Full Catalog' : 'View All Jobs'}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            [1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 animate-pulse flex flex-col justify-between h-48"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 w-2/3">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                      <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
                    </div>
                    <div className="h-5 w-16 bg-slate-100 dark:bg-slate-800 rounded-full" />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <div className="h-5 w-14 bg-slate-100 dark:bg-slate-800 rounded" />
                    <div className="h-5 w-16 bg-slate-100 dark:bg-slate-800 rounded" />
                  </div>
                </div>
                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/2 mt-4" />
              </div>
            ))
          ) : jobsList.length > 0 ? (
            jobsList.map((job: any) => (
              <div
                key={job._id}
                onClick={() => navigate(`/jobs/${job._id}`)}
                className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                        {job.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center">
                        <Building2 className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {job.companyId?.name || 'Verified Company'}
                      </p>
                    </div>
                    <Badge variant="blue" className="capitalize flex-shrink-0">
                      {job.remoteType}
                    </Badge>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {job.skills?.slice(0, 4).map((s: string) => (
                      <span
                        key={s}
                        className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300 font-medium capitalize border border-slate-200/60 dark:border-slate-700"
                      >
                        {s}
                      </span>
                    ))}
                    {job.skills && job.skills.length > 4 && (
                      <span className="text-[10px] text-slate-400 self-center">
                        +{job.skills.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center truncate mr-2">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{job.location}</span>
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex-shrink-0">
                    {job.salaryMin && job.salaryMax
                      ? `${job.currency} ${(job.salaryMin / 100000).toFixed(1)}L - ${(job.salaryMax / 100000).toFixed(1)}L`
                      : 'Competitive'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 px-4 text-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <Briefcase className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                {hasSearched
                  ? `No exact matches found for "${activeSearch}" ${activeLocation ? `in "${activeLocation}"` : ''}`
                  : 'No Job Openings Available Right Now'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                {hasSearched
                  ? 'Try using broader keywords (e.g. React, Engineer, Python) or clear location filters to discover related opportunities.'
                  : 'Check back soon for newly posted engineering and product listings.'}
              </p>
              <div className="mt-5 flex justify-center gap-3">
                {hasSearched && (
                  <Button variant="secondary" size="sm" onClick={handleClearSearch}>
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Show All Openings
                  </Button>
                )}
                <Button variant="primary" size="sm" onClick={handleOpenInCatalog}>
                  Explore Full Catalog
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
