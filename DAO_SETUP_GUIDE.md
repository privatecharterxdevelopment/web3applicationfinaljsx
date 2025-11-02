# DAO Management System - Setup Guide

## Overview

This DAO (Decentralized Autonomous Organization) system allows users to create and manage decentralized organizations with the following features:

- **Multiple DAO Types**: Fundraising, Fractional Ownership, Governance, and Service DAOs
- **Aragon DAO Integration**: Ready for on-chain DAO deployment
- **Safe (Gnosis) Escrow**: Multi-signature wallet integration for treasury management
- **Governance Models**: Token-based voting, Multi-signature, and Quadratic voting
- **Complete Management**: Proposals, voting, transactions, and member management

## Prerequisites

- Node.js and npm installed
- Supabase account and project
- Wallet (MetaMask or similar)
- Aragon DAO SDK (for production deployment)
- Safe API access (for escrow functionality)

## Step 1: Database Setup

### Run the Migration

Execute the SQL migration file in your Supabase SQL Editor:

```bash
# Navigate to Supabase Dashboard > SQL Editor
# Copy and paste the contents of: supabase_dao_migration.sql
# Click "Run"
```

This creates the following tables:
- `daos` - Main DAO information
- `dao_proposals` - Governance proposals
- `dao_votes` - Individual votes on proposals
- `dao_transactions` - Financial transactions
- `dao_members` - DAO membership records

### Verify Tables

Check that all tables were created successfully:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'dao%';
```

## Step 2: Storage Configuration

### Setup Image Storage Bucket

The system uses Supabase Storage for DAO logos and header images.

1. Go to Supabase Dashboard > Storage
2. Verify the `serviceImagesVector` bucket exists (or create it)
3. Update bucket policies to allow public read access:

```sql
-- Allow public read access to DAO images
CREATE POLICY "Public Access" ON storage.objects FOR SELECT
USING (bucket_id = 'serviceImagesVector');

-- Allow authenticated users to upload DAO images
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'serviceImagesVector' AND auth.role() = 'authenticated');
```

## Step 3: Environment Configuration

Ensure your `.env` file has the correct Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Step 4: Component Integration

The DAO system is already integrated into the glassmorphic dashboard:

### Files Included:
- `src/components/Landingpagenew/DAOCreator.jsx` - DAO creation wizard
- `src/components/Landingpagenew/MyDAOs.jsx` - DAO management dashboard
- `src/components/Landingpagenew/tokenized-assets-glassmorphic.jsx` - Main integration

### Access the DAO System:
1. Navigate to the Web3.0 dashboard
2. Click on "DAOs" in the menu
3. The MyDAOs component will load

## Step 5: Using the DAO System

### Creating a DAO

1. **Connect Wallet**: Click "Connect Wallet" if not already connected
2. **Click "Create DAO"**: Opens the 5-step creation wizard

#### Step 1: Basic Information
- Choose DAO type (Fundraising, Fractional, Governance, Service)
- Enter DAO name and description
- Upload logo (square, recommended 200x200px)
- Upload header image (recommended 1200x400px)

#### Step 2: Token & Governance
- Set token name and symbol
- Define initial supply
- Choose governance model:
  - **Token-Based**: 1 token = 1 vote
  - **Multi-Signature**: Multiple approvals required
  - **Quadratic**: Diminishing voting power
- Set voting period (days) and quorum percentage
- For Fundraising DAOs: Set goal, minimum contribution, token price

#### Step 3: Access Control & Security
- Choose Public or Private access
- For Private DAOs: Add whitelisted wallet addresses
- **Safe Escrow Configuration**:
  - Enable/disable Safe (Gnosis) escrow
  - Add Safe owner addresses
  - Set approval threshold (e.g., 2 of 3 signatures)

#### Step 4: Products & Services (Optional)
- Add products or services offered by the DAO
- Each product includes: name, description, price

#### Step 5: Review & Deploy
- Review all configuration
- Accept terms and conditions
- Click "Create DAO" to save to database

### Managing DAOs

#### My DAOs Dashboard

**Stats Overview:**
- Total DAOs (created + joined)
- Created by you
- DAOs you've joined
- Active DAOs

**Filters:**
- **All**: View all DAOs you're involved with
- **Created**: Only DAOs you created
- **Joined**: Only DAOs you're a member of

**Search**: Filter by DAO name or description

#### DAO Detail View

Click on any DAO card to view details:

**Overview Tab:**
- Full description
- Configuration details (type, governance, voting period, quorum)
- Token information (name, symbol, supply, price)
- Products & services list

**Transactions Tab:**
- Recent financial transactions
- Transaction type, amount, and date
- Future: Integration with blockchain transaction data

**Proposals Tab:**
- Governance proposals
- Proposal status (draft, active, passed, rejected, executed)
- Voting results

**Members Tab:**
- Whitelisted addresses
- Safe owners and signature threshold
- Copy address functionality

## Step 6: Aragon DAO Integration (Production)

### Install Aragon SDK

```bash
npm install @aragon/sdk-client @aragon/sdk-client-common
```

### Initialize Aragon Client

Create `src/lib/aragon.js`:

```javascript
import { Client, Context } from '@aragon/sdk-client';
import { JsonRpcProvider } from '@ethersproject/providers';

