import { supabase } from '../lib/supabase';
import { ensureUserProfile } from './profileUtils';

interface OAuthUserMetadata {
  full_name?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  avatar_url?: string;
  picture?: string;
}

/**
 * Handles OAuth user creation/setup after Google (or other OAuth) sign-in.
 * Ensures the user has entries in both `users` and `user_profiles` tables.
 */
export async function handleOAuthUser(userId: string, email: string, metadata: OAuthUserMetadata): Promise<void> {
  if (!userId || !email) {
    console.error('handleOAuthUser: Missing userId or email');
    return;
  }

  try {
    // Check if user already exists in users table
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking for existing user:', fetchError);
      return;
    }

    // If user doesn't exist in users table, create entry
    if (!existingUser) {
      console.log('Creating users table entry for OAuth user:', email);

      // Extract name from metadata - Google provides various formats
      const firstName = extractFirstName(metadata);
      const lastName = extractLastName(metadata);

      const { error: insertError } = await supabase
        .from('users')
        .insert([{
          id: userId,
          email: email,
          first_name: firstName,
          last_name: lastName,
          email_verified: true, // OAuth emails are pre-verified
          user_role: 'user',
          created_at: new Date().toISOString()
        }]);

      if (insertError) {
        // Handle duplicate key error gracefully (race condition)
        if (insertError.code === '23505') {
          console.log('User already exists (concurrent creation)');
        } else {
          console.error('Error creating user entry:', insertError);
        }
      } else {
        console.log('Successfully created users table entry for:', email);

        // Give welcome bonus for new OAuth users
        try {
          await supabase.from('pvcx_balance').insert({
            user_id: userId,
            balance: 100,
            earned_from_bookings: 0,
            earned_from_co2: 0
          });

          await supabase.from('pvcx_transactions').insert({
            user_id: userId,
            type: 'admin_bonus',
            amount: 100,
            description: 'Welcome bonus - Registration reward',
            metadata: { reason: 'new_user_registration', auth_method: 'google' }
          });

          // Welcome notification
          await supabase.from('notifications').insert({
            user_id: userId,
            type: 'welcome',
            title: 'Welcome to PrivateCharterX!',
            message: `Hi ${firstName}! You've received 100 PVCX tokens as a welcome bonus.`,
            is_read: false
          });
        } catch (bonusError) {
          console.error('Error giving welcome bonus:', bonusError);
        }
      }
    }

    // Ensure user_profiles entry exists and save avatar
    await ensureUserProfile(userId);

    // Save Google avatar to user_profiles if available
    const avatarUrl = metadata.avatar_url || metadata.picture;
    if (avatarUrl) {
      await supabase
        .from('user_profiles')
        .update({ avatar_url: avatarUrl })
        .eq('user_id', userId);
      console.log('✅ Avatar saved for user:', email);
    }

  } catch (error) {
    console.error('Error in handleOAuthUser:', error);
  }
}

/**
 * Extract first name from OAuth metadata
 */
function extractFirstName(metadata: OAuthUserMetadata): string {
  // Google provides given_name directly
  if (metadata.given_name) {
    return metadata.given_name;
  }

  // Fall back to parsing full_name or name
  const fullName = metadata.full_name || metadata.name || '';
  if (fullName) {
    const parts = fullName.trim().split(' ');
    return parts[0] || 'User';
  }

  return 'User';
}

/**
 * Extract last name from OAuth metadata
 */
function extractLastName(metadata: OAuthUserMetadata): string | null {
  // Google provides family_name directly
  if (metadata.family_name) {
    return metadata.family_name;
  }

  // Fall back to parsing full_name or name
  const fullName = metadata.full_name || metadata.name || '';
  if (fullName) {
    const parts = fullName.trim().split(' ');
    if (parts.length > 1) {
      return parts.slice(1).join(' ');
    }
  }

  return null;
}
