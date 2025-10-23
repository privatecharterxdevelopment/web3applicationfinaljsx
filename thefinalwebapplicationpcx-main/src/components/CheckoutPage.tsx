import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, Loader2, Shield, FileText, Wallet, Download, ExternalLink, Plane, Euro, Leaf, AlertTriangle, Copy, ArrowRight } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';
import Logo from './Logo';
import NavigationMenu from './NavigationMenu';
import UserMenu from './UserMenu';
import WalletMenu from './WalletMenu';

// Configuration - replace with your actual values
const config = {
  SUPABASE_URL: 'https://oubecmstqtzdnevyqavu.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91YmVjbXN0cXR6ZG5ldnlxYXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwOTc0MTIsImV4cCI6MjA2NjY3MzQxMn0.CQTa4WE0oGF8y5xm3CSeyK6O3fcxhpJv50l_xvHKQfs',
  CONTRACT_ADDRESS: "0x742d35Cc643C0532F8e5b0d6a7f6b8a09c128a9c",
  ADMIN_WALLET: "0x150328862D9EbEdc7Dc2C98c26Ae0def05bbAA3D"
};

// Initialize Supabase
const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);

// Smart Contract Configuration
const CONTRACT_ADDRESS = config.CONTRACT_ADDRESS;
const ADMIN_WALLET = config.ADMIN_WALLET;

// Simplified Contract ABI for payment
const CONTRACT_ABI = [
  "function mintBookingNFT(string bookingId, address customerWallet) public payable",
  "function getBookingStatus(string bookingId) public view returns (bool)",
  "event BookingConfirmed(string indexed bookingId, address indexed customer, uint256 amount)"
];