const context = new Context({
  network: 'mainnet', // or 'goerli' for testnet
  signer: yourWalletSigner,
  daoFactoryAddress: 'ARAGON_DAO_FACTORY_ADDRESS',
  web3Providers: [new JsonRpcProvider('YOUR_RPC_URL')]
});

export const aragonClient = new Client(context);
```

### Update DAOCreator.jsx

In the `createDAO` function (line 181), replace the comment:

```javascript
// Replace this comment at line 230:
// Here you would integrate with Aragon DAO SDK to deploy the actual DAO

// With actual deployment:
const daoParams = {
  daoMetadata: {
    name: daoData.name,
    description: daoData.description
  },
  plugins: [{
    id: 'token-voting-plugin',
    data: {
      token: {
        name: daoData.tokenName,
        symbol: daoData.tokenSymbol,
        decimals: 18
      },
      votingSettings: {
        minDuration: daoData.votingPeriod * 24 * 60 * 60,
        minParticipation: daoData.quorumPercentage / 100,
        supportThreshold: 0.5
      }
    }
  }]
};

const steps = aragonClient.methods.createDao(daoParams);
for await (const step of steps) {
  console.log('Deployment step:', step);
}

// Update database with deployed addresses
await supabase
  .from('daos')
  .update({
    aragon_dao_address: deployedDAOAddress,
    aragon_token_address: deployedTokenAddress,
    aragon_voting_address: deployedVotingAddress,
    status: 'active',
    deployed_at: new Date().toISOString()
  })
  .eq('id', data[0].id);
```

## Step 7: Safe (Gnosis) Integration (Production)

### Install Safe SDK

```bash
npm install @safe-global/api-kit @safe-global/protocol-kit @safe-global/safe-core-sdk-types
```

### Create Safe Service

Create `src/lib/safe.js`:

```javascript
import { ethers } from 'ethers';
import Safe, { EthersAdapter } from '@safe-global/protocol-kit';
import { SafeFactory } from '@safe-global/protocol-kit';

export async function createSafe(owners, threshold, signer) {
  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: signer
  });

  const safeFactory = await SafeFactory.create({ ethAdapter });

  const safe = await safeFactory.deploySafe({
    safeAccountConfig: {
      owners,
      threshold
    }
  });

  return safe.getAddress();
}

