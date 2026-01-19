/**
 * AssetService - Polymesh Asset Querying Service
 *
 * Handles querying assets from Polymesh blockchain,
 * including asset details, holders, documents, and compliance info.
 */

import { PolymeshService } from './PolymeshService';
import type { Asset, FungibleAsset, NftCollection } from '@polymeshassociation/polymesh-sdk/types';

// Asset types for the marketplace
export interface MarketplaceAsset {
  id: string;
  ticker: string;
  name: string;
  assetType: string;
  isDivisible: boolean;
  totalSupply: string;
  ownerDid: string;

  // Additional details
  description?: string;
  category?: string;
  imageUrl?: string;
  coverImageUrl?: string;
  location?: string;

  // Financial info
  tokenPrice?: number;
  targetAmount?: number;
  raisedAmount?: number;
  minInvestment?: number;
  maxInvestment?: number;
  estimatedApy?: number;

  // Status
  status: 'active' | 'upcoming' | 'completed' | 'paused';
  currentPhase: 'waitlist' | 'fundraising' | 'spv_formation' | 'trading';

  // Compliance
  requiresKyc: boolean;
  allowedJurisdictions?: string[];

  // Metadata
  documents?: AssetDocument[];
  fundingRound?: string;
  createdAt?: string;
}

export interface AssetDocument {
  name: string;
  uri: string;
  type: string;
  contentHash?: string;
  filedAt?: string;
}

export interface AssetHolder {
  did: string;
  balance: string;
  percentage: number;
}

export interface AssetDetails {
  asset: MarketplaceAsset;
  holders: AssetHolder[];
  complianceRequirements: string[];
  transferRestrictions: string[];
}

