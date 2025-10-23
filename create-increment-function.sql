-- Create the increment_chat_usage RPC function
-- This function increments the chats_used counter for a user

CREATE OR REPLACE FUNCTION increment_chat_usage(p_user_id UUID)
RETURNS user_profiles AS $$
DECLARE
  v_profile user_profiles;
BEGIN
  -- Increment chats_used by 1
  UPDATE user_profiles
  SET chats_used = chats_used + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Return the updated profile
  SELECT * INTO v_profile
  FROM user_profiles
  WHERE user_id = p_user_id;

  RETURN v_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_chat_usage(UUID) TO authenticated;

-- Test the function
SELECT increment_chat_usage('76e4e329-22d5-434f-b9d5-2fecf1e08721');
