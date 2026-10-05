import React from 'react';
import { heroCleanLight } from '../../assets/images/index.js';

interface CleanBackgroundImageProps {
  className?: string;
}

export const CleanBackgroundImage: React.FC<CleanBackgroundImageProps> = ({
  className = '',
}) => {
  return (
    <div
      className={`relative w-full h-full min-h-[380px] sm:min-h-[420px] lg:min-h-[460px] flex items-center justify-end select-none ${className}`}
    >
      {/* SVG ClipPath Definition for the Organic Left Curve (Desktop & Tablet) */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <clipPath id="hero-curve-clip" clipPathUnits="objectBoundingBox">
            <path d="M 0.22 0 C 0.01 0.35, 0.01 0.65, 0.15 1 L 1 1 L 1 0 Z" />
          </clipPath>
        </defs>
      </svg>

      {/* Outer Halo Crescent Arc behind the image curve (matching reference light blue glow) */}
      <div className="hidden lg:block absolute inset-y-0 right-0 w-[540px] pointer-events-none z-0">
        <svg
          className="w-full h-full text-blue-100/70 dark:text-indigo-900/30"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          fill="none"
        >
          <path
            d="M 23 0 C -1 35, -1 65, 16 100"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Main Hero Image Wrapper */}
      <div
        className="relative w-full lg:w-[520px] xl:w-[560px] h-[340px] sm:h-[400px] lg:h-[450px] overflow-hidden rounded-3xl lg:rounded-none z-10 transition-all duration-300"
        style={{
          clipPath: undefined, // will apply on lg via media or class
        }}
      >
        {/* On desktop (lg+), apply the clipPath style */}
        <div
          className="w-full h-full relative overflow-hidden rounded-2xl lg:rounded-none lg:[clip-path:url(#hero-curve-clip)]"
        >
          {/* Single clean Hero Image - no duplicate image tags (Rule 13, 14, 15) */}
          <img
            src={heroCleanLight}
            alt="Professional candidate working on a laptop"
            {...({ fetchpriority: 'high' } as any)}
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover object-[center_25%] transition-all duration-300 dark:brightness-[0.88] dark:contrast-[1.05]"
          />

          {/* Dark Mode Navy Blend Overlay (Rule 13: same image with controlled navy overlay) */}
          <div className="absolute inset-0 bg-[#080B14]/45 dark:block hidden pointer-events-none mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080B14]/60 via-transparent to-transparent dark:block hidden pointer-events-none" />

          {/* Light Mode Subtle Edge Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent dark:hidden pointer-events-none" />
        </div>

        {/* Motivational Handwritten Script Note & Curved Arrow (as present in reference) */}
        <div className="hidden sm:flex absolute right-5 sm:right-8 lg:right-10 top-[44%] z-20 pointer-events-none select-none flex-col items-end">
          {/* Light mode text */}
          <div className="dark:hidden transform rotate-[3deg] text-right font-['Caveat',_'Brush_Script_MT',_'Segoe_Print',_cursive]">
            <span className="block text-indigo-700/90 text-xs sm:text-sm font-bold tracking-wide drop-shadow-xs">
              Better Skills
            </span>
            <span className="block text-indigo-700/90 text-xs sm:text-sm font-bold tracking-wide drop-shadow-xs">
              Bigger Opportunities
            </span>
          </div>

          {/* Dark mode text */}
          <div className="hidden dark:block transform -rotate-[2deg] text-right font-['Caveat',_'Brush_Script_MT',_'Segoe_Print',_cursive]">
            <span className="block text-white/95 text-xs sm:text-sm font-bold tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              Build Your
            </span>
            <span className="block text-white/95 text-xs sm:text-sm font-bold tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              Dream Career
            </span>
          </div>

          {/* Curved Arrow pointing down to Interview card */}
          <svg
            className="w-6 h-6 sm:w-7 sm:h-7 mr-3 text-indigo-600/85 dark:text-white/90 transform rotate-6 mt-0.5"
            viewBox="0 0 40 40"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M 22 4 C 30 14, 24 22, 16 28 C 12 32, 14 34, 18 36" />
            <path d="M 12 31 L 18 36 L 19 29" />
          </svg>
        </div>
      </div>
    </div>
  );
};
