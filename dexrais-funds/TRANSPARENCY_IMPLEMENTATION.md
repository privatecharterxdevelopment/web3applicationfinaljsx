# Campaign Transparency & Demo Data Implementation Guide

## Overview
This document outlines the implementation of comprehensive transparency features for DexRais.funds campaigns, including company information, benefits, team details, and 28 demo campaigns.

## Database Migrations

### Migration 003: Transparency Fields
File: `supabase-migrations/003_add_transparency_fields.sql`

**New Fields Added:**
- `company_name` - Legal company name
- `company_description` - Company background
- `company_location` - Headquarters location
- `company_website` - Official website
- `company_registration` - Registration/incorporation details
- `dao_purpose` - Clear mission statement
- `dao_governance` - Governance structure
- `contributor_benefits` - What backers receive
- `utility_type` - token, nft, rwa, governance, revenue_share
- `token_details` - JSONB token economics
- `rwa_details` - JSONB real world asset info
- `risk_factors` - Risk disclosures
- `legal_structure` - Legal entity type
- `audit_report_url` - Security audit links
- `team_description` - Team overview
- `team_linkedin` - LinkedIn profile
- `telegram_url` - Telegram community
- `medium_url` - Medium blog
- `funds_allocation` - JSONB fund usage breakdown
- `roadmap` - JSONB project timeline

### Migration 004: Demo Campaigns
File: `supabase-migrations/004_insert_demo_campaigns.sql`

**28 Diverse Campaigns Created:**
1. DeFiMax - Lending Protocol (Enterprise, Active, $125K/$500K)
2. ArtChain - NFT Marketplace (Pro, Active, $87.5K/$250K)
3. MetaQuest - Gaming DAO (Enterprise, Active, $425K/$1M)
4. PropToken - Real Estate (Enterprise Audit, Active, $550K/$2M, RWA)
5. BioDAO - DeSci Research (Pro, Active, $180K/$750K)
6. EarthChain - Carbon Credits (Enterprise, Active, $325K/$500K)
7. MusicDAO - Royalties (Pro, Active, $145K/$350K)
8. CryptoInsure - DeFi Insurance (Enterprise, Active, $280K/$800K)
9. MetaOffice - VR Workspaces (Pro, Active, $195K/$600K)
10. ChainVault - Crypto Custody (Enterprise Audit, Active, $625K/$1.5M)
11. FarmDAO - Agricultural Tech (Starter, Active, $98K/$400K)
12. LegalChain - Smart Contracts (Enterprise, Active, $287K/$550K)
13. EduToken - Learn to Earn (Pro, Active, $125K/$300K)
14. HealthDAO - Medical Records (Enterprise, Active, $412K/$900K)
15. SportsDAO - Athlete Funding (Pro, Active, $175K/$650K)
16. TokenSwap DEX (Enterprise, Funded, $1.2M/$1.2M) ✅
17. MetaLand Virtual Plots (Enterprise, Funded, $800K/$800K) ✅
18. AIArt Generator (Pro, Funded, $250K/$250K) ✅
19. StreamDAO - Streaming (Enterprise Audit, Active, $725K/$1.5M)
20. TradeBot AI (Enterprise, Funded, $500K/$500K) ✅
21. GreenEnergy DAO (Enterprise, Active, $875K/$2M)
22. EventTicket NFT (Pro, Funded, $350K/$350K) ✅
23. CryptoPayroll (Pro, Active, $198K/$450K)
24. BookDAO - Publishing (Starter, Funded, $300K/$300K) ✅
25. IdentityChain (Enterprise, Active, $445K/$800K)
26. PetDAO - Animal Welfare (Starter, Funded, $200K/$200K) ✅
27. FoodTrace - Supply Chain (Pro, Active, $267K/$550K)
28. ChainVote - Digital Voting (Pro, Funded, $400K/$400K) ✅

## UI Updates Needed

### 1. Launchpad Page Updates

**Current State:** Uses mock data with emoji logos
**Target State:** Fetch real campaigns from Supabase with proper images

**Changes Required:**
```typescript
// Replace mock data with Supabase query
useEffect(() => {
  async function loadCampaigns() {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .in('status', ['active', 'funded'])
      .order('created_at', { descending: true });

    if (data) setCampaigns(data);
  }
  loadCampaigns();
}, []);

// Update card rendering to show header + logo
<div className="relative">
  {/* Header Image */}
  {campaign.header_image_url && (
    <img
      src={campaign.header_image_url}
      className="w-full h-32 object-cover rounded-t-xl"
    />
  )}

  {/* Logo Overlay */}
  {campaign.logo_image_url && (
    <img
      src={campaign.logo_image_url}
      className="absolute -bottom-8 left-4 w-16 h-16 rounded-xl border-4 border-white"
    />
  )}
</div>
```

### 2. Campaign Detail Page Enhancements

**Add New Sections:**

#### A. Company Information Section
```tsx
{campaign.company_name && (
  <div className="glassmorphic-card p-8">
    <h3 className="text-2xl font-medium mb-4">Company Information</h3>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-sm text-gray-600">Company Name</p>
        <p className="text-base font-medium">{campaign.company_name}</p>
      </div>
      <div>
        <p className="text-sm text-gray-600">Location</p>
        <p className="text-base font-medium">{campaign.company_location}</p>
      </div>
      <div className="col-span-2">
        <p className="text-sm text-gray-600">About</p>
        <p className="text-sm text-gray-700">{campaign.company_description}</p>
      </div>
      {campaign.legal_structure && (
        <div>
          <p className="text-sm text-gray-600">Legal Structure</p>
          <p className="text-base">{campaign.legal_structure}</p>
        </div>
      )}
    </div>
  </div>
)}
```

