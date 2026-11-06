import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { ShareSheetProvider } from './context/ShareSheetContext';
import { queryClient } from './lib/queryClient';
import { initPwaDisplayMode, registerAppServiceWorker } from './utils/pwa';
import { applyBootTheme } from './preferences/displayPreferences';

applyBootTheme();
initPwaDisplayMode();
registerAppServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ShareSheetProvider>
          <App />
        </ShareSheetProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
