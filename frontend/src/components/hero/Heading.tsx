import React from 'react';

interface HeadingProps {
  className?: string;
}

export const Heading: React.FC<HeadingProps> = ({ className = '' }) => {
  return (
    <h1
      className={`text-3xl sm:text-5xl lg:text-[3.25rem] font-black tracking-tight leading-[1.12] ${className}`}
    >
      <span className="text-slate-950 dark:text-[#F8FAFC]">Connect with your </span>
      <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
        next career
      </span>
      <br />
      <span className="text-slate-950 dark:text-[#F8FAFC]">opportunity on </span>
      <span className="relative inline-block text-indigo-600 dark:text-indigo-400 font-black">
        JobConnect
        <span className="absolute left-0 -bottom-1 w-full h-[3.5px] bg-gradient-to-r from-blue-600 to-purple-600 rounded-full" />
      </span>
    </h1>
  );
};
