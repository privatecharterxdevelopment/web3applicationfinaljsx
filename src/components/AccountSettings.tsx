import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Mail, Phone, MapPin, Shield, Check, X, Globe, Wallet, FileText, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface UserProfile {
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

interface AccountSettingsProps {
  onBack?: () => void;
  isInitialSetup?: boolean;
  onProfileComplete?: () => void;
  showBackButton?: boolean;
}

export default function AccountSettings({ onBack, isInitialSetup = false, onProfileComplete }: AccountSettingsProps) {
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    country: '',
    postal_code: '',
    bio: ''
  });

  const [profileExists, setProfileExists] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchProfileData();
    }
  }, [user?.id]);

  const fetchProfileData = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (profile) {
        setProfileExists(true);
        setFormData(prev => ({
          ...prev,
          phone: profile.phone || '',
          address: profile.address || '',
          city: profile.city || '',
          country: profile.country || '',
          postal_code: profile.postal_code || '',
          bio: profile.bio || ''
        }));
      } else {
        setProfileExists(false);
        // Create default profile for existing users
        await createDefaultProfile();
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load profile data'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultProfile = async () => {
    if (!user?.id) return;
    
    try {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([{
          user_id: user.id,
          bio: '',
          phone: '',
          address: '',
          city: '',
          country: '',
          postal_code: '',
          kyc_status: 'not_started'
        }]);

      if (profileError) {
        console.error('Error creating default profile:', profileError);
      } else {
        setProfileExists(true);
        console.log('Default profile created for user:', user.id);
      }
    } catch (error) {
      console.error('Error in createDefaultProfile:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsUpdating(true);

    try {
      // Update user profile
      const profileData = {
        user_id: user?.id,
        phone: formData.phone || null,
        address: formData.address || null,
        city: formData.city || null,
        country: formData.country || null,
        postal_code: formData.postal_code || null,
        bio: formData.bio || null,
        updated_at: new Date().toISOString()
      };

      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert(profileData);

      if (profileError) throw profileError;

      // Update user name if changed
      if (formData.name !== user?.name) {
        const { error: userError } = await supabase
          .from('users')
          .update({ name: formData.name })
          .eq('id', user?.id);

        if (userError) throw userError;
      }

      setProfileExists(true);

      setMessage({
        type: 'success',
        text: 'Profile updated successfully'
      });

      // If this is initial setup, notify parent
      if (isInitialSetup && onProfileComplete) {
        onProfileComplete();
      }

      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to update profile'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className={isInitialSetup ? 'p-8' : "fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"}>
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin"></div>
            <span>Loading profile data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={isInitialSetup ? '' : "fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-start justify-end p-4"}>
      <div className={`bg-white/95 backdrop-blur-md w-full ${isInitialSetup ? 'max-w-full' : 'max-w-md'} rounded-2xl shadow-2xl border border-white/20 overflow-hidden animate-slideIn`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            {!isInitialSetup && onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
            )}
            <div className="flex-1">
              <h2 className="text-xl font-bold">{isInitialSetup ? 'Complete Your Profile' : 'Profile Settings'}</h2>
              <p className="text-gray-600">
                {isInitialSetup 
                  ? 'Please provide your information to complete your profile' 
                  : 'Manage your personal information and preferences'}
              </p>
            </div>
            {!profileExists && !isInitialSetup && (
              <div className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                New Profile
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Status Message */}
          {message && (
            <div className={`p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            } flex items-center gap-2`}>
              {message.type === 'success' ? (
                <Check size={18} className="flex-shrink-0" />
              ) : (
                <Shield size={18} className="flex-shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={16} className="text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Profile Information</span>
              </div>
              <p className="text-xs text-blue-600">
                Your profile information is securely stored and only used to improve your booking experience.
                {!profileExists && ' This is your first time setting up your profile.'}
              </p>
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  disabled={!!user?.email}
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  required={isInitialSetup}
                />
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  required={isInitialSetup}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  required={isInitialSetup}
                />
              </div>

              <div>
                <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  id="postal_code"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <div className="relative">
                <Globe size={18} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  required={isInitialSetup}
                />
              </div>
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                Bio (Optional)
              </label>
              <div className="relative">
                <FileText size={18} className="absolute left-3 top-2.5 text-gray-400" />
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                  placeholder="Tell us about yourself..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              {!isInitialSetup && onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isUpdating}
                className="flex-1 bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    <span>{isInitialSetup ? 'Complete Profile' : 'Save Changes'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}