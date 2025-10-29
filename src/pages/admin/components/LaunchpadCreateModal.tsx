import React, { useState } from 'react';
import { X, Upload, AlertCircle, Check } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface LaunchpadCreateModalProps {
  onClose: () => void;
}

interface LaunchpadFormData {
  name: string;
  description: string;
  category: string;
  asset_type: string;
  location: string;
  year: number;
  token_standard: string;
  token_symbol: string;
  token_price: number;
  total_supply: number;
  target_amount: number;
  min_investment: number;
  max_investment: number;
  expected_apy: number;
  dividend_frequency: string;
  current_phase: string;
  status: string;
  target_waitlist: number;
  waitlist_start_date: string;
  waitlist_end_date: string;
  fundraising_start_date: string;
  fundraising_end_date: string;
  specifications: any;
  features: string[];
  risk_disclaimer: string;
}

export default function LaunchpadCreateModal({ onClose }: LaunchpadCreateModalProps) {
  const [formData, setFormData] = useState<LaunchpadFormData>({
    name: '',
    description: '',
    category: 'private-jet',
    asset_type: 'Private Jet',
    location: '',
    year: new Date().getFullYear(),
    token_standard: 'ERC20',
    token_symbol: '',
    token_price: 100,
    total_supply: 10000,
    target_amount: 10000000,
    min_investment: 1000,
    max_investment: 100000,
    expected_apy: 12,
    dividend_frequency: 'quarterly',
    current_phase: 'waitlist',
    status: 'upcoming',
    target_waitlist: 500,
    waitlist_start_date: '',
    waitlist_end_date: '',
    fundraising_start_date: '',
    fundraising_end_date: '',
    specifications: {},
    features: [],
    risk_disclaimer: ''
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

  const handleHeaderImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setHeaderImage(e.target.files[0]);
    }
  };

  const handleAssetImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAssetImage(e.target.files[0]);
    }
  };

  const handleGalleryImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setGalleryImages(Array.from(e.target.files));
    }
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
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
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
      let headerImageUrl = '';
      let assetImageUrl = '';
      const galleryImageUrls: string[] = [];

      // Upload header image
      if (headerImage) {
        headerImageUrl = await uploadImage(headerImage, 'headers');
      }

      // Upload asset image
      if (assetImage) {
        assetImageUrl = await uploadImage(assetImage, 'assets');
      }

      // Upload gallery images
      for (const image of galleryImages) {
        const url = await uploadImage(image, 'gallery');
        galleryImageUrls.push(url);
      }

      // Insert launchpad
      const { data, error: insertError } = await supabase
        .from('launchpad_projects')
        .insert([{
          ...formData,
          header_image_url: headerImageUrl || null,
          asset_image_url: assetImageUrl || null,
          gallery_images: galleryImageUrls.length > 0 ? galleryImageUrls : null,
          raised_amount: 0,
          current_waitlist: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        p_action_type: 'create',
        p_target_table: 'launchpad_projects',
        p_target_id: data.id,
        p_admin_notes: `Created launchpad: ${formData.name}`
      });

      alert('Launchpad created successfully!');
      onClose();
    } catch (err: any) {
      console.error('Error creating launchpad:', err);
      setError(err.message || 'Failed to create launchpad');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold">Create New Launchpad</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="e.g., Embraer Phenom 300"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                    placeholder="Describe the asset and investment opportunity..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asset Type *
                  </label>
                  <select
                    name="asset_type"
                    value={formData.asset_type}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="Private Jet">Private Jet</option>
                    <option value="Helicopter">Helicopter</option>
                    <option value="Yacht">Yacht</option>
                    <option value="Supercar">Supercar</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Art">Art</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location *
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="e.g., Geneva, Switzerland"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year *
                  </label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    required
                    min={1900}
                    max={2100}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Images */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Images</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Header Image (recommended: 1920x600px)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleHeaderImageChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                  {headerImage && (
                    <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      {headerImage.name}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asset Image (recommended: 800x600px)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAssetImageChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                  {assetImage && (
                    <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      {assetImage.name}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gallery Images (multiple)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryImagesChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                  {galleryImages.length > 0 && (
                    <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      {galleryImages.length} images selected
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Token Configuration */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Token Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Token Standard *
                  </label>
                  <select
                    name="token_standard"
                    value={formData.token_standard}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="ERC20">ERC20</option>
                    <option value="ERC1400">ERC1400 (Security Token)</option>
                    <option value="ERC721">ERC721 (NFT)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Token Symbol *
                  </label>
                  <input
                    type="text"
                    name="token_symbol"
                    value={formData.token_symbol}
                    onChange={handleChange}
                    required
                    maxLength={10}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="e.g., PHENOM"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Token Price (USD) *
                  </label>
                  <input
                    type="number"
                    name="token_price"
                    value={formData.token_price}
                    onChange={handleChange}
                    required
                    min={0}
                    step={0.01}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Supply *
                  </label>
                  <input
                    type="number"
                    name="total_supply"
                    value={formData.total_supply}
                    onChange={handleChange}
                    required
                    min={1}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Fundraising Details */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Fundraising Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Amount (USD) *
                  </label>
                  <input
                    type="number"
                    name="target_amount"
                    value={formData.target_amount}
                    onChange={handleChange}
                    required
                    min={0}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected APY (%) *
                  </label>
                  <input
                    type="number"
                    name="expected_apy"
                    value={formData.expected_apy}
                    onChange={handleChange}
                    required
                    min={0}
                    max={100}
                    step={0.1}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Investment (USD) *
                  </label>
                  <input
                    type="number"
                    name="min_investment"
                    value={formData.min_investment}
                    onChange={handleChange}
                    required
                    min={0}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Investment (USD) *
                  </label>
                  <input
                    type="number"
                    name="max_investment"
                    value={formData.max_investment}
                    onChange={handleChange}
                    required
                    min={0}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Waitlist Settings */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Waitlist Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Waitlist Size *
                  </label>
                  <input
                    type="number"
                    name="target_waitlist"
                    value={formData.target_waitlist}
                    onChange={handleChange}
                    required
                    min={1}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Phase *
                  </label>
                  <select
                    name="current_phase"
                    value={formData.current_phase}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="waitlist">Waitlist</option>
                    <option value="fundraising">Fundraising</option>
                    <option value="spv_formation">SPV Formation</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Waitlist Start Date
                  </label>
                  <input
                    type="date"
                    name="waitlist_start_date"
                    value={formData.waitlist_start_date}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Waitlist End Date
                  </label>
                  <input
                    type="date"
                    name="waitlist_end_date"
                    value={formData.waitlist_end_date}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
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
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={addFeature}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                >
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                    <span className="flex-1 text-sm">{feature}</span>
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Disclaimer */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Risk Disclaimer</h3>
              <textarea
                name="risk_disclaimer"
                value={formData.risk_disclaimer}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                placeholder="Enter investment risk disclaimer..."
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Create Launchpad
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
