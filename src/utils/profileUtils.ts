import { supabase } from '../lib/supabase';

export interface UserProfile {
  id?: string;
  user_id: string;
  bio?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  kyc_status?: string;
  wallet_address?: string;
  wallet_type?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Ensures a user has a profile in the user_profiles table.
 * Creates a default profile if one doesn't exist.
 */
export async function ensureUserProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) {
    console.error('No user ID provided to ensureUserProfile');
    return null;
  }

  try {
    // Check if profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking for existing profile:', fetchError);
      return null;
    }

    // If profile exists, return it
    if (existingProfile) {
      console.log('✅ User profile found:', userId);
      return existingProfile;
    }

    // Create default profile for existing user
    console.log('📝 Creating default profile for existing user:', userId);
    
    const defaultProfile = {
      user_id: userId,
      bio: '',
      phone: '',
      address: '',
      city: '',
      country: '',
      postal_code: '',
      kyc_status: 'not_started'
    };

    const { data: newProfile, error: createError } = await supabase
      .from('user_profiles')
      .insert([defaultProfile])
      .select()
      .single();

    if (createError) {
      console.error('Error creating default profile:', createError);
      return null;
    }

    console.log('✅ Default profile created for user:', userId);
    return newProfile;

  } catch (error) {
    console.error('Error in ensureUserProfile:', error);
    return null;
  }
}

/**
 * Fetches user profile data by user ID
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) return null;

  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return profile;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
}

/**
 * Updates user profile data
 */
export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
  if (!userId) return false;

  try {
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        ...updates,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error updating user profile:', error);
      return false;
    }

    console.log('✅ Profile updated for user:', userId);
    return true;
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    return false;
  }
}