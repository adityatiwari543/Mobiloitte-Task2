import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.js';
import './index.css';

// Security: Clean up any legacy auth tokens from localStorage so only 'theme' is stored
try {
  localStorage.removeItem('jobconnect_at');
  localStorage.removeItem('jobconnect_rt');
} catch {}

// Global Date Picker Opener: Clicking anywhere on any date or datetime-local input triggers the native calendar picker
if (typeof window !== 'undefined') {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    // 1. Direct click on date or datetime-local input
    if (target instanceof HTMLInputElement && (target.type === 'date' || target.type === 'datetime-local')) {
      try {
        target.showPicker?.();
      } catch {}
      return;
    }

    // 2. Click on calendar icon, icon container, or input wrapper
    const wrapper = target.closest('label, .relative');
    if (wrapper && wrapper.clientHeight < 120) {
      const dateInput = wrapper.querySelector<HTMLInputElement>('input[type="date"], input[type="datetime-local"]');
      if (dateInput && target !== dateInput) {
        try {
          dateInput.showPicker?.();
        } catch {}
      }
    }
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
