# Partner System Updates - Required Changes

## ✅ IMPLEMENTED - Payment Escrow Admin Approval

**Status:** Fully implemented as of 2025-10-30

**What was added:**
1. ✅ [PaymentApprovalManagement.tsx](src/pages/admin/components/PaymentApprovalManagement.tsx) - Admin component to review and approve payments
2. ✅ API endpoints: `POST /admin/approve-payment` and `POST /admin/reject-payment`
3. ✅ Admin dashboard navigation link: "Payment Approvals"
4. ✅ Database migration: [20251030000000_partner_system_updates.sql](supabase/migrations/20251030000000_partner_system_updates.sql)

**How it works now:**
1. Customer books service → Payment held in escrow
2. Partner confirms service completion → Status moves to "Awaiting Approval"
3. Admin reviews in "Payment Approvals" dashboard
4. Admin approves → Payment captured + transferred to partner (minus commission)
5. Admin rejects → Payment authorization released (customer not charged)

---

## 1. Payment Escrow - Admin Approval Required (ORIGINAL SPEC)

### Current Flow (INCORRECT):
```
Customer books → Payment held in escrow
↓
Partner confirms arrival → Payment captured automatically
↓
Money transferred to partner
```

### New Flow (REQUIRED):
```
Customer books → Payment held in escrow
↓
Partner confirms arrival (service completed)
↓
Admin reviews and approves payment ✅
↓
Payment captured and transferred to partner
```

### Implementation Required:

**A. Add new booking status: `awaiting_payment_approval`**
```sql
ALTER TABLE partner_bookings
ADD COLUMN payment_approval_status TEXT DEFAULT 'pending';
-- Values: 'pending' | 'awaiting_approval' | 'approved' | 'rejected'
```

**B. Update Partner Dashboard (PartnerDashboard.tsx)**
- When partner clicks "Confirm Arrival":
  - Booking status → `completed`
  - Payment approval status → `awaiting_approval`
  - Do NOT capture payment yet
  - Notify admin: "Payment approval needed for booking #123"

**C. Create Admin Payment Approval Component**
File: `src/pages/admin/components/PaymentApprovalManagement.tsx`

Features:
- List all bookings with status `awaiting_approval`
- Show booking details:
  - Partner name
  - Customer name
  - Service details
  - Amount
  - Partner's confirmation timestamp
- Actions:
  - **Approve Payment** → Capture payment + Transfer to partner
  - **Reject Payment** → Release escrow (customer not charged)
  - Add rejection reason (optional)

**D. Update API Endpoint**
Modify: `POST /api/partners/capture-and-transfer`
- Remove automatic capture
- Only update status to `awaiting_approval`
- Send admin notification

Create: `POST /api/admin/approve-payment`
```javascript
// Requires admin authentication
{
  bookingId: string,
  adminId: string,
  action: 'approve' | 'reject',
  reason?: string
}
```

---

## 2. Partner Service Types Restriction

### Current Service Types (7 types):
- ❌ Taxi / Driver Service
- ❌ Luxury Car / Limousine
- ❌ Adventure Package
- ❌ Vehicle Rental
- ❌ Other Service

### New Service Types (4 types ONLY):
- ✅ **Car Rental** (formerly "Vehicle Rental")
- ✅ **Limousine Service** (formerly "Luxury Car")
- ✅ **Concierge Service** (NEW)
- ✅ **Adventure Package** (backend only - not public)

### Implementation:

**A. Update PartnerServiceManagement.tsx**
Line 45-51, change SERVICE_TYPES to:
```typescript
const SERVICE_TYPES = [
  { value: 'car_rental', label: 'Car Rental' },
  { value: 'limousine', label: 'Limousine Service' },
  { value: 'concierge', label: 'Concierge Service' },
  { value: 'adventure', label: 'Adventure Package' }
];
```

**B. Update Database Schema**
```sql
-- Update partner_services table
ALTER TABLE partner_services
ALTER COLUMN service_type TYPE TEXT;

-- Add constraint
ALTER TABLE partner_services
ADD CONSTRAINT service_type_check
CHECK (service_type IN ('car_rental', 'limousine', 'concierge', 'adventure'));

-- Update visibility for adventure packages
ALTER TABLE partner_services
ADD COLUMN is_public BOOLEAN DEFAULT true;

-- Adventure packages are NOT public by default
CREATE OR REPLACE FUNCTION set_adventure_visibility()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.service_type = 'adventure' THEN
    NEW.is_public = false;
  ELSE
    NEW.is_public = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER adventure_visibility_trigger
BEFORE INSERT OR UPDATE ON partner_services
FOR EACH ROW
EXECUTE FUNCTION set_adventure_visibility();
```

**C. Partner Adventure Visibility**
- Partner adventures: `is_public = false` by default
- Only visible to:
  - Partner (owner)
  - Admins
- NOT visible to customers in public listings

---

## 3. Admin Adventure Approval Flow

### New Feature: Push Partner Adventures to Public

**A. Admin Dashboard Component**
File: `src/pages/admin/components/PartnerAdventureManagement.tsx`

Features:
- List ALL partner adventure packages (is_public = false)
- Show adventure details:
  - Partner name
  - Title, description
  - Price
  - Location
  - Images
  - Status: Pending Review / Approved / Rejected
- Actions:
  - **Review Adventure** → View full details
  - **Approve & Push to Public** → Move to `fixed_offers` table
  - **Keep Private** → Stay in `partner_services` (backend only)
  - **Reject** → Mark as rejected

