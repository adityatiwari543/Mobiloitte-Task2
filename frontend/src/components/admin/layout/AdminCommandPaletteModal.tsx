import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Users,
  Briefcase,
  FileText,
  ShieldCheck,
  Clock,
  Settings,
  ArrowRight,
  X,
} from 'lucide-react';

interface AdminCommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminCommandPaletteModal: React.FC<AdminCommandPaletteModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickLinks = [
    { label: 'Admin Dashboard', desc: 'Platform KPIs & system health overview', to: '/admin/dashboard', icon: Search },
    { label: 'User Management', desc: 'Browse, filter & suspend candidates and recruiters', to: '/admin/users', icon: Users },
    { label: 'Job Content Moderation', desc: 'Review, approve, pause, or reject job postings', to: '/admin/jobs', icon: Briefcase },
    { label: 'Security Audit Trail', desc: 'Inspect immutable system events and authentication logs', to: '/admin/audit-logs', icon: Clock },
    { label: 'Application Oversight', desc: 'Audit candidate applications and status', to: '/admin/applications', icon: FileText },
    { label: 'Moderate Flagged Jobs', desc: 'Review pending and reported job postings', to: '/admin/jobs?filter=pending', icon: ShieldCheck },
    { label: 'Admin Profile & Security', desc: 'Configure account settings and security credentials', to: '/admin/profile', icon: Settings },
  ];

  const filteredLinks = query.trim()
    ? quickLinks.filter(
        (link) =>
          link.label.toLowerCase().includes(query.toLowerCase()) ||
          link.desc.toLowerCase().includes(query.toLowerCase())
      )
    : quickLinks;

  const handleSelect = (to: string) => {
    onClose();
    navigate(to);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search users, jobs, audit logs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredLinks.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
              No matching commands or pages found.
            </div>
          ) : (
            filteredLinks.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleSelect(item.to)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 text-left transition-colors group cursor-pointer"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-200/60 dark:border-purple-800/60">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {item.label}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                </button>
              );
            })
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-[#0b1120] border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Navigate with mouse or keyboard</span>
          <span>
            Press <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">ESC</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
};
