// src/lib/web3.ts
import { createPublicClient, http, parseAbi } from 'viem';
import { base } from 'viem/chains';

// ===== CONFIG =====
const ALCHEMY_API_KEY = 'nAGVpg8dv1k94VJ_Q-SG0';
const RPC_URL = `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
const NFT_CONTRACT_ADDRESS = '0xDF86Cf55BD2E58aaaC09160AaD0ed8673382B339' as `0x${string}`;
const CO2_CONTRACT_ADDRESS = '0x26F42A3B48D67103BD59D5C45118f353888501B0' as `0x${string}`;
const CHAIN = base;

// viem public client for reads
const publicClient = createPublicClient({
  chain: CHAIN,
  transport: http(RPC_URL)
});

// ABI for ERC721 (minimal for ownership/metadata)
const ERC721_ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function name() view returns (string)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function ownerOf(uint256 tokenId) view returns (address)'
]);

// Mock/default benefits
const NFT_BENEFITS_MAP: Record<string, NFTBenefit> = {
  'default': {
    tokenId: '',
    name: 'PrivateCharterX VIP Pass',
    description: 'Exclusive member benefits including free empty leg flight, up to 10% permanent discount, and priority access. More on OpenSea: https://opensea.io/collection/privatecharterx-membership-card',
    image: '',
    collection: 'PrivateCharterX VIP',
    discountPercent: 10,
    benefits: [
      'Free Empty Leg Flight',
      'Up to 10% Permanent Discount',
      'Priority Empty Leg Access',
      'Complimentary Limousine Transfers',
      '24/7 Priority Support',
      'Early Token Access',
      '$PVCX Token Rewards',
      'VIP Event Invitations'
    ]
  }
};

// Default CO2 certificate template
const CO2_CERTIFICATE_DEFAULT = {
  tokenId: '',
  name: 'CO2 Offset Certificate',
  description: 'Verified carbon offset certificate for sustainable travel',
  image: '',
  carbonOffset: 'N/A',
  issuer: 'PrivateCharterX',
  flightId: '',
  offsetDate: ''
};

// ===== TYPES =====
export interface NFTBenefit {
  tokenId: string;
  name: string;
  description: string;
  image: string;
  collection: string;
  discountPercent: number;
  benefits: string[];
}

export interface CO2Certificate {
  tokenId: string;
  name: string;
  description?: string;
  image?: string;
  carbonOffset?: string;
  issuer?: string;
  flightId?: string;
  offsetDate?: string;
}

export interface DiscountEligibility {
  hasDiscount: boolean;
  discountPercent: number;
  nftName?: string;
  benefits?: string[];
}

// ===== WEB3 SERVICE =====
class Web3Service {
  private static instance: Web3Service;

  static getInstance(): Web3Service {
    if (!Web3Service.instance) {
      Web3Service.instance = new Web3Service();
    }
    return Web3Service.instance;
  }

  // Get all NFTs for user - tries multiple methods
  async getUserNFTs(userAddress: `0x${string}`): Promise<NFTBenefit[]> {
    console.log('Fetching NFTs for:', userAddress);

    // Try Alchemy API first
    try {
      return await this.getUserNFTsViaAlchemy(userAddress);
    } catch (error) {
      console.log('Alchemy failed, trying contract method...');
      return await this.getUserNFTsViaContract(userAddress);
    }
  }

  // Method 1: Alchemy API
  async getUserNFTsViaAlchemy(userAddress: `0x${string}`, contractAddress?: `0x${string}`): Promise<NFTBenefit[]> {
    try {
      const targetContract = contractAddress || NFT_CONTRACT_ADDRESS;

      // Use contract-specific endpoint if filtering for a specific contract
      const url = contractAddress
        ? `${RPC_URL}/getNFTs?owner=${userAddress}&contractAddresses[]=${contractAddress}&withMetadata=true`
        : `${RPC_URL}/getNFTsForOwner?owner=${userAddress}&withMetadata=true&pageSize=100`;

      const response = await fetch(url);
      const data = await response.json();

      console.log(`NFTs found for contract ${targetContract}:`, data.totalCount || data.ownedNfts?.length || 0);

      // Filter for our specific contract if not already filtered
      const ourNFTs = contractAddress
        ? data.ownedNfts || []
        : data.ownedNfts?.filter((nft: any) =>
          nft.contract.address.toLowerCase() === targetContract.toLowerCase()
        ) || [];

      console.log('Filtered NFTs:', ourNFTs.length, ourNFTs);

      const benefits: NFTBenefit[] = [];

      for (const nft of ourNFTs) {
        const tokenId = parseInt(nft.id.tokenId, 16).toString();
        const metadata = nft.metadata || {};

        const benefit = {
          ...NFT_BENEFITS_MAP['default'],
          tokenId,
          name: metadata.name || `VIP Pass #${tokenId}`,
          description: metadata.description || NFT_BENEFITS_MAP['default'].description,
          image: metadata.image || '',
          collection: nft.contract?.name || 'PrivateCharterX'
        };

        benefits.push(benefit);
      }

      return benefits;
    } catch (error) {
      console.error('Alchemy API failed:', error);
      throw error;
    }
  }

  // Method 2: Direct contract calls - FIXED to detect any token 1-100
  async getUserNFTsViaContract(userAddress: `0x${string}`, contractAddress?: `0x${string}`): Promise<NFTBenefit[]> {
    try {
      const targetContract = contractAddress || NFT_CONTRACT_ADDRESS;
      console.log(`Contract method: Checking contract ${targetContract}...`);
      const benefits: NFTBenefit[] = [];

      // First try enumerable approach
      try {
        const balance = await publicClient.readContract({
          address: targetContract,
          abi: ERC721_ABI,
          functionName: 'balanceOf',
          args: [userAddress]
        }) as bigint;

        console.log(`User owns ${balance.toString()} NFTs from ${targetContract}`);

        if (balance > 0n) {
          // Try to get tokens by index
          for (let i = 0; i < Number(balance); i++) {
            try {
              const tokenId = await publicClient.readContract({
                address: targetContract,
                abi: ERC721_ABI,
                functionName: 'tokenOfOwnerByIndex',
                args: [userAddress, BigInt(i)]
              }) as bigint;

              console.log(`Found token via enumeration: #${tokenId.toString()}`);

              // Get metadata for this token
              let metadata = { name: '', description: '', image: '' };
              try {
                const tokenURI = await publicClient.readContract({
                  address: targetContract,
                  abi: ERC721_ABI,
                  functionName: 'tokenURI',
                  args: [tokenId]
                }) as string;

                if (tokenURI) {
                  const metadataUrl = tokenURI.startsWith('ipfs://')
                    ? tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/')
                    : tokenURI;

                  const response = await fetch(metadataUrl);
                  if (response.ok) {
                    metadata = await response.json();
                  }
                }
              } catch (metaError) {
                console.warn(`Metadata fetch failed for token ${tokenId}`);
              }

              const benefit = {
                ...NFT_BENEFITS_MAP['default'],
                tokenId: tokenId.toString(),
                name: metadata.name || `VIP Pass #${tokenId}`,
                description: metadata.description || NFT_BENEFITS_MAP['default'].description,
                image: metadata.image || ''
              };

              benefits.push(benefit);
            } catch (indexError) {
              console.warn(`Failed to get token at index ${i}:`, indexError);
              break;
            }
          }
        }
      } catch (enumerableError) {
        console.log('Enumerable method failed, trying brute force...');

        // Fallback: Check possible token range (adjust based on contract)
        const maxTokens = targetContract === NFT_CONTRACT_ADDRESS ? 100 : 10000; // Adjust range for CO2 certificates
        console.log(`Brute force checking tokens 1-${maxTokens}...`);

        for (let tokenId = 1; tokenId <= maxTokens; tokenId++) {
          try {
            const owner = await publicClient.readContract({
              address: targetContract,
              abi: ERC721_ABI,
              functionName: 'ownerOf',
              args: [BigInt(tokenId)]
            }) as string;

            if (owner.toLowerCase() === userAddress.toLowerCase()) {
              console.log(`FOUND: User owns token #${tokenId}!`);

              // Get metadata for this token
              let metadata = { name: '', description: '', image: '' };
              try {
                const tokenURI = await publicClient.readContract({
                  address: targetContract,
                  abi: ERC721_ABI,
                  functionName: 'tokenURI',
                  args: [BigInt(tokenId)]
                }) as string;

                if (tokenURI) {
                  const metadataUrl = tokenURI.startsWith('ipfs://')
                    ? tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/')
                    : tokenURI;

                  const response = await fetch(metadataUrl);
                  if (response.ok) {
                    metadata = await response.json();
                  }
                }
              } catch (metaError) {
                console.warn(`Metadata fetch failed for token ${tokenId}`);
              }

              const benefit = {
                ...NFT_BENEFITS_MAP['default'],
                tokenId: tokenId.toString(),
                name: metadata.name || `VIP Pass #${tokenId}`,
                description: metadata.description || NFT_BENEFITS_MAP['default'].description,
                image: metadata.image || ''
              };

              benefits.push(benefit);
            }
          } catch (tokenError) {
            // Token doesn't exist or not owned by user, continue checking
            continue;
          }
        }
      }

      console.log(`Contract method found ${benefits.length} NFTs`);
      return benefits;
    } catch (error) {
      console.error('Contract method failed:', error);
      return [];
    }
  }

  // ===== CO2 CERTIFICATE METHODS =====

  // Get CO2 certificates for user
  async getUserCO2Certificates(userAddress: `0x${string}`): Promise<CO2Certificate[]> {
    console.log('Fetching CO2 certificates for:', userAddress);

    try {
      return await this.getCO2CertificatesViaAlchemy(userAddress);
    } catch (error) {
      console.log('CO2 Alchemy failed, trying contract method...');
      return await this.getCO2CertificatesViaContract(userAddress);
    }
  }

  // Get CO2 certificates via Alchemy API
  async getCO2CertificatesViaAlchemy(userAddress: `0x${string}`): Promise<CO2Certificate[]> {
    try {
      console.log('🌱 Fetching CO2 certificates via Alchemy...');

      const url = `${RPC_URL}/getNFTs?owner=${userAddress}&contractAddresses[]=${CO2_CONTRACT_ADDRESS}&withMetadata=true`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Alchemy API failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('CO2 Alchemy response:', data);

      const certificates: CO2Certificate[] = [];
      const nfts = data.ownedNfts || [];

      for (const nft of nfts) {
        const tokenId = parseInt(nft.tokenId, 16).toString();
        const metadata = nft.metadata || {};
        const attributes = metadata.attributes || [];

        // Extract CO2-specific attributes
        const carbonOffsetAttr = attributes.find((attr: any) =>
          attr.trait_type?.toLowerCase().includes('carbon') ||
          attr.trait_type?.toLowerCase().includes('offset') ||
          attr.trait_type?.toLowerCase().includes('co2')
        );

        const issuerAttr = attributes.find((attr: any) =>
          attr.trait_type?.toLowerCase().includes('issuer') ||
          attr.trait_type?.toLowerCase().includes('provider')
        );

        const flightIdAttr = attributes.find((attr: any) =>
          attr.trait_type?.toLowerCase().includes('flight') ||
          attr.trait_type?.toLowerCase().includes('booking')
        );

        const dateAttr = attributes.find((attr: any) =>
          attr.trait_type?.toLowerCase().includes('date') ||
          attr.trait_type?.toLowerCase().includes('time')
        );

        const certificate: CO2Certificate = {
          ...CO2_CERTIFICATE_DEFAULT,
          tokenId,
          name: metadata.name || `CO2 Certificate #${tokenId}`,
          description: metadata.description || 'Verified carbon offset certificate',
          image: metadata.image || nft.media?.[0]?.gateway || '',
          carbonOffset: carbonOffsetAttr?.value || 'N/A',
          issuer: issuerAttr?.value || 'PrivateCharterX',
          flightId: flightIdAttr?.value || '',
          offsetDate: dateAttr?.value || ''
        };

        certificates.push(certificate);
      }

      console.log(`✅ Found ${certificates.length} CO2 certificates via Alchemy`);
      return certificates;
    } catch (error) {
      console.error('CO2 Alchemy API failed:', error);
      throw error;
    }
  }

  // Get CO2 certificates via contract calls
  async getCO2CertificatesViaContract(userAddress: `0x${string}`): Promise<CO2Certificate[]> {
    try {
      console.log('🌱 Fetching CO2 certificates via contract...');
      const certificates: CO2Certificate[] = [];

      // Try enumerable approach first
      try {
        const balance = await publicClient.readContract({
          address: CO2_CONTRACT_ADDRESS,
          abi: ERC721_ABI,
          functionName: 'balanceOf',
          args: [userAddress]
        }) as bigint;

        console.log(`User owns ${balance.toString()} CO2 certificates`);

        if (balance > 0n) {
          for (let i = 0; i < Number(balance); i++) {
            try {
              const tokenId = await publicClient.readContract({
                address: CO2_CONTRACT_ADDRESS,
                abi: ERC721_ABI,
                functionName: 'tokenOfOwnerByIndex',
                args: [userAddress, BigInt(i)]
              }) as bigint;

              console.log(`Found CO2 certificate via enumeration: #${tokenId.toString()}`);

              // Get metadata
              let metadata: any = {};
              try {
                const tokenURI = await publicClient.readContract({
                  address: CO2_CONTRACT_ADDRESS,
                  abi: ERC721_ABI,
                  functionName: 'tokenURI',
                  args: [tokenId]
                }) as string;

                if (tokenURI) {
                  const metadataUrl = tokenURI.startsWith('ipfs://')
                    ? tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/')
                    : tokenURI;

                  const response = await fetch(metadataUrl);
                  if (response.ok) {
                    metadata = await response.json();
                  }
                }
              } catch (metaError) {
                console.warn(`CO2 metadata fetch failed for token ${tokenId}`);
              }

              const attributes = metadata.attributes || [];
              const carbonOffsetAttr = attributes.find((attr: any) =>
                attr.trait_type?.toLowerCase().includes('carbon') ||
                attr.trait_type?.toLowerCase().includes('offset')
              );

              const certificate: CO2Certificate = {
                ...CO2_CERTIFICATE_DEFAULT,
                tokenId: tokenId.toString(),
                name: metadata.name || `CO2 Certificate #${tokenId}`,
                description: metadata.description || 'Verified carbon offset certificate',
                image: metadata.image || '',
                carbonOffset: carbonOffsetAttr?.value || 'N/A'
              };

              certificates.push(certificate);
            } catch (indexError) {
              console.warn(`Failed to get CO2 certificate at index ${i}:`, indexError);
              break;
            }
          }
        }
      } catch (enumerableError) {
        console.log('CO2 enumerable method failed, trying brute force...');

        // Fallback: Check a reasonable range for CO2 certificates
        for (let tokenId = 1; tokenId <= 10000; tokenId++) {
          try {
            const owner = await publicClient.readContract({
              address: CO2_CONTRACT_ADDRESS,
              abi: ERC721_ABI,
              functionName: 'ownerOf',
              args: [BigInt(tokenId)]
            }) as string;

            if (owner.toLowerCase() === userAddress.toLowerCase()) {
              console.log(`FOUND CO2: User owns certificate #${tokenId}!`);

              // Get metadata
              let metadata: any = {};
              try {
                const tokenURI = await publicClient.readContract({
                  address: CO2_CONTRACT_ADDRESS,
                  abi: ERC721_ABI,
                  functionName: 'tokenURI',
                  args: [BigInt(tokenId)]
                }) as string;

                if (tokenURI) {
                  const metadataUrl = tokenURI.startsWith('ipfs://')
                    ? tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/')
                    : tokenURI;

                  const response = await fetch(metadataUrl);
                  if (response.ok) {
                    metadata = await response.json();
                  }
                }
              } catch (metaError) {
                console.warn(`CO2 metadata fetch failed for token ${tokenId}`);
              }

              const certificate: CO2Certificate = {
                ...CO2_CERTIFICATE_DEFAULT,
                tokenId: tokenId.toString(),
                name: metadata.name || `CO2 Certificate #${tokenId}`,
                description: metadata.description || 'Verified carbon offset certificate',
                image: metadata.image || ''
              };

              certificates.push(certificate);
            }
          } catch (tokenError) {
            // Token doesn't exist or not owned by user, continue
            continue;
          }
        }
      }

      console.log(`✅ Contract method found ${certificates.length} CO2 certificates`);
      return certificates;
    } catch (error) {
      console.error('CO2 contract method failed:', error);
      return [];
    }
  }

  // ===== EXISTING METHODS =====

  async checkDiscountEligibility(userAddress: `0x${string}`): Promise<DiscountEligibility> {
    try {
      const nfts = await this.getUserNFTs(userAddress);
      if (nfts.length === 0) return { hasDiscount: false, discountPercent: 0 };

      const bestDiscount = Math.max(...nfts.map(nft => nft.discountPercent || 0));
      const discountNFT = nfts.reduce((prev, curr) => (prev.discountPercent > curr.discountPercent ? prev : curr));

      return {
        hasDiscount: true,
        discountPercent: bestDiscount,
        nftName: discountNFT.name,
        benefits: discountNFT.benefits || []
      };
    } catch {
      return { hasDiscount: false, discountPercent: 0 };
    }
  }

  formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  async getBalance(address: `0x${string}`): Promise<string> {
    try {
      const balance = await publicClient.getBalance({ address });
      return (Number(balance) / 1e18).toFixed(4);
    } catch (error) {
      console.error('Balance fetch failed:', error);
      return '0.0000';
    }
  }

  getChainInfo() {
    return {
      name: CHAIN.name,
      id: CHAIN.id,
      nativeCurrency: CHAIN.nativeCurrency,
      rpcUrl: RPC_URL,
      blockExplorer: CHAIN.blockExplorers?.default?.url
    };
  }

  // Helper method to get contract addresses
  getContractAddresses() {
    return {
      nft: NFT_CONTRACT_ADDRESS,
      co2: CO2_CONTRACT_ADDRESS
    };
  }
}

export const web3Service = Web3Service.getInstance();
export default Web3Service;
