import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App.tsx';
import './index.css';
import './i18n';

// Create a client
const queryClient = new QueryClient();

// Get the current domain and configure Auth0 redirect
const domain = window.location.hostname;
const isAdminDomain = domain.startsWith('admin.');
const dashboardDomain = isAdminDomain ? domain : `dashboard.${domain.replace('dashboard.', '')}`;
const redirectUri = isAdminDomain 
  ? `https://${domain}/dashboard`
  : `https://${dashboardDomain}/dashboard`;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <Auth0Provider
        domain={import.meta.env.VITE_AUTH0_DOMAIN}
        clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
        authorizationParams={{
          redirect_uri: redirectUri,
          audience: `https://${import.meta.env.VITE_AUTH0_DOMAIN}/api/v2/`,
          scope: 'openid profile email'
        }}
        cacheLocation="localstorage"
        useRefreshTokens={true}
      >
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </Auth0Provider>
    </Router>
  </StrictMode>
);