import React from 'react';
import { HeroContent } from './HeroContent.js';
import { HeroVisual } from './HeroVisual.js';

interface HeroProps {
  search: string;
  onSearchChange: (value: string) => void;
  location: string;
  onLocationChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onTrendingClick: (skill: string) => void;
  matchScore?: number | string;
  companyCount?: string;
  interviewTime?: string;
  interviewTitle?: string;
  onAIClick?: () => void;
  onCompaniesClick?: () => void;
  onMatchScoreClick?: () => void;
  onInterviewClick?: () => void;
  className?: string;
}

export const Hero: React.FC<HeroProps> = ({
  search,
  onSearchChange,
  location,
  onLocationChange,
  onSearchSubmit,
  onTrendingClick,
  matchScore = '98%',
  companyCount = '1,200+',
  interviewTime = 'Tomorrow at 11:30 AM',
  interviewTitle = 'Interview Scheduled',
  onAIClick,
  onCompaniesClick,
  onMatchScoreClick,
  onInterviewClick,
  className = '',
}) => {
  return (
    <section
      className={`relative overflow-hidden bg-gradient-to-b from-[#FAF7F2] via-[#FDFBF7] to-white dark:from-[#080B14] dark:via-[#090E1B] dark:to-[#080B14] pt-8 sm:pt-10 pb-12 sm:pb-16 lg:py-14 transition-colors ${className}`}
    >
      {/* Decorative angled blue pill shape on the far left edge (matching reference design) */}
      <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-12 h-28 bg-blue-500/20 dark:bg-indigo-600/20 rounded-r-3xl -rotate-12 blur-[1px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-4 items-center">
          {/* Left Column: HeroContent (Headline, Description, Search, Trending) */}
          <div className="lg:col-span-6 xl:col-span-6">
            <HeroContent
              search={search}
              onSearchChange={onSearchChange}
              location={location}
              onLocationChange={onLocationChange}
              onSubmit={onSearchSubmit}
              onTrendingClick={onTrendingClick}
            />
          </div>

          {/* Right Column: HeroVisual (Clean Persona Visual & Floating Cards) */}
          <div className="lg:col-span-6 xl:col-span-6 flex justify-center lg:justify-end">
            <HeroVisual
              score={matchScore}
              companyCount={companyCount}
              interviewTime={interviewTime}
              interviewTitle={interviewTitle}
              onAIClick={onAIClick}
              onCompaniesClick={onCompaniesClick}
              onMatchScoreClick={onMatchScoreClick}
              onInterviewClick={onInterviewClick}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
