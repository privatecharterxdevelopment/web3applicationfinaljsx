import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WagmiProvider } from './lib/wagmi';
import { AuthProvider } from './context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Home from './pages/Home';
import PricingSelection from './pages/PricingSelection';
import CreateCampaign from './pages/CreateCampaign';
import CreatorDashboard from './pages/CreatorDashboard';
import Launchpad from './pages/Launchpad';
import CampaignDetail from './pages/CampaignDetail';
import ProfileDashboard from './pages/ProfileDashboard';
import AuthCallback from './pages/AuthCallback';
import Privacy from './pages/Privacy';

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/pricing" element={<PricingSelection />} />
              <Route path="/create" element={<CreateCampaign />} />
              <Route path="/dashboard" element={<CreatorDashboard />} />
              <Route path="/launchpad" element={<Launchpad />} />
              <Route path="/campaign/:id" element={<CampaignDetail />} />
              <Route path="/profile" element={<ProfileDashboard />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/privacy" element={<Privacy />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
