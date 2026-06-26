import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { ShopCartProvider } from './context/ShopCartContext';
import { getGoogleClientId } from './components/auth/GoogleSignInButton';
import { queryClient } from './lib/queryClient';
import { initPwaDisplayMode, registerAppServiceWorker } from './utils/pwa';

initPwaDisplayMode();
registerAppServiceWorker();

const googleClientId = getGoogleClientId();

const AppTree = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ShopCartProvider>
        <App />
      </ShopCartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {googleClientId ? (
      <GoogleOAuthProvider clientId={googleClientId}>
        <AppTree />
      </GoogleOAuthProvider>
    ) : (
      <AppTree />
    )}
  </StrictMode>
);
