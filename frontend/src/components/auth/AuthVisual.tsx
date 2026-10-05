import React from 'react';
import { authVisualLight, authVisualDark } from '../../assets/images/index.js';

interface AuthVisualProps {
  className?: string;
}

export const AuthVisual: React.FC<AuthVisualProps> = ({ className = '' }) => {
  return (
    <div
      className={`relative w-full max-w-[340px] xl:max-w-[380px] flex flex-col items-center justify-center select-none pointer-events-auto ${className}`}
    >
      {/* Ambient background glow behind the 3D illustration */}
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-indigo-500/10 to-transparent dark:from-purple-600/20 dark:via-blue-600/20 rounded-full blur-2xl pointer-events-none" />

      {/* Light Theme 3D Composition (shown when not dark mode) */}
      <div className="block dark:hidden w-full relative group">
        <img
          src={authVisualLight}
          alt="JobConnect candidate opportunities illustration"
          className="w-full h-auto object-contain rounded-2xl drop-shadow-sm transition-transform duration-500 hover:scale-[1.02]"
          loading="eager"
        />
      </div>

      {/* Dark Theme 3D Composition (shown in dark mode) */}
      <div className="hidden dark:block w-full relative group">
        <img
          src={authVisualDark}
          alt="JobConnect candidate opportunities illustration dark"
          className="w-full h-auto object-contain rounded-2xl drop-shadow-[0_10px_30px_rgba(99,102,241,0.2)] transition-transform duration-500 hover:scale-[1.02]"
          loading="eager"
        />
      </div>
    </div>
  );
};