#### B. DAO Purpose & Benefits Section
```tsx
<div className="glassmorphic-card p-8">
  <h3 className="text-2xl font-medium mb-4">DAO Purpose & Mission</h3>
  <p className="text-gray-700 mb-6">{campaign.dao_purpose}</p>

  <h4 className="text-xl font-medium mb-3">Contributor Benefits</h4>
  <p className="text-gray-700 mb-4">{campaign.contributor_benefits}</p>

  <div className="inline-block px-4 py-2 bg-purple-100 rounded-lg">
    <span className="text-sm font-medium">Utility Type: {campaign.utility_type}</span>
  </div>
</div>
```

#### C. Token/RWA Details Section
```tsx
{campaign.token_details && (
  <div className="glassmorphic-card p-8">
    <h3 className="text-2xl font-medium mb-4">Token Economics</h3>
    <div className="grid grid-cols-2 gap-4">
      {Object.entries(campaign.token_details).map(([key, value]) => (
        <div key={key}>
          <p className="text-sm text-gray-600 capitalize">
            {key.replace(/_/g, ' ')}
          </p>
          <p className="text-base font-medium">{value}</p>
        </div>
      ))}
    </div>
  </div>
)}

{campaign.rwa_details && (
  <div className="glassmorphic-card p-8">
    <h3 className="text-2xl font-medium mb-4">Real World Asset Details</h3>
    // Similar structure
  </div>
)}
```

#### D. Risk & Transparency Section
```tsx
<div className="glassmorphic-card p-8 border-2 border-amber-200">
  <h3 className="text-2xl font-medium mb-4 flex items-center gap-2">
    <AlertCircle className="text-amber-600" />
    Risk Factors
  </h3>
  <p className="text-gray-700 text-sm">{campaign.risk_factors}</p>

  {campaign.audit_report_url && (
    <a
      href={campaign.audit_report_url}
      className="mt-4 inline-flex items-center gap-2 text-blue-600"
    >
      <Shield size={16} />
      View Security Audit Report
    </a>
  )}
</div>
```

#### E. Team Section
```tsx
<div className="glassmorphic-card p-8">
  <h3 className="text-2xl font-medium mb-4">Team</h3>
  <p className="text-gray-700 mb-4">{campaign.team_description}</p>

  {campaign.team_linkedin && (
    <a href={campaign.team_linkedin} className="text-blue-600">
      View Team on LinkedIn
    </a>
  )}
</div>
```

#### F. Funds Allocation Section
```tsx
{campaign.funds_allocation && (
  <div className="glassmorphic-card p-8">
    <h3 className="text-2xl font-medium mb-4">Use of Funds</h3>
    <div className="space-y-3">
      {Object.entries(campaign.funds_allocation).map(([category, percentage]) => (
        <div key={category}>
          <div className="flex justify-between mb-1">
            <span className="text-sm">{category}</span>
            <span className="text-sm font-medium">{percentage}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-full bg-gray-900 rounded-full"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  </div>
)}
```

#### G. Transaction History Section
```tsx
<div className="glassmorphic-card p-8">
  <h3 className="text-2xl font-medium mb-4">Transaction History</h3>
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="border-b">
          <th className="text-left py-2">Date</th>
          <th className="text-left py-2">From</th>
          <th className="text-right py-2">Amount</th>
          <th className="text-right py-2">TX Hash</th>
        </tr>
      </thead>
      <tbody>
        {backers.map(backer => (
          <tr key={backer.id} className="border-b">
            <td className="py-2 text-sm">
              {new Date(backer.contributed_at).toLocaleDateString()}
            </td>
            <td className="py-2 text-sm font-mono">
              {backer.wallet_address.slice(0,6)}...{backer.wallet_address.slice(-4)}
            </td>
            <td className="py-2 text-sm text-right">
              ${backer.amount.toLocaleString()} USDC
            </td>
            <td className="py-2 text-sm text-right">
              <a
                href={`https://basescan.org/tx/${backer.tx_hash}`}
                className="text-blue-600"
              >
                View ↗
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

## Implementation Steps

1. **Run Database Migrations**
   ```bash
   # In Supabase SQL Editor, run in order:
   003_add_transparency_fields.sql
   004_insert_demo_campaigns.sql
   ```

2. **Update Launchpad.tsx**
   - Replace mock data with Supabase query
   - Update card component to show header + logo images
   - Add proper image sizing and styling

3. **Update CampaignDetail.tsx**
   - Add company information section
   - Add DAO purpose & benefits section
   - Add token/RWA details sections
   - Add risk factors section
   - Add team information section
   - Add funds allocation visualization
   - Enhance transaction history display

4. **Update Campaign Interface**
   - Add new fields to TypeScript interface
   - Update form validation
   - Add fields to CreateCampaign form

## Testing

1. Verify all 28 campaigns appear on Launchpad
2. Check campaign detail pages show all new sections
3. Verify images load correctly
4. Test filtering and search with real data
5. Confirm transaction history displays correctly

## Future Enhancements

- Image upload to Supabase Storage
- Team member profiles with photos
- Interactive fund allocation charts
- Real-time transaction feed
- Export transaction history to CSV
- Milestone progress visualization
- Governance voting interface

## Notes

- Using via.placeholder.com for demo images
- Replace with actual uploaded images in production
- All campaigns use Base network
- Safe addresses are placeholders
- Update platform signer address before production
