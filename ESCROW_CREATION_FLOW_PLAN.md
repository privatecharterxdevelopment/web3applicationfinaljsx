# 📝 ESCROW CREATION FLOW - IMPLEMENTATION PLAN

**Datum:** 2025-11-25
**Status:** 🎯 **PLANNING**

---

## 🎯 USER REQUIREMENTS

### Fragen vom User:
1. **Where can users create escrow?**
   - ❌ Aktuell: Keine Möglichkeit!
   - ✅ Lösung: "Create Escrow" Button in EscrowPage + Integration in Booking Flow

2. **Where can users add signatures?**
   - ❌ Aktuell: Keine Signature Collection!
   - ✅ Lösung: Digital signature flow VOR escrow creation

3. **Where can users upload a contract?**
   - ❌ Aktuell: Kein Contract Upload!
   - ✅ Lösung: PDF/Document upload zu IPFS (encrypted)

4. **Should contracts be uploadable to IPFS (private)?**
   - ✅ JA! IPFS mit Encryption für Privacy

---

## 🔄 COMPLETE ESCROW CREATION FLOW

### Schritt 1: User erstellt Booking (z.B. Private Charter)
```
User bucht Flight im TaxiConciergeView
↓
Option: "Pay with Secure Escrow" ✅
↓
CreateEscrowFlow startet
```

### Schritt 2: Contract Upload & Details
```
┌─────────────────────────────────────────┐
│ Create Secure Escrow Payment            │
├─────────────────────────────────────────┤
│ Step 1: Agreement Details               │
│                                          │
│ Booking ID: CHARTER-2025-001 (auto)     │
│ Seller Address: 0x...                   │
│ Amount: [1.5] ETH                       │
│ Fee Tier: ○ Classic 1.5%                │
│           ● Managed 2.5% (with disputes)│
│                                          │
│ Upload Contract (Optional):              │
│ [📎 Upload PDF] or [📝 Write Agreement] │
│                                          │
│ Description:                             │
│ [Private charter from NYC to Miami...]  │
│                                          │
│        [Next: Review & Sign]             │
└─────────────────────────────────────────┘
```

### Schritt 3: Contract Review & Signatures
```
┌─────────────────────────────────────────┐
│ Step 2: Review & Sign Agreement         │
├─────────────────────────────────────────┤
│ Agreement Preview:                       │
│ ┌─────────────────────────────────┐    │
│ │ ESCROW AGREEMENT                 │    │
│ │                                  │    │
│ │ Booking: CHARTER-2025-001        │    │
│ │ Buyer: 0xAbC...123 (You)         │    │
│ │ Seller: 0xDef...456              │    │
│ │ Amount: 1.5 ETH                  │    │
│ │ Fee: 2.5% (Managed)              │    │
│ │                                  │    │
│ │ Terms:                           │    │
│ │ - Funds locked until service...  │    │
│ │ - Buyer can release or dispute   │    │
│ │ - Emergency exit after 180 days  │    │
│ │                                  │    │
│ │ [View Full Contract PDF]         │    │
│ └─────────────────────────────────┘    │
│                                          │
│ Signatures Required:                     │
│ ✅ Buyer (You): [Sign with Wallet]      │
│ ⏳ Seller: Waiting for signature...     │
│                                          │
│    [Cancel] [Sign & Create Escrow]      │
└─────────────────────────────────────────┘
```

### Schritt 4: Blockchain Escrow Creation
```
1. Buyer signs agreement (wallet signature)
   ↓
2. Agreement uploaded to IPFS (encrypted)
   ↓
3. Smart contract createEscrow() called
   ↓
4. ETH locked in contract
   ↓
5. Database entry created
   ↓
6. Seller receives notification (email/push)
   ↓
7. Seller signs agreement
   ↓
8. Escrow ACTIVE ✅
```

---

## 🗂️ DATABASE SCHEMA UPDATES

### Neue Tabelle: escrow_agreements

```sql
CREATE TABLE escrow_agreements (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Linked to escrow payment
  escrow_payment_id UUID NOT NULL REFERENCES escrow_payments(id) ON DELETE CASCADE,

  -- Contract/Agreement details
  contract_type TEXT NOT NULL CHECK (contract_type IN ('uploaded', 'generated', 'template')),
  contract_title TEXT NOT NULL,
  contract_description TEXT,

  -- IPFS storage (encrypted)
  ipfs_hash TEXT, -- IPFS CID for uploaded contract
  encryption_key TEXT, -- AES encryption key (encrypted with wallet public key)

  -- Agreement text (if not uploaded)
  agreement_text TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_escrow_agreements_payment_id ON escrow_agreements(escrow_payment_id);
```

