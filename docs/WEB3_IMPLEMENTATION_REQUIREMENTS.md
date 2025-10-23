# Web3.0 Implementation Requirements & Planning Document

**Date Created**: 2025-10-13
**Status**: Planning Phase
**Priority**: High

---

## 📋 OVERVIEW

This document outlines the remaining features and implementation questions for the Web3.0 STO/UTL (Security Token Offerings / Utility Token) ecosystem.

### ✅ COMPLETED FEATURES

- [x] Header button configuration (RWS vs Web3.0 modes)
- [x] STO/UTL Dashboard basic structure
- [x] Wallet verification and connection checks
- [x] Mock transaction display
- [x] Created assets tracking from database
- [x] NFT display in profile page
- [x] Wallet transaction history from blockchain
- [x] ProfileOverview with NFT frame
- [x] TokenizeAssetFlow saves to database

---

## 🎯 PENDING IMPLEMENTATION

## **1. MARKETPLACE PAGE - NFT Display**

**Current Status**: Menu item exists but no implementation found

### Questions to Answer:

#### **A. Marketplace Location & Structure**
- [ ] Should the Marketplace be:
  - Option 1: A dedicated full-page view (like Jets, Empty Legs pages)?
  - Option 2: Integrated into the Dashboard as a tab?
  - Option 3: Part of the existing "Tokenized Assets" category?

**Decision**: _[TO BE DECIDED]_

#### **B. NFT Data Sources**
- [ ] Where should we fetch NFT data from?
  - Option 1: OpenSea API (requires API key)
  - Option 2: Directly from blockchain via Alchemy
  - Option 3: Both (OpenSea for marketplace data, Alchemy for owned NFTs)
  - Option 4: Database (user_requests table for created assets)

**Decision**: _[TO BE DECIDED]_

#### **C. NFT Display Categories**
- [ ] Should we show:
  - Option 1: **All NFTs** from OpenSea Base network in one view
  - Option 2: **Filtered sections**: PCX Membership separately, then user-created NFTs
  - Option 3: **Tabs**: "Featured" (PCX), "My NFTs", "Created by Me", "All NFTs"

**Decision**: _[TO BE DECIDED]_

#### **D. PCX Membership Card Display**
- [ ] Where to feature PCX Membership Card?
  - Option 1: Hero section at top of Marketplace
  - Option 2: First item in grid
  - Option 3: Separate "Featured" section
  - Option 4: Sticky sidebar

**Decision**: _[TO BE DECIDED]_

---

## **2. OPENSEA INTEGRATION - Transaction Sync**

**Current Status**: Mock data in STO/UTL dashboard

### Questions to Answer:

#### **A. API Implementation**
- [ ] OpenSea API Setup:
  - Do you have an OpenSea API key? **YES / NO**
  - Should we use free tier (limited) or paid?
  - What's the fallback if API fails?

**API Key Status**: _[TO BE CONFIRMED]_

#### **B. Data Synchronization**
- [ ] When/how to sync OpenSea transactions?
  - Option 1: Real-time (webhooks from OpenSea)
  - Option 2: Polling (check every X minutes)
  - Option 3: On-demand (user clicks refresh)
  - Option 4: Store in Supabase or fetch live each time

**Decision**: _[TO BE DECIDED]_

#### **C. Royalty Tracking**
- [ ] How to calculate royalties:
  - Option 1: Read from smart contract royalty settings
  - Option 2: Store royalty percentage in database when creating NFT
  - Option 3: Use OpenSea's reported royalties

**Decision**: _[TO BE DECIDED]_

### Implementation Notes:

