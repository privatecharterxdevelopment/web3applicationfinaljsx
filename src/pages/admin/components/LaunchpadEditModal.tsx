import React, { useState } from 'react';
import { X, Upload, AlertCircle, Check } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface LaunchpadEditModalProps {
  launchpad: any;
  onClose: () => void;
}

export default function LaunchpadEditModal({ launchpad, onClose }: LaunchpadEditModalProps) {
  const [formData, setFormData] = useState({
    name: launchpad.name || '',
    description: launchpad.description || '',
    category: launchpad.category || 'private-jet',
    asset_type: launchpad.asset_type || 'Private Jet',
    location: launchpad.location || '',
    year: launchpad.year || new Date().getFullYear(),
    token_standard: launchpad.token_standard || 'ERC20',
    token_symbol: launchpad.token_symbol || '',
    token_price: launchpad.token_price || 100,
    total_supply: launchpad.total_supply || 10000,
    target_amount: launchpad.target_amount || 10000000,
    min_investment: launchpad.min_investment || 1000,
    max_investment: launchpad.max_investment || 100000,
    expected_apy: launchpad.expected_apy || 12,
    dividend_frequency: launchpad.dividend_frequency || 'quarterly',
    current_phase: launchpad.current_phase || 'waitlist',
    status: launchpad.status || 'upcoming',
    target_waitlist: launchpad.target_waitlist || 500,
    waitlist_start_date: launchpad.waitlist_start_date || '',
    waitlist_end_date: launchpad.waitlist_end_date || '',
    fundraising_start_date: launchpad.fundraising_start_date || '',
    fundraising_end_date: launchpad.fundraising_end_date || '',
    features: launchpad.features || [],
    risk_disclaimer: launchpad.risk_disclaimer || ''
  });

  const [headerImage, setHeaderImage] = useState<File | null>(null);
  const [assetImage, setAssetImage] = useState<File | null>(null);
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [featureInput, setFeatureInput] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, featureInput.trim()]
      }));
      setFeatureInput('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const uploadImage = async (file: File, path: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const randomStr = (Math.random() * 1e18).toString(36);
    const fileName = `${randomStr}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('launchpad-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('launchpad-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setError(null);

    try {
      const updates: any = { ...formData };

      // Upload new images if provided
      if (headerImage) {
        updates.header_image_url = await uploadImage(headerImage, 'headers');
      }
      if (assetImage) {
        updates.asset_image_url = await uploadImage(assetImage, 'assets');
      }
      if (galleryImages.length > 0) {
        const galleryUrls: string[] = [];
        for (const image of galleryImages) {
          const url = await uploadImage(image, 'gallery');
          galleryUrls.push(url);
        }
        updates.gallery_images = galleryUrls;
      }

      updates.updated_at = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('launchpad_projects')
        .update(updates)
        .eq('id', launchpad.id);

      if (updateError) throw updateError;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        p_action_type: 'update',
        p_target_table: 'launchpad_projects',
        p_target_id: launchpad.id,
        p_admin_notes: `Updated launchpad: ${formData.name}`
      });

      alert('Launchpad updated successfully!');
      onClose();
    } catch (err: any) {
      console.error('Error updating launchpad:', err);
      setError(err.message || 'Failed to update launchpad');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold">Edit Launchpad</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asset Type *</label>
                  <select name="asset_type" value={formData.asset_type} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent">
                    <option value="Private Jet">Private Jet</option>
                    <option value="Helicopter">Helicopter</option>
                    <option value="Yacht">Yacht</option>
                    <option value="Supercar">Supercar</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Art">Art</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                  <input type="text" name="location" value={formData.location} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                  <input type="number" name="year" value={formData.year} onChange={handleChange} required min={1900} max={2100} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                  <select name="status" value={formData.status} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent">
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Current Images */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Current Images</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {launchpad.header_image_url && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Header Image</p>
                    <img src={launchpad.header_image_url} alt="Header" className="w-full h-24 object-cover rounded-lg" />
                  </div>
                )}
                {launchpad.asset_image_url && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Asset Image</p>
                    <img src={launchpad.asset_image_url} alt="Asset" className="w-full h-24 object-cover rounded-lg" />
                  </div>
                )}
              </div>
            </div>

            {/* Upload New Images */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Upload New Images (optional)</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Header Image</label>
                  <input type="file" accept="image/*" onChange={(e) => e.target.files && setHeaderImage(e.target.files[0])} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Asset Image</label>
                  <input type="file" accept="image/*" onChange={(e) => e.target.files && setAssetImage(e.target.files[0])} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Gallery Images</label>
                  <input type="file" accept="image/*" multiple onChange={(e) => e.target.files && setGalleryImages(Array.from(e.target.files))} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
            </div>

            {/* Token & Fundraising */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Token Configuration</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Token Symbol *</label>
                  <input type="text" name="token_symbol" value={formData.token_symbol} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Token Price *</label>
                  <input type="number" name="token_price" value={formData.token_price} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount *</label>
                  <input type="number" name="target_amount" value={formData.target_amount} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected APY *</label>
                  <input type="number" name="expected_apy" value={formData.expected_apy} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
                </div>
              </div>
            </div>

            {/* Phase & Status */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Phase Management</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Phase *</label>
                  <select name="current_phase" value={formData.current_phase} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent">
                    <option value="waitlist">Waitlist</option>
                    <option value="fundraising">Fundraising</option>
                    <option value="spv_formation">SPV Formation</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Waitlist *</label>
                  <input type="number" name="target_waitlist" value={formData.target_waitlist} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
                </div>
              </div>
            </div>

            {/* Features */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Features</h3>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                  placeholder="Add a feature..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                />
                <button type="button" onClick={addFeature} className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800">Add</button>
              </div>
              <div className="space-y-2">
                {formData.features.map((feature: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                    <span className="flex-1 text-sm">{feature}</span>
                    <button type="button" onClick={() => removeFeature(index)} className="text-red-600"><X className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button type="button" onClick={onClose} disabled={uploading} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={uploading} className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2">
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Update Launchpad
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