### Neue Tabelle: escrow_signatures

```sql
CREATE TABLE escrow_signatures (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Linked to agreement
  agreement_id UUID NOT NULL REFERENCES escrow_agreements(id) ON DELETE CASCADE,

  -- Signer details
  signer_address TEXT NOT NULL, -- Wallet address (lowercase)
  signer_role TEXT NOT NULL CHECK (signer_role IN ('buyer', 'seller')),

  -- Signature data
  signature TEXT NOT NULL, -- Hex signature from wallet
  message_hash TEXT NOT NULL, -- Hash of agreement that was signed

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'rejected')),

  -- Timestamps
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_escrow_signatures_agreement_id ON escrow_signatures(agreement_id);
CREATE INDEX idx_escrow_signatures_signer ON escrow_signatures(signer_address);
```

### Update: escrow_payments (neue Spalten)

```sql
ALTER TABLE escrow_payments
ADD COLUMN agreement_id UUID REFERENCES escrow_agreements(id),
ADD COLUMN all_signed BOOLEAN DEFAULT false,
ADD COLUMN contract_ipfs_hash TEXT;
```

---

## 📦 IPFS INTEGRATION

### Option 1: Web3.Storage (Empfohlen - Kostenlos)

**Vorteile:**
- ✅ Kostenlos für bis zu 1TB
- ✅ Einfache API
- ✅ Automatische IPFS Pinning
- ✅ Gute Performance

**Implementation:**
```typescript
// src/lib/ipfs.ts
import { Web3Storage } from 'web3.storage';

const WEB3_STORAGE_TOKEN = import.meta.env.VITE_WEB3_STORAGE_TOKEN;
const client = new Web3Storage({ token: WEB3_STORAGE_TOKEN });

export async function uploadEncryptedContract(
  file: File,
  buyerAddress: string,
  sellerAddress: string
): Promise<{ cid: string; encryptionKey: string }> {
  // 1. Generate AES encryption key
  const encryptionKey = generateAESKey();

  // 2. Encrypt file with AES
  const encryptedFile = await encryptFile(file, encryptionKey);

  // 3. Upload to IPFS via Web3.Storage
  const cid = await client.put([encryptedFile], {
    name: `escrow-contract-${Date.now()}`,
    wrapWithDirectory: false
  });

  // 4. Encrypt the encryption key with buyer's public key
  const encryptedKey = await encryptForWallet(encryptionKey, buyerAddress);

  return { cid, encryptionKey: encryptedKey };
}

export async function downloadDecryptContract(
  cid: string,
  encryptionKey: string
): Promise<Blob> {
  // 1. Download from IPFS
  const res = await fetch(`https://${cid}.ipfs.w3s.link/`);
  const encryptedData = await res.blob();

  // 2. Decrypt with key
  const decryptedFile = await decryptFile(encryptedData, encryptionKey);

  return decryptedFile;
}
```

### Option 2: Pinata (Alternative)

**Vorteile:**
- ✅ Sehr zuverlässig
- ✅ Gute Developer Experience
- ⚠️ Paid plans für mehr Storage

---

## 🔐 ENCRYPTION STRATEGY

### Private Contracts - Nur Buyer & Seller können lesen

**Problem:** IPFS ist public - jeder mit CID kann Datei downloaden!

**Lösung:** Client-side Encryption

```typescript
// Encryption Flow
1. Generate random AES-256 key
2. Encrypt PDF/contract with AES key
3. Upload encrypted file to IPFS → get CID
4. Encrypt AES key with:
   - Buyer's wallet public key
   - Seller's wallet public key
5. Store encrypted keys in database
6. Only buyer/seller can decrypt with their wallet private key
```

**Code:**
```typescript
import CryptoJS from 'crypto-js';

// Generate random AES key
function generateAESKey(): string {
  return CryptoJS.lib.WordArray.random(256/8).toString();
}

// Encrypt file
async function encryptFile(file: File, key: string): Promise<File> {
  const arrayBuffer = await file.arrayBuffer();
  const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
  const encrypted = CryptoJS.AES.encrypt(wordArray, key).toString();

  const blob = new Blob([encrypted], { type: 'application/octet-stream' });
  return new File([blob], file.name + '.enc', { type: blob.type });
}

