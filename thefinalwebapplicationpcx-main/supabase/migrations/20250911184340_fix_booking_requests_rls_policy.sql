-- Fix booking_requests RLS policy to use admin_settings instead of raw_user_meta_data
DROP POLICY IF EXISTS "Only admins can update booking requests" ON booking_requests;

-- Create new policy that checks admin_settings properly
CREATE POLICY "Only admins can update booking requests" ON booking_requests
FOR UPDATE
TO public
USING (
    EXISTS (
        SELECT 1
        FROM admin_settings
        WHERE admin_settings.user_id = auth.uid()
        AND (admin_settings.settings->'permissions'->'booking_requests'->>'write')::boolean = true
    )
);