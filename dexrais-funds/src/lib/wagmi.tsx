import { createAppKit } from '@reown/appkit/react';
import { WagmiProvider as Wagmi, createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { walletConnect } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

if (!projectId) {
  console.warn('Missing VITE_WALLETCONNECT_PROJECT_ID');
}

// Wagmi config
const wagmiConfig = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  connectors: [
    walletConnect({ projectId, showQrModal: false }),
  ],
});

// AppKit config
const metadata = {
  name: 'DexRais.funds',
  description: 'Decentralized fundraising for DAOs and Web3 projects',
  url: 'https://dexrais.funds',
  icons: ['https://dexrais.funds/icon.png'],
};

createAppKit({
  adapters: [wagmiConfig as any],
  projectId,
  networks: [base],
  metadata,
  features: {
    analytics: true,
  },
});

const queryClient = new QueryClient();

export function WagmiProvider({ children }: { children: React.ReactNode }) {
  return (
    <Wagmi config={wagmiConfig as any}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </Wagmi>
  );
}

export { wagmiConfig };