```javascript
// Example OpenSea API Integration
const fetchOpenSeaData = async (contractAddress) => {
  const response = await fetch(
    `https://api.opensea.io/api/v2/chain/base/contract/${contractAddress}/nfts`,
    {
      headers: { 'X-API-KEY': process.env.OPENSEA_API_KEY }
    }
  );
  const data = await response.json();

  // Extract:
  // - Total sales
  // - Current listings
  // - Buyer/seller addresses
  // - Royalty payments
  // - Floor price
};
```

---

## **3. WALLET SWITCHING - Multiple Wallets**

**Current Status**: WalletConnect supports this, but needs UX implementation

### Questions to Answer:

#### **A. Wallet Management UX**
- [ ] Where to add wallet switching?
  - Option 1: In STO/UTL dashboard header
  - Option 2: In WalletMenu dropdown
  - Option 3: Both locations

**Decision**: _[TO BE DECIDED]_

#### **B. Wallet Verification Flow**
- [ ] When user creates NFT/token:
  - Store creator wallet address in database? **YES / NO**
  - Only allow that wallet to manage the asset? **YES / NO**
  - Allow transfer of ownership? **YES / NO**

**Decision**: _[TO BE DECIDED]_

#### **C. Multi-Wallet Scenarios**
- [ ] If user has multiple wallets:
  - Option 1: Show combined view of all wallets' assets
  - Option 2: Switch between wallet views
  - Option 3: Link wallets to same user account

**Decision**: _[TO BE DECIDED]_

---

## **4. BUYER/SELLER TRANSACTION DISPLAY**

**Current Status**: Mock data exists in STO/UTL dashboard

### Questions to Answer:

#### **A. Transaction Data Detail Level**
- [ ] What information to show?
  - Level 1: Basic - Buyer, Seller, Price, Date
  - Level 2: Advanced - Gas fees, USD value, profit/loss
  - Level 3: Very detailed - Transaction hash, block number, contract interaction

**Decision**: _[TO BE DECIDED]_

#### **B. Transaction Filtering**
- [ ] Allow users to filter by:
  - Asset type (NFT vs Security Token)? **YES / NO**
  - Date range? **YES / NO**
  - Transaction type (Sale, Transfer, Mint)? **YES / NO**
  - Wallet address (buyer vs seller)? **YES / NO**

**Decision**: _[TO BE DECIDED]_

#### **C. Historical Data**
- [ ] How far back to show transactions?
  - Option 1: Last 30 days
  - Option 2: All time
  - Option 3: Paginated (50 per page)

**Decision**: _[TO BE DECIDED]_

---

## **5. NFT CREATION WORKFLOW**

**Current Status**: TokenizeAssetFlow exists, saves to database

### Questions to Answer:

#### **A. Actual NFT Minting**
- [ ] Should we actually mint NFTs on-chain?
  - Option 1: Use existing smart contract (provide contract address)
  - Option 2: Deploy new contract per asset
  - Option 3: Use OpenSea's lazy minting
  - Option 4: Just track intent in database for now

**Decision**: _[TO BE DECIDED]_
**Contract Address (if applicable)**: _[TO BE PROVIDED]_

#### **B. OpenSea Listing**
- [ ] After user creates tokenization request:
  - Option 1: Automatically list on OpenSea
  - Option 2: Manual approval step
  - Option 3: Admin reviews first

**Decision**: _[TO BE DECIDED]_

#### **C. Metadata & IPFS**
- [ ] Where to store NFT metadata/images?
  - Option 1: IPFS (need Pinata/Infura account)
  - Option 2: Supabase storage
  - Option 3: OpenSea hosts it

**Decision**: _[TO BE DECIDED]_

---

## **6. SECURITY TOKEN (STO) COMPLIANCE**

**⚠️ LEGAL CONSIDERATIONS**

### Questions to Answer:

#### **A. Legal Restrictions**
- [ ] For Security Tokens specifically:
  - Should we gate this feature behind KYC verification? **YES / NO**
  - Require accredited investor verification? **YES / NO**
  - Add legal disclaimers/warnings? **YES / NO**
  - Restrict to certain jurisdictions? **YES / NO**

**Decision**: _[TO BE DECIDED]_

#### **B. Difference from Utility Tokens**
- [ ] In the UI/flow:
  - Separate creation flows for STO vs UTL? **YES / NO**
  - Different compliance checks? **YES / NO**
  - Different display in STO/UTL dashboard? **YES / NO**

**Decision**: _[TO BE DECIDED]_

### Legal Compliance Notes:

**NFT Royalties**:
- Generally legal - creator royalties are standard in NFT marketplaces
- No special license typically required

**Security Tokens (STOs)**:
- ⚠️ Requires securities license depending on jurisdiction
- Must comply with KYC/AML regulations
- May require securities registration

**Recommendation**:
- NFT utility tokens: ✅ Safe with proper disclaimers
- Security tokens (STOs): ⚠️ Require legal compliance
- Add disclaimer: "Not financial advice" and "Consult legal counsel"

---

## **7. TECHNICAL ARCHITECTURE**

### Questions to Answer:

#### **A. Performance & Caching**
- [ ] With OpenSea API calls:
  - Cache data in Supabase? **YES / NO** (how long? _______)
  - Use server-side API route to hide API keys? **YES / NO**
  - Client-side direct calls? **YES / NO**

**Decision**: _[TO BE DECIDED]_

#### **B. Error Handling**
- [ ] If blockchain/OpenSea is down:
  - Option 1: Show cached data
  - Option 2: Display error message
  - Option 3: Graceful degradation

**Decision**: _[TO BE DECIDED]_

#### **C. Testing Environment**
- [ ] What network for testing?
  - Option 1: Base Mainnet (real money)
  - Option 2: Base Sepolia testnet
  - Option 3: Both with environment switch

**Decision**: _[TO BE DECIDED]_

---

## 📋 RECOMMENDED IMPLEMENTATION PRIORITY

### **Phase 1: Display & Basic Integration** (Easiest, High User Value)
**Estimated Time**: 2-3 days

1. **Marketplace Page Implementation**
   - File Location: `/src/components/Landingpagenew/Marketplace.jsx`
   - Grid layout for NFT display
   - Integration with existing routing

2. **Show PCX Membership Card Prominently**
   - Featured section at top of Marketplace
   - Link to OpenSea collection

3. **Display User's Owned NFTs from Alchemy**
   - Already have `web3Service.getUserNFTsViaAlchemy()` method
   - Just need to call and display in Marketplace

**Dependencies**:
- None (can use existing Alchemy integration)

---

### **Phase 2: Transaction Tracking** (Medium Difficulty)
**Estimated Time**: 3-5 days

4. **OpenSea API Integration for Transaction History**
   - File Location: `/src/services/openseaService.ts` (NEW)
   - Fetch sales, transfers, and listing data
   - Parse transaction history

5. **Display Real Buyer/Seller Data in STO/UTL Dashboard**
   - Update: `/src/components/Landingpagenew/STOUTLDashboard.jsx`
   - Replace mock data with real OpenSea data
   - Add real-time refresh

6. **Calculate and Show Actual Royalties Earned**
   - Parse royalty payments from blockchain
   - Display in dashboard stats
   - Transaction breakdown

**Dependencies**:
- OpenSea API key
- Royalty percentage stored in database or contract

---

### **Phase 3: Advanced Features** (Hardest, Requires Careful Planning)
**Estimated Time**: 1-2 weeks

7. **Actual NFT Minting on Blockchain**
   - File Location: `/src/services/nftMintingService.ts` (NEW)
   - Smart contract interaction
   - IPFS metadata upload
   - Transaction signing

8. **Wallet Switching/Management UX**
   - Update: `/src/components/WalletMenu.tsx`
   - Multi-wallet view in STO/UTL dashboard
   - Wallet verification flow

9. **STO Compliance & Legal Framework**
   - KYC gating for security tokens
   - Legal disclaimers and terms
   - Jurisdiction restrictions

**Dependencies**:
- Smart contract address
- IPFS service (Pinata/Infura)
- Legal consultation
- KYC provider integration

---

## ⚡ CRITICAL DECISIONS NEEDED

**Before ANY code can be written, please provide:**

### **1. OpenSea API Access**
- [ ] Do you have an OpenSea API key? **YES / NO**
- [ ] API Key: `_______________________`
- [ ] Tier: FREE / PAID

### **2. NFT Minting Strategy**
- [ ] Should we actually mint NFTs on blockchain? **YES / NO / LATER**
- [ ] If yes, do you have a smart contract deployed? **YES / NO**
- [ ] Contract Address: `_______________________`

### **3. Marketplace Implementation Priority**
- [ ] Where should Marketplace page go?
  - A) New full-page view ← **RECOMMENDED**
  - B) Dashboard tab
  - C) Integrate into existing view

**Decision**: _[TO BE DECIDED]_

### **4. Overall Priority Ranking**
Please rank these by importance (1 = highest priority):

- [ ] **Rank ___**: Users seeing NFTs in Marketplace
- [ ] **Rank ___**: Tracking real sales/royalties in STO/UTL dashboard
- [ ] **Rank ___**: Actually minting NFTs on-chain
- [ ] **Rank ___**: Wallet switching and management

### **5. Budget & Services**
Are you okay with costs for:

- [ ] Paid OpenSea API tier? **YES / NO** (for better rate limits)
- [ ] IPFS pinning service? **YES / NO** (for metadata storage ~$5-20/month)
- [ ] Gas fees for on-chain operations? **YES / NO** (Base network is cheap but still costs)

---

## 📁 FILE STRUCTURE PLAN

### Existing Files:
```
/src
├── /components
│   ├── /Landingpagenew
│   │   ├── tokenized-assets-glassmorphic.jsx ✅ (Main app)
│   │   ├── ProfileOverview.jsx ✅ (Profile with NFT frame)
│   │   ├── STOUTLDashboard.jsx ✅ (STO/UTL dashboard)
│   │   ├── TokenizeAssetFlow_NEW.jsx ✅ (Create tokens)
│   │   └── Marketplace.jsx ❌ (TO BE CREATED)
│   ├── WalletMenu.tsx ✅ (Wallet dropdown)
│   └── Dashboard.tsx ✅ (Dashboard with transactions)
├── /lib
│   └── web3.ts ✅ (Web3 service with NFT fetching)
└── /services
    ├── openseaService.ts ❌ (TO BE CREATED)
    └── nftMintingService.ts ❌ (TO BE CREATED - Phase 3)
