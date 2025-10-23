# 📝 Remaining Pages to Update with PageHeader

## ✅ Already Updated:
1. Marketplace ✅
2. P2PMarketplace ✅
3. TokenizedAssetsShowcase ✅
4. STOUTLDashboard ✅

---

## 🔄 Still Need Update:

### Priority 1 - Main Pages:

#### **ProfileOverview.jsx**
Find line with: `Profile Overview` or similar h1/h2
Replace with:
```jsx
import PageHeader from './PageHeader';

<PageHeader
  title="Profile Overview"
  subtitle="Manage your account and preferences"
/>
```

#### **TokenSwap.jsx**
Current likely has: `Token Swap` or `Swap Tokens`
Replace with:
```jsx
<PageHeader
  title="Token Swap"
  subtitle="Exchange tokens instantly with best rates"
/>
```

#### **AIChat.jsx**
Current: `Travel Concierge` (line ~1109)
Replace with:
```jsx
<PageHeader
  title="Travel Concierge"
  subtitle="Your AI-powered travel planning assistant"
/>
```

#### **ReferralPage.jsx**
Current: `Bring a Jet-Setter` (line ~35)
Replace with:
```jsx
<PageHeader
  title="Bring a Jet-Setter"
  subtitle="Earn rewards by referring friends"
/>
```

#### **Subscriptionplans.jsx**
Find subscription title
Replace with:
```jsx
<PageHeader
  title="Subscription Plans"
  subtitle="Choose the perfect plan for your needs"
/>
```

---

### Priority 2 - Asset Detail Pages:

These are detail pages, less critical but should be consistent:

- **JetDetail.jsx** - Keep current style (detail pages different)
- **HelicopterDetail.jsx** - Keep current style
- **LuxuryCarDetail.jsx** - Keep current style
- **AdventureDetail.jsx** - Keep current style
- **CO2CertificateDetail.jsx** - Keep current style

Detail pages can have more dramatic headers since they're not list views.

---

### Priority 3 - Inside tokenized-assets-glassmorphic.jsx:

This file has MANY embedded views. Search for these patterns:

#### Jets View (line ~3102+)
Find: `<h2.*Private Jets`
Replace with:
```jsx
<PageHeader title="Private Jets" subtitle="Browse our fleet of luxury aircraft" />
```

#### Yachts View
Find: `<h2.*Yachts`
Replace with:
```jsx
<PageHeader title="Luxury Yachts" subtitle="Explore premium yacht charters" />
```

#### Helicopters View
Find: `<h2.*Helicopters`
Replace with:
```jsx
<PageHeader title="Helicopters" subtitle="Quick and exclusive helicopter transfers" />
```

#### Adventures View
Find: `<h2.*Adventures`
Replace with:
```jsx
<PageHeader title="Adventures" subtitle="Curated luxury experiences worldwide" />
```

#### Luxury Cars View
Find: `<h2.*Luxury Cars`
Replace with:
```jsx
<PageHeader title="Luxury Cars" subtitle="Premium vehicle rentals and charters" />
```

#### CO2/SAF View
Find: `<h2.*CO2` or `SAF`
Replace with:
```jsx
<PageHeader title="CO₂ & SAF Credits" subtitle="Offset your carbon footprint sustainably" />
```

#### Notifications View (line ~2990+)
Find: `<h2.*Notifications`
Replace with:
```jsx
<PageHeader title="Notifications" subtitle="Stay updated with your activity" />
```

#### Transactions View
Find: `<h2.*Transactions`
Replace with:
```jsx
<PageHeader title="Transactions" subtitle="View your transaction history" />
```

#### Settings View
Find: `<h2.*Settings`
Replace with:
```jsx
<PageHeader title="Settings" subtitle="Customize your experience" />
```

---

## 🔍 Search Pattern:

Use this regex to find all titles:
```regex
<h[12]\s+className="[^"]*text-(2xl|3xl|4xl|5xl)[^"]*"[^>]*>
```

Or search for these common patterns:
- `text-3xl font-bold`
- `text-4xl font-light`
- `text-2xl font-semibold`
- `text-5xl`

---

## 🎯 Standard Replacement Template:

```jsx
// 1. Add import at top
import PageHeader from './PageHeader';

// 2. Replace title section
// OLD:
<div className="...">
  <h1 className="text-3xl ... ">Title</h1>
  <p className="text-gray-600">Subtitle</p>
</div>

// NEW:
<PageHeader
  title="Title"
  subtitle="Subtitle"
/>

// 3. If there's an action button:
<PageHeader
  title="Title"
  subtitle="Subtitle"
  action={<button>...</button>}
/>
```

---

## ✨ Benefits:

- **Consistent**: All pages same style
- **Maintainable**: Change once, applies everywhere
- **Clean**: Less code duplication
- **Professional**: Unified UX

---

## 🚀 Next Steps:

1. Open each file
2. Find the title (use Cmd+F for patterns above)
3. Add `import PageHeader from './PageHeader';`
4. Replace title HTML with `<PageHeader ... />`
5. Test in browser

**Estimate**: ~5 minutes per file = 1 hour total for all remaining pages