class AssetServiceClass {
  /**
   * Get all assets from Polymesh (with pagination)
   */
  async getAssets(options: {
    limit?: number;
    offset?: number;
    category?: string;
  } = {}): Promise<MarketplaceAsset[]> {
    try {
      const sdk = await PolymeshService.getSDK();
      const { limit = 20, offset = 0 } = options;

      // Use middleware to query assets
      // Note: This is a simplified version - in production you'd use GraphQL queries
      const assets: MarketplaceAsset[] = [];

      // For now, we'll return demo data that matches Polymesh structure
      // In production, this would query the actual blockchain
      console.log('[AssetService] Fetching assets from Polymesh...');

      // Demo assets for PrivateCharterX marketplace
      const demoAssets: MarketplaceAsset[] = [
        {
          id: 'pcx-jet-001',
          ticker: 'JET001',
          name: 'Gulfstream G650ER Fractional',
          assetType: 'Security Token',
          isDivisible: true,
          totalSupply: '10000',
          ownerDid: '0x1234567890abcdef',
          description: 'Fractional ownership in a 2023 Gulfstream G650ER based in Geneva. Long-range luxury business jet with intercontinental capability.',
          category: 'private-jet',
          imageUrl: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=800',
          coverImageUrl: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=1920',
          location: 'Geneva, Switzerland',
          tokenPrice: 1000,
          targetAmount: 10000000,
          raisedAmount: 4500000,
          minInvestment: 10000,
          maxInvestment: 1000000,
          estimatedApy: 12.5,
          status: 'active',
          currentPhase: 'fundraising',
          requiresKyc: true,
          allowedJurisdictions: ['CH', 'DE', 'FR', 'GB', 'US'],
          fundingRound: 'Series A',
          createdAt: '2024-01-15'
        },
        {
          id: 'pcx-yacht-001',
          ticker: 'YCT001',
          name: 'Azimut 72 Mediterranean',
          assetType: 'Security Token',
          isDivisible: true,
          totalSupply: '5000',
          ownerDid: '0xabcdef1234567890',
          description: 'Luxury 72-foot yacht based in Monaco. Prime Mediterranean charter revenue with proven track record.',
          category: 'yacht',
          imageUrl: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800',
          coverImageUrl: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=1920',
          location: 'Monaco',
          tokenPrice: 500,
          targetAmount: 2500000,
          raisedAmount: 1800000,
          minInvestment: 5000,
          maxInvestment: 500000,
          estimatedApy: 15.2,
          status: 'active',
          currentPhase: 'fundraising',
          requiresKyc: true,
          allowedJurisdictions: ['MC', 'FR', 'IT', 'ES', 'GB'],
          fundingRound: 'Seed',
          createdAt: '2024-02-01'
        },
        {
          id: 'pcx-car-001',
          ticker: 'F50MCO',
          name: 'Ferrari F50 Collector Edition',
          assetType: 'Security Token',
          isDivisible: true,
          totalSupply: '4600',
          ownerDid: '0x9876543210fedcba',
          description: 'Rare 1996 Ferrari F50 in pristine condition. One of only 349 units produced. Ferrari Classiche certified.',
          category: 'luxury-car',
          imageUrl: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800',
          coverImageUrl: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1920',
          location: 'Monaco',
          tokenPrice: 1000,
          targetAmount: 4600000,
          raisedAmount: 920000,
          minInvestment: 10000,
          maxInvestment: 460000,
          estimatedApy: 8.5,
          status: 'active',
          currentPhase: 'fundraising',
          requiresKyc: true,
          allowedJurisdictions: ['MC', 'CH', 'DE', 'US', 'GB'],
          fundingRound: 'Private Sale',
          createdAt: '2024-03-01'
        },
        {
          id: 'pcx-re-001',
          ticker: 'HY15NYC',
          name: '15 Hudson Yards Penthouse',
          assetType: 'Security Token',
          isDivisible: true,
          totalSupply: '100000',
          ownerDid: '0xfedcba0987654321',
          description: 'Fractional ownership in a luxury penthouse at 15 Hudson Yards, NYC. Prime Manhattan real estate with stunning views.',
          category: 'real-estate',
          imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
          coverImageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1920',
          location: 'New York, USA',
          tokenPrice: 100,
          targetAmount: 10000000,
          raisedAmount: 7500000,
          minInvestment: 1000,
          maxInvestment: 2000000,
          estimatedApy: 6.8,
          status: 'active',
          currentPhase: 'fundraising',
          requiresKyc: true,
          allowedJurisdictions: ['US'],
          fundingRound: 'Series A',
          createdAt: '2024-01-01'
        },
        {
          id: 'pcx-jet-002',
          ticker: 'PHE300',
          name: 'Embraer Phenom 300E',
          assetType: 'Security Token',
          isDivisible: true,
          totalSupply: '8000',
          ownerDid: '0x1111222233334444',
          description: 'World\'s best-selling light business jet. 2024 model based in London City Airport with EU charter license.',
          category: 'private-jet',
          imageUrl: 'https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=800',
          coverImageUrl: 'https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=1920',
          location: 'London, UK',
          tokenPrice: 750,
          targetAmount: 6000000,
          raisedAmount: 0,
          minInvestment: 7500,
          maxInvestment: 600000,
          estimatedApy: 14.2,
          status: 'upcoming',
          currentPhase: 'waitlist',
          requiresKyc: true,
          allowedJurisdictions: ['GB', 'CH', 'DE', 'FR', 'NL'],
          fundingRound: 'Pre-Seed',
          createdAt: '2024-03-15'
        },
        {
          id: 'pcx-yacht-002',
          ticker: 'SUN105',
          name: 'Sunseeker 105 Sport Yacht',
          assetType: 'Security Token',
          isDivisible: true,
          totalSupply: '12000',
          ownerDid: '0x5555666677778888',
          description: '105-foot Sunseeker sport yacht based in Ibiza. Premium summer charter destination with high demand.',
          category: 'yacht',
          imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
          coverImageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1920',
          location: 'Ibiza, Spain',
          tokenPrice: 400,
          targetAmount: 4800000,
          raisedAmount: 0,
          minInvestment: 4000,
          maxInvestment: 480000,
          estimatedApy: 16.8,
          status: 'upcoming',
          currentPhase: 'waitlist',
          requiresKyc: true,
          allowedJurisdictions: ['ES', 'FR', 'IT', 'GB', 'DE'],
          fundingRound: 'Seed',
          createdAt: '2024-04-01'
        }
      ];

      // Apply category filter if provided
      let filteredAssets = demoAssets;
      if (options.category) {
        filteredAssets = demoAssets.filter(a => a.category === options.category);
      }

      // Apply pagination
      return filteredAssets.slice(offset, offset + limit);
    } catch (error) {
      console.error('[AssetService] Error fetching assets:', error);
      throw error;
    }
  }

