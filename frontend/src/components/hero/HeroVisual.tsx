import React from 'react';
import { CleanBackgroundImage } from './CleanBackgroundImage.js';
import { AIRecommendationCard } from './AIRecommendationCard.js';
import { VerifiedCompaniesCard } from './VerifiedCompaniesCard.js';
import { MatchScoreCard } from './MatchScoreCard.js';
import { InterviewCard } from './InterviewCard.js';

interface HeroVisualProps {
  score?: number | string;
  companyCount?: string;
  interviewTime?: string;
  interviewTitle?: string;
  onAIClick?: () => void;
  onCompaniesClick?: () => void;
  onMatchScoreClick?: () => void;
  onInterviewClick?: () => void;
  className?: string;
}

export const HeroVisual: React.FC<HeroVisualProps> = ({
  score = '98%',
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
    <div
      className={`hero-visual relative w-full max-w-[620px] flex flex-col items-center justify-center select-none ${className}`}
    >
      {/* Background ambient glowing orbs (CSS based, GPU light) */}
      <div className="absolute -top-8 -right-8 w-60 h-60 bg-blue-500/10 dark:bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-60 h-60 bg-purple-500/10 dark:bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Clean Hero Candidate Visual Asset */}
      <div className="relative w-full">
        <CleanBackgroundImage />

        {/* Desktop / Tablet Floating Cards (Relative to .hero-visual container, Rule 18 & 19) */}
        <div className="hidden md:block">
          {/* 1. Top-Left: AI-Powered */}
          <div className="absolute top-4 left-[6%] sm:left-[8%] lg:left-[10%] z-20">
            <AIRecommendationCard onClick={onAIClick} />
          </div>

          {/* 2. Top-Right: 1,200+ Verified Companies */}
          <div className="absolute top-4 right-4 sm:right-6 lg:right-6 z-20">
            <VerifiedCompaniesCard count={companyCount} onClick={onCompaniesClick} />
          </div>

          {/* 3. Middle-Left: 98% Match Score (Right at curve apex) */}
          <div className="absolute top-[50%] -translate-y-1/2 -left-2 sm:-left-4 lg:-left-6 z-20">
            <MatchScoreCard score={score} onClick={onMatchScoreClick} />
          </div>

          {/* 4. Bottom-Right: Interview Scheduled */}
          <div className="absolute bottom-4 right-4 sm:bottom-5 sm:right-6 lg:bottom-5 lg:right-6 z-20">
            <InterviewCard
              title={interviewTitle}
              time={interviewTime}
              onClick={onInterviewClick}
            />
          </div>
        </div>
      </div>

      {/* Mobile-Friendly Structured Card Grid (Rule 47 & 49: clean flow without overlapping face) */}
      <div className="grid md:hidden grid-cols-1 sm:grid-cols-2 gap-2.5 w-full mt-4 px-1">
        <AIRecommendationCard onClick={onAIClick} />
        <VerifiedCompaniesCard count={companyCount} onClick={onCompaniesClick} />
        <MatchScoreCard score={score} onClick={onMatchScoreClick} />
        <InterviewCard
          title={interviewTitle}
          time={interviewTime}
          onClick={onInterviewClick}
        />
      </div>
    </div>
  );
};