// Decrypt file
async function decryptFile(encryptedBlob: Blob, key: string): Promise<Blob> {
  const encryptedText = await encryptedBlob.text();
  const decrypted = CryptoJS.AES.decrypt(encryptedText, key);
  const arrayBuffer = wordArrayToArrayBuffer(decrypted);

  return new Blob([arrayBuffer], { type: 'application/pdf' });
}

// Encrypt AES key for wallet (using wallet's public key)
async function encryptForWallet(aesKey: string, walletAddress: string): Promise<string> {
  // Use wallet's signing to encrypt
  // Alternative: Use wallet's public key with asymmetric encryption
  const message = `Encrypt key: ${aesKey}`;
  const signature = await signMessage(message, walletAddress);
  return signature; // Signature acts as encrypted key
}
```

---

## 🎨 UI COMPONENTS ZU ERSTELLEN

### 1. CreateEscrowButton.jsx
```jsx
// In EscrowPage.jsx
<button
  onClick={() => setShowCreateModal(true)}
  className="px-6 py-2 bg-black text-white text-sm font-light rounded-lg hover:bg-gray-800"
>
  + Create Escrow
</button>
```

### 2. CreateEscrowModal.jsx
```jsx
// Multi-step wizard:
// Step 1: Details (amount, seller, fee tier)
// Step 2: Contract upload/write
// Step 3: Review & Sign
// Step 4: Confirmation
```

### 3. ContractUpload.jsx
```jsx
// Drag & drop PDF upload
// OR write agreement in textarea
// Preview uploaded contract
```

### 4. SignatureCollector.jsx
```jsx
// Show pending signatures
// Sign with wallet button
// Display signature status
```

### 5. ContractViewer.jsx
```jsx
// View uploaded PDF
// Download decrypted contract
// Show signature status
```

---

## 🔄 INTEGRATION MIT BOOKING FLOW

### In TaxiConciergeView.jsx

```jsx
// Beim Booking erstellen
<button onClick={() => handlePayWithEscrow()}>
  Pay with Secure Escrow (2.5% fee)
</button>

const handlePayWithEscrow = async () => {
  // 1. Create booking first
  const booking = await createBooking();

  // 2. Open CreateEscrowModal with pre-filled data
  setEscrowData({
    bookingId: booking.id,
    sellerAddress: driver.wallet_address,
    amount: booking.total_price,
    description: `Private charter from ${booking.from} to ${booking.to}`
  });

  setShowCreateEscrowModal(true);
};
```

---

## 📋 IMPLEMENTATION STEPS

### Phase 1: Database & IPFS Setup (Day 1)
- [ ] Create escrow_agreements table
- [ ] Create escrow_signatures table
- [ ] Update escrow_payments table
- [ ] Setup Web3.Storage account
- [ ] Implement ipfs.ts library
- [ ] Implement encryption helpers

### Phase 2: UI Components (Day 2-3)
- [ ] CreateEscrowButton component
- [ ] CreateEscrowModal (multi-step wizard)
- [ ] ContractUpload component
- [ ] SignatureCollector component
- [ ] ContractViewer component

### Phase 3: Backend Integration (Day 4)
- [ ] Create escrow creation API
- [ ] Signature collection flow
- [ ] IPFS upload/download integration
- [ ] Database operations
- [ ] Notification system (email seller)

### Phase 4: Booking Integration (Day 5)
- [ ] Integrate in TaxiConciergeView
- [ ] Add to other booking flows
- [ ] Test end-to-end flow

### Phase 5: Testing & Polish (Day 6-7)
- [ ] Test escrow creation
- [ ] Test signature collection
- [ ] Test IPFS upload/download
- [ ] Test encryption/decryption
- [ ] Test with real bookings
- [ ] Polish UI/UX

---

## 🎯 USER STORIES

### Story 1: Buyer Creates Escrow with Contract
```
Als Buyer möchte ich:
1. Im Booking Flow "Pay with Escrow" wählen
2. Einen Vertrag hochladen (PDF) oder schreiben
3. Den Vertrag mit meiner Wallet signieren
4. ETH in Escrow sperren
5. Dass der Seller benachrichtigt wird
6. Dass der Seller auch signieren kann

