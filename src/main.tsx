import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { queryClient } from './lib/queryClient';
import { initPwaDisplayMode, registerAppServiceWorker } from './utils/pwa';
import { applyBootTheme } from './preferences/displayPreferences';
import { initWebVitalsRum } from './perf/webVitals';
applyBootTheme();
initPwaDisplayMode();
registerAppServiceWorker();
initWebVitalsRum();

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </StrictMode>
  </BrowserRouter>
);
