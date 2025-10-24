'use client';

import React, { useState } from 'react';
import {
  X, Leaf, CheckCircle, AlertCircle, Heart, Droplets, TreePine,
  Calculator, ChevronRight, Check, Save, Clock3, User, Wallet, Upload, Trash2, ExternalLink
} from 'lucide-react';
import { airportsStaticService as airportsService, type AirportSearchResult } from '../../services/airportsStaticService';
import { FileUploadService, type UploadedFile, type UploadProgress } from '../../services/fileUploadService';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

// Interfaces
interface CO2CertificateRequest {
  departureAirport: string;
  destinationAirport: string;
  flightDate: string;
  aircraftType: string;
  tailNumber: string;
  passengers: string;
  flightDuration: string;
  aircraftWeight?: string;
  certificateType: string;
  offsetPercentage: string;
  rushProcessing: boolean;
  certificateFormat: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  billingAddress: string;
  taxId: string;
  paymentMethod: string;
  specialInstructions: string;
  agreedToTerms: boolean;
  receiverWallet: string;
  blockchainChain: string;
}


interface Certificate {
  id: string;
  route: string;
  aircraft: string;
  emissions: string;
  date: string;
  nftId: string;
  status: 'retired';
  projectName: string;
  clientName: string;
}

interface FAQ {
  id: number;
  question: string;
  answer: string;
}

// Sample data
const featuredCertificates: Certificate[] = [
  {
    id: '1',
    route: 'TETERBORO → ASPEN',
    aircraft: 'Gulfstream G650',
    emissions: '4.2 tCO₂',
    date: '2024-01-15',
    nftId: 'PJC001',
    status: 'retired',
    projectName: 'Rainforest Protection Initiative',
    clientName: 'Private Client'
  },
  {
    id: '2',
    route: 'VAN NUYS → JACKSON HOLE',
    aircraft: 'Bombardier Global 7500',
    emissions: '3.8 tCO₂',
    date: '2024-01-20',
    nftId: 'PJC002',
    status: 'retired',
    projectName: 'Wind Farm Development',
    clientName: 'Private Client'
  },
  {
    id: '3',
    route: 'NICE → GENEVA',
    aircraft: 'Citation X+',
    emissions: '1.2 tCO₂',
    date: '2024-01-22',
    nftId: 'PJC003',
    status: 'retired',
    projectName: 'Solar Energy Initiative',
    clientName: 'Private Client'
  }
];

const aircraftTypes = [
  { category: 'Very Light Jet', emissions: 0.8, costPerHour: 64 },
  { category: 'Light Jet', emissions: 1.2, costPerHour: 96 },
  { category: 'Mid-Size Jet', emissions: 1.8, costPerHour: 144 },
  { category: 'Super Mid-Size', emissions: 2.2, costPerHour: 176 },
  { category: 'Heavy Jet', emissions: 3.1, costPerHour: 248 },
  { category: 'Ultra Long Range', emissions: 3.8, costPerHour: 304 }
];

const faqData: FAQ[] = [
  {
    id: 1,
    question: 'How do you calculate emissions for private jets?',
    answer: 'We use flight-specific calculations based on aircraft type, route, weight, and flight conditions. A private jet produces, on average, between 1.5 and 4 tonnes of CO₂ per flight hour depending on these factors. This provides much more accurate results than standardized rates.'
  },
  {
    id: 2,
    question: 'What makes your certificates different from others?',
    answer: 'We focus exclusively on high-quality voluntary CO₂ certificates from licensed NGOs that fund real environmental projects with measurable climate benefits. Each certificate includes blockchain verification as an NFT for complete transparency and is permanently retired to prevent resale.'
  },
  {
    id: 3,
    question: 'How do you prevent greenwashing?',
    answer: 'True offsetting is based on recognised standards like VCS and Gold Standard, clear project documentation, and pricing that reflects real costs of effective climate protection. We avoid unrealistically low prices, ensure transparency about underlying projects, and provide verifiable blockchain records.'
  },
  {
    id: 4,
    question: 'What is blockchain verification?',
    answer: 'Blockchain makes our offsetting tamper-proof. Each certificate receives a unique digital fingerprint stored as an NFT – immutable and verifiable at any time. This ensures complete transparency, traceability, and prevents double-counting of the same offset.'
  },
  {
    id: 5,
    question: 'Who is responsible for purchasing offset certificates?',
    answer: 'From a legal standpoint, the responsibility for CO₂ emissions lies with the person who orders the flight – not the aircraft operator or broker. If you choose to fly private, you also choose to take responsibility for its environmental impact.'
  },
  {
    id: 6,
    question: 'How long does the certificate process take?',
    answer: 'Standard processing takes 2-5 business days for personalized certificates with your name, flight details, and exact CO₂ figure. Rush processing (24 hours) is available for an additional fee. All certificates are officially verified before issuance.'
  }
];

