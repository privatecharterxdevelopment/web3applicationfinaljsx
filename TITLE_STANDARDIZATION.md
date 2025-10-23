# 📝 Title Standardization Guide

## ✅ Unified Standard Applied

**Component**: `PageHeader.jsx`

**Style**:
```jsx
<PageHeader
  title="Page Title"
  subtitle="Optional description"
/>
```

**Output**:
- Font: DM Sans (global)
- Size: `text-3xl` (30px)
- Weight: `font-bold` (700)
- Color: `text-gray-900`
- Subtitle: `text-gray-600`

---

## 📄 Pages Updated:

### ✅ Web3.0 Pages:
1. **Marketplace** - "Luxury Asset Marketplace" ✅
2. **P2P Trading** - Needs update
3. **Tokenized Assets Showcase** - Needs update
4. **Swap** - Needs update
5. **Staking** - Needs update

### ⏳ RWS Pages:
1. **Private Jets** - Needs update
2. **Yachts** - Needs update
3. **Helicopters** - Needs update
4. **Events & Sports** - Needs update
5. **CO2/SAF** - Needs update

### 📱 Both Modes:
1. **Overview/Dashboard** - Needs update
2. **Profile** - Needs update
3. **Transactions** - Needs update
4. **Notifications** - Needs update
5. **Settings** - Needs update

---

## 🔧 How to Apply:

### Step 1: Import
```jsx
import PageHeader from './PageHeader';
```

### Step 2: Replace old title
**Before**:
```jsx
<h1 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tighter mb-2">
  Old Title
</h1>
<p className="text-gray-600 font-light">
  Old subtitle
</p>
```

**After**:
```jsx
<PageHeader
  title="Old Title"
  subtitle="Old subtitle"
/>
```

### Step 3: With Action Button (optional)
```jsx
<PageHeader
  title="Page Title"
  subtitle="Description"
  action={
    <button className="...">
      Action Button
    </button>
  }
/>
```

---

## 📋 Quick Search & Replace Patterns:

### Pattern 1: text-3xl font-bold
```bash
Find: className="text-3xl font-bold text-gray-900 mb-2"
```

### Pattern 2: text-4xl font-light
```bash
Find: className="text-3xl md:text-4xl font-light
```

### Pattern 3: Various h1/h2
```bash
Find: <h[12].*text-(3xl|4xl|5xl).*font-(bold|light|semibold)
```

---

## 🎯 Priority List:

1. ✅ Marketplace
2. P2P Trading
3. Tokenized Assets
4. Profile Overview
5. Transactions
6. Private Jets
7. Events & Sports

After these, the rest can follow the same pattern.
