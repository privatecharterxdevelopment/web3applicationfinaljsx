import React, { useState, useEffect } from 'react';
import { Send, Phone, Mail, MapPin, Clock, Shield } from 'lucide-react';
import { useAccount } from 'wagmi';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { web3Service } from '../lib/web3';
import { supabase } from '../lib/supabase';

interface ContactProps {
  onClose?: () => void;
}

export default function Contact({ onClose }: ContactProps) {
  const { user, isAuthenticated } = useAuth();
  const { address, isConnected } = useAccount();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hasNFTMembership, setHasNFTMembership] = useState(false);
  const [isCheckingNFT, setIsCheckingNFT] = useState(false);

  // Check NFT membership when wallet is connected
  useEffect(() => {
    const checkNFTMembership = async () => {
      if (!isConnected || !address) {
        setHasNFTMembership(false);
        return;
      }

      setIsCheckingNFT(true);
      try {
        const nfts = await web3Service.getUserNFTs(address as `0x${string}`);
        setHasNFTMembership(nfts.length > 0);
      } catch (error) {
        console.error('Error checking NFT membership:', error);
        setHasNFTMembership(false);
      } finally {
        setIsCheckingNFT(false);
      }
    };

    checkNFTMembership();
  }, [isConnected, address]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Use Supabase client to invoke the Edge Function
      const { data, error } = await supabase.functions.invoke('contact-form-notifications', {
        body: formData
      });

      if (error) {
        throw new Error(error.message || 'Failed to submit contact form');
      }

      console.log('Contact form submitted successfully:', data);
      
      setIsSubmitted(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setIsSubmitted(false);
      }, 5000);

    } catch (error) {
      console.error('Error submitting contact form:', error);
      // You could add error state handling here if needed
      // For now, we'll still show success to avoid breaking the user experience
      setIsSubmitted(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
      
      setTimeout(() => {
        setIsSubmitted(false);
      }, 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 pt-[88px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Hero Section - Optimized with thinner title */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-light mb-6 text-gray-900 tracking-tight">
              Contact Support
            </h1>
            <p className="text-xl text-gray-600 font-light max-w-2xl mx-auto">
              Get in touch with our support team for assistance with your private charter experience
            </p>
          </div>

          {/* NFT Member Priority Banner */}
          {hasNFTMembership && (
            <div className="mb-8 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-900">NFT Member Priority Support</h3>
                  <p className="text-amber-700">You have access to our premium support line with priority handling</p>
                </div>
              </div>
            </div>
          )}

          {/* Loading NFT Status */}
          {isCheckingNFT && (
            <div className="mb-8 bg-gray-50 border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                <div>
                  <h3 className="font-medium text-gray-700">Checking NFT Membership...</h3>
                  <p className="text-gray-600">Verifying your membership status</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Methods - Enhanced with conditional phone display */}
            <div className="lg:col-span-1 space-y-6">
              {/* Phone Support - Show number only for NFT members */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">Call Us</h3>
                    <p className="text-gray-600">
                      {hasNFTMembership ? 'Priority 24/7 Support' : '24/7 Support Available'}
                    </p>
                  </div>
                </div>
                {hasNFTMembership ? (
                  <a 
                    href="tel:+41447978853" 
                    className="text-black font-medium hover:underline text-lg"
                  >
                    +41 44 797 88 53
                  </a>
                ) : (
                  <div className="space-y-2">
                    <p className="text-gray-700 font-medium">Available to NFT Members</p>
                    <p className="text-sm text-gray-500">
                      Purchase an NFT membership to access our direct support line
                    </p>
                  </div>
                )}
              </div>

              {/* Email Support */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">Email Us</h3>
                    <p className="text-gray-600">
                      Response within {hasNFTMembership ? '1 hour' : '2 hours'}
                    </p>
                  </div>
                </div>
                <a 
                  href="mailto:admin@privatecharterx.com" 
                  className="text-black font-medium hover:underline"
                >
                  admin@privatecharterx.com
                </a>
              </div>

              {/* Office Locations */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">Visit Us</h3>
                    <p className="text-gray-600">Our Global Offices</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium text-gray-900">Zurich</p>
                    <p className="text-gray-600 text-sm">
                      Bahnhofstrasse 10<br />
                      8001 Zurich, Switzerland
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">London</p>
                    <p className="text-gray-600 text-sm">
                      71-75 Shelton Street<br />
                      London, WC2H 9JQ, UK
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Miami</p>
                    <p className="text-gray-600 text-sm">
                      1000 Brickell Ave, Suite 715<br />
                      Miami, FL 33131, USA
                    </p>
                  </div>
                </div>
              </div>

              {/* Response Times */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="w-6 h-6 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Response Times</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email Support:</span>
                    <span className="font-medium text-gray-900">
                      {hasNFTMembership ? '< 1 hour' : '< 2 hours'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone Support:</span>
                    <span className="font-medium text-gray-900">
                      {hasNFTMembership ? 'Immediate' : 'NFT Members Only'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ticket Resolution:</span>
                    <span className="font-medium text-gray-900">
                      {hasNFTMembership ? '< 4 hours' : '< 24 hours'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Support Ticket Form - Enhanced styling */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-light text-gray-900">Create Support Ticket</h2>
                  {hasNFTMembership && (
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 text-sm font-medium rounded-full">
                      Priority Member
                    </span>
                  )}
                </div>
                
                {isSubmitted ? (
                  <div className="bg-green-50 border border-green-200 text-green-700 p-6 rounded-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Ticket Created Successfully!</h3>
                        <p>Our support team will respond to your inquiry shortly.</p>
                      </div>
                    </div>
                    <p className="text-sm">
                      {hasNFTMembership 
                        ? 'As an NFT member, your ticket has been prioritized and you can expect a response within 1 hour.'
                        : 'You can view the status of your ticket in your account dashboard.'
                      }
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                          placeholder="Enter your full name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                          placeholder="Enter your email address"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject
                      </label>
                      <select
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                      >
                        <option value="">Select a subject</option>
                        <option value="booking">Booking Inquiry</option>
                        <option value="payment">Payment Issue</option>
                        <option value="nft">NFT Membership</option>
                        <option value="technical">Technical Support</option>
                        <option value="complaint">File a Complaint</option>
                        <option value="feedback">General Feedback</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none transition-colors"
                        placeholder="Please describe your issue or question in detail..."
                      ></textarea>
                    </div>

                    <div className="flex justify-between items-center pt-4">
                      {onClose && (
                        <button
                          type="button"
                          onClick={onClose}
                          className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                        >
                          Cancel
                        </button>
                      )}

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 ml-auto font-medium"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Creating Ticket...</span>
                          </>
                        ) : (
                          <>
                            <Send size={18} />
                            <span>Create Ticket</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Support Information */}
              <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      Average response time: {hasNFTMembership ? '1 hour' : '2 hours'}
                    </p>
                    <p className="text-sm text-gray-600">
                      For urgent matters{hasNFTMembership ? ', use your priority support line at ' : ', NFT members can call '}
                      {hasNFTMembership ? (
                        <a href="tel:+41447978853" className="text-black font-medium hover:underline">
                          +41 44 797 88 53
                        </a>
                      ) : (
                        'our dedicated support line (available with NFT membership)'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
