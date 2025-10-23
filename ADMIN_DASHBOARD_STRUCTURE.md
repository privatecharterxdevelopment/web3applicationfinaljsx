# Admin Dashboard - Visual Structure

## 🎯 Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│  🏠 Luxury Platform        🔔 📊 ⚙️ 👤                      │ ← Header
├───────────────┬─────────────────────────────────────────────┤
│               │                                             │
│  NAVIGATION   │           CONTENT AREA                      │
│   SIDEBAR     │                                             │
│               │                                             │
│ Web3 & DeFi   │  ┌─────────────────────────────────┐       │
│  • Projects   │  │  Launchpad Projects             │       │
│  • Waitlist   │  │  Total: 12 | Active: 5          │       │
│  • STO Inv.   │  └─────────────────────────────────┘       │
│  • P2P        │                                             │
│  • Tokenize   │  ┌────────────────────────────────┐        │
│               │  │ Project Name: Luxury Villa     │        │
│ Services      │  │ Status: Pending                │        │
│  • SPV        │  │ Amount: $2.5M                  │        │
│  • Tickets    │  │                                │        │
│  • Bookings   │  │ [Approve] [Reject] [Details]   │        │
│  • Requests   │  └────────────────────────────────┘        │
│               │                                             │
│ Marketplace   │  ┌────────────────────────────────┐        │
│  • Empty Legs │  │ Project Name: Jet Shares       │        │
│  • Offers     │  │ Status: Pending                │        │
│               │  │ Amount: $5M                    │        │
│ Management    │  │                                │        │
│  • Users      │  │ [Approve] [Reject] [Details]   │        │
│  • Notify     │  └────────────────────────────────┘        │
│  • Wallet     │                                             │
│               │  ... more projects ...                      │
└───────────────┴─────────────────────────────────────────────┘
```

---

## 📊 Section Breakdown

### 🟦 WEB3 & DeFi Section

#### 🚀 Launchpad Projects
```
Purpose: Manage tokenization project approvals
Shows: Project name, status, amount, target, shares
Actions: Approve, Reject, View Details
Status: pending → approved → active → completed
```

**Example View:**
```
┌─────────────────────────────────────────────┐
│ 🚀 Launchpad Projects                       │
│ ─────────────────────────────────────────── │
│                                             │
│ 🏝️  Luxury Villa Tokenization              │
│     Status: Pending    Amount: $2,500,000  │
│     Target: $5,000,000  Shares: 100,000    │
│     [✓ Approve] [✗ Reject] [👁️ Details]    │
│                                             │
│ ─────────────────────────────────────────── │
│                                             │
│ ✈️  Private Jet Fleet                       │
│     Status: Active     Amount: $5,000,000  │
│     Target: $10,000,000 Shares: 50,000     │
│     [Status ▼] [👁️ Details]                │
│                                             │
└─────────────────────────────────────────────┘
```

#### 👥 Waitlist
```
Purpose: Track users interested in projects
Shows: User email, project name, joined date
Actions: View, Send notification
```

#### 📈 STO Investments
```
Purpose: Monitor primary market investments
Shows: User, asset, shares purchased, amount, status
Actions: View, Update status
```

#### 💎 P2P Listings
```
Purpose: Oversee secondary market trading
Shows: Seller, asset, shares, price, status
Actions: View, Update status, Remove
```

#### 📝 Tokenization Requests
```
Purpose: Handle asset tokenization applications
Shows: User, asset type, valuation, status
Actions: Approve, Reject, Request info, Send payment link
```

---

### 🟩 SERVICES Section

#### 🏢 SPV Formations
```
Purpose: Manage SPV formation requests
Shows: Company name, jurisdiction, status, user
Actions: Approve, Reject, Send payment link
```

**Example View:**
```
┌─────────────────────────────────────────────┐
│ 🏢 SPV Formations                           │
│ ─────────────────────────────────────────── │
│                                             │
│ Company: Luxury Assets SPV Limited         │
│ Jurisdiction: British Virgin Islands       │
│ Status: Pending Review                     │
│ Requested by: john@example.com             │
│                                             │
│ [✓ Approve] [✗ Reject] [💳 Payment Link]   │
│                                             │
└─────────────────────────────────────────────┘
```

#### 💬 Support Tickets
```
Purpose: Manage user support requests
Shows: Ticket ID, user, subject, status, priority
Actions: Mark solved, Reply, Update priority
```

#### 📅 Bookings
```
Purpose: Handle jet/helicopter bookings
Shows: Service type, user, date, route, status
Actions: Confirm, Cancel, Update details
```

#### 📋 User Requests
```
Purpose: Manage general user requests
Shows: Request type, user, status, date
Actions: Update status, Send payment link, Notify user
```

---

### 🟨 MARKETPLACE Section

#### ✈️ Empty Legs
```
Purpose: Manage empty leg flight offers
Shows: Route, date, aircraft, price, status
Actions: Activate, Deactivate, Edit, Delete
```

**Example View:**
```
┌─────────────────────────────────────────────┐
│ ✈️ Empty Legs                               │
│ ─────────────────────────────────────────── │
│                                             │
│ Route: Zurich (ZRH) → London (LTN)         │
│ Date: 2025-10-25 | Aircraft: Gulfstream G5 │
│ Price: $12,500 | Seats: 8                  │
│ Status: Active                             │
│                                             │
│ [🔴 Deactivate] [✏️ Edit] [🗑️ Delete]       │
│                                             │
└─────────────────────────────────────────────┘
```

#### 🎁 Fixed Offers
```
Purpose: Manage fixed-price service packages
Shows: Offer name, service type, price, status
Actions: Edit, Activate, Deactivate
```

---

### 🟪 MANAGEMENT Section

#### 👥 Users
```
Purpose: View and manage all platform users
Shows: Name, email, KYC status, join date, role
Actions: Send notification, Update KYC, View profile
```

**Example View:**
```
┌─────────────────────────────────────────────┐
│ 👥 Users                                    │
│ ─────────────────────────────────────────── │
│                                             │
│ 👤 John Doe                                 │
│    john@example.com                         │
│    KYC: ✅ Verified | Role: User           │
│    Joined: 2025-08-15                      │
│                                             │
│    [📧 Notify] [👁️ View Profile]           │
│                                             │
│ ─────────────────────────────────────────── │
│                                             │
│ 👤 Jane Smith                               │
│    jane@example.com                         │
│    KYC: ⏳ Pending | Role: User            │
│    Joined: 2025-09-01                      │
│                                             │
│    [📧 Notify] [👁️ View Profile]           │
│                                             │
└─────────────────────────────────────────────┘
```

#### 🔔 Notifications
```
Purpose: Review notification history
Shows: Type, recipient, title, date, read status
Actions: View, Resend
```

#### 💰 Wallet Transactions
```
Purpose: Monitor blockchain transactions
Shows: User, transaction type, amount, hash, date
Actions: View details, Verify on blockchain
```

---

## 🎛️ Modal Dialogs

### 💳 Payment Link Modal
```
┌─────────────────────────────────────┐
│  Send Payment Link                  │
│  ───────────────────────────────────│
│                                     │
│  Amount:     [5000          ]       │
│  Currency:   [USD  ▼        ]       │
│  Payment URL:[https://...   ]       │
│  Description:[SPV Formation ]       │
│                                     │
│  [Cancel]           [Send Link]     │
└─────────────────────────────────────┘
```

### 📢 Send Notification Modal
```
┌─────────────────────────────────────┐
│  Send Notification                  │
│  ───────────────────────────────────│
│                                     │
│  Type:    [Project Approved ▼]     │
│  Title:   [Your Project Live]      │
│  Message: [Your tokenization...]   │
│  URL:     [/launchpad/proj-123]    │
│                                     │
│  [Cancel]    [Send Notification]    │
└─────────────────────────────────────┘
```

---

## 🎨 Color Coding

### Status Colors
- 🟢 **Green** - Active, Approved, Verified, Completed
- 🟡 **Yellow** - Pending, In Review, Processing
- 🔴 **Red** - Rejected, Failed, Expired
- 🔵 **Blue** - Draft, New, Unread
- ⚫ **Gray** - Cancelled, Closed, Archived

### Priority Colors (Support Tickets)
- 🔴 **High** - Urgent, requires immediate attention
- 🟡 **Medium** - Normal priority
- 🟢 **Low** - Can wait

### KYC Status
- ✅ **Verified** - KYC completed and approved
- ⏳ **Pending** - KYC submitted, under review
- ❌ **Rejected** - KYC failed verification
- ⚪ **Not Started** - User hasn't submitted KYC

---

## 🔄 Action Flows

### Approve Project Flow
```
1. Navigate to "Launchpad Projects"
2. Find pending project
3. Click "Approve" button
4. ✅ Project status → "approved"
5. 📧 User receives notification
6. 🚀 Project appears in marketplace
```

### Send Payment Link Flow
```
1. Open any request
2. Click "Send Payment Link"
3. Fill in modal:
   - Amount
   - Currency
   - Payment URL
   - Description
4. Click "Send"
5. ✅ User receives notification
6. 💳 User clicks link to pay
7. 📧 Admin notified of payment
```

### Handle Support Ticket Flow
```
1. Navigate to "Support Tickets"
2. Find open ticket
3. Read user message
4. Click "Reply" or "Mark Solved"
5. ✅ Ticket status → "closed"
6. 📧 User receives closure notification
```

---

## 📱 Responsive Behavior

### Desktop (1920px+)
- Full two-column layout
- Sidebar: 300px width
- Content: Remaining space
- 3 items per row in grid views

### Tablet (768px - 1919px)
- Two-column layout maintained
- Sidebar: 250px width
- 2 items per row in grid views

### Mobile (< 768px)
- Sidebar collapses to hamburger menu
- Single column layout
- 1 item per row
- Full-width content area

---

## 🎯 Key Metrics Dashboard (Future)

Planned dashboard overview:
```
┌──────────────────────────────────────────────────┐
│  📊 Platform Overview                            │
│  ────────────────────────────────────────────────│
│                                                  │
│  👥 Total Users: 1,234    ✅ Verified: 856      │
│  🚀 Projects: 45          💰 TVL: $127.5M       │
│  🎫 Open Tickets: 12      📧 Unread: 23         │
│  ✈️ Active Flights: 8     💎 P2P Listings: 34   │
│                                                  │
│  Recent Activity:                                │
│  • New project submitted (5 min ago)            │
│  • Support ticket #1234 resolved (10 min ago)   │
│  • User completed KYC (15 min ago)              │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## 🛠️ Technical Architecture

### Component Structure
```
AdminDashboardEnhanced.tsx
├── Navigation Sidebar
│   ├── Section: Web3 & DeFi
│   ├── Section: Services
│   ├── Section: Marketplace
│   └── Section: Management
│
├── Content Area
│   ├── Header (search, filter, refresh)
│   ├── Stats Cards
│   └── Data Grid/List
│
└── Modals
    ├── Payment Link Modal
    └── Notification Modal
```

### Data Flow
```
1. Component Mount → fetchAllData()
2. Supabase Query → Get all tables
3. State Update → Render components
4. User Action → API Call
5. Database Update → Refetch data
6. UI Update → Show success/error
```

### State Management
```typescript
{
  activeSection: 'launchpad_projects',
  launchpadProjects: [...],
  stoInvestments: [...],
  supportTickets: [...],
  users: [...],
  // ... etc
  isLoading: false,
  showPaymentModal: false,
  showNotificationModal: false,
  selectedItem: null
}
```

---

This structure provides a complete overview of the admin dashboard layout, sections, and functionality!
