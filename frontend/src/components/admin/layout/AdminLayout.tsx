import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api.js';
import { AdminSidebar } from './AdminSidebar.js';
import { AdminHeader } from './AdminHeader.js';
import { AdminCommandPaletteModal } from './AdminCommandPaletteModal.js';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Poll total applications count every 10 seconds to track newly received applications
  const { data: appsData } = useQuery({
    queryKey: ['adminApplicationsCount'],
    queryFn: async () => {
      const res = await api.get('/admin/applications', { params: { limit: 1 } });
      return res.data?.data?.pagination?.total ?? 0;
    },
    refetchInterval: 10000,
  });

  const totalApplications = appsData ?? 0;
  const [unseenAppsCount, setUnseenAppsCount] = useState<number>(0);
  const lastSeenAppsRef = useRef<number | null>(null);

  // Update unseen count on applications change or route change in-memory
  useEffect(() => {
    if (lastSeenAppsRef.current === null) {
      lastSeenAppsRef.current = totalApplications;
      setUnseenAppsCount(0);
    } else if (location.pathname === '/admin/applications') {
      lastSeenAppsRef.current = totalApplications;
      setUnseenAppsCount(0);
    } else {
      const diff = Math.max(0, totalApplications - lastSeenAppsRef.current);
      setUnseenAppsCount(diff);
    }
  }, [totalApplications, location.pathname]);

  // When admin navigates to /admin/applications, clear badge immediately
  useEffect(() => {
    if (location.pathname === '/admin/applications' && totalApplications >= 0) {
      lastSeenAppsRef.current = totalApplications;
      setUnseenAppsCount(0);
    }
  }, [location.pathname, totalApplications]);

  return (
    <div className="flex h-screen h-[100dvh] overflow-hidden bg-slate-50 dark:bg-[#070b16] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Dedicated Desktop & Mobile Admin Sidebar */}
      <AdminSidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        applicationsBadgeCount={unseenAppsCount}
      />

      {/* Main Administrative Work Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Admin Top Header with Search, Notifications, Theme & Profile */}
        <AdminHeader
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        />

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-6 lg:p-8 overscroll-contain">
          <Outlet />
        </main>
      </div>

      {/* Global Command Palette (Ctrl + K) */}
      <AdminCommandPaletteModal
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
};

export default AdminLayout;
