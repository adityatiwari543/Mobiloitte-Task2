import React from 'react';
import { Briefcase, Shield, Sparkles, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Briefcase className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">JobConnect</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enterprise-grade Job Portal engineered with MERN, TypeScript, Redis caching, real-time Socket.IO, and AI career matching.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Candidates</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="/jobs" className="hover:text-white transition-colors">Search Jobs</a></li>
              <li><a href="/candidate/profile" className="hover:text-white transition-colors">Profile Completeness</a></li>
              <li><a href="/candidate/ai-assistant" className="hover:text-white transition-colors">AI Career Advisor</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Recruiters</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="/recruiter/jobs/create" className="hover:text-white transition-colors">Post a Job</a></li>
              <li><a href="/recruiter/dashboard" className="hover:text-white transition-colors">Hiring Pipeline</a></li>
              <li><a href="/recruiter/jobs" className="hover:text-white transition-colors">AI Job Generator</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Security & Trust</h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center space-x-1.5 text-emerald-400">
                <Shield className="w-4 h-4" />
                <span>Zero-Trust RBAC & CSRF Protected</span>
              </div>
              <div className="flex items-center space-x-1.5 text-blue-400">
                <Sparkles className="w-4 h-4" />
                <span>AI Assistive Match Intelligence</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} JobConnect Portal. Built for high reliability and scale.</p>
          <p className="flex items-center mt-2 sm:mt-0">
            Engineered with <Heart className="w-3.5 h-3.5 mx-1 text-red-500 fill-red-500" /> for modern developers
          </p>
        </div>
      </div>
    </footer>
  );
};
