import React from 'react';
import { Search as SearchIcon, MapPin, ChevronDown, ArrowRight } from 'lucide-react';
import { Button } from '../common/Button.js';

interface SearchProps {
  search: string;
  onSearchChange: (value: string) => void;
  location: string;
  onLocationChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading?: boolean;
  className?: string;
}

export const Search: React.FC<SearchProps> = ({
  search,
  onSearchChange,
  location,
  onLocationChange,
  onSubmit,
  className = '',
}) => {
  return (
    <form
      onSubmit={onSubmit}
      className={`mt-7 max-w-xl lg:max-w-2xl bg-white dark:bg-[#0D1220] shadow-xl shadow-purple-500/5 dark:shadow-none border border-slate-200/90 dark:border-slate-800 rounded-full p-1.5 sm:p-2 flex flex-col sm:flex-row items-center gap-2 transition-all focus-within:ring-2 focus-within:ring-indigo-500/30 dark:focus-within:border-indigo-500/50 ${className}`}
    >
      {/* Keyword input */}
      <div className="flex-1 w-full flex items-center px-3.5 py-1.5">
        <SearchIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mr-2.5 flex-shrink-0" />
        <input
          type="text"
          placeholder="Job title, skills, or keywords..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
        />
      </div>

      {/* Divider */}
      <div className="hidden sm:block h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />

      {/* Location input */}
      <div className="flex-1 w-full flex items-center px-3.5 py-1.5">
        <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mr-2.5 flex-shrink-0" />
        <input
          type="text"
          placeholder="City, remote, or country..."
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
          className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
        />
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 ml-1 mr-2 flex-shrink-0" />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        className="w-full sm:w-auto px-7 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white font-semibold rounded-full flex items-center justify-center gap-2 shadow-md shadow-purple-500/25 whitespace-nowrap cursor-pointer text-xs sm:text-sm transition-all"
      >
        <span>Find Jobs</span>
        <ArrowRight className="w-4 h-4" />
      </Button>
    </form>
  );
};
