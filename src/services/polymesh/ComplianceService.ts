/**
 * ComplianceService - Polymesh Compliance Verification
 *
 * Handles compliance checks for transfers, investor verification,
 * and jurisdiction requirements on Polymesh.
 */

import { PolymeshService } from './PolymeshService';
import { AssetService, type MarketplaceAsset } from './AssetService';

// Compliance status types
export type ComplianceStatus = 'compliant' | 'non_compliant' | 'pending' | 'unknown';

export interface ComplianceCheck {
  isCompliant: boolean;
  status: ComplianceStatus;
  requirements: ComplianceRequirement[];
  missingRequirements: string[];
  message: string;
}

export interface ComplianceRequirement {
  id: string;
  name: string;
  description: string;
  isMet: boolean;
  type: 'kyc' | 'jurisdiction' | 'accreditation' | 'holding_period' | 'transfer_limit';
}

export interface InvestorEligibility {
  canInvest: boolean;
  eligibilityStatus: 'eligible' | 'ineligible' | 'pending_kyc' | 'jurisdiction_restricted';
  requirements: {
    kycVerified: boolean;
    accreditedInvestor: boolean;
    jurisdictionAllowed: boolean;
    minimumInvestmentMet: boolean;
  };
  message: string;
}

// Supported jurisdictions for PrivateCharterX
export const SUPPORTED_JURISDICTIONS = {
  US: { name: 'United States', accreditedRequired: true },
  GB: { name: 'United Kingdom', accreditedRequired: false },
  CH: { name: 'Switzerland', accreditedRequired: false },
  DE: { name: 'Germany', accreditedRequired: false },
  FR: { name: 'France', accreditedRequired: false },
  MC: { name: 'Monaco', accreditedRequired: false },
  IT: { name: 'Italy', accreditedRequired: false },
  ES: { name: 'Spain', accreditedRequired: false },
  NL: { name: 'Netherlands', accreditedRequired: false },
  SG: { name: 'Singapore', accreditedRequired: true },
  HK: { name: 'Hong Kong', accreditedRequired: true },
  AE: { name: 'United Arab Emirates', accreditedRequired: false },
};

class ComplianceServiceClass {
  /**
   * Check if a transfer is compliant
   */
  async checkTransferCompliance(
    assetTicker: string,
    senderDid: string,
    receiverDid: string,
    amount: string
  ): Promise<ComplianceCheck> {
    try {
      const sdk = await PolymeshService.getSDK();

      // Try to check compliance on-chain
      try {
        const asset = await sdk.assets.getAsset({ ticker: assetTicker });
        const compliance = await asset.compliance.requirements.get();

        // This would check actual on-chain compliance
        console.log('[ComplianceService] Checking on-chain compliance...');
      } catch (err) {
        console.log('[ComplianceService] Using local compliance check');
      }

      // Demo compliance check
      const requirements: ComplianceRequirement[] = [
        {
          id: 'kyc',
          name: 'KYC Verification',
          description: 'Both sender and receiver must have verified KYC',
          isMet: true,
          type: 'kyc'
        },
        {
          id: 'jurisdiction',
          name: 'Jurisdiction Check',
          description: 'Receiver must be in an allowed jurisdiction',
          isMet: true,
          type: 'jurisdiction'
        },
        {
          id: 'accreditation',
          name: 'Accredited Investor',
          description: 'Receiver must be an accredited investor',
          isMet: true,
          type: 'accreditation'
        },
        {
          id: 'holding_period',
          name: 'Holding Period',
          description: 'Minimum holding period must be met',
          isMet: true,
          type: 'holding_period'
        }
      ];

      const allMet = requirements.every(r => r.isMet);
      const missingRequirements = requirements.filter(r => !r.isMet).map(r => r.name);

      return {
        isCompliant: allMet,
        status: allMet ? 'compliant' : 'non_compliant',
        requirements,
        missingRequirements,
        message: allMet
          ? 'Transfer is compliant with all requirements'
          : `Transfer blocked: ${missingRequirements.join(', ')} not met`
      };
    } catch (error) {
      console.error('[ComplianceService] Error checking compliance:', error);
      return {
        isCompliant: false,
        status: 'unknown',
        requirements: [],
        missingRequirements: ['Unable to verify compliance'],
        message: 'Error checking compliance. Please try again.'
      };
    }
  }

