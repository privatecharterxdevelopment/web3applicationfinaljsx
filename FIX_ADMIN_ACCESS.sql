-- ============================================================
-- FIX ADMIN ACCESS FOR lorenzo.vanza@hotmail.com
-- ============================================================

-- Step 1: Delete any existing entry
DELETE FROM admin_settings
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'lorenzo.vanza@hotmail.com');

-- Step 2: Create Super Admin entry
INSERT INTO admin_settings (user_id, settings, created_at, updated_at)
SELECT
  id as user_id,
  '{"role": "super_admin", "permissions": {"booking_requests": {"read": true, "write": true, "approve": true}, "co2_certificate_requests": {"read": true, "write": true, "assign_ngo": true, "approve": true}, "user_requests": {"read": true, "write": true, "complete": true}, "kyc_applications": {"read": true, "write": true, "approve": true, "reject": true}}}'::jsonb as settings,
  NOW() as created_at,
  NOW() as updated_at
FROM auth.users
WHERE email = 'lorenzo.vanza@hotmail.com';

-- Step 3: Verify
SELECT
  u.email,
  a.settings->>'role' as admin_role,
  a.created_at
FROM admin_settings a
JOIN auth.users u ON u.id = a.user_id
WHERE u.email = 'lorenzo.vanza@hotmail.com';

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Admin access granted for lorenzo.vanza@hotmail.com';
  RAISE NOTICE '✅ Role: super_admin';
  RAISE NOTICE '✅ Next steps:';
  RAISE NOTICE '   1. Logout from website';
  RAISE NOTICE '   2. Login: lorenzo.vanza@hotmail.com / Admin123!';
  RAISE NOTICE '   3. Go to: https://web3applicationfinaljsx.vercel.app/admin';
END $$;
