import React from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';

interface NFTManagementProps {
  onBack: () => void;
  nfts: NFT[];
}

interface NFT {
  id: string;
  title: string;
  imageUrl: string;
  flightNumber: string;
  date: string;
  openseaUrl: string;
}

export default function NFTManagement({ onBack, nfts }: NFTManagementProps) {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h2 className="text-xl font-bold">NFT Collection</h2>
          <p className="text-sm text-gray-500">Manage your flight NFTs</p>
        </div>
      </div>

      {/* NFT Grid */}
      <div className="grid grid-cols-2 gap-4">
        {nfts.map((nft) => (
          <div key={nft.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
            <div className="relative h-32">
              <img 
                src={nft.imageUrl}
                alt={nft.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-3">
              <h3 className="font-medium text-sm mb-1 line-clamp-1">{nft.title}</h3>
              <div className="text-xs text-gray-500 mb-2">
                Flight {nft.flightNumber} • {new Date(nft.date).toLocaleDateString()}
              </div>
              <a
                href={nft.openseaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-colors text-xs font-medium"
              >
                View on OpenSea
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
