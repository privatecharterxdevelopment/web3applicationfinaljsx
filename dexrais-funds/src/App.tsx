import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WagmiProvider } from './lib/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Home from './pages/Home';
import CreateCampaign from './pages/CreateCampaign';
import CreatorDashboard from './pages/CreatorDashboard';
import Launchpad from './pages/Launchpad';
import CampaignDetail from './pages/CampaignDetail';

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreateCampaign />} />
            <Route path="/dashboard" element={<CreatorDashboard />} />
            <Route path="/launchpad" element={<Launchpad />} />
            <Route path="/campaign/:id" element={<CampaignDetail />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
