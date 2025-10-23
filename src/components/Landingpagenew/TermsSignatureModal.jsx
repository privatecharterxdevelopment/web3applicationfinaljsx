import React, { useState } from 'react';
import { Check, X, Wallet, AlertCircle, FileText } from 'lucide-react';
import { useAccount, useSignMessage } from 'wagmi';

const TermsSignatureModal = ({ onClose, onSubmit, tokenType, formData }) => {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [signature, setSignature] = useState(null);
  const [isSigning, setIsSigning] = useState(false);

  const handleWalletSignature = async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      setIsSigning(true);

      const message = `I hereby declare that I am the rightful owner of the asset "${formData.assetName || 'this asset'}"
and I am legally authorized to tokenize it on the PrivateCharterX platform.

Asset Details:
- Name: ${formData.assetName || 'N/A'}
- Value: $${formData.assetValue || 'N/A'}
- Type: ${tokenType === 'security' ? 'Security Token' : 'Utility Token'}

I confirm that all information provided is accurate and complete.

Signed by: ${address}
Timestamp: ${new Date().toISOString()}`;

      const sig = await signMessageAsync({ message });

      setSignature({
        message,
        signature: sig,
        address,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Signature error:', error);
      alert('Signature failed: ' + error.message);
    } finally {
      setIsSigning(false);
    }
  };

  const handleSubmit = () => {
    if (!termsAccepted || !declarationAccepted) {
      alert('Please accept all terms and declarations');
      return;
    }

    if (!signature) {
      alert('Please sign with your wallet');
      return;
    }

    onSubmit({
      termsAccepted,
      declarationAccepted,
      signature
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-xl border border-gray-300/50 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-300/50 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Terms & Signature</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200/50 transition-all"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          {/* Terms & Conditions */}
          <div>
            <label className="flex items-start gap-3 p-4 bg-white/30 rounded-xl border border-gray-300/50 cursor-pointer hover:bg-white/40 transition-all">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="w-5 h-5 mt-0.5 rounded border-gray-300 text-black focus:ring-2 focus:ring-gray-400"
              />
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <FileText size={16} />
                  I agree to the Terms & Conditions
                </div>
                <div className="text-xs text-gray-700 leading-relaxed">
                  I have read and agree to PrivateCharterX's Terms of Service, Privacy Policy, and Tokenization Agreement. I understand the risks associated with tokenizing assets and digital securities.
                </div>
              </div>
            </label>
          </div>

          {/* Declaration */}
          <div>
            <label className="flex items-start gap-3 p-4 bg-white/30 rounded-xl border border-gray-300/50 cursor-pointer hover:bg-white/40 transition-all">
              <input
                type="checkbox"
                checked={declarationAccepted}
                onChange={(e) => setDeclarationAccepted(e.target.checked)}
                className="w-5 h-5 mt-0.5 rounded border-gray-300 text-black focus:ring-2 focus:ring-gray-400"
              />
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <AlertCircle size={16} />
                  Legal Declaration
                </div>
                <div className="text-xs text-gray-700 leading-relaxed">
                  I hereby declare under oath that I am the sole rightful owner of this asset and have full legal authority to tokenize it. I confirm that the asset is free from any encumbrances, liens, or legal disputes. I am solely responsible for all information provided and understand that false declarations may result in legal consequences.
                </div>
              </div>
            </label>
          </div>

          {/* Wallet Signature */}
          <div className="bg-blue-50/50 border border-blue-200/50 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Wallet size={18} />
              Digital Signature (Recommended)
            </h3>
            <p className="text-xs text-gray-700 mb-4 leading-relaxed">
              Sign this declaration with your connected wallet to provide cryptographic proof of ownership and authorization. This signature will be stored securely in our database with timestamp.
            </p>

            {!signature ? (
              <button
                onClick={handleWalletSignature}
                disabled={!isConnected || isSigning}
                className="w-full px-4 py-3 bg-black hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              >
                {isSigning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing...
                  </>
                ) : (
                  <>
                    <Wallet size={18} />
                    {isConnected ? 'Sign with Wallet' : 'Connect Wallet First'}
                  </>
                )}
              </button>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-green-700 mb-2">
                  <Check size={18} />
                  <span className="font-semibold text-sm">Signature Verified</span>
                </div>
                <div className="text-xs text-green-600">
                  <div>Address: {signature.address?.slice(0, 10)}...{signature.address?.slice(-8)}</div>
                  <div>Time: {new Date(signature.timestamp).toLocaleString()}</div>
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-gray-50/50 border border-gray-200/50 rounded-xl p-4">
            <p className="text-xs text-gray-700 leading-relaxed">
              <strong>Important:</strong> By submitting this tokenization request, you acknowledge that PrivateCharterX acts solely as a technology provider. You retain full responsibility for legal compliance, regulatory approval, and all aspects of the tokenized asset. Our team will review your submission within 24-48 hours.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-300/50 flex justify-between gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-white/40 hover:bg-white/50 border border-gray-300/50 text-gray-900 rounded-xl font-semibold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!termsAccepted || !declarationAccepted || !signature}
            className="px-6 py-3 bg-black hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all flex items-center gap-2"
          >
            <Check size={18} />
            Submit for Review
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsSignatureModal;