Damit: Beide Parteien einen signierten Vertrag haben
```

### Story 2: Seller Signs Agreement
```
Als Seller möchte ich:
1. Notification erhalten (Email/Push)
2. Escrow Details sehen
3. Vertrag lesen können
4. Vertrag signieren mit Wallet
5. Dass Escrow dann ACTIVE wird

Damit: Ich bestätige, dass ich Service erbringe
```

### Story 3: View Signed Contract
```
Als Buyer/Seller möchte ich:
1. Jederzeit meinen signierten Vertrag sehen
2. PDF herunterladen können
3. Signaturen verifizieren können
4. IPFS Hash sehen können

Damit: Ich Proof-of-Agreement habe
```

---

## 🔒 SECURITY CONSIDERATIONS

### 1. Private Contracts
✅ **Encryption:** AES-256 client-side
✅ **Key Storage:** Encrypted with wallet keys
✅ **Access Control:** Only buyer/seller can decrypt
✅ **IPFS:** Public CID, aber encrypted content

### 2. Signature Verification
✅ **Wallet Signatures:** Native wallet signing
✅ **Message Hash:** Hash of agreement content
✅ **On-Chain Verification:** Optional - verify signatures on-chain
✅ **Replay Protection:** Timestamp + nonce

### 3. Privacy
✅ **No Public Data:** Agreement content encrypted
✅ **IPFS CID:** Points to encrypted data
✅ **Metadata:** Only in private database
✅ **Wallet-Only Access:** Decrypt requires wallet signature

---

## 💰 COSTS

### Web3.Storage
- ✅ **FREE:** Up to 1TB storage
- ✅ **FREE:** Unlimited uploads
- ✅ **FREE:** IPFS pinning included

### Pinata (Alternative)
- 💰 **$20/month:** 1GB storage
- 💰 **$100/month:** 100GB storage

**Empfehlung:** Web3.Storage für Start (FREE!)

---

## 📊 DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                   ESCROW CREATION FLOW                       │
└─────────────────────────────────────────────────────────────┘

User Creates Booking
        ↓
    [Booking Created]
        ↓
User clicks "Pay with Escrow"
        ↓
┌────────────────────────┐
│ CreateEscrowModal      │
│ - Enter Details        │
│ - Upload Contract (PDF)│
│ - OR Write Agreement   │
└────────────────────────┘
        ↓
Contract Uploaded/Written
        ↓
┌────────────────────────┐
│ Encryption             │
│ 1. Generate AES key    │
│ 2. Encrypt contract    │
│ 3. Upload to IPFS      │
│ 4. Get CID             │
└────────────────────────┘
        ↓
    [IPFS CID: Qm...]
        ↓
┌────────────────────────┐
│ Buyer Signs Agreement  │
│ - Wallet signature     │
│ - Message hash         │
└────────────────────────┘
        ↓
    [Buyer Signature: 0x...]
        ↓
┌────────────────────────┐
│ Create Escrow On-Chain │
│ - Call smart contract  │
│ - Lock ETH             │
│ - Get escrow ID        │
└────────────────────────┘
        ↓
    [Escrow ID: 1]
        ↓
┌────────────────────────┐
│ Save to Database       │
│ - escrow_payments      │
│ - escrow_agreements    │
│ - escrow_signatures    │
└────────────────────────┘
        ↓
┌────────────────────────┐
│ Notify Seller          │
│ - Email notification   │
│ - Push notification    │
└────────────────────────┘
        ↓
Seller Views Escrow
        ↓
┌────────────────────────┐
│ Seller Signs Agreement │
│ - Wallet signature     │
│ - Message hash         │
└────────────────────────┘
        ↓
    [Seller Signature: 0x...]
        ↓
┌────────────────────────┐
│ Update Database        │
│ - all_signed = true    │
│ - status = 'active'    │
└────────────────────────┘
        ↓
    ✅ ESCROW ACTIVE!
```

---

## 🎉 SUMMARY

### Was wir bauen müssen:

1. **Database Tables** ✅
   - escrow_agreements
   - escrow_signatures

2. **IPFS Integration** ✅
   - Web3.Storage setup
   - Upload/download functions
   - Encryption helpers

3. **UI Components** ✅
   - CreateEscrowModal
   - ContractUpload
   - SignatureCollector
   - ContractViewer

4. **Backend Logic** ✅
   - Escrow creation flow
   - Signature verification
   - Notification system

5. **Booking Integration** ✅
   - TaxiConciergeView
   - Other booking flows

### Timeline: ~1 Woche

**Bereit für Implementation?** 🚀