  /**
   * Get asset by ticker
   */
  async getAssetByTicker(ticker: string): Promise<MarketplaceAsset | null> {
    try {
      const sdk = await PolymeshService.getSDK();

      // Try to fetch from Polymesh
      try {
        const asset = await sdk.assets.getAsset({ ticker });

        if (asset) {
          const details = await asset.details();
          const totalSupply = await asset.currentFundingRound();

          return {
            id: ticker,
            ticker: ticker,
            name: details.name,
            assetType: details.assetType,
            isDivisible: details.isDivisible,
            totalSupply: details.totalSupply?.toString() || '0',
            ownerDid: details.owner?.did || '',
            status: 'active',
            currentPhase: 'trading',
            requiresKyc: true
          };
        }
      } catch (err) {
        console.log('[AssetService] Asset not found on chain, checking local data');
      }

      // Fallback to demo data
      const assets = await this.getAssets({ limit: 100 });
      return assets.find(a => a.ticker === ticker) || null;
    } catch (error) {
      console.error('[AssetService] Error fetching asset:', error);
      throw error;
    }
  }

  /**
   * Get asset by ID (local database ID or ticker)
   */
  async getAssetById(id: string): Promise<MarketplaceAsset | null> {
    const assets = await this.getAssets({ limit: 100 });
    return assets.find(a => a.id === id || a.ticker === id) || null;
  }

  /**
   * Get detailed asset information including holders
   */
  async getAssetDetails(ticker: string): Promise<AssetDetails | null> {
    try {
      const asset = await this.getAssetByTicker(ticker);
      if (!asset) return null;

      // Demo holders data
      const holders: AssetHolder[] = [
        { did: '0x1234...5678', balance: '2500', percentage: 25 },
        { did: '0xabcd...ef01', balance: '1500', percentage: 15 },
        { did: '0x9876...5432', balance: '1000', percentage: 10 },
      ];

      // Compliance requirements
      const complianceRequirements = [
        'Accredited Investor Verification',
        'KYC/AML Compliance Required',
        'Jurisdiction Restrictions Apply'
      ];

      const transferRestrictions = [
        'Minimum holding period: 12 months',
        'Maximum transfer per day: 5% of holdings',
        'Transfers only to verified investors'
      ];

      return {
        asset,
        holders,
        complianceRequirements,
        transferRestrictions
      };
    } catch (error) {
      console.error('[AssetService] Error fetching asset details:', error);
      throw error;
    }
  }

  /**
   * Get asset documents
   */
  async getAssetDocuments(ticker: string): Promise<AssetDocument[]> {
    // Demo documents
    return [
      {
        name: 'Offering Memorandum',
        uri: '/documents/offering-memorandum.pdf',
        type: 'legal',
        filedAt: '2024-01-15'
      },
      {
        name: 'Subscription Agreement',
        uri: '/documents/subscription-agreement.pdf',
        type: 'legal',
        filedAt: '2024-01-15'
      },
      {
        name: 'Risk Disclosure',
        uri: '/documents/risk-disclosure.pdf',
        type: 'compliance',
        filedAt: '2024-01-15'
      },
      {
        name: 'Asset Valuation Report',
        uri: '/documents/valuation-report.pdf',
        type: 'financial',
        filedAt: '2024-01-10'
      }
    ];
  }

  /**
   * Search assets by query
   */
  async searchAssets(query: string): Promise<MarketplaceAsset[]> {
    const allAssets = await this.getAssets({ limit: 100 });
    const searchLower = query.toLowerCase();

    return allAssets.filter(asset =>
      asset.name.toLowerCase().includes(searchLower) ||
      asset.ticker.toLowerCase().includes(searchLower) ||
      asset.description?.toLowerCase().includes(searchLower) ||
      asset.category?.toLowerCase().includes(searchLower) ||
      asset.location?.toLowerCase().includes(searchLower)
    );
  }

  /**
   * Get assets by category
   */
  async getAssetsByCategory(category: string): Promise<MarketplaceAsset[]> {
    return this.getAssets({ category, limit: 100 });
  }

  /**
   * Check if a ticker is available
   */
  async isTickerAvailable(ticker: string): Promise<boolean> {
    try {
      const sdk = await PolymeshService.getSDK();
      const available = await sdk.assets.isTickerAvailable({ ticker });
      return available;
    } catch (error) {
      console.error('[AssetService] Error checking ticker:', error);
      return false;
    }
  }
}

// Export singleton instance
export const AssetService = new AssetServiceClass();