```

### Files to Create:
1. **Marketplace.jsx** - Full NFT marketplace view
2. **openseaService.ts** - OpenSea API integration
3. **nftMintingService.ts** - On-chain minting (Phase 3)

---

## 🔄 NEXT STEPS

**Action Items:**

1. **Review this document** and fill in all `[TO BE DECIDED]` sections
2. **Provide OpenSea API key** (if available)
3. **Rank priorities** (1-4 in section 4 above)
4. **Confirm budget** for external services
5. **Schedule** implementation timeline based on priorities

**Once decisions are made:**
- I'll create detailed implementation plan for Phase 1
- Break down each feature into specific file changes
- Explain placement rationale for every function
- Provide code with full documentation

---

## 📝 NOTES & CONSIDERATIONS

### Security Best Practices:
- Never expose API keys in client-side code
- Use environment variables for sensitive data
- Implement rate limiting for API calls
- Validate wallet signatures for ownership

### User Experience:
- Loading states for all blockchain operations
- Error messages with actionable solutions
- Graceful degradation when services are unavailable
- Clear distinction between test and production environments

### Performance:
- Cache OpenSea data to reduce API calls
- Lazy load NFT images
- Paginate large NFT collections
- Use optimistic updates for better UX

---

## 📞 CONTACT & SUPPORT

**Developer**: Claude (AI Assistant)
**Project**: PrivateCharterX Tokenization Platform
**Last Updated**: 2025-10-13

---

**END OF REQUIREMENTS DOCUMENT**

*Please fill in the decision sections and we can proceed with implementation!* 🚀
