import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Globe, FileText, Edit3, Check, X, Shield, Loader2 } from 'lucide-react';
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

export default function ProfileSettings() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [profileData, setProfileData] = useState<UserProfile>({
    user_id: user?.id || '',
    bio: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    postal_code: ''
  });

  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    bio: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    postal_code: ''
  });

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
        setProfileData(profile);
        setFormData(prev => ({
          ...prev,
          bio: profile.bio || '',
          phone: profile.phone || '',
          address: profile.address || '',
          city: profile.city || '',
          country: profile.country || '',
          postal_code: profile.postal_code || ''
        }));
      } else {
        // Create default profile for existing user
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
      const defaultProfile = {
        user_id: user.id,
        bio: '',
        phone: '',
        address: '',
        city: '',
        country: '',
        postal_code: '',
        kyc_status: 'not_started'
      };

      const { data: newProfile, error } = await supabase
        .from('user_profiles')
        .insert([defaultProfile])
        .select()
        .single();

      if (error) {
        console.error('Error creating default profile:', error);
      } else {
        setProfileData(newProfile);
        console.log('Default profile created for user:', user.id);
      }
    } catch (error) {
      console.error('Error in createDefaultProfile:', error);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    setIsSaving(true);
    setMessage(null);
    
    try {
      // Update user profile
      const profileUpdates = {
        bio: formData.bio || null,
        phone: formData.phone || null,
        address: formData.address || null,
        city: formData.city || null,
        country: formData.country || null,
        postal_code: formData.postal_code || null,
        updated_at: new Date().toISOString()
      };

      const { error: profileError } = await supabase
        .from('user_profiles')
        .update(profileUpdates)
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Update user names if changed
      if (formData.first_name !== user?.first_name || formData.last_name !== user?.last_name) {
        const { error: userError } = await supabase
          .from('users')
          .update({ 
            first_name: formData.first_name,
            last_name: formData.last_name 
          })
          .eq('id', user.id);

        if (userError) throw userError;
      }

      // Update local state
      setProfileData(prev => ({ ...prev, ...profileUpdates }));
      setIsEditing(false);
      
      setMessage({
        type: 'success',
        text: 'Profile updated successfully'
      });

      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({
        type: 'error',
        text: 'Failed to update profile'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      bio: profileData.bio || '',
      phone: profileData.phone || '',
      address: profileData.address || '',
      city: profileData.city || '',
      country: profileData.country || '',
      postal_code: profileData.postal_code || ''
    });
    setIsEditing(false);
    setMessage(null);
  };

  const handleStartEdit = () => {
    setFormData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      bio: profileData.bio || '',
      phone: profileData.phone || '',
      address: profileData.address || '',
      city: profileData.city || '',
      country: profileData.country || '',
      postal_code: profileData.postal_code || ''
    });
    setIsEditing(true);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader2 size={24} className="animate-spin text-gray-400" />
            <span className="text-gray-600">Loading profile data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-gray-800 mb-1">Profile Settings</h1>
          <p className="text-gray-600 text-xs">Manage your account information</p>
        </div>
        {!isEditing ? (
          <button
            onClick={handleStartEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800/80 backdrop-blur-md text-white text-xs rounded-lg hover:bg-gray-900/90 transition-all border border-gray-600/40"
          >
            <Edit3 size={12} />
            Edit Profile
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-1.5 text-xs text-gray-700 hover:text-gray-900 bg-white/20 backdrop-blur-md border border-gray-600/40 rounded-lg hover:bg-white/30 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800/80 backdrop-blur-md text-white text-xs rounded-lg hover:bg-gray-900/90 transition-all border border-gray-600/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={12} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Status Message */}
      {message && (
        <div className={`p-3 rounded-lg backdrop-blur-md ${
          message.type === 'success' ? 'bg-green-500/20 text-green-800 border border-green-600/40' : 'bg-red-500/20 text-red-800 border border-red-600/40'
        } flex items-center gap-2`}>
          {message.type === 'success' ? (
            <Check size={14} className="flex-shrink-0" />
          ) : (
            <X size={14} className="flex-shrink-0" />
          )}
          <span className="text-xs">{message.text}</span>
        </div>
      )}

      {/* Profile Information */}
      <div className="bg-white/20 backdrop-blur-md rounded-2xl border border-gray-600/40 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield size={16} className="text-gray-700" />
          <h3 className="text-base font-medium text-gray-800">Personal Information</h3>
        </div>

        {!isEditing ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-xs text-gray-600 mb-1">First Name</div>
                <div className="text-sm text-gray-800 font-medium">{user?.first_name || 'Not set'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Last Name</div>
                <div className="text-sm text-gray-800 font-medium">{user?.last_name || 'Not set'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Email Address</div>
                <div className="text-gray-900 font-medium">{user?.email || 'Not set'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Phone Number</div>
                <div className="text-gray-900 font-medium">{profileData.phone || 'Not set'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">City</div>
                <div className="text-gray-900 font-medium">{profileData.city || 'Not set'}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-500 mb-1">Country</div>
                <div className="text-gray-900 font-medium">{profileData.country || 'Not set'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Postal Code</div>
                <div className="text-gray-900 font-medium">{profileData.postal_code || 'Not set'}</div>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Address</div>
              <div className="text-gray-900 font-medium">{profileData.address || 'Not set'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Bio</div>
              <div className="text-gray-900 font-medium">{profileData.bio || 'Not set'}</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-500 mb-1">Account Created</div>
                <div className="text-gray-900 font-medium">{formatDate(user?.created_at)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Last Updated</div>
                <div className="text-gray-900 font-medium">{formatDate(profileData.updated_at)}</div>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">User ID</div>
              <div className="text-gray-900 font-medium font-mono text-sm">{user?.id}</div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                    disabled
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                <div className="relative">
                  <Globe size={18} className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                <input
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio (Optional)</label>
              <div className="relative">
                <FileText size={18} className="absolute left-3 top-2.5 text-gray-400" />
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={3}
                  placeholder="Tell us about yourself..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black resize-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}