const AirportSelector: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}> = ({ value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [airports, setAirports] = useState<AirportSearchResult[]>([]);

  React.useEffect(() => {
    const searchAirports = async () => {
      if (searchTerm.length >= 2) {
        const results = await airportsService.searchAirports(searchTerm, 10);
        setAirports(results);
      } else {
        setAirports([]);
      }
    };

    searchAirports();
  }, [searchTerm]);

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
        placeholder={placeholder}
      />
      {isOpen && airports.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {airports.map((airport) => (
            <button
              key={airport.code}
              onMouseDown={() => {
                onChange(`${airport.code} - ${airport.name}`);
                setIsOpen(false);
                setSearchTerm('');
              }}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-gray-900 text-sm">{airport.code}</div>
              <div className="text-xs text-gray-600">{airport.name}</div>
              <div className="text-xs text-gray-500">{airport.city}, {airport.country}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const DocumentUpload: React.FC<{
  label: string;
  description: string;
  documentType: string;
  onUpload: (document: UploadedFile) => void;
  uploadedDocument?: UploadedFile;
  onRemove: () => void;
  userId?: string;
}> = ({ label, description, documentType, onUpload, uploadedDocument, onRemove, userId }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploadError, setUploadError] = useState('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    setIsUploading(true);
    setUploadError('');
    setUploadProgress(null);

    try {
      const uploadedFile = await FileUploadService.uploadFile(
        file,
        userId,
        {
          bucket: 'securedocuments',
          folder: 'co2-documents',
          onProgress: setUploadProgress
        }
      );

      // Save metadata
      await FileUploadService.saveFileMetadata(
        uploadedFile,
        userId,
        'other',
        { documentType: 'co2_document' }
      );

      onUpload(uploadedFile);
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(null), 2000);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3">
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}
      </label>
      <p className="text-xs text-gray-500 mb-2">{description}</p>

      {uploadError && (
        <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="text-red-600" />
            <span className="text-red-800 text-xs">{uploadError}</span>
          </div>
        </div>
      )}
      
      {uploadedDocument ? (
        <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-lg">{FileUploadService.getFileIcon(uploadedDocument.fileType)}</span>
            <div>
              <p className="text-xs font-medium text-gray-900">{uploadedDocument.fileName}</p>
              <p className="text-xs text-gray-500">
                {FileUploadService.formatFileSize(uploadedDocument.fileSize)} • {new Date(uploadedDocument.uploadedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button
            onClick={onRemove}
            className="text-red-500 hover:text-red-700 p-1"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="file"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-gray-400 transition-colors">
            {isUploading ? (
              <div className="flex flex-col items-center gap-1">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                <p className="text-xs text-gray-600">Uploading...</p>
                {uploadProgress && (
                  <div className="w-full max-w-xs">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>{uploadProgress.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-black h-1 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Upload className="text-gray-400" size={16} />
                <p className="text-xs text-gray-600">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500">PDF, DOC, JPG, PNG (MAX. 300MB)</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const CertificateOverview: React.FC<{
  onShowCO2Form: () => void;
  certificates: Certificate[];
  faqData: FAQ[];
  expandedFaq: number | null;
  onSetExpandedFaq: (id: number | null) => void;
}> = ({ onShowCO2Form, certificates, faqData, expandedFaq, onSetExpandedFaq }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-3xl md:text-4xl font-light text-gray-900 text-center mb-4 tracking-tighter">
          Professional carbon offsetting solutions for private aviation with blockchain verification
        </h1>
        <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto font-light">
          Get verified certificates using flight-specific calculations and blockchain verification for complete transparency.
          High-quality voluntary certificates from licensed NGOs with measurable climate benefits.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
        <button
          onClick={onShowCO2Form}
          className="bg-black text-white px-8 py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium flex items-center justify-center gap-2"
        >
          Get CO₂ Certificate
        </button>
        <a
          href="mailto:bookings@privatecharterx.com"
          className="bg-gray-100 text-gray-700 px-8 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
        >
          Email Operations Team
        </a>
      </div>

      {/* Details toggle */}
      <div className="text-center mb-16">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center justify-center gap-2 mx-auto text-gray-600 hover:text-gray-800 transition-colors"
        >
          <span className="text-sm">Show details</span>
          <ChevronRight
            className={`transition-transform ${showDetails ? 'rotate-90' : ''}`}
            size={16}
          />
        </button>
        {showDetails && (
          <div className="mt-6 p-6 bg-white rounded-2xl border border-gray-100 text-left shadow-sm max-w-2xl mx-auto">
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center">
                <Check size={16} className="text-green-600 mr-3" />
                Flight-specific calculations based on aircraft type, route, and conditions
              </div>
              <div className="flex items-center">
                <Check size={16} className="text-green-600 mr-3" />
                High-quality voluntary certificates from licensed NGOs
              </div>
              <div className="flex items-center">
                <Check size={16} className="text-green-600 mr-3" />
                Blockchain verification with NFT storage for transparency
              </div>
              <div className="flex items-center">
                <Check size={16} className="text-green-600 mr-3" />
                Personalized certificates with flight details
              </div>
              <div className="flex items-center">
                <Check size={16} className="text-green-600 mr-3" />
                Permanent retirement - certificates cannot be resold
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Certificate Cards Carousel */}
      <div className="mb-20">
        <div className="relative overflow-hidden">
          <style dangerouslySetInnerHTML={{
            __html: `
              @keyframes scroll {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
              .animate-scroll {
                animation: scroll 30s linear infinite;
              }
              .animate-scroll:hover {
                animation-play-state: paused;
              }
              .carousel-container {
                position: relative;
              }
              .carousel-container::before,
              .carousel-container::after {
                content: '';
                position: absolute;
                top: 0;
                bottom: 0;
                width: 100px;
                z-index: 10;
                pointer-events: none;
              }
              .carousel-container::before {
                left: 0;
                background: linear-gradient(to right, rgba(249, 250, 251, 1), rgba(249, 250, 251, 0));
              }
              .carousel-container::after {
                right: 0;
                background: linear-gradient(to left, rgba(249, 250, 251, 1), rgba(249, 250, 251, 0));
              }
            `
          }} />
          <div className="carousel-container">
            <div className="flex gap-6 animate-scroll">
              {[...certificates, ...certificates].map((cert, index) => (
                <div key={`${cert.id}-${index}`} className="flex-shrink-0 w-80 bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-sm text-gray-500 font-mono">#{cert.nftId}</span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      RETIRED
                    </span>
                  </div>
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-900 mb-2 text-lg">{cert.route}</h3>
                    <p className="text-sm text-gray-600 mb-1">{cert.aircraft}</p>
                    <p className="text-xs text-gray-500">{cert.clientName}</p>
                  </div>
                  <div className="space-y-3 text-sm mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Emissions Offset:</span>
                      <span className="font-medium text-green-600">{cert.emissions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Project:</span>
                      <span className="font-medium text-xs">{cert.projectName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Issued:</span>
                      <span className="font-medium">{cert.date}</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-600">Certificate permanently retired</p>
                    <p className="text-xs text-gray-500">Verified carbon offset completed</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ISO14083 Information Section */}
      <div className="bg-blue-50 rounded-2xl border border-blue-200 overflow-hidden mb-20">
        <div className="p-8 border-b border-blue-200">
          <h2 className="text-2xl font-light text-blue-900 mb-2">ISO 14083 Compliant Calculations</h2>
          <p className="text-blue-700 font-light">International standard for quantifying GHG emissions from transport operations</p>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <p className="text-blue-800 leading-relaxed">
                Our emission calculations follow the ISO 14083 standard for quantifying and reporting greenhouse gas emissions from transport operations. This ensures consistent, accurate, and internationally recognized methodologies for your carbon footprint assessment.
              </p>
              <div className="space-y-2">
                <div className="flex items-start">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-blue-700 text-sm"><strong>Standardized methodology</strong> – Following international ISO 14083 guidelines</p>
                </div>
                <div className="flex items-start">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-blue-700 text-sm"><strong>Accurate reporting</strong> – Consistent calculation methods across all flight types</p>
                </div>
                <div className="flex items-start">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-blue-700 text-sm"><strong>Global recognition</strong> – Internationally accepted standard for transport emissions</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-3">Learn More About ISO 14083</h4>
              <p className="text-blue-700 leading-relaxed mb-4 text-sm">
                Discover how our ISO 14083 compliant methodology ensures the highest accuracy in aviation emission calculations and supports your ESG reporting requirements.
              </p>
              <a
                href="https://www.privatecharterx.blog/iso-14083-standard-complete-guide/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Read More About ISO 14083
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-20">
        <div className="p-8 border-b border-gray-100">
          <h2 className="text-2xl font-light text-black mb-2">Responsible Flying as the New Standard</h2>
          <p className="text-gray-500 font-light">Understanding the environmental impact and taking responsibility</p>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-black mb-3">Understanding the Reality</h3>
                <p className="text-gray-600 leading-relaxed mb-3">
                  A private jet produces, on average, between 1.5 and 4 tonnes of CO₂ per flight hour – depending on aircraft type, route length, and passenger load. For comparison: the average German citizen generates around 11 tonnes of CO₂ per year.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  Transparency is the first step toward informed, responsible decision-making. Only when the real impact is known can effective offsetting measures be taken.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-black mb-3">Our Approach</h3>
                <div className="space-y-2">
                  <div className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <p className="text-gray-600 text-sm"><strong>Flight-specific calculation</strong> – precise CO₂ output based on aircraft type, route, weight, and flight conditions</p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <p className="text-gray-600 text-sm"><strong>Personalized certificate</strong> – with your name, flight details, and exact CO₂ figure</p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <p className="text-gray-600 text-sm"><strong>Official offsetting</strong> – purchase of certificates from recognised NGOs and climate organisations</p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <p className="text-gray-600 text-sm"><strong>Blockchain verification</strong> – storage as an NFT for complete transparency and tamper-proof security</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="font-medium text-gray-900 mb-3">Quality Standards</h4>
                <p className="text-gray-600 leading-relaxed mb-4 text-sm">
                  We focus exclusively on high-quality voluntary CO₂ certificates that fund real environmental projects and deliver measurable climate benefits.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    VCS Verified
                  </span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    Gold Standard
                  </span>
                  <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                    Licensed NGOs Only
                  </span>
                </div>
              </div>
              <div className="bg-gray-100 rounded-xl p-6">
                <h4 className="font-medium text-gray-900 mb-3">Blockchain Verification</h4>
                <p className="text-gray-600 leading-relaxed text-sm">
                  Each certificate receives a unique digital fingerprint – immutable and verifiable at any time. Every certificate is permanently retired and cannot be resold.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Emission Rates Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-20">
        <div className="p-8 border-b border-gray-100">
          <h2 className="text-2xl font-light text-black mb-2">Standardized Emission Rates</h2>
          <p className="text-gray-500 font-light">Aircraft categories and offset pricing</p>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {aircraftTypes.map((aircraft, index) => (
              <div key={index} className="flex items-center justify-between p-6 border-b border-gray-50 last:border-b-0 hover:bg-gray-25 transition-colors">
                <div className="flex-1">
                  <h3 className="font-medium text-black mb-1">{aircraft.category}</h3>
                </div>
                <div className="flex items-center gap-8 text-sm">
                  <div className="text-center">
                    <div className="font-medium text-black">{aircraft.emissions}t CO₂/h</div>
                    <div className="text-xs text-gray-400">Emissions</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-black">€{aircraft.costPerHour}/h</div>
                    <div className="text-xs text-gray-400">Offset Cost</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
        {faqData.map((faq) => (
          <button
            key={faq.id}
            onClick={() => onSetExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
            className="bg-white rounded-2xl border border-gray-100 hover:shadow-sm transition-all duration-300 p-6 text-left group"
          >
            <h3 className="text-lg font-medium text-black mb-2 group-hover:text-gray-700 transition-colors">
              {faq.question}
            </h3>
            {expandedFaq === faq.id ? (
              <p className="text-sm text-gray-600 font-light leading-relaxed">
                {faq.answer}
              </p>
            ) : (
              <div className="mt-4 text-sm text-black font-light flex items-center gap-1 group-hover:gap-2 transition-all">
                View answer <ChevronRight size={14} />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

const CO2CertificateForm: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isDraft, setIsDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, UploadedFile>>({});

  const [formData, setFormData] = useState<CO2CertificateRequest>({
    departureAirport: '',
    destinationAirport: '',
    flightDate: '',
    aircraftType: '',
    tailNumber: '',
    passengers: '',
    flightDuration: '',
    certificateType: 'standard',
    offsetPercentage: '100',
    rushProcessing: false,
    certificateFormat: 'pdf',
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    billingAddress: '',
    taxId: '',
    paymentMethod: 'card',
    specialInstructions: '',
    agreedToTerms: false,
    receiverWallet: '',
    blockchainChain: 'ethereum'
  });

  const updateField = (field: keyof CO2CertificateRequest, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDraft(true);
  };

  const nextStep = () => currentStep < 4 && setCurrentStep(currentStep + 1);
  const prevStep = () => currentStep > 1 && setCurrentStep(currentStep - 1);

  const saveDraft = () => {
    const draftData = {
      ...formData,
      savedAt: new Date().toISOString(),
      draftId: `DRAFT-${Date.now()}`
    };
    console.log('Draft saved:', draftData);
    setIsDraft(false);
    alert('Draft saved successfully!');
  };

  const calculateEmissions = () => {
    const selectedAircraft = aircraftTypes.find(aircraft => aircraft.category === formData.aircraftType);
    const duration = parseFloat(formData.flightDuration) || 0;
    if (selectedAircraft && duration > 0) {
      const baseEmissions = selectedAircraft.emissions * duration;
      const offsetMultiplier = parseInt(formData.offsetPercentage) / 100;
      const totalEmissions = baseEmissions * offsetMultiplier;
      const baseCost = selectedAircraft.costPerHour * duration;
      const totalCost = baseCost * offsetMultiplier;
      return {
        emissions: totalEmissions.toFixed(1),
        cost: Math.round(totalCost)
      };
    }
    return { emissions: '0.0', cost: 0 };
  };

  const handleDocumentUpload = (documentType: string, document: UploadedFile) => {
    setUploadedDocuments(prev => ({
      ...prev,
      [documentType]: document
    }));
  };

  const handleDocumentRemove = async (documentType: string) => {
    const document = uploadedDocuments[documentType];
    if (document && user?.id) {
      try {
        await FileUploadService.deleteFile(
          document.filePath,
          'securedocuments',
          user.id,
          document.publicUrl
        );
      } catch (error) {
        console.error('Error removing document:', error);
      }
    }
    
    setUploadedDocuments(prev => {
      const newDocs = { ...prev };
      delete newDocs[documentType];
      return newDocs;
    });
  };

  const submitRequest = async () => {
    if (!formData.agreedToTerms) {
      alert('Please agree to the terms and conditions to continue.');
      return;
    }

    if (!user?.id) {
      alert('Please log in to submit your request.');
      return;
    }

    setIsSubmitting(true);

    try {
      const emissions = calculateEmissions();
      let totalCost = emissions.cost;
      if (formData.rushProcessing) totalCost += 100;
      if (formData.certificateFormat === 'physical') totalCost += 50;

      // Extract airport codes from the selected values
      const departureCode = formData.departureAirport.split(' - ')[0];
      const destinationCode = formData.destinationAirport.split(' - ')[0];

      // Create request data
      const requestData = {
        user_id: user.id,
        request_id: `CO2-${Date.now()}`,
        contact_email: formData.email,
        service_type: 'carbon_offset_certificate',
        origin: departureCode,
        destination: destinationCode,
        first_flight_date: formData.flightDate,
        aircraft_type: formData.aircraftType,
        passenger_count: parseInt(formData.passengers) || 1,
        total_emissions_kg: Math.round(parseFloat(emissions.emissions) * 1000), // Convert tons to kg
        certification_type: formData.certificateType,
        carbon_offset_cost: totalCost,
        total_cost: totalCost,
        urgency: formData.rushProcessing ? 'rush' : 'standard',
        wants_blockchain_nft: formData.certificateFormat === 'digital',
        wants_email_pdf: true,
        company_name: formData.companyName,
        wallet_address: formData.receiverWallet,
        status: 'pending',
        metadata: {
          form_data: formData,
          uploaded_documents: Object.keys(uploadedDocuments),
          calculated_emissions: emissions,
          submission_timestamp: new Date().toISOString()
        }
      };

      // Submit to database
      const { data, error } = await supabase
        .from('co2_certificate_requests')
        .insert([requestData])
        .select()
        .single();

      if (error) throw error;

      const requestId = data.request_id;

      alert(`Certificate request submitted successfully!\nRequest ID: ${requestId}\n\nEstimated Emissions: ${emissions.emissions} tCO₂\nEstimated Cost: €${totalCost}\nProcessing Time: ${formData.rushProcessing ? '24 hours' : '2-5 business days'}\n\nYou'll receive a confirmation email shortly.`);
      
      onBack();
    } catch (error: any) {
      console.error('Error submitting request:', error);
      alert(`Failed to submit request: ${error.message}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium text-black mb-1">Flight Information</h2>
              <p className="text-gray-500 text-xs">Enter your flight details for emission calculation</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Departure Airport <span className="text-red-500">*</span>
                </label>
                <AirportSelector
                  value={formData.departureAirport}
                  onChange={(value) => updateField('departureAirport', value)}
                  placeholder="Search by code or name..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Destination Airport <span className="text-red-500">*</span>
                </label>
                <AirportSelector
                  value={formData.destinationAirport}
                  onChange={(value) => updateField('destinationAirport', value)}
                  placeholder="Search by code or name..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Flight Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.flightDate}
                  onChange={(e) => updateField('flightDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Aircraft Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.aircraftType}
                  onChange={(e) => updateField('aircraftType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                >
                  <option value="">Select aircraft category</option>
                  {aircraftTypes.map((type) => (
                    <option key={type.category} value={type.category}>
                      {type.category} ({type.emissions}t CO₂/h)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Flight Duration (hours) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.flightDuration}
                  onChange={(e) => updateField('flightDuration', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                  placeholder="2.5"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Number of Passengers <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.passengers}
                  onChange={(e) => updateField('passengers', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                  placeholder="4"
                  min="1"
                  max="19"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Aircraft Weight (kg) - Optional
              </label>
              <input
                type="number"
                value={formData.aircraftWeight || ''}
                onChange={(e) => updateField('aircraftWeight', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                placeholder="5000"
              />
              <p className="text-xs text-gray-500 mt-1">Helps improve calculation accuracy</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Tail Number (Optional)
              </label>
              <input
                type="text"
                value={formData.tailNumber}
                onChange={(e) => updateField('tailNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                placeholder="N123AB"
              />
              <p className="text-xs text-gray-500 mt-1">Will appear on your personalized certificate</p>
            </div>
            {formData.aircraftType && formData.flightDuration && (
              <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start">
                  <Calculator className="text-blue-600 mr-2 mt-1" size={16} />
                  <div>
                    <p className="text-xs font-medium text-blue-800 mb-1">Flight-Specific Calculation</p>
                    <p className="text-sm font-bold text-blue-900 mb-1">
                      {calculateEmissions().emissions} tCO₂ • €{calculateEmissions().cost} offset cost
                    </p>
                    <p className="text-xs text-blue-700">
                      Calculation based on aircraft type, route, and flight conditions for maximum accuracy
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start">
                <AlertCircle className="text-yellow-600 mr-2 mt-1" size={16} />
                <div>
                  <p className="text-xs font-medium text-yellow-800 mb-1">Responsibility Notice</p>
                  <p className="text-xs text-yellow-700">
                    The responsibility for CO₂ emissions lies with the person who orders the flight. By choosing private aviation, you also choose to take responsibility for its environmental impact.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium text-black mb-1">Certificate Details</h2>
              <p className="text-gray-500 text-xs">Customize your carbon offset certificate</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Certificate Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <button
                  onClick={() => updateField('certificateType', 'standard')}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${formData.certificateType === 'standard'
                    ? 'border-black bg-gray-50'
                    : 'border-gray-200 hover:border-gray-400'
                    }`}
                >
                  <div className="font-medium text-black text-xs mb-1">Standard Certificate</div>
                  <div className="text-xs text-gray-600 mb-1">Professional PDF certificate with verification details</div>
                  <div className="text-xs text-gray-500">Includes personalized certificate with your name and flight details</div>
                </button>
                <button
                  onClick={() => updateField('certificateType', 'premium')}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${formData.certificateType === 'premium'
                    ? 'border-black bg-gray-50'
                    : 'border-gray-200 hover:border-gray-400'
                    }`}
                >
                  <div className="font-medium text-black text-xs mb-1">Premium Certificate</div>
                  <div className="text-xs text-gray-600 mb-1">Enhanced design with blockchain NFT verification</div>
                  <div className="text-xs text-gray-500">Immutable digital fingerprint stored on blockchain for transparency</div>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Offset Percentage <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.offsetPercentage}
                  onChange={(e) => updateField('offsetPercentage', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                >
                  <option value="100">100% - Full Offset</option>
                  <option value="110">110% - Carbon Positive</option>
                  <option value="120">120% - Premium Offset</option>
                  <option value="150">150% - Maximum Impact</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Certificate Format</label>
                <select
                  value={formData.certificateFormat}
                  onChange={(e) => updateField('certificateFormat', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                >
                  <option value="pdf">PDF Certificate</option>
                  <option value="digital">Digital Certificate + NFT</option>
                  <option value="physical">Physical Certificate (+€50)</option>
                </select>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={formData.rushProcessing}
                  onChange={(e) => updateField('rushProcessing', e.target.checked)}
                  className="mr-2 h-4 w-4 accent-black mt-0.5"
                />
                <div>
                  <span className="text-xs font-medium text-gray-900">Rush Processing (+€100)</span>
                  <div className="text-xs text-gray-600 mt-1">24-hour delivery instead of standard 2-5 business days</div>
                </div>
              </label>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium text-black mb-1">Documentation</h2>
              <p className="text-gray-500 text-xs">Upload supporting documents (optional but recommended)</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start">
                <AlertCircle className="text-blue-600 mr-2 mt-1" size={16} />
                <div>
                  <p className="text-xs font-medium text-blue-800 mb-1">Enhanced Accuracy with Documentation</p>
                  <p className="text-xs text-blue-700 mb-1">
                    While not required, supporting documents help us provide flight-specific calculations rather than estimates. This ensures maximum precision in CO₂ calculations.
                  </p>
                  <p className="text-xs text-blue-600 font-medium">
                    Documents from licensed operators and NGOs ensure genuine additionality and measurable environmental benefits.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <DocumentUpload
                label="Flight Plan"
                description="Official flight plan documentation"
                documentType="flight_plan"
                onUpload={(doc) => handleDocumentUpload('flight_plan', doc)}
                uploadedDocument={uploadedDocuments.flight_plan}
                onRemove={() => handleDocumentRemove('flight_plan')}
                userId={user?.id}
              />
              <DocumentUpload
                label="Fuel Receipts"
                description="Actual fuel consumption records"
                documentType="fuel_receipts"
                onUpload={(doc) => handleDocumentUpload('fuel_receipts', doc)}
                uploadedDocument={uploadedDocuments.fuel_receipts}
                onRemove={() => handleDocumentRemove('fuel_receipts')}
                userId={user?.id}
              />
              <DocumentUpload
                label="Flight Logs"
                description="Pilot or operator flight logs"
                documentType="flight_logs"
                onUpload={(doc) => handleDocumentUpload('flight_logs', doc)}
                uploadedDocument={uploadedDocuments.flight_logs}
                onRemove={() => handleDocumentRemove('flight_logs')}
                userId={user?.id}
              />
              <DocumentUpload
                label="Additional Documents"
                description="Any other relevant documentation"
                documentType="additional_docs"
                onUpload={(doc) => handleDocumentUpload('additional_docs', doc)}
                uploadedDocument={uploadedDocuments.additional_docs}
                onRemove={() => handleDocumentRemove('additional_docs')}
                userId={user?.id}
              />
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-start">
                <CheckCircle className="text-green-600 mr-2 mt-1" size={16} />
                <div>
                  <p className="text-xs font-medium text-green-800 mb-1">Enhanced Accuracy</p>
                  <p className="text-xs text-green-700">
                    Providing fuel receipts or flight logs allows us to use actual fuel consumption data for maximum precision.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium text-black mb-1">Billing Information</h2>
              <p className="text-gray-500 text-xs">Complete your order and review details</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => updateField('companyName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                  placeholder="Your Company Name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Contact Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => updateField('contactName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                  placeholder="john@company.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Billing Address <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.billingAddress}
                onChange={(e) => updateField('billingAddress', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                placeholder="123 Main Street, City, State, ZIP, Country"
              />
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Order Summary</h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Route:</span>
                  <span className="font-medium">{formData.departureAirport || 'Not specified'} → {formData.destinationAirport || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Aircraft Category:</span>
                  <span className="font-medium">{formData.aircraftType || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Flight Duration:</span>
                  <span className="font-medium">{formData.flightDuration || '0'} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Emissions:</span>
                  <span className="font-medium text-red-600">{calculateEmissions().emissions} tCO₂</span>
                </div>
                {Object.keys(uploadedDocuments).length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Documents Uploaded:</span>
                    <span className="font-medium">{Object.keys(uploadedDocuments).length}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-gray-200">
                  <span>Estimated Total:</span>
                  <span className="text-blue-600">
                    €{(() => {
                      let base = calculateEmissions().cost;
                      if (formData.rushProcessing) base += 100;
                      if (formData.certificateFormat === 'physical') base += 50;
                      return base;
                    })()}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  checked={formData.agreedToTerms}
                  onChange={(e) => updateField('agreedToTerms', e.target.checked)}
                  className="mr-2 h-4 w-4 accent-black mt-0.5"
                />
                <div className="text-xs text-gray-700">
                  I agree to the <a href="#" className="text-black hover:underline font-medium">Terms and Conditions</a> and
                  <a href="#" className="text-black hover:underline font-medium"> Privacy Policy</a>. I understand that
                  carbon offset certificates are permanently retired and cannot be resold. I acknowledge my responsibility
                  as the flight purchaser for the environmental impact and commit to genuine climate protection through verified offsetting.
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="bg-gray-50 p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-lg font-light text-gray-900 mb-1">CO₂ Certificate Request</h1>
              <p className="text-gray-500 text-xs">Step {currentStep} of 4</p>
            </div>
            <div className="flex items-center gap-2">
              {isDraft && (
                <button
                  onClick={saveDraft}
                  className="flex items-center gap-1 px-3 py-1 text-xs bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  <Save size={12} />
                  Save Draft
                </button>
              )}
              <button
                onClick={onBack}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Flight Details</span>
              <span>Certificate</span>
              <span>Documentation</span>
              <span>Review & Pay</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div
                className="bg-black h-1 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="min-h-[300px] relative overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${(currentStep - 1) * 100}%)` }}
            >
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="w-full flex-shrink-0 pr-4 last:pr-0">
                  {currentStep === step && renderStep()}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-between p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs"
          >
            Previous
          </button>
          {currentStep < 4 ? (
            <button
              onClick={nextStep}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-xs"
            >
              Next Step
            </button>
          ) : (
            <button
              onClick={submitRequest}
              disabled={!formData.agreedToTerms || isSubmitting}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                'Submit Request'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const CarbonCertificates: React.FC = () => {
  const [currentView, setCurrentView] = useState<'overview' | 'co2_form'>('overview');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* Main Content */}
      <main className="flex-1 pt-[88px]">
        {currentView === 'co2_form' ? (
          <CO2CertificateForm onBack={() => setCurrentView('overview')} />
        ) : (
          <CertificateOverview
            onShowCO2Form={() => setCurrentView('co2_form')}
            certificates={featuredCertificates}
            faqData={faqData}
            expandedFaq={expandedFaq}
            onSetExpandedFaq={setExpandedFaq}
          />
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default CarbonCertificates;