export default function CheckoutPage() {
  const [step, setStep] = useState('loading'); // loading, checkout, processing, confirming, success, error
  const [bookingData, setBookingData] = useState(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [error, setError] = useState(null);
  const [transactionHash, setTransactionHash] = useState('');
  const [blockConfirmations, setBlockConfirmations] = useState(0);
  const [agreementsAccepted, setAgreementsAccepted] = useState({
    contract: false,
    terms: false
  });

  const getBookingId = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
  };

  // Load booking data
  useEffect(() => {
    loadBookingData();
  }, []);

  const loadBookingData = async () => {
    const bookingId = getBookingId();
    
    if (!bookingId) {
      setError('No booking ID provided in URL');
      setStep('error');
      return;
    }

    try {
      console.log('🔍 Loading booking:', bookingId);
      
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (bookingError || !booking) {
        setError('Booking not found');
        setStep('error');
        return;
      }

      // Check if already completed
      if (booking.wallet_status === 'minted') {
        setBookingData(booking);
        setWalletAddress(booking.wallet_address);
        setTransactionHash(booking.transaction_hash);
        setStep('success');
        return;
      }

      console.log('✅ Booking loaded:', booking);
      setBookingData(booking);
      setStep('checkout');
      
    } catch (error) {
      console.error('❌ Failed to load booking:', error);
      setError('Failed to load booking data');
      setStep('error');
    }
  };

  // Connect wallet
  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask or another Web3 wallet');
      return;
    }

    try {
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await web3Provider.send("eth_requestAccounts", []);
      
      if (accounts.length === 0) {
        alert('No wallet accounts found');
        return;
      }

      const web3Signer = web3Provider.getSigner();
      const address = await web3Signer.getAddress();

      setProvider(web3Provider);
      setSigner(web3Signer);
      setWalletAddress(address);
      setWalletConnected(true);
      
      console.log('✅ Wallet connected:', address);
      
    } catch (error) {
      console.error('❌ Wallet connection failed:', error);
      alert('Wallet connection failed: ' + error.message);
    }
  };

  // Process payment and mint NFT
  const processPayment = async () => {
    if (!agreementsAccepted.contract || !agreementsAccepted.terms) {
      alert('Please accept all agreements');
      return;
    }

    if (!walletConnected || !signer) {
      alert('Please connect your wallet first');
      return;
    }

    setStep('processing');

    try {
      console.log('🚀 Starting payment process...');
      
      // Calculate gas price and amount
      const totalAmountETH = (parseFloat(bookingData.total_price) / 3000).toFixed(6); // Mock EUR to ETH conversion
      const paymentAmount = ethers.utils.parseEther(totalAmountETH);

      // Create contract instance
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      console.log('💰 Processing payment of', totalAmountETH, 'ETH');

      // Send transaction
      const transaction = await contract.mintBookingNFT(
        bookingData.id,
        walletAddress,
        {
          value: paymentAmount,
          gasLimit: 300000
        }
      );

      console.log('📤 Transaction sent:', transaction.hash);
      setTransactionHash(transaction.hash);
      setStep('confirming');

      // Wait for confirmation
      const receipt = await transaction.wait(1);
      console.log('✅ Transaction confirmed:', receipt);
      
      setBlockConfirmations(1);

      // Update booking in database
      await supabase
        .from('bookings')
        .update({
          wallet_status: 'minted',
          wallet_address: walletAddress,
          transaction_hash: transaction.hash,
          token_id: receipt.blockNumber.toString(), // Using block number as token ID for demo
          confirmed_at: new Date().toISOString()
        })
        .eq('id', bookingData.id);

      // Create transaction record
      await supabase
        .from('transactions')
        .insert([{
          booking_id: bookingData.id,
          transaction_type: 'payment',
          amount: bookingData.total_price,
          currency: 'EUR',
          blockchain_hash: transaction.hash,
          gas_fee: receipt.gasUsed ? ethers.utils.formatEther(receipt.gasUsed.mul(receipt.effectiveGasPrice || 0)) : '0',
          status: 'confirmed',
          confirmed_at: new Date().toISOString()
        }]);

      console.log('✅ Database updated');
      setStep('success');
      
    } catch (error) {
      console.error('❌ Payment failed:', error);
      setError(error.message);
      setStep('error');
    }
  };

  // Wait for more confirmations
  useEffect(() => {
    if (transactionHash && provider && step === 'confirming') {
      const waitForConfirmations = async () => {
        try {
          const receipt = await provider.waitForTransaction(transactionHash, 3);
          setBlockConfirmations(3);
          console.log('🔗 3 block confirmations received');
        } catch (error) {
          console.error('Error waiting for confirmations:', error);
        }
      };
      
      waitForConfirmations();
    }
  }, [transactionHash, provider, step]);

  if (!bookingData && step !== 'error') {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="max-w-8xl mx-auto">
            <div className="flex items-center justify-between py-4 px-6">
              <div className="flex items-center gap-8">
                <Logo />
                <NavigationMenu />
              </div>
              <div className="flex items-center gap-4">
                <UserMenu />
                <WalletMenu onShowDashboard={() => {}} />
              </div>
            </div>
          </div>
        </header>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-gray-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Loading your booking</h2>
            <p className="text-gray-600">Please wait while we prepare your secure checkout...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-8xl mx-auto">
          <div className="flex items-center justify-between py-4 px-6">
            <div className="flex items-center gap-8">
              <Logo />
              <NavigationMenu />
            </div>
            <div className="flex items-center gap-4">
              <UserMenu />
              <WalletMenu onShowDashboard={() => {}} />
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-2xl mx-auto">
          
          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-50 to-white p-8 border-b border-gray-200">
              <div className="text-center">
                <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Secure Blockchain Checkout</h1>
                <p className="text-gray-600">Complete your payment with cryptocurrency</p>
                
                {bookingData && (
                  <div className="mt-4 inline-flex items-center px-4 py-2 bg-blue-50 rounded-xl">
                    <Plane className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-800">Booking ID: {bookingData.id}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-8">
              
              {/* Error State */}
              {step === 'error' && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Booking Error</h2>
                  <p className="text-gray-600 mb-6">{error}</p>
                  <button
                    onClick={() => window.location.href = '/'}
                    className="bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors"
                  >
                    Return Home
                  </button>
                </div>
              )}

              {/* Success State */}
              {step === 'success' && (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h2>
                  <p className="text-gray-600 mb-8">
                    Your booking has been confirmed and secured on the blockchain.
                    Your NFT ticket has been minted to your wallet.
                  </p>
                  
                  <div className="bg-gray-50 rounded-xl p-6 mb-8">
                    <div className="grid grid-cols-1 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Transaction Hash:</span>
                        <div className="flex items-center">
                          <span className="font-mono text-gray-900 mr-2">
                            {transactionHash?.substring(0, 10)}...{transactionHash?.substring(-8)}
                          </span>
                          <button
                            onClick={() => navigator.clipboard.writeText(transactionHash)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Your Wallet:</span>
                        <span className="font-mono text-gray-900">
                          {walletAddress?.substring(0, 6)}...{walletAddress?.substring(-4)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Confirmations:</span>
                        <span className="font-medium text-green-600">
                          {blockConfirmations}/3 ✅
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => window.open(`https://etherscan.io/tx/${transactionHash}`, '_blank')}
                      className="w-full bg-gray-100 text-gray-900 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View on Blockchain
                    </button>
                    
                    <button
                      onClick={() => window.location.href = '/'}
                      className="w-full bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors"
                    >
                      Return Home
                    </button>
                  </div>
                </div>
              )}

              {/* Processing State */}
              {step === 'processing' && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Processing Payment</h2>
                  <p className="text-gray-600 mb-8">
                    Please wait while we process your blockchain transaction.
                    Do not close this window.
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <p className="text-sm text-yellow-800">
                      🔄 Sending transaction to blockchain...
                    </p>
                  </div>
                </div>
              )}

              {/* Confirming State */}
              {step === 'confirming' && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-10 h-10 text-orange-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Awaiting Confirmation</h2>
                  <p className="text-gray-600 mb-8">
                    Your transaction has been sent! Waiting for blockchain confirmation.
                  </p>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-800">Transaction Hash:</span>
                        <span className="text-sm font-mono text-blue-900">
                          {transactionHash?.substring(0, 10)}...
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-800">Confirmations:</span>
                        <span className="text-sm font-bold text-blue-900">
                          {blockConfirmations}/3
                        </span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(blockConfirmations / 3) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => window.open(`https://etherscan.io/tx/${transactionHash}`, '_blank')}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center justify-center mx-auto"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    View Transaction
                  </button>
                </div>
              )}

              {/* Checkout State */}
              {step === 'checkout' && bookingData && (
                <div className="space-y-8">
                  
                  {/* Booking Details */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Details</h3>
                    <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Customer:</span>
                        <span className="font-medium text-gray-900">{bookingData.guest_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Service:</span>
                        <span className="font-medium text-gray-900">Private Charter</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium text-gray-900">{bookingData.service_date}</span>
                      </div>
                      
                      {bookingData.service_details && (
                        <div className="border-t border-gray-200 pt-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">From:</span>
                              <p className="font-medium text-gray-900">
                                {JSON.parse(bookingData.service_details || '{}').departure || 'TBD'}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">To:</span>
                              <p className="font-medium text-gray-900">
                                {JSON.parse(bookingData.service_details || '{}').arrival || 'TBD'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pricing */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing Breakdown</h3>
                    <div className="bg-gray-50 rounded-xl p-6">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Base Price</span>
                          <span className="font-medium">€{parseFloat(bookingData.base_price).toLocaleString()}</span>
                        </div>
                        
                        <div className="flex justify-between text-green-600">
                          <span className="flex items-center">
                            <Leaf className="w-4 h-4 mr-1" />
                            Carbon Offset
                          </span>
                          <span>+€{parseFloat(bookingData.carbon_offset_fee || 0).toFixed(2)}</span>
                        </div>
                        
                        <div className="flex justify-between text-gray-600">
                          <span>Service Fee</span>
                          <span>+€{parseFloat(bookingData.admin_fee || 0).toFixed(2)}</span>
                        </div>
                        
                        <div className="border-t border-gray-300 pt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xl font-bold text-gray-900">Total</span>
                            <div className="text-right">
                              <span className="text-2xl font-bold text-gray-900">
                                €{parseFloat(bookingData.total_price).toLocaleString()}
                              </span>
                              <p className="text-sm text-gray-500">
                                ~{(parseFloat(bookingData.total_price) / 3000).toFixed(4)} ETH
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Agreements */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Documentation</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="contract-agreement"
                            checked={agreementsAccepted.contract}
                            onChange={(e) => setAgreementsAccepted({
                              ...agreementsAccepted,
                              contract: e.target.checked
                            })}
                            className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                          />
                          <label htmlFor="contract-agreement" className="ml-3 text-gray-900 font-medium">
                            Service Agreement
                          </label>
                        </div>
                        <button className="text-gray-600 hover:text-gray-900 flex items-center">
                          <Download className="w-4 h-4 mr-1" />
                          View
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="terms"
                            checked={agreementsAccepted.terms}
                            onChange={(e) => setAgreementsAccepted({
                              ...agreementsAccepted,
                              terms: e.target.checked
                            })}
                            className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                          />
                          <label htmlFor="terms" className="ml-3 text-gray-900 font-medium">
                            Terms & Conditions
                          </label>
                        </div>
                        <button className="text-gray-600 hover:text-gray-900 flex items-center">
                          <Download className="w-4 h-4 mr-1" />
                          View
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Wallet Connection */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Wallet</h3>
                    
                    {!walletConnected ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Wallet className="w-8 h-8 text-gray-600" />
                        </div>
                        <p className="text-gray-600 mb-6">
                          Connect your Web3 wallet to complete the secure blockchain transaction.
                        </p>
                        <button
                          onClick={connectWallet}
                          className="bg-black text-white font-semibold py-4 px-8 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center mx-auto"
                        >
                          <Wallet className="w-5 h-5 mr-2" />
                          Connect Wallet
                        </button>
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                        <div className="flex items-center mb-4">
                          <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                          <div>
                            <p className="font-semibold text-green-800">Wallet Connected</p>
                            <p className="text-sm text-green-600">Ready to process payment</p>
                          </div>
                        </div>
                        <p className="text-sm font-mono text-green-700 bg-green-100 rounded-lg p-3 break-all">
                          {walletAddress}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Complete Payment */}
                  {walletConnected && (
                    <div className="border-t border-gray-200 pt-8">
                      <button
                        onClick={processPayment}
                        disabled={!agreementsAccepted.contract || !agreementsAccepted.terms}
                        className="w-full bg-black text-white font-bold py-4 px-6 rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                      >
                        <Shield className="w-5 h-5 mr-2" />
                        Complete Secure Payment
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </button>
                      
                      {(!agreementsAccepted.contract || !agreementsAccepted.terms) && (
                        <p className="text-orange-600 text-sm mt-3 text-center">
                          Please accept all agreements to continue
                        </p>
                      )}
                      
                      <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <p className="text-sm text-blue-800 flex items-center">
                          <Shield className="w-4 h-4 mr-2" />
                          Your payment will be processed securely via smart contract
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          Funds go to: {ADMIN_WALLET.substring(0, 10)}...
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}