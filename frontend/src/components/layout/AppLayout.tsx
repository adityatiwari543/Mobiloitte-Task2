import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar.js';
import { Footer } from './Footer.js';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const isAIAssistant = location.pathname.includes('/candidate/ai-assistant');

  return (
    <div
      className={`flex flex-col ${
        isAIAssistant ? 'h-screen h-[100dvh] overflow-hidden' : 'min-h-screen min-h-[100dvh]'
      } bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200`}
    >
      <Navbar />
      <main className={`flex-grow ${isAIAssistant ? 'h-[calc(100dvh-64px)] overflow-hidden' : ''}`}>
        <Outlet />
      </main>
      {!isAIAssistant && <Footer />}
    </div>
  );
};

