import React from 'react';
import { Rocket, BarChart3, Sparkles } from 'lucide-react';
import { authHeroCleanLight } from '../../assets/images/index.js';

interface HeroVisualProps {
  className?: string;
}

export const HeroVisual: React.FC<HeroVisualProps> = ({ className = '' }) => {
  return (
    <div
      className={`relative w-full max-w-[490px] xl:max-w-[540px] flex items-center justify-center select-none py-4 transition-all duration-300 ${className}`}
    >
      {/* Ambient background glow aura behind the visual */}
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/15 via-indigo-500/15 to-blue-500/10 dark:from-purple-600/25 dark:via-indigo-600/25 dark:to-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Visual Image Container (Enlarged and rotated/flipped so screen & angle face toward the Sign In form) */}
      <div className="relative w-full aspect-[16/11] rounded-3xl overflow-hidden border border-slate-200/70 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 shadow-2xl shadow-purple-500/10 dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        {/* The 3D laptop flipped horizontally with scale-x-[-1] so it faces TOWARDS the center Sign In card */}
        <div className="w-full h-full relative overflow-hidden">
          <img
            src={authHeroCleanLight}
            alt="JobConnect modern candidate career workspace with AI recommendation and verified profile"
            className="w-full h-full object-cover object-center scale-x-[-1] transition-transform duration-700 hover:scale-x-[-1] hover:scale-y-[1.02] dark:brightness-[0.92] dark:contrast-[1.05]"
            loading="eager"
            decoding="async"
          />

          {/* Frosted overlay on the screen to soften the reversed text into a clean abstract profile preview */}
          <div
            className="absolute top-[16%] right-[15%] w-[42%] h-[46%] rounded-2xl backdrop-blur-[2.5px] bg-white/20 dark:bg-slate-900/30 border border-white/40 dark:border-white/10 pointer-events-none shadow-xs"
            aria-hidden="true"
          />

          {/* Subtle dark gradient overlay to blend into dark theme seamlessly */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-950/20 via-transparent to-transparent hidden dark:block" />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* REAL DOM FLOATING MICRO-CARDS (Placed harmoniously around enlarged visual) */}
      {/* ========================================================================= */}

      {/* Card 1: Better Opportunities (Top Right) */}
      <div
        className="absolute -top-3 -right-2 sm:-right-4 z-20 flex items-center space-x-2.5 px-4 py-2.5 rounded-2xl bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-purple-500/10 dark:shadow-[0_12px_30px_rgba(0,0,0,0.6)] animate-in fade-in slide-in-from-top-3 duration-500 motion-safe:hover:-translate-y-0.5 transition-all"
        style={{
          animation: 'floatSlow 4.5s ease-in-out infinite',
        }}
      >
        <div className="w-8 h-8 rounded-xl bg-pink-50 dark:bg-pink-950/70 border border-pink-200/70 dark:border-pink-800/60 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0 shadow-2xs">
          <Rocket className="w-4 h-4" />
        </div>
        <div className="text-left">
          <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
            Better Opportunities
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            Top tech companies
          </p>
        </div>
      </div>

      {/* Card 2: Higher Salary (Middle Right / Offset) */}
      <div
        className="absolute top-[48%] -right-3 sm:-right-6 z-20 flex items-center space-x-2.5 px-4 py-2.5 rounded-2xl bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-purple-500/10 dark:shadow-[0_12px_30px_rgba(0,0,0,0.6)] animate-in fade-in slide-in-from-right-3 duration-500 delay-150 motion-safe:hover:-translate-y-0.5 transition-all"
        style={{
          animation: 'floatSlow 4.8s ease-in-out infinite 1.2s',
        }}
      >
        <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/70 border border-purple-200/70 dark:border-purple-800/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-2xs">
          <BarChart3 className="w-4 h-4" />
        </div>
        <div className="text-left">
          <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
            Higher Salary
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            +35% avg increase
          </p>
        </div>
      </div>

      {/* Card 3: Grow Your Career (Bottom Left - facing the Sign In form) */}
      <div
        className="absolute -bottom-3 -left-3 sm:-left-6 z-20 flex items-center space-x-2.5 px-4 py-2.5 rounded-2xl bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-purple-500/10 dark:shadow-[0_12px_30px_rgba(0,0,0,0.6)] animate-in fade-in slide-in-from-bottom-3 duration-500 delay-300 motion-safe:hover:-translate-y-0.5 transition-all"
        style={{
          animation: 'floatSlow 5.2s ease-in-out infinite 2.4s',
        }}
      >
        <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/70 border border-amber-200/70 dark:border-amber-800/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-2xs">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="text-left">
          <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
            Grow Your Career
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            AI personalized roadmap
          </p>
        </div>
      </div>
    </div>
  );
};
