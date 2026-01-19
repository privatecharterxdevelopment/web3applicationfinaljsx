/**
 * PolymeshService - Core Polymesh SDK Connection Manager
 *
 * Manages connection to Polymesh blockchain, handles authentication,
 * and provides singleton access to the SDK instance.
 */

import { Polymesh } from '@polymeshassociation/polymesh-sdk';
import { LocalSigningManager } from '@polymeshassociation/local-signing-manager';

// Network configuration
export const POLYMESH_NETWORKS = {
  mainnet: {
    nodeUrl: 'wss://mainnet-rpc.polymesh.network',
    middlewareUrl: 'https://mainnet-graphql.polymesh.network',
    name: 'Polymesh Mainnet'
  },
  testnet: {
    nodeUrl: 'wss://testnet-rpc.polymesh.live',
    middlewareUrl: 'https://testnet-graphql.polymesh.live',
    name: 'Polymesh Testnet'
  }
} as const;

export type NetworkType = keyof typeof POLYMESH_NETWORKS;

// Connection status
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// Service state
interface PolymeshServiceState {
  sdk: Polymesh | null;
  status: ConnectionStatus;
  network: NetworkType | null;
  error: string | null;
  identity: string | null;
}

class PolymeshServiceClass {
  private state: PolymeshServiceState = {
    sdk: null,
    status: 'disconnected',
    network: null,
    error: null,
    identity: null
  };

  private connectionPromise: Promise<Polymesh> | null = null;
  private listeners: Set<(state: PolymeshServiceState) => void> = new Set();

  /**
   * Get current service state
   */
  getState(): PolymeshServiceState {
    return { ...this.state };
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: PolymeshServiceState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }

  private updateState(updates: Partial<PolymeshServiceState>) {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  /**
   * Connect to Polymesh network (read-only mode)
   * This doesn't require a mnemonic - perfect for browsing assets
   */
  async connectReadOnly(network: NetworkType = 'mainnet'): Promise<Polymesh> {
    // Return existing connection if same network
    if (this.state.sdk && this.state.network === network && this.state.status === 'connected') {
      return this.state.sdk;
    }

    // Wait for existing connection attempt
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.updateState({ status: 'connecting', error: null });

    this.connectionPromise = (async () => {
      try {
        const networkConfig = POLYMESH_NETWORKS[network];

        console.log(`[Polymesh] Connecting to ${networkConfig.name}...`);

        const sdk = await Polymesh.connect({
          nodeUrl: networkConfig.nodeUrl,
          middleware: {
            link: networkConfig.middlewareUrl,
            key: '' // Public access
          }
        });

        console.log(`[Polymesh] Connected to ${networkConfig.name}`);

        this.updateState({
          sdk,
          status: 'connected',
          network,
          error: null
        });

        return sdk;
      } catch (error: any) {
        console.error('[Polymesh] Connection error:', error);
        this.updateState({
          status: 'error',
          error: error.message || 'Failed to connect to Polymesh'
        });
        throw error;
      } finally {
        this.connectionPromise = null;
      }
    })();

    return this.connectionPromise;
  }

  /**
   * Connect with signing capability (requires mnemonic)
   * Used for transactions like investing
   */
  async connectWithSigner(
    mnemonic: string,
    network: NetworkType = 'mainnet'
  ): Promise<Polymesh> {
    this.updateState({ status: 'connecting', error: null });

    try {
      const networkConfig = POLYMESH_NETWORKS[network];

      // Create local signing manager from mnemonic
      const signingManager = await LocalSigningManager.create({
        accounts: [{ mnemonic }]
      });

      const sdk = await Polymesh.connect({
        nodeUrl: networkConfig.nodeUrl,
        signingManager,
        middleware: {
          link: networkConfig.middlewareUrl,
          key: ''
        }
      });

      // Get the identity
      const identity = await sdk.getSigningIdentity();
      const did = identity?.did || null;

      console.log(`[Polymesh] Connected with identity: ${did}`);

      this.updateState({
        sdk,
        status: 'connected',
        network,
        identity: did,
        error: null
      });

      return sdk;
    } catch (error: any) {
      console.error('[Polymesh] Connection with signer error:', error);
      this.updateState({
        status: 'error',
        error: error.message || 'Failed to connect with signer'
      });
      throw error;
    }
  }

  /**
   * Get the SDK instance (connects if needed)
   */
  async getSDK(network: NetworkType = 'mainnet'): Promise<Polymesh> {
    if (this.state.sdk && this.state.status === 'connected') {
      return this.state.sdk;
    }
    return this.connectReadOnly(network);
  }

  /**
   * Disconnect from Polymesh
   */
  async disconnect(): Promise<void> {
    if (this.state.sdk) {
      try {
        await this.state.sdk.disconnect();
      } catch (error) {
        console.warn('[Polymesh] Error during disconnect:', error);
      }
    }

    this.updateState({
      sdk: null,
      status: 'disconnected',
      network: null,
      identity: null,
      error: null
    });
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.state.status === 'connected' && this.state.sdk !== null;
  }

  /**
   * Get current network info
   */
  getNetworkInfo(): { network: NetworkType | null; url: string | null } {
    if (!this.state.network) {
      return { network: null, url: null };
    }
    return {
      network: this.state.network,
      url: POLYMESH_NETWORKS[this.state.network].nodeUrl
    };
  }

  /**
   * Get signing identity DID
   */
  getIdentity(): string | null {
    return this.state.identity;
  }
}

// Export singleton instance
export const PolymeshService = new PolymeshServiceClass();

// Export types
export type { PolymeshServiceState };
