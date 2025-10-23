# 🔑 Admin Dashboard - Quick Access Guide

## How to Access Your Admin Dashboard

### Step 1: Login
Login to your platform with your admin account.

### Step 2: Navigate to Secret URL
In your browser address bar, add the secret path to your domain:

**Hash-based (Recommended):**
```
https://yourdomain.com/#x8833gulfstream66admin
```

**Path-based:**
```
https://yourdomain.com/x8833gulfstream66admin
```

### Step 3: Dashboard Opens
- Admin dashboard opens automatically
- URL is cleaned (secret path removed)
- You're now in admin mode!

---

## 📋 Quick Examples

### Local Development
```
http://localhost:5173/#x8833gulfstream66admin
```

### Staging Environment
```
https://staging.yourdomain.com/#x8833gulfstream66admin
```

### Production
```
https://yourdomain.com/#x8833gulfstream66admin
```

---

## 🔒 Security Notes

### ✅ DO:
- ✅ Use private/incognito browsing
- ✅ Clear browser history after use
- ✅ Logout when done
- ✅ Use secure networks only
- ✅ Keep URL secret

### ❌ DON'T:
- ❌ Share URL via email/Slack
- ❌ Bookmark in browser
- ❌ Take screenshots with URL visible
- ❌ Use on public WiFi
- ❌ Leave dashboard open unattended

---

## 🚨 Troubleshooting

### Dashboard Doesn't Open?

**Check 1: Are you logged in?**
```
You must be logged into your admin account first.
```

**Check 2: Do you have admin role?**
```sql
-- Run in Supabase SQL Editor:
SELECT role FROM user_profiles
WHERE user_id = (
  SELECT id FROM auth.users
  WHERE email = 'your@email.com'
);
-- Should return: 'admin'
```

**Check 3: Is URL correct?**
```
Exact path: x8833gulfstream66admin
Case sensitive: Must be lowercase
No spaces or extra characters
```

**Check 4: Check browser console**
```
Open DevTools (F12)
Look for: "Unauthorized admin access attempt"
If you see this, you don't have admin role
```

### How to Grant Admin Role

If you need to make yourself admin:

```sql
UPDATE user_profiles
SET role = 'admin'
WHERE user_id = (
  SELECT id FROM auth.users
  WHERE email = 'your@email.com'
);
```

Run this in Supabase Dashboard → SQL Editor.

---

## 💡 Pro Tips

### Tip 1: Bookmark Securely
Don't bookmark the secret URL directly. Instead:
1. Bookmark your normal domain
2. Store secret path in password manager
3. Manually add path when needed

### Tip 2: Use Browser Shortcut
Create a browser bookmark with JavaScript:
```javascript
javascript:(function(){window.location.hash='x8833gulfstream66admin';})()
```
Click bookmark to instantly navigate to admin dashboard.

### Tip 3: Mobile Access
On mobile, secret URL works the same:
1. Login to your account
2. Add `#x8833gulfstream66admin` to URL
3. Dashboard opens

### Tip 4: Quick Toggle
To leave admin dashboard:
1. Click on any other navigation item
2. Or refresh page (URL is cleaned)
3. Admin dashboard closes

---

## 📱 Copy-Paste URLs

### Production
```
https://yourdomain.com/#x8833gulfstream66admin
```

### Development
```
http://localhost:5173/#x8833gulfstream66admin
http://localhost:3000/#x8833gulfstream66admin
http://localhost:5000/#x8833gulfstream66admin
```

### Common Ports
```
http://localhost:8080/#x8833gulfstream66admin
http://localhost:4000/#x8833gulfstream66admin
http://localhost:3001/#x8833gulfstream66admin
```

---

## 🎯 What You'll See

After accessing the secret URL, you'll see:

```
┌─────────────────────────────────────────┐
│  Admin Dashboard                        │
├───────────┬─────────────────────────────┤
│           │                             │
│ Web3      │  Select a section to view  │
│ Services  │  data and manage platform  │
│ Market    │                             │
│ Manage    │  • Launchpad Projects      │
│           │  • Support Tickets          │
│           │  • User Management          │
│           │  • And more...              │
│           │                             │
└───────────┴─────────────────────────────┘
```

---

## 🔄 URL Rotation

When the secret URL changes:
1. You'll receive secure notification
2. Update your bookmarks/notes
3. Old URL stops working
4. New URL format same style: `#[prefix][number][aircraft][number][suffix]`

Example new URLs:
- `#y9944falcon77control`
- `#z7722citation88manage`
- `#a5544challenger99panel`

---

## 📧 Need Help?

### Can't access dashboard?
1. Verify you're logged in
2. Check admin role in database
3. Confirm URL is exactly correct
4. Try in different browser
5. Check browser console for errors

### Forgot secret URL?
- Check your password manager
- Review secure documentation
- Contact platform owner
- Check `ADMIN_ACCESS_GUIDE.md` (this file)

### Security concern?
- Change your password immediately
- Notify platform security team
- Review access logs
- Consider rotating secret URL

---

## ✅ Quick Checklist

Before accessing admin dashboard:

- [ ] I'm logged in with admin account
- [ ] I'm on a secure network
- [ ] I'm using private/incognito mode (optional)
- [ ] I have the correct secret URL
- [ ] I'm ready to manage the platform

After using admin dashboard:

- [ ] I've completed my admin tasks
- [ ] I've logged out or closed tab
- [ ] I've cleared browser history (if needed)
- [ ] I haven't shared the secret URL

---

## 🎉 That's It!

You now know how to access your admin dashboard securely.

**Remember:**
- URL: `yourdomain.com/#x8833gulfstream66admin`
- Must be logged in as admin
- Dashboard opens automatically
- Keep URL secret!

**Happy managing!** 🚀
