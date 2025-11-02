import React, { useState, useEffect } from 'react';
import {
  Upload, X, Plus, Trash2, Users, DollarSign, Lock, Shield,
  Wallet, CheckCircle, ArrowRight, Image as ImageIcon, FileText,
  Settings, Target, PieChart, TrendingUp, Save, AlertCircle
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function DAOCreator({ onClose, onSuccess }) {
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  const { user } = useAuth();

  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [daoData, setDaoData] = useState({
    // Basic Info
    name: '',
    description: '',
    daoType: 'fundraising', // fundraising, fractional, governance, service
    category: 'investment',

    // Images
    logoUrl: '',
    headerImageUrl: '',

    // DAO Configuration
    tokenName: '',
    tokenSymbol: '',
    initialSupply: '',
    governanceModel: 'token-voting', // token-voting, multisig, quadratic
    votingPeriod: '7', // days
    quorumPercentage: '50',

    // Financial
    fundraisingGoal: '',
    minimumContribution: '',
    tokenPrice: '',

    // Whitelist
    whitelistedAddresses: [],
    isPublic: true,

    // Safe (Escrow)
    useSafeEscrow: true,
    safeOwners: [],
    safeThreshold: 2,

    // Products/Services
    products: [],

    // Legal
    legalDocs: [],
    termsAccepted: false
  });

  const [newAddress, setNewAddress] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: ''
  });
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);

  const daoTypes = [
    {
      id: 'fundraising',
      name: 'Fundraising DAO',
      description: 'Raise capital for a project or venture',
      icon: TrendingUp
    },
    {
      id: 'fractional',
      name: 'Fractional Ownership',
      description: 'Tokenize and share ownership of assets',
      icon: PieChart
    },
    {
      id: 'governance',
      name: 'Governance DAO',
      description: 'Collective decision-making organization',
      icon: Users
    },
    {
      id: 'service',
      name: 'Service DAO',
      description: 'Coordinate services and providers',
      icon: Target
    }
  ];

  const governanceModels = [
    { id: 'token-voting', name: 'Token-Based Voting', description: '1 token = 1 vote' },
    { id: 'multisig', name: 'Multi-Signature', description: 'Multiple approvals required' },
    { id: 'quadratic', name: 'Quadratic Voting', description: 'Diminishing voting power' }
  ];

  // Image upload to Supabase
  const handleImageUpload = async (file, type) => {
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `dao-images/${fileName}`;

      const { data, error } = await supabase.storage
        .from('serviceImagesVector')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('serviceImagesVector')
        .getPublicUrl(filePath);

      setDaoData(prev => ({
        ...prev,
        [type]: publicUrl
      }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  // Add whitelisted address
  const addWhitelistedAddress = () => {
    if (newAddress && /^0x[a-fA-F0-9]{40}$/.test(newAddress)) {
      setDaoData(prev => ({
        ...prev,
        whitelistedAddresses: [...prev.whitelistedAddresses, newAddress]
      }));
      setNewAddress('');
    } else {
      alert('Please enter a valid Ethereum address');
    }
  };

  // Remove whitelisted address
  const removeWhitelistedAddress = (index) => {
    setDaoData(prev => ({
      ...prev,
      whitelistedAddresses: prev.whitelistedAddresses.filter((_, i) => i !== index)
    }));
  };

  // Add Safe owner
  const addSafeOwner = () => {
    if (newAddress && /^0x[a-fA-F0-9]{40}$/.test(newAddress)) {
      setDaoData(prev => ({
        ...prev,
        safeOwners: [...prev.safeOwners, newAddress]
      }));
      setNewAddress('');
    } else {
      alert('Please enter a valid Ethereum address');
    }
  };

  // Add product
  const addProduct = () => {
    if (newProduct.name && newProduct.price) {
      setDaoData(prev => ({
        ...prev,
        products: [...prev.products, { ...newProduct, id: Date.now() }]
      }));
      setNewProduct({ name: '', description: '', price: '', imageUrl: '' });
    }
  };

  // Create DAO
  const createDAO = async () => {
    if (!isConnected) {
      open();
      return;
    }

    if (!daoData.termsAccepted) {
      alert('Please accept the terms and conditions');
      return;
    }

    setCreating(true);
    try {
      // Save DAO to database
      const { data, error } = await supabase
        .from('daos')
        .insert([
          {
            creator_address: address,
            user_id: user?.id,
            name: daoData.name,
            description: daoData.description,
            dao_type: daoData.daoType,
            category: daoData.category,
            logo_url: daoData.logoUrl,
            header_image_url: daoData.headerImageUrl,
            token_name: daoData.tokenName,
            token_symbol: daoData.tokenSymbol,
            initial_supply: daoData.initialSupply,
            governance_model: daoData.governanceModel,
            voting_period_days: parseInt(daoData.votingPeriod),
            quorum_percentage: parseInt(daoData.quorumPercentage),
            fundraising_goal: daoData.fundraisingGoal || null,
            minimum_contribution: daoData.minimumContribution || null,
            token_price: daoData.tokenPrice || null,
            whitelisted_addresses: daoData.whitelistedAddresses,
            is_public: daoData.isPublic,
            use_safe_escrow: daoData.useSafeEscrow,
            safe_owners: daoData.safeOwners,
            safe_threshold: daoData.safeThreshold,
            products: daoData.products,
            status: 'pending', // Will be activated after deployment
            created_at: new Date().toISOString()
          }
        ])
        .select();

      if (error) throw error;

      // Here you would integrate with Aragon DAO SDK to deploy the actual DAO
      // For now, we'll save the configuration and return success

      alert('DAO created successfully! It will be deployed shortly.');
      onSuccess && onSuccess(data[0]);
      onClose && onClose();
    } catch (error) {
      console.error('Error creating DAO:', error);
      alert('Failed to create DAO: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-light text-gray-900 mb-6">Basic Information</h3>

      {/* DAO Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">DAO Type</label>
        <div className="grid grid-cols-2 gap-4">
          {daoTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setDaoData(prev => ({ ...prev, daoType: type.id }))}
                className={`p-4 border-2 rounded-xl transition-all text-left ${
                  daoData.daoType === type.id
                    ? 'border-black bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon size={24} className="mb-2 text-gray-700" />
                <div className="font-medium text-gray-900 text-sm mb-1">{type.name}</div>
                <div className="text-xs text-gray-500">{type.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* DAO Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">DAO Name</label>
        <input
          type="text"
          value={daoData.name}
          onChange={(e) => setDaoData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
          placeholder="e.g., JetShare Collective"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea
          value={daoData.description}
          onChange={(e) => setDaoData(prev => ({ ...prev, description: e.target.value }))}
          rows={4}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
          placeholder="Describe your DAO's purpose and goals..."
        />
      </div>

      {/* Logo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">DAO Logo</label>
        <div className="flex items-center gap-4">
          {daoData.logoUrl && (
            <img src={daoData.logoUrl} alt="Logo" className="w-20 h-20 object-cover rounded-xl" />
          )}
          <label className="flex-1 border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-gray-400 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e.target.files[0], 'logoUrl')}
              className="hidden"
            />
            <ImageIcon size={24} className="mx-auto mb-2 text-gray-400" />
            <span className="text-sm text-gray-600">
              {uploading ? 'Uploading...' : 'Click to upload logo'}
            </span>
          </label>
        </div>
      </div>

      {/* Header Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Header Image</label>
        <div className="flex items-center gap-4">
          {daoData.headerImageUrl && (
            <img src={daoData.headerImageUrl} alt="Header" className="w-32 h-20 object-cover rounded-xl" />
          )}
          <label className="flex-1 border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-gray-400 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e.target.files[0], 'headerImageUrl')}
              className="hidden"
            />
            <ImageIcon size={24} className="mx-auto mb-2 text-gray-400" />
            <span className="text-sm text-gray-600">
              {uploading ? 'Uploading...' : 'Click to upload header image'}
            </span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-light text-gray-900 mb-6">Token & Governance Configuration</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Token Name</label>
          <input
            type="text"
            value={daoData.tokenName}
            onChange={(e) => setDaoData(prev => ({ ...prev, tokenName: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
            placeholder="e.g., JetShare Token"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Token Symbol</label>
          <input
            type="text"
            value={daoData.tokenSymbol}
            onChange={(e) => setDaoData(prev => ({ ...prev, tokenSymbol: e.target.value.toUpperCase }))}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
            placeholder="e.g., JST"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Initial Token Supply</label>
        <input
          type="number"
          value={daoData.initialSupply}
          onChange={(e) => setDaoData(prev => ({ ...prev, initialSupply: e.target.value }))}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
          placeholder="e.g., 1000000"
        />
      </div>

      {/* Governance Model */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Governance Model</label>
        <div className="space-y-2">
          {governanceModels.map((model) => (
            <button
              key={model.id}
              onClick={() => setDaoData(prev => ({ ...prev, governanceModel: model.id }))}
              className={`w-full p-4 border-2 rounded-xl transition-all text-left ${
                daoData.governanceModel === model.id
                  ? 'border-black bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-gray-900 text-sm mb-1">{model.name}</div>
              <div className="text-xs text-gray-500">{model.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Voting Period (days)</label>
          <input
            type="number"
            value={daoData.votingPeriod}
            onChange={(e) => setDaoData(prev => ({ ...prev, votingPeriod: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
            placeholder="7"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Quorum (%)</label>
          <input
            type="number"
            value={daoData.quorumPercentage}
            onChange={(e) => setDaoData(prev => ({ ...prev, quorumPercentage: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
            placeholder="50"
            min="1"
            max="100"
          />
        </div>
      </div>

      {/* Fundraising Config (only if fundraising type) */}
      {daoData.daoType === 'fundraising' && (
        <div className="border-t border-gray-200 pt-6 mt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Fundraising Configuration</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fundraising Goal (€)</label>
              <input
                type="number"
                value={daoData.fundraisingGoal}
                onChange={(e) => setDaoData(prev => ({ ...prev, fundraisingGoal: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="e.g., 1000000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Contribution (€)</label>
              <input
                type="number"
                value={daoData.minimumContribution}
                onChange={(e) => setDaoData(prev => ({ ...prev, minimumContribution: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="e.g., 1000"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Token Price (€)</label>
            <input
              type="number"
              step="0.01"
              value={daoData.tokenPrice}
              onChange={(e) => setDaoData(prev => ({ ...prev, tokenPrice: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="e.g., 1.00"
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-light text-gray-900 mb-6">Access Control & Security</h3>

      {/* Public/Private */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={daoData.isPublic}
            onChange={(e) => setDaoData(prev => ({ ...prev, isPublic: e.target.checked }))}
            className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
          />
          <div>
            <div className="font-medium text-gray-900">Public DAO</div>
            <div className="text-sm text-gray-500">Anyone can join and participate</div>
          </div>
        </label>
      </div>

      {/* Whitelist */}
      {!daoData.isPublic && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Whitelisted Addresses</label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="0x..."
            />
            <button
              onClick={addWhitelistedAddress}
              className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="space-y-2">
            {daoData.whitelistedAddresses.map((addr, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-sm font-mono text-gray-900">{addr}</span>
                <button
                  onClick={() => removeWhitelistedAddress(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safe Escrow */}
      <div className="border-t border-gray-200 pt-6 mt-6">
        <label className="flex items-center gap-3 cursor-pointer mb-4">
          <input
            type="checkbox"
            checked={daoData.useSafeEscrow}
            onChange={(e) => setDaoData(prev => ({ ...prev, useSafeEscrow: e.target.checked }))}
            className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
          />
          <div>
            <div className="font-medium text-gray-900">Use Safe (Gnosis) Escrow</div>
            <div className="text-sm text-gray-500">Secure multi-signature wallet for treasury</div>
          </div>
        </label>

        {daoData.useSafeEscrow && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Safe Owners</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="0x..."
                />
                <button
                  onClick={addSafeOwner}
                  className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="space-y-2">
                {daoData.safeOwners.map((addr, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm font-mono text-gray-900">{addr}</span>
                    <button
                      onClick={() => setDaoData(prev => ({
                        ...prev,
                        safeOwners: prev.safeOwners.filter((_, i) => i !== index)
                      }))}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Approval Threshold
              </label>
              <input
                type="number"
                value={daoData.safeThreshold}
                onChange={(e) => setDaoData(prev => ({ ...prev, safeThreshold: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="2"
                min="1"
                max={daoData.safeOwners.length || 1}
              />
              <p className="text-xs text-gray-500 mt-2">
                Number of owner approvals required for transactions
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-light text-gray-900 mb-6">Products & Services (Optional)</h3>

      {/* Add Product Form */}
      <div className="border border-gray-200 rounded-xl p-4">
        <h4 className="font-medium text-gray-900 mb-4">Add Product/Service</h4>
        <div className="space-y-3">
          <input
            type="text"
            value={newProduct.name}
            onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
            placeholder="Product name"
          />
          <textarea
            value={newProduct.description}
            onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
            rows={2}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
            placeholder="Description"
          />
          <input
            type="number"
            value={newProduct.price}
            onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent"
            placeholder="Price (€)"
          />
          <button
            onClick={addProduct}
            className="w-full px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Add Product
          </button>
        </div>
      </div>

      {/* Products List */}
      {daoData.products.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Added Products</h4>
          {daoData.products.map((product, index) => (
            <div key={product.id} className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{product.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{product.description}</div>
                  <div className="text-sm font-medium text-gray-900 mt-2">€{product.price}</div>
                </div>
                <button
                  onClick={() => setDaoData(prev => ({
                    ...prev,
                    products: prev.products.filter((_, i) => i !== index)
                  }))}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-light text-gray-900 mb-6">Review & Deploy</h3>

      <div className="space-y-4">
        {/* Basic Info Summary */}
        <div className="border border-gray-200 rounded-xl p-4">
          <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">DAO Name:</span>
              <span className="font-medium text-gray-900">{daoData.name || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Type:</span>
              <span className="font-medium text-gray-900">{daoTypes.find(t => t.id === daoData.daoType)?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Token:</span>
              <span className="font-medium text-gray-900">{daoData.tokenSymbol || 'Not set'}</span>
            </div>
          </div>
        </div>

        {/* Governance Summary */}
        <div className="border border-gray-200 rounded-xl p-4">
          <h4 className="font-medium text-gray-900 mb-3">Governance</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Model:</span>
              <span className="font-medium text-gray-900">
                {governanceModels.find(m => m.id === daoData.governanceModel)?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Voting Period:</span>
              <span className="font-medium text-gray-900">{daoData.votingPeriod} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Quorum:</span>
              <span className="font-medium text-gray-900">{daoData.quorumPercentage}%</span>
            </div>
          </div>
        </div>

        {/* Security Summary */}
        <div className="border border-gray-200 rounded-xl p-4">
          <h4 className="font-medium text-gray-900 mb-3">Security</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Access:</span>
              <span className="font-medium text-gray-900">{daoData.isPublic ? 'Public' : 'Private'}</span>
            </div>
            {!daoData.isPublic && (
              <div className="flex justify-between">
                <span className="text-gray-600">Whitelisted:</span>
                <span className="font-medium text-gray-900">{daoData.whitelistedAddresses.length} addresses</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Safe Escrow:</span>
              <span className="font-medium text-gray-900">{daoData.useSafeEscrow ? 'Enabled' : 'Disabled'}</span>
            </div>
            {daoData.useSafeEscrow && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Safe Owners:</span>
                  <span className="font-medium text-gray-900">{daoData.safeOwners.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Threshold:</span>
                  <span className="font-medium text-gray-900">{daoData.safeThreshold}/{daoData.safeOwners.length}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Terms */}
        <div className="border border-gray-200 rounded-xl p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={daoData.termsAccepted}
              onChange={(e) => setDaoData(prev => ({ ...prev, termsAccepted: e.target.checked }))}
              className="w-5 h-5 mt-0.5 rounded border-gray-300 text-black focus:ring-black"
            />
            <div className="text-sm">
              <span className="text-gray-700">
                I accept the{' '}
                <a href="#" className="text-black underline">terms and conditions</a>
                {' '}and understand that creating a DAO involves blockchain transactions and associated costs.
              </span>
            </div>
          </label>
        </div>

        {/* Wallet Connection Alert */}
        {!isConnected && (
          <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <AlertCircle size={20} className="text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              Please connect your wallet to create the DAO
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const steps = [
    { id: 1, name: 'Basic Info', icon: FileText },
    { id: 2, name: 'Configuration', icon: Settings },
    { id: 3, name: 'Security', icon: Shield },
    { id: 4, name: 'Products', icon: PieChart },
    { id: 5, name: 'Review', icon: CheckCircle }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-light text-gray-900">Create New DAO</h2>
            <p className="text-sm text-gray-500 mt-1">Powered by Aragon & Safe</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Steps */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        currentStep === step.id
                          ? 'bg-black text-white'
                          : currentStep > step.id
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {currentStep > step.id ? <CheckCircle size={20} /> : <Icon size={20} />}
                    </div>
                    <span className="text-xs text-gray-600 mt-2">{step.name}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 ${
                        currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 250px)' }}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-100">
          <button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <div className="flex gap-3">
            {currentStep < 5 ? (
              <button
                onClick={() => setCurrentStep(prev => Math.min(5, prev + 1))}
                className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                Next
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                onClick={createDAO}
                disabled={creating || !daoData.termsAccepted}
                className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Create DAO
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
