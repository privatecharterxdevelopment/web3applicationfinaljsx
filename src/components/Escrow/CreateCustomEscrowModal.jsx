import React, { useState, useEffect } from 'react';
import {
  X, Upload, FileText, Shield, AlertCircle, CheckCircle,
  Users, DollarSign, Info, ArrowLeft, ArrowRight, Lock,
  MapPin, Mail, CheckCircle2, Loader
} from 'lucide-react';
import { useAccount, useSignMessage } from 'wagmi';
import { parseEther, formatEther } from 'ethers';
import { calculateCustomEscrowFee, formatFeeInfo } from '../../lib/feeCalculator';
import { uploadEncryptedToIPFS, encryptKeyForWallet, isIPFSConfigured } from '../../lib/ipfs';
import { supabase } from '../../lib/supabase';

export default function CreateCustomEscrowModal({ isOpen, onClose, bookingId, prefilledData }) {
  const { address, chain } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [step, setStep] = useState(1);
  const totalSteps = 5;

  const [formData, setFormData] = useState({
    // Step 1: Asset/Transfer Details
    title: prefilledData?.title || '',
    description: prefilledData?.description || '',
    assetType: prefilledData?.assetType || 'service', // service, goods, real_estate, vehicle, other
    location: prefilledData?.location || '',
    amountUSD: prefilledData?.amountUSD || '',

    // Step 2: Participants
    participants: [], // { wallet: '', email: '', role: 'buyer'/'seller'/'agent', verified: false }

    // Step 3: Contract Upload
    contractFile: null,
    contractText: '',

    // Step 4: Multi-Sig & Signatures
    requiredSigs: 2,
    signatures: [], // { address: '', signature: '', timestamp: '' }

    // Internal
    bookingId: bookingId || prefilledData?.bookingId || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [contractCID, setContractCID] = useState('');
  const [encryptionKeys, setEncryptionKeys] = useState({});
  const [feeInfo, setFeeInfo] = useState(null);
  const [ethPrice, setEthPrice] = useState(3000); // Default ETH price, should fetch from API
  const [newParticipant, setNewParticipant] = useState({ wallet: '', email: '', role: 'seller' });

  // Calculate ETH amount from USD
  const amountETH = formData.amountUSD ? parseFloat(formData.amountUSD) / ethPrice : 0;

  useEffect(() => {
    if (amountETH > 0) {
      const info = calculateCustomEscrowFee(amountETH);
      setFeeInfo(info);
    } else {
      setFeeInfo(null);
    }
  }, [amountETH]);

  // Auto-add current user as buyer
  useEffect(() => {
    if (address && formData.participants.length === 0) {
      setFormData(prev => ({
        ...prev,
        participants: [{
          wallet: address.toLowerCase(),
          email: '',
          role: 'buyer',
          verified: true // Current user is already connected
        }]
      }));
    }
  }, [address]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File too large. Max size: 10 MB');
        return;
      }

      const allowedTypes = ['application/pdf', 'application/msword', 'text/plain'];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Please upload PDF, DOC, or TXT');
        return;
      }

      setFormData(prev => ({ ...prev, contractFile: file }));
      setError('');
    }
  };

  const addParticipant = () => {
    setError('');

    // Validate wallet address
    if (!newParticipant.wallet || !/^0x[a-fA-F0-9]{40}$/.test(newParticipant.wallet)) {
      setError('Invalid wallet address');
      return;
    }

    // Validate email
    if (!newParticipant.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newParticipant.email)) {
      setError('Invalid email address');
      return;
    }

    // Check if already exists
    if (formData.participants.some(p => p.wallet.toLowerCase() === newParticipant.wallet.toLowerCase())) {
      setError('Wallet already added');
      return;
    }

    setFormData(prev => ({
      ...prev,
      participants: [...prev.participants, {
        wallet: newParticipant.wallet.toLowerCase(),
        email: newParticipant.email.toLowerCase(),
        role: newParticipant.role,
        verified: false
      }]
    }));

    setNewParticipant({ wallet: '', email: '', role: 'seller' });
  };

  const removeParticipant = (wallet) => {
    if (wallet === address?.toLowerCase()) {
      setError('Cannot remove yourself (buyer)');
      return;
    }

    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter(p => p.wallet !== wallet)
    }));
  };

  const sendInvitations = async () => {
    setLoading(true);
    setError('');

    try {
      // Send email to each participant
      for (const participant of formData.participants) {
        if (participant.wallet !== address?.toLowerCase()) {
          // TODO: Send email via Supabase Edge Function or SendGrid
          await supabase.functions.invoke('send-escrow-invitation', {
            body: {
              to: participant.email,
              escrowTitle: formData.title,
              role: participant.role,
              amount: `$${formData.amountUSD}`,
              invitedBy: address
            }
          });
        }
      }

      alert('Invitations sent successfully!');
    } catch (err) {
      console.error('Failed to send invitations:', err);
      setError('Failed to send invitations. You can continue and share links manually.');
    } finally {
      setLoading(false);
    }
  };

  const verifyWalletOnBase = async (walletAddress) => {
    // Check if wallet is on Base network
    if (chain?.id !== 8453 && chain?.id !== 84532) {
      throw new Error('Please switch to Base network');
    }

    // Verify wallet has some activity on Base
    // This is a placeholder - you'd use Base RPC to check
    return true;
  };

  const collectSignature = async (participant) => {
    try {
      const message = `I agree to participate in escrow "${formData.title}" for $${formData.amountUSD} USD.\n\nEscrow ID: ${Date.now()}\nRole: ${participant.role}\nWallet: ${participant.wallet}`;

      const signature = await signMessageAsync({ message });

      setFormData(prev => ({
        ...prev,
        signatures: [...prev.signatures, {
          address: participant.wallet,
          signature,
          message,
          timestamp: new Date().toISOString()
        }]
      }));

      return signature;
    } catch (err) {
      throw new Error('Signature rejected');
    }
  };

  const handleContractUpload = async () => {
    if (!formData.contractFile) return;

    setLoading(true);
    setUploadProgress(0);

    try {
      if (!isIPFSConfigured()) {
        throw new Error('IPFS not configured. Please set VITE_WEB3_STORAGE_TOKEN in .env');
      }

      setUploadProgress(25);
      const { cid, encryptionKey } = await uploadEncryptedToIPFS(
        formData.contractFile,
        formData.contractFile.name
      );

      setUploadProgress(50);
      setContractCID(cid);

      // Encrypt key for each participant
      const keys = {};
      for (const participant of formData.participants) {
        const encryptedKey = await encryptKeyForWallet(
          encryptionKey,
          participant.wallet,
          async (msg) => await signMessageAsync({ message: msg })
        );
        keys[participant.wallet] = encryptedKey;
        setUploadProgress(50 + (Object.keys(keys).length / formData.participants.length) * 50);
      }

      setEncryptionKeys(keys);
      setUploadProgress(100);
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.message || 'Failed to upload contract');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    setError('');

    // Step 1: Asset Details
    if (step === 1) {
      if (!formData.title || !formData.description || !formData.amountUSD) {
        setError('Please fill in all required fields');
        return;
      }
      if (parseFloat(formData.amountUSD) <= 0) {
        setError('Amount must be greater than 0');
        return;
      }
    }

    // Step 2: Participants
    if (step === 2) {
      if (formData.participants.length < 2) {
        setError('At least 2 participants required (buyer + seller)');
        return;
      }

      const hasSeller = formData.participants.some(p => p.role === 'seller');
      if (!hasSeller) {
        setError('At least one seller is required');
        return;
      }
    }

    // Step 3: Contract Upload
    if (step === 3) {
      if (!formData.contractFile && !formData.contractText) {
        setError('Please upload a contract or write agreement text');
        return;
      }

      if (formData.contractFile) {
        await handleContractUpload();
      } else {
        const blob = new Blob([formData.contractText], { type: 'text/plain' });
        const file = new File([blob], 'agreement.txt', { type: 'text/plain' });
        setFormData(prev => ({ ...prev, contractFile: file }));
        await handleContractUpload();
      }
    }

    // Step 4: Signatures
    if (step === 4) {
      // Check all participants signed
      const allSigned = formData.participants.every(p =>
        formData.signatures.some(s => s.address === p.wallet)
      );

      if (!allSigned) {
        setError('All participants must sign before creating escrow');
        return;
      }
    }

    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      await handleCreateEscrow();
    }
  };

  const handleCreateEscrow = async () => {
    setLoading(true);
    setError('');

    try {
      const sellerAddress = formData.participants.find(p => p.role === 'seller')?.wallet;

      const { data: escrow, error: dbError } = await supabase
        .from('flexible_escrow_payments')
        .insert({
          escrow_id: Math.floor(Date.now() / 1000),
          contract_address: '0x0000000000000000000000000000000000000000',
          buyer_address: address.toLowerCase(),
          seller_address: sellerAddress,
          amount_wei: parseEther(amountETH.toString()).toString(),
          platform_fee_wei: feeInfo?.fee ? parseEther(feeInfo.fee.toString()).toString() : '0',
          total_deposit_wei: parseEther(amountETH.toString()).toString(),
          fee_tier: feeInfo?.tier || 'Standard',
          fee_percentage: feeInfo?.tierBps || 200,
          contract_cid: contractCID,
          contract_title: formData.title,
          description: formData.description,
          booking_id: formData.bookingId || null,
          signers: formData.participants.map(p => p.wallet),
          required_signatures: formData.requiredSigs,
          current_signatures: formData.signatures.length,
          status: 'active'
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Save contract
      await supabase.from('escrow_contracts').insert({
        escrow_payment_id: escrow.id,
        contract_type: formData.contractFile ? 'uploaded' : 'generated',
        contract_title: formData.title,
        contract_description: formData.description,
        ipfs_cid: contractCID,
        ipfs_gateway_url: `https://${contractCID}.ipfs.w3s.link/`,
        file_size_bytes: formData.contractFile?.size || 0,
        file_type: formData.contractFile?.type || 'text/plain',
        original_filename: formData.contractFile?.name || 'agreement.txt',
        encryption_key_buyer: encryptionKeys[address.toLowerCase()],
        encryption_key_seller: encryptionKeys[sellerAddress]
      });

      // Save all signatures
      for (const sig of formData.signatures) {
        await supabase.from('escrow_signatures').insert({
          escrow_payment_id: escrow.id,
          signer_address: sig.address,
          signer_role: formData.participants.find(p => p.wallet === sig.address)?.role,
          signature_hash: sig.signature,
          message_signed: sig.message,
          status: 'signed'
        });
      }

      // Create event
      await supabase.from('flexible_escrow_events').insert({
        escrow_payment_id: escrow.id,
        event_type: 'created',
        triggered_by: address.toLowerCase(),
        metadata: {
          title: formData.title,
          amount_usd: formData.amountUSD,
          participants: formData.participants.length,
          asset_type: formData.assetType,
          location: formData.location
        }
      });

      onClose({ success: true, escrow });
    } catch (err) {
      console.error('Escrow creation failed:', err);
      setError(err.message || 'Failed to create escrow');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white/15 backdrop-blur-xl rounded-lg border border-gray-300/50 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white/20 backdrop-blur-xl border-b border-gray-300/50 p-6 z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-light text-gray-900">Create Escrow Agreement</h2>
              <p className="text-xs text-gray-600 mt-1">Step {step} of {totalSteps}</p>
            </div>
            <button onClick={() => onClose()} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200/30 rounded-full h-1.5">
            <div
              className="bg-black h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>

          {/* Step Labels */}
          <div className="flex justify-between mt-3 text-xs text-gray-600">
            <span className={step >= 1 ? 'text-gray-900 font-medium' : ''}>Asset Details</span>
            <span className={step >= 2 ? 'text-gray-900 font-medium' : ''}>Participants</span>
            <span className={step >= 3 ? 'text-gray-900 font-medium' : ''}>Contract</span>
            <span className={step >= 4 ? 'text-gray-900 font-medium' : ''}>Signatures</span>
            <span className={step >= 5 ? 'text-gray-900 font-medium' : ''}>Review</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-6 bg-red-50/50 border border-red-200/50 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* STEP 1: Asset/Transfer Details */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-light text-gray-900 mb-2">What are you escrowing?</h3>
                <p className="text-sm text-gray-600">Provide details about the asset or service being transferred</p>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-light text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Private Jet Charter - Miami to NYC"
                  className="w-full px-4 py-3 bg-white/20 border border-gray-300/50 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black/20"
                />
              </div>

              {/* Asset Type */}
              <div>
                <label className="block text-sm font-light text-gray-700 mb-2">Asset Type</label>
                <select
                  value={formData.assetType}
                  onChange={(e) => setFormData({ ...formData, assetType: e.target.value })}
                  className="w-full px-4 py-3 bg-white/20 border border-gray-300/50 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/20"
                >
                  <option value="service">Service</option>
                  <option value="goods">Goods</option>
                  <option value="real_estate">Real Estate</option>
                  <option value="vehicle">Vehicle (Jet, Yacht, Car)</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Amount USD */}
                <div>
                  <label className="block text-sm font-light text-gray-700 mb-2">
                    Amount (USD) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amountUSD}
                      onChange={(e) => setFormData({ ...formData, amountUSD: e.target.value })}
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-3 bg-white/20 border border-gray-300/50 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black/20"
                    />
                  </div>
                  {amountETH > 0 && (
                    <p className="text-xs text-gray-600 mt-1">≈ {amountETH.toFixed(6)} ETH</p>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-light text-gray-700 mb-2">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="City, Country"
                      className="w-full pl-10 pr-4 py-3 bg-white/20 border border-gray-300/50 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black/20"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-light text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the asset, service, or transaction in detail..."
                  rows={4}
                  className="w-full px-4 py-3 bg-white/20 border border-gray-300/50 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black/20 resize-none"
                />
              </div>

              {/* Fee Preview */}
              {feeInfo && (
                <div className="bg-white/20 backdrop-blur-xl rounded-lg border border-gray-300/50 p-6">
                  <h3 className="text-sm font-light text-gray-700 mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Fee Calculation
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Tier</span>
                      <span className="text-sm font-light text-gray-900">{feeInfo.tier} ({feeInfo.percentage})</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Amount</span>
                      <span className="text-sm font-light text-gray-900">${formData.amountUSD} USD</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Platform Fee</span>
                      <span className="text-sm font-light text-gray-900">${(parseFloat(formData.amountUSD) * parseFloat(feeInfo.percentage.replace('%', '')) / 100).toFixed(2)} USD</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Participants */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-light text-gray-900 mb-2">Add Participants</h3>
                <p className="text-sm text-gray-600">Invite all parties involved in this escrow</p>
              </div>

              {/* Current Participants */}
              <div className="space-y-3">
                <label className="block text-sm font-light text-gray-700">Current Participants</label>
                {formData.participants.map((participant, idx) => (
                  <div key={idx} className="bg-white/20 backdrop-blur-xl rounded-lg border border-gray-300/50 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-light text-gray-900">
                            {participant.role.charAt(0).toUpperCase() + participant.role.slice(1)}
                            {participant.wallet === address?.toLowerCase() && ' (You)'}
                          </span>
                          {participant.verified && (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 font-mono">{participant.wallet}</p>
                        {participant.email && (
                          <p className="text-xs text-gray-600 mt-1">{participant.email}</p>
                        )}
                      </div>
                      {participant.wallet !== address?.toLowerCase() && (
                        <button
                          onClick={() => removeParticipant(participant.wallet)}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Participant */}
              <div className="bg-white/10 rounded-lg border border-gray-300/30 p-4 space-y-3">
                <label className="block text-sm font-light text-gray-700">Add New Participant</label>

                <div>
                  <input
                    type="text"
                    value={newParticipant.wallet}
                    onChange={(e) => setNewParticipant({ ...newParticipant, wallet: e.target.value })}
                    placeholder="Wallet Address (0x...)"
                    className="w-full px-4 py-2 bg-white/20 border border-gray-300/50 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black/20"
                  />
                </div>

                <div>
                  <input
                    type="email"
                    value={newParticipant.email}
                    onChange={(e) => setNewParticipant({ ...newParticipant, email: e.target.value })}
                    placeholder="Email Address"
                    className="w-full px-4 py-2 bg-white/20 border border-gray-300/50 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={newParticipant.role}
                    onChange={(e) => setNewParticipant({ ...newParticipant, role: e.target.value })}
                    className="px-4 py-2 bg-white/20 border border-gray-300/50 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/20"
                  >
                    <option value="seller">Seller</option>
                    <option value="agent">Agent</option>
                    <option value="authorized">Authorized Signer</option>
                  </select>

                  <button
                    onClick={addParticipant}
                    className="px-4 py-2 bg-black text-white text-sm font-light rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Send Invitations */}
              {formData.participants.length > 1 && (
                <button
                  onClick={sendInvitations}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-blue-600 text-white text-sm font-light rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Send Email Invitations to Join PrivateCharterX
                </button>
              )}

              <div className="bg-blue-50/50 border border-blue-200/50 rounded-lg p-4">
                <p className="text-xs text-blue-800">
                  Participants will receive an email invitation to register at PrivateCharterX and verify their wallet on Base network.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: Contract Upload */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-light text-gray-900 mb-2">Upload Agreement Contract</h3>
                <p className="text-sm text-gray-600">
                  Files are encrypted with AES-256 before upload to IPFS
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-300/50 rounded-lg p-8 text-center bg-white/10">
                <input
                  type="file"
                  id="contract-upload"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                />
                <label htmlFor="contract-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-700 mb-2">
                    {formData.contractFile ? formData.contractFile.name : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-gray-500">PDF, DOC, or TXT (max 10MB)</p>
                </label>
              </div>

              <div className="text-center text-xs text-gray-500">OR</div>

              <div>
                <label className="block text-sm font-light text-gray-700 mb-2">Write Agreement</label>
                <textarea
                  value={formData.contractText}
                  onChange={(e) => setFormData({ ...formData, contractText: e.target.value })}
                  placeholder="Write your agreement here..."
                  rows={8}
                  className="w-full px-4 py-3 bg-white/20 border border-gray-300/50 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black/20 resize-none"
                />
              </div>

              <div className="bg-blue-50/50 border border-blue-200/50 rounded-lg p-4 flex items-start gap-3">
                <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-800">
                  <p className="font-medium mb-1">End-to-End Encrypted</p>
                  <p>Only participants with verified wallets can decrypt and view this contract.</p>
                </div>
              </div>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div>
                  <div className="w-full bg-gray-200/30 rounded-full h-2">
                    <div
                      className="bg-black h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 text-center mt-2">Uploading: {uploadProgress}%</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Collect Signatures */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-light text-gray-900 mb-2">Collect Wallet Signatures</h3>
                <p className="text-sm text-gray-600">All participants must sign before creating escrow</p>
              </div>

              {formData.participants.map((participant, idx) => {
                const hasSigned = formData.signatures.some(s => s.address === participant.wallet);
                const isCurrentUser = participant.wallet === address?.toLowerCase();

                return (
                  <div key={idx} className="bg-white/20 backdrop-blur-xl rounded-lg border border-gray-300/50 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-light text-gray-900">
                            {participant.role.charAt(0).toUpperCase() + participant.role.slice(1)}
                            {isCurrentUser && ' (You)'}
                          </span>
                          {hasSigned ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-yellow-600" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 font-mono">{participant.wallet}</p>
                        {hasSigned && (
                          <p className="text-xs text-green-600 mt-1">Signed ✓</p>
                        )}
                      </div>
                      {isCurrentUser && !hasSigned && (
                        <button
                          onClick={() => collectSignature(participant)}
                          className="px-4 py-2 bg-black text-white text-sm font-light rounded-lg hover:bg-gray-800 transition-colors"
                        >
                          Sign Now
                        </button>
                      )}
                      {!isCurrentUser && !hasSigned && (
                        <span className="text-xs text-gray-500">Waiting for signature...</span>
                      )}
                    </div>
                  </div>
                );
              })}

              <div className="bg-yellow-50/50 border border-yellow-200/50 rounded-lg p-4">
                <p className="text-xs text-yellow-800">
                  <strong>Note:</strong> In production, other participants will sign via their wallets after receiving email invitations.
                  For now, you can only sign as the connected wallet.
                </p>
              </div>

              {/* Required Signatures Config */}
              <div>
                <label className="block text-sm font-light text-gray-700 mb-3">
                  Required Signatures for Release: {formData.requiredSigs} of {formData.participants.length}
                </label>
                <div className="space-y-2">
                  {[...Array(formData.participants.length)].map((_, idx) => {
                    const requiredCount = idx + 1;
                    return (
                      <label key={idx} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="requiredSigs"
                          checked={formData.requiredSigs === requiredCount}
                          onChange={() => setFormData({ ...formData, requiredSigs: requiredCount })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-gray-700">
                          {requiredCount} of {formData.participants.length}
                          {requiredCount === 1 && ' (Any single signer)'}
                          {requiredCount === formData.participants.length && ' (All signers required)'}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Review */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-light text-gray-900 mb-2">Review & Create Escrow</h3>
                <p className="text-sm text-gray-600">Please review all details before finalizing</p>
              </div>

              <div className="bg-white/20 backdrop-blur-xl rounded-lg border border-gray-300/50 p-6 space-y-4">
                <div>
                  <p className="text-xs text-gray-600">Title</p>
                  <p className="text-sm font-light text-gray-900">{formData.title}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Amount</p>
                    <p className="text-sm text-gray-900">${formData.amountUSD} USD</p>
                    <p className="text-xs text-gray-600">≈ {amountETH.toFixed(6)} ETH</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Fee</p>
                    <p className="text-sm text-gray-900">{feeInfo?.percentage} ({feeInfo?.tier})</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Asset Type</p>
                    <p className="text-sm text-gray-900">{formData.assetType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Location</p>
                    <p className="text-sm text-gray-900">{formData.location || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-600">Participants</p>
                    <p className="text-sm text-gray-900">{formData.participants.length} people</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-600">Signatures</p>
                    <p className="text-sm text-gray-900">
                      {formData.signatures.length} collected, {formData.requiredSigs} required for release
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50/50 border border-yellow-200/50 rounded-lg p-4">
                <p className="text-xs text-yellow-800">
                  By proceeding, you agree to lock <strong>${formData.amountUSD} USD ({amountETH.toFixed(6)} ETH)</strong> in escrow.
                  Funds will be released when <strong>{formData.requiredSigs} of {formData.participants.length}</strong> participants approve.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white/20 backdrop-blur-xl border-t border-gray-300/50 p-6 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={step === 1 || loading}
            className="px-6 py-2 text-sm font-light text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <button
            onClick={handleNext}
            disabled={loading}
            className="px-6 py-2 bg-black text-white text-sm font-light rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : step === totalSteps ? (
              'Create Escrow'
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