**B. Database Changes**
```sql
-- Add approval tracking to partner_services
ALTER TABLE partner_services
ADD COLUMN admin_approved BOOLEAN DEFAULT false,
ADD COLUMN approved_by UUID REFERENCES auth.users(id),
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN rejection_reason TEXT;

-- Add partner tracking to fixed_offers
ALTER TABLE fixed_offers
ADD COLUMN partner_id UUID REFERENCES auth.users(id),
ADD COLUMN is_partner_offer BOOLEAN DEFAULT false,
ADD COLUMN partner_logo_url TEXT;
```

**C. API Endpoint**
Create: `POST /api/admin/approve-partner-adventure`
```javascript
{
  serviceId: string, // partner_services.id
  adminId: string,
  action: 'approve_public' | 'keep_private' | 'reject',
  reason?: string
}

// If action = 'approve_public':
// 1. Copy from partner_services to fixed_offers
// 2. Set is_partner_offer = true
// 3. Set partner_id and partner_logo_url
// 4. Set admin_approved = true in partner_services
```

---

## 4. Logo Display on Adventure Cards

### Current Display:
```jsx
<span className="bg-black text-white px-2 py-1 rounded text-xs font-semibold uppercase">
  PCX
</span>
```

### New Display:

**A. PCX Adventures** (is_partner_offer = false):
```jsx
<div className="flex items-center gap-2">
  <img
    src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/PrivatecharterX_logo_vectorized.glb.png"
    alt="PrivateCharterX"
    className="h-6 w-auto object-contain"
  />
</div>
```

**B. Partner Adventures** (is_partner_offer = true):
```jsx
<div className="flex items-center gap-2">
  <img
    src={adventure.partner_logo_url || '/default-partner-logo.png'}
    alt={adventure.partner_name || 'Partner'}
    className="h-6 w-auto object-contain rounded"
  />
  <span className="text-xs text-gray-600 font-medium">Partner</span>
</div>
```

### Implementation:

**Files to Update:**

1. **Adventure Grid Cards** (Line 6548)
   - File: `src/components/Landingpagenew/tokenized-assets-glassmorphic.jsx`
   - Replace text badge with logo

2. **Adventure Detail View** (Line 6802)
   - Same file
   - Replace "PCX ADVENTURE" with logo

3. **Adventure Tabs View** (if exists)
   - Same pattern

**Example Implementation:**
```jsx
{/* Grid Card - Line 6548 */}
<div className="flex items-center justify-between mb-3">
  {adventure.is_partner_offer ? (
    <div className="flex items-center gap-2">
      <img
        src={adventure.partner_logo_url}
        alt={adventure.partner_name}
        className="h-6 w-auto object-contain rounded"
      />
      <span className="text-xs text-gray-600 font-medium">Partner</span>
    </div>
  ) : (
    <img
      src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/PrivatecharterX_logo_vectorized.glb.png"
      alt="PrivateCharterX"
      className="h-6 w-auto object-contain"
    />
  )}
  <div className="flex space-x-2">
    {/* Share and favorite buttons */}
  </div>
</div>
```

---

## 5. Query Updates

### Load Adventures with Partner Info

**Update adventure loading query:**
```javascript
// In tokenized-assets-glassmorphic.jsx
const { data: adventures, error } = await supabase
  .from('fixed_offers')
  .select(`
    *,
    partner:users!partner_id (
      id,
      company_name,
      logo_url
    )
  `)
  .or('is_partner_offer.eq.false,and(is_partner_offer.eq.true,admin_approved.eq.true)')
  .order('created_at', { ascending: false });

// Transform data to include partner info
const transformedAdventures = adventures.map(adv => ({
  ...adv,
  is_partner_offer: adv.is_partner_offer || false,
  partner_name: adv.partner?.company_name || null,
  partner_logo_url: adv.partner?.logo_url || null
}));
```

---

## Summary of Changes

### Database:
- ✅ Add `payment_approval_status` to `partner_bookings`
- ✅ Update `partner_services` service_type constraint
- ✅ Add `is_public` column to `partner_services`
- ✅ Add `admin_approved` columns to `partner_services`
- ✅ Add `partner_id`, `is_partner_offer`, `partner_logo_url` to `fixed_offers`

### Backend API:
- ✅ Modify `/api/partners/capture-and-transfer` - remove auto-capture
- ✅ Create `/api/admin/approve-payment`
- ✅ Create `/api/admin/approve-partner-adventure`

### Frontend Components:
- ✅ Update `PartnerDashboard.tsx` - change confirm arrival flow
- ✅ Update `PartnerServiceManagement.tsx` - restrict service types
- ✅ Create `PaymentApprovalManagement.tsx` - admin payment approval
- ✅ Create `PartnerAdventureManagement.tsx` - admin adventure approval
- ✅ Update adventure cards - replace text with logos

### Admin Dashboard:
- ✅ Add "Payment Approvals" section
- ✅ Add "Partner Adventures" section
- ✅ Show pending payment approvals count
- ✅ Show pending adventure approvals count

---

## Priority Order

1. **HIGH**: Payment approval system (security/money)
2. **HIGH**: Service type restrictions (data integrity)
3. **MEDIUM**: Logo display (UX improvement)
4. **MEDIUM**: Partner adventure approval (feature enhancement)

---

## Testing Checklist

- [ ] Partner completes service → Status = awaiting_approval (NOT captured)
- [ ] Admin sees pending payment approval
- [ ] Admin approves → Payment captured + transferred
- [ ] Admin rejects → Payment released (customer not charged)
- [ ] Partner can only create 4 service types
- [ ] Partner adventure packages stay private by default
- [ ] Admin can push partner adventure to public listings
- [ ] PCX adventures show PCX logo
- [ ] Partner adventures show partner logo
- [ ] Public listings show both PCX and approved partner adventures
