import React from 'react';
import { Activity, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';

interface PlatformHealthProps {
  health?: {
    frontend?: string;
    backend?: string;
    database?: string;
    redis?: string;
    socket?: string;
  };
}

export const PlatformHealth: React.FC<PlatformHealthProps> = ({ health }) => {
  const systems = [
    {
      name: 'Frontend',
      status: health?.frontend || 'healthy',
      label: 'Operational',
    },
    {
      name: 'Backend API',
      status: health?.backend || 'healthy',
      label: 'Operational',
    },
    {
      name: 'Database (MongoDB)',
      status: health?.database || 'healthy',
      label: health?.database === 'healthy' ? 'Connected' : 'Degraded',
    },
    {
      name: 'Redis Cache',
      status: health?.redis || 'healthy',
      label: health?.redis === 'healthy' ? 'Connected' : 'Fallback Mode',
    },
    {
      name: 'Socket.IO',
      status: health?.socket || 'healthy',
      label: 'Connected',
    },
  ];

  const allHealthy = systems.every((s) => s.status === 'healthy');

  return (
    <div className="bg-white dark:bg-[#0c1427] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-colors">
      <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Platform Health</h3>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Realtime
        </span>
      </div>

      <div className="space-y-3">
        {systems.map((sys) => {
          const isHealthy = sys.status === 'healthy';
          return (
            <div
              key={sys.name}
              className="flex items-center justify-between py-1 text-xs"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isHealthy ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
                <span className="font-medium text-slate-700 dark:text-slate-300">{sys.name}</span>
              </div>
              <span
                className={`font-semibold ${
                  isHealthy ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {sys.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        {allHealthy ? (
          <>
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>All 5 subsystems running without incident.</span>
          </>
        ) : (
          <>
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Some subsystems are operating in fallback mode.</span>
          </>
        )}
      </div>
    </div>
  );
};
export default PlatformHealth;
