# Admin Dashboard - Quick Start Guide

## 🚀 Getting Started in 3 Steps

### Step 1: Run Database Migration
Open Supabase SQL Editor and run:
```sql
-- File: database/add_admin_role.sql
```
Copy and paste the entire contents, then click "Run".

### Step 2: Make Yourself Admin
```sql
UPDATE user_profiles
SET role = 'admin'
WHERE user_id = (
  SELECT id FROM auth.users
  WHERE email = 'YOUR_EMAIL@DOMAIN.COM'
);
```
Replace `YOUR_EMAIL@DOMAIN.COM` with your email.

### Step 3: Access Dashboard
1. Login to the platform
2. Navigate to the **secret admin URL**:
   ```
   https://yourdomain.com/#x8833gulfstream66admin
   ```
   or
   ```
   https://yourdomain.com/x8833gulfstream66admin
   ```
3. Admin dashboard opens automatically

Done! You're now an admin.

**🔒 Security Note:** The admin dashboard has no visible button. Only admins who know the secret URL path can access it.

---

## 📊 Dashboard Overview

The admin dashboard has **4 main sections**:

### 1️⃣ Web3 & DeFi
Manage all blockchain and tokenization features:
- **Launchpad Projects** - Approve/reject new projects
- **Waitlist** - See who joined waitlists
- **STO Investments** - Monitor investments
- **P2P Listings** - Track secondary trades
- **Tokenization Requests** - Handle asset tokenization

### 2️⃣ Services
Manage user requests and support:
- **SPV Formations** - Approve SPV requests
- **Support Tickets** - Answer user questions
- **Bookings** - Manage jet/helicopter bookings
- **User Requests** - Handle general requests

### 3️⃣ Marketplace
Oversee marketplace offerings:
- **Empty Legs** - Manage flight offers
- **Fixed Offers** - Handle fixed-price services

### 4️⃣ Management
Platform administration:
- **Users** - View all users and KYC status
- **Notifications** - Monitor notification history
- **Wallet Transactions** - Track blockchain activity

---

## 🎯 Common Admin Tasks

### ✅ Approve a Project
1. Click **Web3 & DeFi** → **Launchpad Projects**
2. Find project in list
3. Click green **"Approve"** button
4. Project goes live on marketplace

### 💳 Send Payment Link
1. Navigate to any request section
2. Click **"Send Payment Link"** button
3. Fill in form:
   - **Amount**: e.g., 5000
   - **Currency**: USD, EUR, CHF, etc.
   - **Payment URL**: Your Stripe/PayPal link
   - **Description**: Brief description
4. Click **"Send"**
5. User receives notification with link

### 📢 Send Notification to User
1. Go to **Management** → **Users**
2. Find user in list
3. Click **"Notify"** button
4. Fill in notification:
   - **Type**: Select from dropdown
   - **Title**: Short title
   - **Message**: Detailed message
   - **Action URL**: Where to link (optional)
5. Click **"Send"**
6. User gets instant notification

### 📝 Update Request Status
1. Navigate to any section
2. Find item to update
3. Click **status dropdown** next to item
4. Select new status
5. Status updates immediately

### ✔️ Close Support Ticket
1. Go to **Services** → **Support Tickets**
2. Find solved ticket
3. Click **"Mark Solved"**
4. Ticket status becomes 'closed'

---

## 🔍 Navigation Tips

### Quick Navigation
- Use **left sidebar** to switch between sections
- Current section is **highlighted**
- Click section name to expand/collapse

### Search & Filter
- Use **search bar** at top of each section
- Filter by **status** using dropdown
- Results update instantly

### Refresh Data
- Click **"Refresh Data"** button anytime
- Pulls latest from database
- Shows current counts

---

## 🛡️ Security Notes

### Who Can Access?
Only users with:
- `role = 'admin'` in user_profiles table
- Email = 'admin@domain.com'
- Will see admin dashboard icon

### What Admins Can Do:
✅ View all platform data
✅ Approve/reject projects
✅ Send payment links
✅ Send notifications
✅ Update statuses
✅ Manage support tickets
✅ View user information

### What Admins CANNOT Do:
❌ Delete user data
❌ Access user passwords
❌ Modify blockchain transactions
❌ Change admin roles (must use SQL)

---

## 🎨 Design Features

- **Glassmorphic UI** - Matches luxury market design
- **Real-time data** - Always shows latest
- **Smooth animations** - Professional feel
- **Mobile-friendly** - Works on tablets/phones
- **DM Sans font** - Consistent typography

---

## 🐛 Troubleshooting

### Problem: Admin icon not showing
**Solution**: Check your role in database:
```sql
SELECT role FROM user_profiles
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your@email.com');
```
If role is not 'admin', run:
```sql
UPDATE user_profiles SET role = 'admin'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your@email.com');
```

### Problem: Dashboard shows no data
**Solution**:
1. Check browser console for errors
2. Verify Supabase connection
3. Ensure tables exist in database

### Problem: Cannot send payment link
**Solution**: Run notifications system SQL:
```bash
database/create_notifications_system.sql
```

### Problem: Status update fails
**Solution**: Check RLS policies on target table allow admin updates.

---

## 📋 Admin Checklist

Daily tasks for admins:

### Morning
- [ ] Check new support tickets
- [ ] Review pending project approvals
- [ ] Check new user registrations
- [ ] Review overnight requests

### Throughout Day
- [ ] Respond to urgent tickets
- [ ] Process payment requests
- [ ] Approve verified projects
- [ ] Send payment links

### Evening
- [ ] Close resolved tickets
- [ ] Update pending requests
- [ ] Send follow-up notifications
- [ ] Review platform statistics

---

## 🚀 Pro Tips

1. **Use keyboard shortcuts** - Tab to navigate, Enter to select
2. **Keep dashboard open** - Use it in separate browser tab
3. **Check notifications** - Monitor bell icon for user activity
4. **Refresh regularly** - Click refresh to see new requests
5. **Be responsive** - Users appreciate quick replies
6. **Document actions** - Note why you approved/rejected
7. **Use payment links** - Faster than manual invoicing
8. **Send clear notifications** - Help users understand next steps

---

## 📞 Need Help?

If something isn't working:
1. Check `ADMIN_DASHBOARD_SETUP.md` for detailed docs
2. Review browser console for errors
3. Verify all SQL files have been run
4. Check Supabase dashboard for table structure

---

## Summary

You now have full admin access! Key points:
- **Admin icon** in top navigation
- **4 main sections** to manage everything
- **Quick actions** for common tasks
- **Real-time updates** with latest data
- **Send payment links** and notifications
- **Approve/reject** projects instantly

Start by clicking the dashboard icon and exploring the sections. Happy managing! 🎉
