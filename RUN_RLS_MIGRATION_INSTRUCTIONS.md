# How to Run the RLS Migration

## Quick Instructions

1. **Open Supabase SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/oubecmstqtzdnevyqavu/sql/new

2. **Copy the Migration SQL:**
   - Open the file: `supabase/migrations/20251020210000_fix_rls_policies.sql`
   - Copy ALL contents (Ctrl+A, Ctrl+C / Cmd+A, Cmd+C)

3. **Run in Supabase:**
   - Paste the SQL into the SQL Editor
   - Click the green "Run" button
   - Wait for completion (should take 5-10 seconds)

4. **Verify Success:**
   - You should see green checkmarks
   - No red error messages
   - Output should show "CREATE POLICY" statements

5. **Refresh Your App:**
   - Go back to your application
   - Refresh the page (F5 or Cmd+R)
   - Check console - should see fewer errors

---

## What This Migration Does

✅ Fixes 406 errors on `users` table
✅ Fixes 406 errors on `user_pvcx_balances` table
✅ Fixes 409 errors on `user_profiles` table
✅ Fixes 403 errors on `blog_posts` table
✅ Creates missing tables: `helicopters`, `adventures`, `co2_certificates`
✅ Adds performance indexes

---

## Expected Errors After Migration

After running this migration, you should NO LONGER see:
- ❌ `users?select=* → 406`
- ❌ `user_pvcx_balances?select=* → 406`
- ❌ `user_profiles → 409`
- ❌ `blog_posts → 403`
- ❌ `helicopters → 404`
- ❌ `adventures → 404`
- ❌ `co2_certificates → 404`

---

## Troubleshooting

### If you see errors like "policy already exists":
- That's okay! It means some policies were already created
- The migration uses `DROP POLICY IF EXISTS` to handle this
- Continue to the next section

### If you see errors like "table does not exist":
- That's okay for some tables
- The migration uses `CREATE TABLE IF NOT EXISTS`
- It will create missing tables automatically

### If you see permission errors:
- Make sure you're logged in to Supabase as the project owner
- Try refreshing the Supabase dashboard
- Contact support if issue persists

---

## Alternative: Run via Supabase CLI (if installed)

If you have Supabase CLI installed:

```bash
cd "/Users/x/Downloads/Tokenization-main 2"
supabase db push
```

This will apply all pending migrations automatically.

---

## After Migration

1. **Clear browser cache** (optional but recommended)
2. **Refresh application** (F5 or Cmd+R)
3. **Check console** for errors (should be much cleaner)
4. **Test features:**
   - Try logging in
   - Search for jets
   - Open AI chat
   - Check user profile

---

**Need Help?**
If you encounter issues, check the full details in [ERROR_FIXES_SUMMARY.md](ERROR_FIXES_SUMMARY.md:1)