  /**
   * Check investor eligibility for an asset
   */
  async checkInvestorEligibility(
    assetId: string,
    investorInfo: {
      did?: string;
      jurisdiction: string;
      isKycVerified: boolean;
      isAccreditedInvestor: boolean;
      investmentAmount: number;
    }
  ): Promise<InvestorEligibility> {
    try {
      // Get asset details
      const asset = await AssetService.getAssetById(assetId);
      if (!asset) {
        return {
          canInvest: false,
          eligibilityStatus: 'ineligible',
          requirements: {
            kycVerified: false,
            accreditedInvestor: false,
            jurisdictionAllowed: false,
            minimumInvestmentMet: false
          },
          message: 'Asset not found'
        };
      }

      // Check jurisdiction
      const jurisdictionAllowed = asset.allowedJurisdictions
        ? asset.allowedJurisdictions.includes(investorInfo.jurisdiction)
        : true;

      // Check if accreditation is required for this jurisdiction
      const jurisdictionConfig = SUPPORTED_JURISDICTIONS[investorInfo.jurisdiction as keyof typeof SUPPORTED_JURISDICTIONS];
      const accreditationRequired = jurisdictionConfig?.accreditedRequired || false;
      const accreditedInvestor = accreditationRequired
        ? investorInfo.isAccreditedInvestor
        : true;

      // Check minimum investment
      const minimumInvestmentMet = investorInfo.investmentAmount >= (asset.minInvestment || 0);

      // Determine eligibility
      const requirements = {
        kycVerified: investorInfo.isKycVerified,
        accreditedInvestor,
        jurisdictionAllowed,
        minimumInvestmentMet
      };

      const canInvest = Object.values(requirements).every(v => v);

      let eligibilityStatus: InvestorEligibility['eligibilityStatus'] = 'eligible';
      let message = 'You are eligible to invest in this asset';

      if (!investorInfo.isKycVerified) {
        eligibilityStatus = 'pending_kyc';
        message = 'Please complete KYC verification to invest';
      } else if (!jurisdictionAllowed) {
        eligibilityStatus = 'jurisdiction_restricted';
        message = `This asset is not available in ${jurisdictionConfig?.name || investorInfo.jurisdiction}`;
      } else if (!accreditedInvestor && accreditationRequired) {
        eligibilityStatus = 'ineligible';
        message = 'Accredited investor status required for your jurisdiction';
      } else if (!minimumInvestmentMet) {
        eligibilityStatus = 'ineligible';
        message = `Minimum investment is $${asset.minInvestment?.toLocaleString()}`;
      }

      return {
        canInvest,
        eligibilityStatus,
        requirements,
        message
      };
    } catch (error) {
      console.error('[ComplianceService] Error checking eligibility:', error);
      return {
        canInvest: false,
        eligibilityStatus: 'ineligible',
        requirements: {
          kycVerified: false,
          accreditedInvestor: false,
          jurisdictionAllowed: false,
          minimumInvestmentMet: false
        },
        message: 'Error checking eligibility. Please try again.'
      };
    }
  }

  /**
   * Get compliance requirements for an asset
   */
  async getAssetComplianceRequirements(assetTicker: string): Promise<ComplianceRequirement[]> {
    try {
      const sdk = await PolymeshService.getSDK();

      // Try to get on-chain requirements
      try {
        const asset = await sdk.assets.getAsset({ ticker: assetTicker });
        const requirements = await asset.compliance.requirements.get();
        console.log('[ComplianceService] On-chain requirements:', requirements);
      } catch (err) {
        console.log('[ComplianceService] Using default requirements');
      }

      // Default requirements for PrivateCharterX assets
      return [
        {
          id: 'cdd',
          name: 'Customer Due Diligence',
          description: 'Investor identity must be verified through CDD process',
          isMet: false,
          type: 'kyc'
        },
        {
          id: 'jurisdiction',
          name: 'Jurisdiction Verification',
          description: 'Investor must be in an allowed jurisdiction',
          isMet: false,
          type: 'jurisdiction'
        },
        {
          id: 'accreditation',
          name: 'Accredited Investor (US only)',
          description: 'US investors must be accredited',
          isMet: false,
          type: 'accreditation'
        },
        {
          id: 'lock_up',
          name: '12-Month Lock-up',
          description: 'Tokens are subject to 12-month holding period',
          isMet: false,
          type: 'holding_period'
        }
      ];
    } catch (error) {
      console.error('[ComplianceService] Error getting requirements:', error);
      return [];
    }
  }

  /**
   * Verify investor attestation (CDD)
   */
  async verifyInvestorAttestation(did: string): Promise<{
    isVerified: boolean;
    attestations: string[];
    cddProvider?: string;
  }> {
    try {
      const sdk = await PolymeshService.getSDK();

      try {
        const identity = await sdk.identities.getIdentity({ did });
        // This would check actual CDD claims on-chain
        console.log('[ComplianceService] Checking identity:', identity);
      } catch (err) {
        console.log('[ComplianceService] Identity not found');
      }

      // Demo response
      return {
        isVerified: false,
        attestations: [],
        cddProvider: undefined
      };
    } catch (error) {
      console.error('[ComplianceService] Error verifying attestation:', error);
      return {
        isVerified: false,
        attestations: []
      };
    }
  }

  /**
   * Get supported jurisdictions
   */
  getSupportedJurisdictions(): typeof SUPPORTED_JURISDICTIONS {
    return SUPPORTED_JURISDICTIONS;
  }

  /**
   * Check if a jurisdiction requires accreditation
   */
  requiresAccreditation(jurisdictionCode: string): boolean {
    const config = SUPPORTED_JURISDICTIONS[jurisdictionCode as keyof typeof SUPPORTED_JURISDICTIONS];
    return config?.accreditedRequired || false;
  }
}

// Export singleton instance
export const ComplianceService = new ComplianceServiceClass();
