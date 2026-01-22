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
 * Tables that have user_id foreign keys - migrate these when linking accounts
 */
const USER_RELATED_TABLES = [
  'user_profiles',
  'user_pvcx_balances',
  'pvcx_transactions',
  'notifications',
  'user_bookings',
  'user_documents',
  'user_requests'
] as const;

/**
 * Migrates user data from old (password-auth) ID to new (Google OAuth) ID.
 * Uses graceful error handling - continues even if some tables fail.
 * Note: This doesn't handle auth.users cleanup (requires admin API).
 */
async function migrateUserData(oldUserId: string, newUserId: string, email: string): Promise<boolean> {
  console.log(`🔄 Migrating user data from ${oldUserId} to ${newUserId} for ${email}`);

  try {
    // 1. Get old user data
    const { data: oldUserData, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', oldUserId)
      .single();

    if (fetchError || !oldUserData) {
      console.error('Failed to fetch old user data:', fetchError);
      return false;
    }

    // 2. Create new user entry preserving all old data
    const { error: insertError } = await supabase
      .from('users')
      .insert([{
        id: newUserId,
        email: oldUserData.email,
        first_name: oldUserData.first_name,
        last_name: oldUserData.last_name,
        email_verified: true,
        user_role: oldUserData.user_role || 'user',
        created_at: oldUserData.created_at,
        referral_code: oldUserData.referral_code,
        successful_referrals: oldUserData.successful_referrals,
        partner_type: oldUserData.partner_type,
        company_name: oldUserData.company_name,
        payment_method: oldUserData.payment_method,
        iban: oldUserData.iban,
        wallet_address: oldUserData.wallet_address,
        stripe_account_id: oldUserData.stripe_account_id,
        partner_verified: oldUserData.partner_verified
      }]);

    if (insertError) {
      console.error('Failed to create new user entry:', insertError);
      return false;
    }
    console.log('✅ Created new user entry with OAuth ID');

    // 3. Migrate related tables (graceful - continue on errors)
    for (const table of USER_RELATED_TABLES) {
      try {
        const { error } = await supabase
          .from(table)
          .update({ user_id: newUserId })
          .eq('user_id', oldUserId);

        if (error && error.code !== 'PGRST116') {
          console.warn(`⚠️ Could not migrate ${table}:`, error.message);
        } else {
          console.log(`✅ Migrated ${table}`);
        }
      } catch (e) {
        console.warn(`⚠️ Error migrating ${table}:`, e);
      }
    }

    // 4. Delete old user entry from users table
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', oldUserId);

    if (deleteError) {
      console.warn('⚠️ Could not delete old user entry:', deleteError.message);
    } else {
      console.log('✅ Deleted old user entry');
    }

    console.log(`✅ Account linked: ${email} now uses Google OAuth`);
    return true;

  } catch (error) {
    console.error('❌ Migration failed:', error);
    return false;
  }
}

/**
 * Handles OAuth user creation/setup after Google (or other OAuth) sign-in.
 * Now includes account linking when email exists with different auth provider.
 */
export async function handleOAuthUser(userId: string, email: string, metadata: OAuthUserMetadata): Promise<void> {
  if (!userId || !email) {
    console.error('handleOAuthUser: Missing userId or email');
    return;
  }

  try {
    // Check if user already exists BY ID (existing OAuth users)
    const { data: existingUserById, error: fetchByIdError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (fetchByIdError && fetchByIdError.code !== 'PGRST116') {
      console.error('Error checking for existing user by ID:', fetchByIdError);
      return;
    }

    // Existing OAuth user - just update avatar and return
    if (existingUserById) {
      console.log('✅ Existing OAuth user found:', email);
      await ensureUserProfile(userId);
      const avatarUrl = metadata.avatar_url || metadata.picture;
      if (avatarUrl) {
        await supabase.from('user_profiles').update({ avatar_url: avatarUrl }).eq('user_id', userId);
      }
      return;
    }

    // Check if email exists with DIFFERENT ID (password-registered user)
    const { data: existingUserByEmail } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    // Account linking: migrate password user to OAuth
    if (existingUserByEmail && existingUserByEmail.id !== userId) {
      console.log('🔗 Found password-registered account, linking to Google OAuth:', email);
      const migrated = await migrateUserData(existingUserByEmail.id, userId, email);
      if (migrated) {
        await ensureUserProfile(userId);
        const avatarUrl = metadata.avatar_url || metadata.picture;
        if (avatarUrl) {
          await supabase.from('user_profiles').update({ avatar_url: avatarUrl }).eq('user_id', userId);
        }
        return;
      }
      // Migration failed - fall through to create new user
      console.warn('⚠️ Migration failed, creating fresh account');
    }

    // New user - create entry
    console.log('Creating users table entry for OAuth user:', email);

    const firstName = extractFirstName(metadata);
    const lastName = extractLastName(metadata);

    const { error: insertError } = await supabase
      .from('users')
      .insert([{
        id: userId,
        email: email,
        first_name: firstName,
        last_name: lastName,
        email_verified: true,
        user_role: 'user',
        created_at: new Date().toISOString()
      }]);

    if (insertError) {
      if (insertError.code === '23505') {
        console.log('User already exists (concurrent creation)');
      } else {
        console.error('Error creating user entry:', insertError);
      }
    } else {
      console.log('Successfully created users table entry for:', email);

      // Give welcome bonus for new OAuth users
      try {
        const { error: balanceError } = await supabase.from('user_pvcx_balances').insert({
          user_id: userId,
          balance: 100,
          earned_from_bookings: 0,
          earned_from_co2: 0
        });

        if (balanceError) {
          console.error('Error creating PVCX balance:', balanceError);
        } else {
          console.log('✅ 100 PVCX welcome bonus added for:', email);
        }

        const { error: txError } = await supabase.from('pvcx_transactions').insert({
          user_id: userId,
          type: 'admin_bonus',
          amount: 100,
          description: 'Welcome bonus - Registration reward',
          metadata: { reason: 'new_user_registration', auth_method: 'google' }
        });

        if (txError) {
          console.error('Error logging PVCX transaction:', txError);
        }

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

    // Ensure user_profiles entry exists and save avatar
    await ensureUserProfile(userId);

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