export async function submitTransaction(safeAddress, to, value, data, signer) {
  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: signer
  });

  const safeSdk = await Safe.create({
    ethAdapter,
    safeAddress
  });

  const transaction = {
    to,
    value,
    data
  };

  const safeTransaction = await safeSdk.createTransaction({ safeTransactionData: transaction });
  const txHash = await safeSdk.getTransactionHash(safeTransaction);

  return { safeTransaction, txHash };
}
```

### Update DAOCreator.jsx for Safe Deployment

Add Safe creation when escrow is enabled:

```javascript
if (daoData.useSafeEscrow && daoData.safeOwners.length >= daoData.safeThreshold) {
  const safeAddress = await createSafe(
    daoData.safeOwners,
    daoData.safeThreshold,
    signer // from wagmi useWalletClient
  );

  // Update database with Safe address
  await supabase
    .from('daos')
    .update({ safe_address: safeAddress })
    .eq('id', data[0].id);
}
```

## Step 8: Testing

### Test DAO Creation

1. Connect wallet
2. Create a test DAO with minimal configuration
3. Verify entry in Supabase `daos` table
4. Check that creator was added to `dao_members` table (automatic trigger)

### Test Image Upload

1. Upload logo and header images
2. Verify files appear in Supabase Storage bucket
3. Check that URLs are correctly saved in database

### Test Whitelist

1. Create a private DAO
2. Add whitelisted addresses
3. Verify addresses saved as PostgreSQL array in database

### Test Safe Configuration

1. Enable Safe escrow
2. Add owner addresses
3. Set threshold
4. Verify configuration saved correctly

## Database Schema Reference

### DAOs Table
```sql
id                  UUID PRIMARY KEY
creator_address     TEXT NOT NULL
user_id            UUID (foreign key to auth.users)
name               TEXT NOT NULL
description        TEXT
dao_type           TEXT (fundraising|fractional|governance|service)
category           TEXT
logo_url           TEXT
header_image_url   TEXT
token_name         TEXT NOT NULL
token_symbol       TEXT NOT NULL
initial_supply     NUMERIC
governance_model   TEXT (token-voting|multisig|quadratic)
voting_period_days INTEGER (default 7)
quorum_percentage  INTEGER (default 50)
fundraising_goal   NUMERIC
minimum_contribution NUMERIC
token_price        NUMERIC
whitelisted_addresses TEXT[] (array)
is_public          BOOLEAN (default true)
use_safe_escrow    BOOLEAN (default false)
safe_address       TEXT
safe_owners        TEXT[] (array)
safe_threshold     INTEGER (default 1)
aragon_dao_address TEXT
products           JSONB (array of products)
status             TEXT (pending|active|paused|closed)
created_at         TIMESTAMP
updated_at         TIMESTAMP
deployed_at        TIMESTAMP
```

## Security Considerations

### Row Level Security (RLS)

The system includes RLS policies:

**DAOs:**
- ✓ Anyone can view public DAOs
- ✓ Authenticated users can create DAOs
- ✓ Only creators can update/delete their DAOs

**Proposals:**
- ✓ Anyone can view proposals
- ✓ Only DAO members can create proposals

**Votes:**
- ✓ Anyone can view votes
- ✓ Only DAO members can submit votes

**Transactions:**
- ✓ Only DAO members can view transactions
- ✓ Only DAO admins can create transactions

### Best Practices

1. **Wallet Security**: Never store private keys in the application
2. **Address Validation**: All wallet addresses are validated with regex before storage
3. **Safe Thresholds**: Ensure threshold ≤ number of owners
4. **Image Uploads**: Validate file types and sizes before upload
5. **Transaction Signing**: Always require user confirmation for blockchain transactions

## Troubleshooting

### Database Connection Issues
- Verify Supabase credentials in `.env`
- Check RLS policies are properly configured
- Ensure user is authenticated before operations

### Image Upload Fails
- Check Storage bucket permissions
- Verify bucket name matches (`serviceImagesVector`)
- Ensure file size is reasonable (< 5MB recommended)

### DAO Not Appearing
- Confirm wallet is connected
- Check browser console for errors
- Verify DAO was saved to database
- Clear cache and reload

### Safe Creation Fails
- Ensure Safe SDK is installed
- Check network compatibility (mainnet vs testnet)
- Verify sufficient gas for deployment
- Confirm owner addresses are valid

## Future Enhancements

### Planned Features
- [ ] Proposal creation interface
- [ ] On-chain voting integration
- [ ] Treasury management dashboard
- [ ] Token distribution tools
- [ ] NFT membership integration
- [ ] DAO analytics and reporting
- [ ] Multi-chain support
- [ ] ENS integration for DAO naming
- [ ] Discord/Telegram notifications
- [ ] Snapshot integration for off-chain voting

## Support & Resources

### Documentation
- [Aragon Developer Docs](https://devs.aragon.org/)
- [Safe (Gnosis) Documentation](https://docs.safe.global/)
- [Supabase Documentation](https://supabase.com/docs)
- [wagmi Documentation](https://wagmi.sh/)

### Community
- Report issues in project repository
- Check existing DAOs for examples
- Join Aragon Discord for DAO development support
- Safe community forum for multi-sig questions

## API Reference

### Supabase Tables

#### Query DAOs
```javascript
const { data, error } = await supabase
  .from('daos')
  .select('*')
  .eq('creator_address', address);
```

#### Create Proposal
```javascript
const { data, error } = await supabase
  .from('dao_proposals')
  .insert({
    dao_id: daoId,
    creator_address: address,
    title: 'Proposal Title',
    description: 'Proposal Description',
    status: 'draft'
  });
```

#### Record Vote
```javascript
const { data, error } = await supabase
  .from('dao_votes')
  .insert({
    proposal_id: proposalId,
    dao_id: daoId,
    voter_address: address,
    vote_choice: 'for', // 'for', 'against', 'abstain'
    voting_power: tokenBalance
  });
```

#### Track Transaction
```javascript
const { data, error } = await supabase
  .from('dao_transactions')
  .insert({
    dao_id: daoId,
    type: 'contribution',
    from_address: fromAddress,
    to_address: toAddress,
    amount: amount,
    transaction_hash: txHash,
    status: 'confirmed'
  });
```

## Conclusion

The DAO Management System is now ready for use! Users can create and manage DAOs through the Web3.0 dashboard. For production deployment, integrate the Aragon DAO SDK and Safe API as outlined in Steps 6 and 7.

For questions or support, refer to the documentation links above or check the community resources.
