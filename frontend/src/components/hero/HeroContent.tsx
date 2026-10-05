import React from 'react';
import { Badge } from './Badge.js';
import { Heading } from './Heading.js';
import { Description } from './Description.js';
import { Search } from './Search.js';
import { TrendingSkills } from './TrendingSkills.js';

interface HeroContentProps {
  search: string;
  onSearchChange: (value: string) => void;
  location: string;
  onLocationChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onTrendingClick: (skill: string) => void;
  className?: string;
}

export const HeroContent: React.FC<HeroContentProps> = ({
  search,
  onSearchChange,
  location,
  onLocationChange,
  onSubmit,
  onTrendingClick,
  className = '',
}) => {
  return (
    <div className={`max-w-2xl text-left ${className}`}>
      <Badge />
      <Heading />
      <Description />
      <Search
        search={search}
        onSearchChange={onSearchChange}
        location={location}
        onLocationChange={onLocationChange}
        onSubmit={onSubmit}
      />
      <TrendingSkills onSkillClick={onTrendingClick} />
    </div>
  );
};
