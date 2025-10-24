import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, ExternalLink, Download, CheckCircle, TrendingUp,
  Shield, Users, Calendar, MapPin, Plane, FileText, AlertCircle,
  ChevronDown, ChevronUp, Star, Award, Info
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import Button from './Button';

export default function AssetDetailPage({ assetId, onBack }) {
  const { user } = useAuth();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (assetId) {
      fetchAsset();
    }
  }, [assetId]);

  const fetchAsset = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_requests')
        .select('*')
        .eq('id', assetId)
        .single();

      if (error) throw error;
      setAsset(data);
    } catch (error) {
      console.error('Error fetching asset:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <AlertCircle size={48} className="text-gray-400 mb-4" />
        <p className="text-gray-600">Asset not found</p>
        <button onClick={onBack} className="mt-4 text-black underline">Go Back</button>
      </div>
    );
  }

  const data = asset.data || {};
  const isComingSoon = asset.status === 'coming_soon';
  const isWaitlistOpen = asset.status === 'waitlist_open';
  const isLive = asset.status === 'live_on_marketplace' || asset.status === 'approved_for_sto';

  const specs = data.specifications || {};
  const features = data.features || [];
  const highlights = data.highlights || [];
  const riskFactors = data.risk_factors || [];
  const documents = data.documents || [];
  const faq = data.faq || [];
  const investmentTiers = data.investment_tiers || [];
  const images = data.images || [];

  return (
    <div className="w-full h-full overflow-y-auto bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="relative">
        {/* Back Button */}
        <Button
          onClick={onBack}
          variant="secondary"
          size="md"
          icon={<ArrowLeft size={18} />}
          className="absolute top-6 left-6 z-20 bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white"
        >
          Back
        </Button>

        {/* Main Image */}
        <div className="relative h-[500px] overflow-hidden">
          <img
            src={images[selectedImageIndex] || 'https://via.placeholder.com/1200x500'}
            alt={data.asset_name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Status Badge */}
          <div className="absolute top-6 right-6">
            {isComingSoon && (
              <div className="px-4 py-2 bg-yellow-500 text-white rounded-full font-semibold text-sm">
                Coming Soon
              </div>
            )}
            {isWaitlistOpen && (
              <div className="px-4 py-2 bg-blue-500 text-white rounded-full font-semibold text-sm">
                Waitlist Open
              </div>
            )}
            {isLive && (
              <div className="px-4 py-2 bg-green-500 text-white rounded-full font-semibold text-sm flex items-center gap-2">
                <CheckCircle size={16} />
                Live Now
              </div>
            )}
          </div>

          {/* Title Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <h1 className="text-5xl font-bold mb-2">{data.asset_name}</h1>
            <p className="text-xl text-gray-200">{data.description}</p>
          </div>
        </div>

        {/* Image Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 p-4 bg-white border-b overflow-x-auto">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImageIndex(idx)}
                className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-all ${
                  selectedImageIndex === idx ? 'border-black' : 'border-gray-200 opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="col-span-2 space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4">
              <StatCard
                label="Total Value"
                value={`$${(asset.estimated_cost || 0).toLocaleString()}`}
                icon={<TrendingUp size={20} />}
              />
              <StatCard
                label="Expected APY"
                value={`${data.estimated_apy || 0}%`}
                icon={<Award size={20} />}
              />
              <StatCard
                label="Min Investment"
                value={`$${(data.min_investment || 0).toLocaleString()}`}
                icon={<Users size={20} />}
              />
              <StatCard
                label="Total Tokens"
                value={(data.total_supply || 0).toLocaleString()}
                icon={<Star size={20} />}
              />
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex gap-6">
                {['overview', 'specifications', 'financials', 'documents', 'risks'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-4 px-2 font-semibold capitalize transition-colors ${
                      activeTab === tab
                        ? 'text-black border-b-2 border-black'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              {activeTab === 'overview' && (
                <OverviewTab highlights={highlights} features={features} data={data} />
              )}
              {activeTab === 'specifications' && (
                <SpecificationsTab specs={specs} />
              )}
              {activeTab === 'financials' && (
                <FinancialsTab data={data} />
              )}
              {activeTab === 'documents' && (
                <DocumentsTab documents={documents} />
              )}
              {activeTab === 'risks' && (
                <RisksTab riskFactors={riskFactors} />
              )}
            </div>

            {/* Investment Tiers */}
            {investmentTiers.length > 0 && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold mb-6">Investment Tiers</h2>
                <div className="grid grid-cols-3 gap-6">
                  {investmentTiers.map((tier, idx) => (
                    <TierCard key={idx} tier={tier} pricePerToken={data.price_per_token} />
                  ))}
                </div>
              </div>
            )}

            {/* FAQ */}
            {faq.length > 0 && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {faq.map((item, idx) => (
                    <FAQItem
                      key={idx}
                      question={item.question}
                      answer={item.answer}
                      isExpanded={expandedFAQ === idx}
                      onToggle={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - CTA */}
          <div className="col-span-1">
            <div className="sticky top-8 bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-2xl font-bold mb-4">
                {isComingSoon && 'Launching Soon'}
                {isWaitlistOpen && 'Join the Waitlist'}
                {isLive && 'Invest Now'}
              </h3>

              {data.launch_date && (isComingSoon || isWaitlistOpen) && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-900 mb-1">
                    <Calendar size={16} />
                    <span className="font-semibold">Launch Date</span>
                  </div>
                  <p className="text-blue-700">
                    {new Date(data.launch_date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              )}

              {data.early_access_discount && isWaitlistOpen && (
                <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 text-green-900 mb-1">
                    <Award size={16} />
                    <span className="font-semibold">Early Access Bonus</span>
                  </div>
                  <p className="text-green-700">
                    Get {data.early_access_discount}% discount by joining the waitlist
                  </p>
                </div>
              )}

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Token Price</span>
                  <span className="font-bold">${(data.price_per_token || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Minimum</span>
                  <span className="font-bold">${(data.min_investment || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Expected APY</span>
                  <span className="font-bold text-green-600">{data.estimated_apy || 0}%</span>
                </div>
              </div>

              {(isComingSoon || isWaitlistOpen) && (
                <Button
                  onClick={() => setShowWaitlistModal(true)}
                  variant="primary"
                  size="lg"
                  fullWidth
                  className="mb-4 text-lg font-bold"
                >
                  Join Waitlist
                </Button>
              )}

              {isLive && (
                <Button
                  onClick={() => {/* Navigate to marketplace */}}
                  variant="primary"
                  size="lg"
                  fullWidth
                  className="mb-4 text-lg font-bold"
                >
                  Invest Now
                </Button>
              )}

              <div className="flex items-center gap-2 text-sm text-gray-500 justify-center">
                <Shield size={16} />
                <span>SEC-Compliant Security Token</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Waitlist Modal */}
      {showWaitlistModal && (
        <WaitlistModal
          asset={asset}
          onClose={() => setShowWaitlistModal(false)}
        />
      )}
    </div>
  );
}

// Sub-components
function StatCard({ label, value, icon }) {
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex items-center gap-2 text-gray-600 mb-2">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function OverviewTab({ highlights, features, data }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-4">Investment Highlights</h3>
        <div className="grid grid-cols-2 gap-3">
          {highlights.map((highlight, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">{highlight}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold mb-4">Features & Amenities</h3>
        <div className="grid grid-cols-2 gap-2">
          {features.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-2 text-gray-700">
              <div className="w-1.5 h-1.5 bg-black rounded-full" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {data.location && (
        <div>
          <h3 className="text-xl font-bold mb-4">Location</h3>
          <div className="flex items-center gap-2 text-gray-700">
            <MapPin size={20} />
            <span>{data.location}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function SpecificationsTab({ specs }) {
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
      {Object.entries(specs).map(([key, value]) => (
        <div key={key} className="flex justify-between border-b border-gray-100 pb-2">
          <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
          <span className="font-semibold text-gray-900">{value}</span>
        </div>
      ))}
    </div>
  );
}

function FinancialsTab({ data }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold text-gray-600 mb-2">Revenue Distribution</h4>
          <p className="text-lg font-bold">{data.revenue_distribution || 'N/A'}</p>
        </div>
        <div>
          <h4 className="font-semibold text-gray-600 mb-2">Currency</h4>
          <p className="text-lg font-bold">{data.revenue_currency || 'N/A'}</p>
        </div>
        <div>
          <h4 className="font-semibold text-gray-600 mb-2">Expected Annual Revenue</h4>
          <p className="text-lg font-bold">${(data.expected_annual_revenue || 0).toLocaleString()}</p>
        </div>
        <div>
          <h4 className="font-semibold text-gray-600 mb-2">Management Fee</h4>
          <p className="text-lg font-bold">{data.management_fee || 0}%</p>
        </div>
      </div>

      {data.revenue_split && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-4">Revenue Split</h4>
          <div className="space-y-2">
            {Object.entries(data.revenue_split).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-gray-700 capitalize">{key.replace(/_/g, ' ')}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-black h-2 rounded-full"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                  <span className="font-semibold w-12 text-right">{value}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DocumentsTab({ documents }) {
  if (documents.length === 0) {
    return <p className="text-gray-500 text-center py-8">No documents available yet</p>;
  }

  return (
    <div className="space-y-3">
      {documents.map((doc, idx) => (
        <a
          key={idx}
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileText size={24} className="text-gray-600" />
            <div>
              <p className="font-semibold text-gray-900">{doc.name}</p>
              <p className="text-sm text-gray-600">{doc.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Download size={18} />
            <ExternalLink size={18} />
          </div>
        </a>
      ))}
    </div>
  );
}

function RisksTab({ riskFactors }) {
  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-2">
          <AlertCircle size={20} className="text-yellow-700 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-800">
            All investments carry risk. Please read these risk factors carefully before investing.
          </p>
        </div>
      </div>

      {riskFactors.map((risk, idx) => (
        <div key={idx} className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
          <span className="font-bold text-gray-400 text-lg">{idx + 1}</span>
          <p className="text-gray-700">{risk}</p>
        </div>
      ))}
    </div>
  );
}

function TierCard({ tier, pricePerToken }) {
  const minInvestment = tier.min_tokens * pricePerToken;
  const maxInvestment = tier.max_tokens * pricePerToken;

  return (
    <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-black transition-colors">
      <h4 className="text-xl font-bold mb-2">{tier.name}</h4>
      <p className="text-sm text-gray-600 mb-4">
        ${minInvestment.toLocaleString()} - ${maxInvestment.toLocaleString()}
      </p>
      <ul className="space-y-2">
        {tier.benefits.map((benefit, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm">
            <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FAQItem({ question, answer, isExpanded, onToggle }) {
  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-900">{question}</span>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {isExpanded && (
        <div className="px-4 pb-4 text-gray-700">
          {answer}
        </div>
      )}
    </div>
  );
}

function WaitlistModal({ asset, onClose }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    email: user?.email || '',
    name: '',
    interestedTokens: 1,
    accreditedInvestor: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Save to waitlist table (you'll need to create this)
      const { error } = await supabase
        .from('asset_waitlist')
        .insert([{
          asset_id: asset.id,
          user_id: user?.id,
          email: form.email,
          name: form.name,
          interested_tokens: form.interestedTokens,
          accredited_investor: form.accreditedInvestor,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      setSubmitted(true);
    } catch (error) {
      console.error('Error joining waitlist:', error);
      alert('Failed to join waitlist. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">You're on the list!</h2>
          <p className="text-gray-600 mb-6">
            We'll notify you when {asset.data?.asset_name} goes live. Check your email for confirmation.
          </p>
          <Button
            onClick={onClose}
            variant="primary"
            size="lg"
            fullWidth
          >
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6">Join the Waitlist</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({...form, name: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({...form, email: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interested in purchasing (tokens)
            </label>
            <input
              type="number"
              min="1"
              required
              value={form.interestedTokens}
              onChange={(e) => setForm({...form, interestedTokens: parseInt(e.target.value)})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
            <p className="text-xs text-gray-500 mt-1">
              Estimated: ${((form.interestedTokens || 0) * (asset.data?.price_per_token || 0)).toLocaleString()}
            </p>
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="accredited"
              checked={form.accreditedInvestor}
              onChange={(e) => setForm({...form, accreditedInvestor: e.target.checked})}
              className="mt-1"
            />
            <label htmlFor="accredited" className="text-sm text-gray-700">
              I am an accredited investor (required for SEC compliance)
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              size="lg"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !form.accreditedInvestor}
              variant="primary"
              size="lg"
              className="flex-1"
              loading={submitting}
            >
              {submitting ? 'Joining...' : 'Join Waitlist'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
