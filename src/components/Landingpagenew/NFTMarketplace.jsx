import React from 'react';
import { ExternalLink, Check, Shield, Crown, Sparkles, Zap, Plus, ChevronRight } from 'lucide-react';

export default function NFTMarketplace({ onCreateNFT }) {
  const nftVideoUrl = "https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/PrivateCharterX_transparent-_3_.mp4";
  const openSeaUrl = "https://opensea.io"; // Replace with actual OpenSea collection URL

  // PrivateCharterX NFT Data
  const nft = {
    name: "PrivateCharterX Membership 001-100",
    collection: "PrivateCharterX Official",
    description: "Exclusive membership NFT with lifetime aviation benefits and VIP privileges",
    supply: 100,
    minted: 47,
    network: "Ethereum",
    price: "0.5 ETH",
    category: "Utility Token"
  };

  return (
    <div className="w-full h-full overflow-y-auto p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-light text-gray-900 mb-2">NFT Marketplace</h1>
          <p className="text-gray-600">Exclusive digital collectibles with real-world utility</p>
        </div>

        {/* NFT Grid - matching My SPVs layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* PrivateCharterX NFT Card */}
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center">
                <Shield size={28} className="text-white" />
              </div>
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-gray-200 text-gray-900 rounded-md text-[10px] font-medium">ERC-721</span>
                <span className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black rounded-md text-[10px] font-bold">Limited</span>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">{nft.name}</h3>
            <p className="text-sm text-gray-700 mb-6 leading-relaxed">
              {nft.description}
            </p>

            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-xs text-gray-700">
                <Check size={14} className="text-gray-900" />
                <span>1 Free Empty Leg</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-700">
                <Check size={14} className="text-gray-900" />
                <span>10% Booking Discount</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-700">
                <Check size={14} className="text-gray-900" />
                <span>Free Airport Transfer</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-700">
                <Check size={14} className="text-gray-900" />
                <span>24/7 Support</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-700">
                <Check size={14} className="text-gray-900" />
                <span>Tradable at Anytime</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-700">
                <Check size={14} className="text-gray-900" />
                <span>And more...</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-300/50 mb-6">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="text-xs text-gray-600 mb-0.5">Supply</div>
                  <div className="text-sm font-medium text-gray-900">{nft.supply}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-0.5">Minted</div>
                  <div className="text-sm font-medium text-gray-900">{nft.minted}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-0.5">Price</div>
                  <div className="text-sm font-medium text-gray-900">{nft.price}</div>
                </div>
              </div>
            </div>

            <a
              href={openSeaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 text-gray-900 hover:text-black transition-colors"
            >
              <span className="text-sm font-medium">View on OpenSea</span>
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {/* Create New NFT Button */}
          <button
            onClick={onCreateNFT}
            className="bg-white/60 backdrop-blur-xl border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-gray-400 hover:bg-white/80 transition-all flex flex-col items-center justify-center min-h-[200px] group"
          >
            <div className="w-12 h-12 bg-gray-100 group-hover:bg-gray-200 rounded-lg flex items-center justify-center mb-3 transition-colors">
              <Plus size={24} className="text-gray-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">Create your NFT</p>
            <p className="text-xs text-gray-500 mt-1">(Utility Token)</p>
          </button>
        </div>
      </div>
    </div>
  );
}
