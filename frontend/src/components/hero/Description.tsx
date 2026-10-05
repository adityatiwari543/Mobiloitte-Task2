import React from 'react';

interface DescriptionProps {
  text?: string;
  className?: string;
}

export const Description: React.FC<DescriptionProps> = ({
  text = 'Discover thousands of verified tech roles, get deterministic skills matching, and connect directly with hiring managers in real time.',
  className = '',
}) => {
  return (
    <p
      className={`mt-4 text-sm sm:text-base text-slate-600 dark:text-[#94A3B8] max-w-lg font-normal leading-relaxed ${className}`}
    >
      {text}
    </p>
  );
};
