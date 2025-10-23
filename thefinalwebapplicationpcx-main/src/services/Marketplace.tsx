import React, { useState, useEffect } from 'react';
import { 
  Search, Grid, List, Globe, Shield, X, Wallet, CreditCard,
  ShoppingCart, Plus, Minus, Send, Info, ChevronLeft, ChevronRight,
  MapPin, Clock, Users, Check, ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoginModal from '../components/LoginModal';
import Header from '../components/Header';
import Footer from '../components/Footer';

// CO2 Certificate Project Interface
interface CO2Project {
  id: string;
  projectId: string;
  name: string;
  description: string;
  location: string;
  country: string;
  continent: string;
  category: 'reforestation' | 'renewable-energy' | 'methane-capture' | 'clean-water' | 'sustainable-agriculture' | 'blue-carbon' | 'direct-air-capture' | 'biochar';
  ngoName: string;
  verified: boolean;
  certificationStandard: string;
  pricePerTon: number;
  minPurchase: number;
  maxPurchase: number;
  availableTons: number;
  totalOffset: number;
  image: string;
  benefits: string[];
  methodology: string;
  projectStart: string;
  projectEnd: string;
  additionalInfo: {
    sdgGoals: number[];
    biodiversityImpact: string;
    communityBenefit: string;
    technologyUsed: string;
  };
  coordinates: {
    lat: number;
    lng: number;
  };
}

// Real CO2 Projects data
const realProjects: CO2Project[] = [
  {
    id: '10250',
    projectId: '10250',
    name: 'Solar Power Project',
    description: 'This Clean Development Mechanism (CDM) project involves the installation of a 5.2 MWp solar power plant in Anantapur, Andhra Pradesh, generating clean renewable electricity from solar energy, displacing approximately 8,253 MWh of electricity annually.',
    location: 'Anantapur, Andhra Pradesh',
    country: 'India',
    continent: 'Asia',
    category: 'renewable-energy',
    ngoName: 'Narasimha Swamy Solar Generations Pvt. Ltd.',
    verified: true,
    certificationStandard: 'CDM',
    pricePerTon: 5.00,
    minPurchase: 1,
    maxPurchase: 1000,
    availableTons: 35243,
    totalOffset: 35243,
    image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/co2%20projects/0001252_solar-power-project-by-narasimha-swamy-solar-generations-pvt-ltd_550.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjbzIgcHJvamVjdHMvMDAwMTI1Ml9zb2xhci1wb3dlci1wcm9qZWN0LWJ5LW5hcmFzaW1oYS1zd2FteS1zb2xhci1nZW5lcmF0aW9ucy1wdnQtbHRkXzU1MC5qcGVnIiwiaWF0IjoxNzU3NDMxMzQwLCJleHAiOjE3ODg5NjczNDB9.dV682u8dFfcEZAJb1qz-AfzT2cndmPuuJrkVzxkTEhU',
    benefits: ['Clean Energy Generation', 'Employment Creation', 'Grid Frequency Improvement', 'Technology Transfer'],
    methodology: 'Solar Photovoltaic Power Generation',
    projectStart: '2013-01-01',
    projectEnd: '2030-12-31',
    additionalInfo: {
      sdgGoals: [7, 13, 8, 9],
      biodiversityImpact: 'Minimal land use impact with clean energy generation',
      communityBenefit: 'Creates employment opportunities during construction and operation',
      technologyUsed: 'Advanced photovoltaic systems'
    },
    coordinates: { lat: 14.6819, lng: 77.6006 }
  },
  {
    id: '6573',
    projectId: '6573',
    name: 'Caixa Econômica Federal Solid Waste Management and Carbon Finance Project',
    description: 'The project aims to reduce methane emissions from municipal landfills in Brazil, capturing 450,000 cubic meters of greenhouse gases daily. This landfill gas would otherwise be released into the atmosphere, but is captured, converted into electricity, and distributed as biogas.',
    location: 'Seropédica, Rio de Janeiro',
    country: 'Brazil',
    continent: 'South America',
    category: 'methane-capture',
    ngoName: 'Caixa Econômica Federal',
    verified: true,
    certificationStandard: 'CDM',
    pricePerTon: 6.00,
    minPurchase: 1,
    maxPurchase: 800,
    availableTons: 28572,
    totalOffset: 28572,
    image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/co2%20projects/0001175_caixa-economica-federal-solid-waste-management-and-carbon-finance-project.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjbzIgcHJvamVjdHMvMDAwMTE3NV9jYWl4YS1lY29ub21pY2EtZmVkZXJhbC1zb2xpZC13YXN0ZS1tYW5hZ2VtZW50LWFuZC1jYXJib24tZmluYW5jZS1wcm9qZWN0LmpwZWciLCJpYXQiOjE3NTc0MzEzOTAsImV4cCI6MTc4ODk2NzM5MH0.HQq1YtvjjuBk0KgjXZqZUkXX2uhQ8a1vG2VwZbsVP14',
    benefits: ['Methane Capture', 'Waste Management', 'Biogas Generation', 'Environmental Recovery'],
    methodology: 'Landfill Gas Capture and Utilization',
    projectStart: '2010-01-01',
    projectEnd: '2028-12-31',
    additionalInfo: {
      sdgGoals: [12, 13, 11, 15],
      biodiversityImpact: 'Reduces environmental pollution and land degradation',
      communityBenefit: 'Improves local air quality and waste management',
      technologyUsed: 'Landfill gas capture and biogas conversion systems'
    },
    coordinates: { lat: -22.7461, lng: -43.7017 }
  },
  {
    id: '9165',
    projectId: '9165',
    name: 'Taebaek Wind Park (Hasami Samcheok) CDM Project',
    description: 'Located in Gangwon-do, Republic of Korea, this 18MW wind farm generates electricity from renewable wind energy with 9 turbines of 2MW each. The project produces about 44,568 MWh per year and achieves an average annual emission reduction of 302,570 tCO2 over ten years.',
    location: 'Gangwon-do, South Korea',
    country: 'South Korea',
    continent: 'Asia',
    category: 'renewable-energy',
    ngoName: 'Taebaek Wind Park Co., Ltd',
    verified: true,
    certificationStandard: 'CDM',
    pricePerTon: 7.00,
    minPurchase: 1,
    maxPurchase: 500,
    availableTons: 33678,
    totalOffset: 33678,
    image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/co2%20projects/0000941_taebaek-wind-park-hasami-samcheok-cdm-project.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjbzIgcHJvamVjdHMvMDAwMDk0MV90YWViYWVrLXdpbmQtcGFyay1oYXNhbWktc2FtY2hlb2stY2RtLXByb2plY3QuanBlZyIsImlhdCI6MTc1NzQzMTQ1NywiZXhwIjo0OTc2Njk3Mzg1N30.WYt0J3KKw0WuArm7nykOr3ttR60T0bfEIj8A80mDuDs',
    benefits: ['Clean Energy Generation', 'Tourism Development', 'Technology Advancement', 'Energy Independence'],
    methodology: 'Wind Power Generation',
    projectStart: '2012-01-01',
    projectEnd: '2025-12-31',
    additionalInfo: {
      sdgGoals: [7, 13, 9, 8],
      biodiversityImpact: 'Minimal environmental impact with clean energy production',
      communityBenefit: 'Creates jobs and attracts tourism to the region',
      technologyUsed: '2MW wind turbine generators'
    },
    coordinates: { lat: 37.1640, lng: 128.9856 }
  },
  {
    id: '10080',
    projectId: '10080',
    name: 'Rondinha Small Hydroelectric Power Plant',
    description: 'Located on the Chapecó River in Santa Catarina, Brazil, this 9.6 MW hydroelectric plant serves approximately 18,500 consumer units, benefiting around 70,000 inhabitants. The run-of-river operation uses minimal flooded area, significantly reducing environmental impacts.',
    location: 'Passos Maia, Santa Catarina',
    country: 'Brazil',
    continent: 'South America',
    category: 'renewable-energy',
    ngoName: 'Rondinha Energetica S.A.',
    verified: true,
    certificationStandard: 'CDM',
    pricePerTon: 3.20,
    minPurchase: 0.5,
    maxPurchase: 400,
    availableTons: 16357,
    totalOffset: 16357,
    image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/co2%20projects/0001123_rondinha-small-hydroelectric-power-plant.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjbzIgcHJvamVjdHMvMDAwMTEyM19yb25kaW5oYS1zbWFsbC1oeWRyb2VsZWN0cmljLXBvd2VyLXBsYW50LmpwZWciLCJpYXQiOjE3NTc0MzE2MzcsImV4cCI6NDk3NjY5NzQwMzd9.BS2P9jVuwNCu40lqE0sA3UjqJ0CdMFwDXB7G59R4moM',
    benefits: ['Clean Energy Generation', 'Ecosystem Preservation', 'Job Creation', 'Environmental Education'],
    methodology: 'Small Hydro Power Generation',
    projectStart: '2014-01-01',
    projectEnd: '2035-12-31',
    additionalInfo: {
      sdgGoals: [7, 13, 15, 6],
      biodiversityImpact: 'Preserves aquatic and terrestrial ecosystems',
      communityBenefit: 'Benefits around 70,000 inhabitants with clean energy',
      technologyUsed: 'Run-of-river hydroelectric technology'
    },
    coordinates: { lat: -26.7734, lng: -52.0567 }
  },
  {
    id: '9078',
    projectId: '9078',
    name: 'Solar PV Power Project by MMPL in Fatepur, Gujarat',
    description: 'Tata Power\'s solar PV project in Gujarat represents a transformation in sustainability with advanced photovoltaic technology. The project has resulted in infrastructure development and stimulated business growth by enhancing electricity generation capacity.',
    location: 'Fatepur, Gujarat',
    country: 'India',
    continent: 'Asia',
    category: 'renewable-energy',
    ngoName: 'Tata Power (MMPL)',
    verified: true,
    certificationStandard: 'CDM',
    pricePerTon: 2.50,
    minPurchase: 1,
    maxPurchase: 2000,
    availableTons: 150009,
    totalOffset: 150009,
    image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/co2%20projects/0001123_rondinha-small-hydroelectric-power-plant.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjbzIgcHJvamVjdHMvMDAwMTEyM19yb25kaW5oYS1zbWFsbC1oeWRyb2VsZWN0cmljLXBvd2VyLXBsYW50LmpwZWciLCJpYXQiOjE3NTc0MzE2MzcsImV4cCI6NDk3NjY5NzQwMzd9.BS2P9jVuwNCu40lqE0sA3UjqJ0CdMFwDXB7G59R4moM',
    benefits: ['Clean Energy Access', 'Infrastructure Development', 'GHG Reduction', 'Grid Enhancement'],
    methodology: 'Solar Photovoltaic Power Generation',
    projectStart: '2012-01-01',
    projectEnd: '2030-12-31',
    additionalInfo: {
      sdgGoals: [7, 13, 9, 11],
      biodiversityImpact: 'Minimal land impact with significant GHG reduction',
      communityBenefit: 'Infrastructure development and business growth',
      technologyUsed: 'Advanced photovoltaic systems with grid integration'
    },
    coordinates: { lat: 23.0225, lng: 72.5714 }
  },
  {
    id: '7980',
    projectId: '7980',
    name: 'Burgos Wind Project',
    description: 'The largest wind farm in the Philippines with 150-MW capacity, featuring fifty Vestas V90 wind turbines in one of the country\'s best wind areas. The project complies with all local and national environmental policies and produces clean energy.',
    location: 'Burgos, Ilocos Norte',
    country: 'Philippines',
    continent: 'Asia',
    category: 'renewable-energy',
    ngoName: 'EDC Burgos Wind Power Corporation',
    verified: true,
    certificationStandard: 'CDM',
    pricePerTon: 5.50,
    minPurchase: 1,
    maxPurchase: 300,
    availableTons: 12585,
    totalOffset: 12585,
    image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/co2%20projects/0000616_burgos-wind-project.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjbzIgcHJvamVjdHMvMDAwMDYxNl9idXJnb3Mtd2luZC1wcm9qZWN0LmpwZWciLCJpYXQiOjE3NTc0MzE3MzMsImV4cCI6MTc4ODk2NzczM30.UjJLrQ9tpy0cj6bayjdyBstsEkDx6_Mldj1njlm18eo',
    benefits: ['Clean Energy Generation', 'Job Creation', 'Environmental Protection', 'Community Development'],
    methodology: 'Wind Power Generation',
    projectStart: '2014-01-01',
    projectEnd: '2030-12-31',
    additionalInfo: {
      sdgGoals: [7, 13, 8, 4],
      biodiversityImpact: 'Produces clean energy while maintaining environmental standards',
      communityBenefit: 'Generates jobs and supports local government initiatives',
      technologyUsed: 'Vestas V90 wind turbines (50 units of 3MW each)'
    },
    coordinates: { lat: 18.5311, lng: 120.6511 }
  },
  {
    id: '10360',
    projectId: '10360',
    name: '5 MW Solar Power Project by Baba Group',
    description: 'The project utilizes renewable solar energy for generation of electricity in Madhya Pradesh, India. The project contributes towards reduction in demand-supply gap and increases the share of renewable energy in the grid mix.',
    location: 'Sehore, Madhya Pradesh',
    country: 'India',
    continent: 'Asia',
    category: 'renewable-energy',
    ngoName: 'Dharampal Premchand Ltd. (Baba Group)',
    verified: true,
    certificationStandard: 'CDM',
    pricePerTon: 16.00,
    minPurchase: 1,
    maxPurchase: 100,
    availableTons: 619,
    totalOffset: 619,
    image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/co2%20projects/0000537_5-mw-solar-power-project-by-baba-group.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjbzIgcHJvamVjdHMvMDAwMDUzN181LW13LXNvbGFyLXBvd2VyLXByb2plY3QtYnktYmFiYS1ncm91cC5qcGVnIiwiaWF0IjoxNzU3NDMxNzg4LCJleHAiOjQ4MTc2Njk3NDE4OH0.bCQlbE56XEVsHrQVdoQUXImd2bQtFJVc1kTATnMBC6o',
    benefits: ['Clean Energy Generation', 'Employment Creation', 'Technology Advancement', 'Rural Development'],
    methodology: 'Solar Photovoltaic Power Generation',
    projectStart: '2019-01-01',
    projectEnd: '2030-12-31',
    additionalInfo: {
      sdgGoals: [7, 13, 8, 9],
      biodiversityImpact: 'Minimal environmental impact with clean energy production',
      communityBenefit: 'Provides job opportunities to local population',
      technologyUsed: 'Advanced photovoltaic systems'
    },
    coordinates: { lat: 23.2030, lng: 77.4832 }
  },
  {
    id: '6315',
    projectId: '6315',
    name: 'Biomass based power project by Harinagar Sugar Mills Ltd',
    description: 'This project generates electricity by combustion of bagasse, a carbon neutral fuel. A part of the generated electricity is used in the adjacent sugar plant while surplus electricity is exported to the Bihar State Electricity Board.',
    location: 'Harinagar, West Champaran, Bihar',
    country: 'India',
    continent: 'Asia',
    category: 'sustainable-agriculture',
    ngoName: 'Harinagar Sugar Mills Ltd.',
    verified: true,
    certificationStandard: 'CDM',
    pricePerTon: 4.50,
    minPurchase: 1,
    maxPurchase: 500,
    availableTons: 8652,
    totalOffset: 8652,
    image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/co2%20projects/0000574_biomass-based-power-project-by-harinagar-sugar-mills-ltd.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjbzIgcHJvamVjdHMvMDAwMDU3NF9iaW9tYXNzLWJhc2VkLXBvd2VyLXByb2plY3QtYnktaGFyaW5hZ2FyLXN1Z2FyLW1pbGxzLWx0ZC5qcGVnIiwiaWF0IjoxNzU3NDMxODUyLCJleHAiOjE3ODg5Njc4NTJ9.mtc87hA6kxJnODWMY7pXTc7b7UNsTUzvZ0OYuBQyAVU',
    benefits: ['Renewable Energy Generation', 'Waste Utilization', 'Job Creation', 'Rural Development'],
    methodology: 'Bagasse Combustion for Power Generation',
    projectStart: '2019-01-01',
    projectEnd: '2029-12-31',
    additionalInfo: {
      sdgGoals: [7, 13, 12, 8],
      biodiversityImpact: 'Utilizes agricultural waste reducing emission of greenhouse gases',
      communityBenefit: 'Employs skilled and unskilled personnel for operation and maintenance',
      technologyUsed: 'Bagasse-fired power generation technology'
    },
    coordinates: { lat: 26.5499, lng: 84.1358 }
  }
];

// Category configuration
const categoryConfig = {
  'renewable-energy': { label: 'Renewable Energy' },
  'methane-capture': { label: 'Methane Capture' },
  'sustainable-agriculture': { label: 'Sustainable Agriculture' },
  'reforestation': { label: 'Reforestation' },
  'clean-water': { label: 'Clean Water' },
  'blue-carbon': { label: 'Blue Carbon' }
};

// Multi-step Purchase Modal
const PurchaseModal = ({ project, onClose }) => {
  const { user, isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [tons, setTons] = useState(project.minPurchase);
  const [customTonsInput, setCustomTonsInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [message, setMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const totalPrice = tons * project.pricePerTon;

  // Handle custom tons input
  const handleCustomTonsChange = (value) => {
    setCustomTonsInput(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= project.minPurchase && numValue <= project.maxPurchase) {
      setTons(numValue);
    }
  };

  const handleCustomTonsSubmit = () => {
    const value = parseFloat(customTonsInput);
    if (!isNaN(value) && value >= project.minPurchase && value <= project.maxPurchase) {
      setTons(value);
      setCustomTonsInput('');
    } else {
      alert(`Please enter a value between ${project.minPurchase} and ${project.maxPurchase} tons`);
    }
  };

  const handleSendEmail = () => {
    if (!isAuthenticated || !user) {
      alert('Please log in to place an order');
      return;
    }

    const userName = user.first_name && user.last_name 
      ? `${user.first_name} ${user.last_name}` 
      : user.email;

    const subject = encodeURIComponent(`CO2 Certificate Order - Project ${project.projectId}`);
    const body = encodeURIComponent(`Dear PrivateCharterX Team,

I would like to purchase CO2 certificates:

ORDER DETAILS:
Customer: ${userName} (${user.email})
Project: ${project.name} (ID: ${project.projectId})
Provider: ${project.ngoName}
Location: ${project.location}
Quantity: ${tons} tons CO2
Price: $${project.pricePerTon}/ton
Total: $${totalPrice.toFixed(2)} USD
Payment: ${paymentMethod === 'crypto' ? 'Cryptocurrency' : 'Bank Transfer'}

${message ? `Message: ${message}` : ''}

Please confirm availability and payment instructions.

Best regards,
${userName}`);
    
    // Open email client
    window.location.href = `mailto:certificates@privatecharterx.com?subject=${subject}&body=${body}`;
    
    // Show success message
    setShowSuccess(true);
    
    // Close after 3 seconds
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 3000);
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center shadow-2xl mx-4">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-green-600" />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Email Client Opened</h3>
          
          <p className="text-gray-600 mb-6">
            Your email client should open with pre-filled order details.
          </p>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700 mb-2">Manual email:</p>
            <div className="flex items-center justify-between bg-white rounded p-3">
              <span className="text-sm font-medium">certificates@privatecharterx.com</span>
              <button
                onClick={() => navigator.clipboard.writeText('certificates@privatecharterx.com')}
                className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header with Hero Image */}
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors"
          >
            <X className="w-4 h-4 stroke-2" />
          </button>

          <div className="h-48 bg-gradient-to-br from-gray-900 to-gray-700 relative overflow-hidden rounded-t-2xl">
            <img
              src={project.image}
              alt={project.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>

            <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 text-white px-3 py-1.5 rounded-md flex items-center text-sm font-light">
              <MapPin className="w-4 h-4 mr-2 stroke-1" />
              {project.location}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <div>
            <h2 className="text-lg font-light text-black mb-2">
              {project.name}
            </h2>
            
            <div className="flex items-center space-x-2 mb-3">
              {project.verified && (
                <div className="bg-gray-100 px-2 py-1 rounded-full flex items-center text-xs text-black font-light">
                  <Shield size={10} className="mr-1" />
                  Verified
                </div>
              )}
              {categoryConfig[project.category] && (
                <div className="bg-gray-100 px-2 py-1 rounded-full flex items-center text-xs text-black font-light">
                  {categoryConfig[project.category].label}
                </div>
              )}
            </div>

            {/* Step 1: Project Overview */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="grid grid-cols-2 gap-3 text-sm font-light">
                    <div>
                      <span className="text-gray-500">Provider:</span>
                      <div className="text-black">{project.ngoName}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Standard:</span>
                      <div className="text-black">{project.certificationStandard}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Available:</span>
                      <div className="text-black">{project.availableTons.toLocaleString()} tons</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Price:</span>
                      <div className="text-black">${project.pricePerTon}/ton</div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-4">
                  <div className="text-sm text-gray-700 leading-relaxed">
                    {project.description.split('\n')[0]}
                  </div>
                </div>

                {/* Benefits */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-black mb-2">Key Benefits:</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {project.benefits.slice(0, 4).map((benefit, index) => (
                      <div key={index} className="flex items-center text-xs text-gray-600">
                        <Check className="w-3 h-3 mr-1 text-green-600" />
                        <span className="truncate">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Impact Information */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-black mb-2">Impact Details:</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div><span className="font-medium">Community:</span> {project.additionalInfo.communityBenefit}</div>
                    <div><span className="font-medium">Environment:</span> {project.additionalInfo.biodiversityImpact}</div>
                    <div><span className="font-medium">Technology:</span> {project.additionalInfo.technologyUsed}</div>
                  </div>
                </div>

                <button
                  onClick={() => setCurrentStep(2)}
                  className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                >
                  Continue to Purchase
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Step 2: Purchase Details */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="flex items-center text-gray-600 hover:text-black text-sm"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Overview
                  </button>
                  <span className="text-sm text-gray-500">Step 2 of 2</span>
                </div>

                {/* Quantity Selection */}
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Quantity (tons of CO2)</label>
                  
                  {/* Button Controls */}
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3 mb-3">
                    <span className="text-sm text-gray-700">Number of tons</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setTons(Math.max(project.minPurchase, tons - 1))}
                        disabled={tons <= project.minPurchase}
                        className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors text-sm font-semibold disabled:opacity-50"
                      >
                        -
                      </button>
                      
                      <input
                        type="number"
                        value={tons}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (!isNaN(value) && value >= project.minPurchase && value <= project.maxPurchase) {
                            setTons(value);
                          } else if (e.target.value === '') {
                            setTons(project.minPurchase);
                          }
                        }}
                        min={project.minPurchase}
                        max={project.maxPurchase}
                        step={project.minPurchase < 1 ? 0.1 : 1}
                        className="w-16 text-center text-sm font-semibold bg-transparent border-none outline-none"
                      />
                      
                      <button
                        onClick={() => setTons(Math.min(project.maxPurchase, tons + 1))}
                        disabled={tons >= project.maxPurchase}
                        className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors text-sm font-semibold disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Custom Amount Input Field */}
                  <div className="mb-3">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={customTonsInput}
                        onChange={(e) => handleCustomTonsChange(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleCustomTonsSubmit()}
                        placeholder={`Enter custom amount (${project.minPurchase}-${project.maxPurchase})`}
                        min={project.minPurchase}
                        max={project.maxPurchase}
                        step={project.minPurchase < 1 ? 0.1 : 1}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                      />
                      <button
                        onClick={handleCustomTonsSubmit}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                      >
                        Set
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-1">
                    Min: {project.minPurchase} • Max: {project.maxPurchase} • Current: {tons} tons
                  </p>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Payment Method</label>
                  <div className="space-y-2">
                    <button
                      onClick={() => setPaymentMethod('bank')}
                      className={`w-full p-3 border rounded-xl text-left transition-all ${
                        paymentMethod === 'bank' ? 'border-black bg-gray-50' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard size={18} />
                        <span className="text-sm">Bank Transfer</span>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setPaymentMethod('crypto')}
                      className={`w-full p-3 border rounded-xl text-left transition-all ${
                        paymentMethod === 'crypto' ? 'border-black bg-gray-50' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Wallet size={18} />
                        <div>
                          <div className="text-sm">Cryptocurrency</div>
                          <div className="text-xs text-gray-500">Coming Soon</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Additional Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Any special requirements..."
                    className="w-full h-20 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent resize-none text-sm"
                  />
                </div>

                {/* Price display */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="flex justify-between items-center mb-2 text-sm">
                    <span className="text-gray-600">{tons} tons × ${project.pricePerTon}</span>
                    <span className="text-gray-900 font-semibold">${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      Total: ${totalPrice.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">Final price</div>
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={handleSendEmail}
                  className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                >
                  Send Order Request
                  <Send className="w-4 h-4" />
                </button>

                <p className="text-center text-xs text-gray-500">
                  This will open your email client with order details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main CO2 Marketplace Component
const CO2Marketplace = () => {
  const { isAuthenticated } = useAuth();
  const [projects] = useState(realProjects);
  const [filteredProjects, setFilteredProjects] = useState(realProjects);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedProject, setSelectedProject] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(4);

  // Filter projects
  useEffect(() => {
    let filtered = [...projects];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(term) ||
        project.location.toLowerCase().includes(term) ||
        project.ngoName.toLowerCase().includes(term) ||
        project.country.toLowerCase().includes(term) ||
        project.description.toLowerCase().includes(term)
      );
    }
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(project => project.category === selectedCategory);
    }
    
    setFilteredProjects(filtered);
    setCurrentPage(1);
  }, [projects, searchTerm, selectedCategory]);

  const handleProjectClick = (project) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    setSelectedProject(project);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedProject(null);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
  };

  const filterProjectsByCategory = (category) => {
    setSelectedCategory(category);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
  };

  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProjects = filteredProjects.slice(startIndex, startIndex + itemsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ 
      top: 0, 
      behavior: 'smooth' 
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* Main Content */}
      <main className="flex-1 pt-[88px]">
        <div className="max-w-6xl mx-auto px-6 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-3xl md:text-4xl font-light text-gray-900 text-center mb-4 tracking-tighter">
              CO2 Offset Certificates
            </h1>

            <p className="text-gray-500 text-center mb-8 max-w-2xl mx-auto font-light">
              Purchase verified carbon offset certificates from renewable energy and sustainability projects worldwide. Make a positive impact on our planet with transparent, certified climate action.
            </p>

            {/* Light Grey Bubbles */}
            <div className="flex justify-center gap-6 mb-12">
              <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-sm font-light">
                {projects.length} Verified Projects
              </div>
              <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-sm font-light">
                {Math.round(projects.reduce((sum, p) => sum + p.availableTons, 0) / 1000)}K+ Tons Available
              </div>
              <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-sm font-light">
                Starting at ${Math.min(...projects.map(p => p.pricePerTon))}/ton
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search size={20} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search projects, locations, or providers..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="block w-full pl-12 pr-12 py-4 text-lg border-0 rounded-2xl bg-white shadow-sm ring-1 ring-gray-300 focus:ring-2 focus:ring-black focus:ring-offset-0 transition-all duration-200"
                />
                {searchTerm && (
                  <button
                    onClick={() => handleSearchChange('')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filters and View Mode */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
            <div className="lg:flex-1">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                Available Projects
              </h2>
              {filteredProjects.length > 0 && (
                <p className="text-sm md:text-base text-gray-600 mt-1">
                  {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'} found
                  {(searchTerm || selectedCategory !== 'all') && (
                    <span className="ml-2 text-sm">
                      {searchTerm && `for "${searchTerm}"`}
                      {searchTerm && selectedCategory !== 'all' && ' in '}
                      {selectedCategory !== 'all' && `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`}
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Filters and View Mode */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto lg:flex-shrink-0 lg:ml-8">
              {/* Filters */}
              <div className="flex flex-wrap sm:inline-flex bg-white rounded-full p-1 shadow-sm border border-gray-200 w-full sm:w-auto">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'renewable-energy', label: 'Renewable' },
                  { key: 'methane-capture', label: 'Methane' },
                  { key: 'sustainable-agriculture', label: 'Agriculture' },
                  { key: 'reforestation', label: 'Forest' }
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => filterProjectsByCategory(filter.key)}
                    className={`px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-200 min-w-0 ${selectedCategory === filter.key
                      ? 'bg-black text-white shadow-sm'
                      : 'text-gray-700 hover:text-black hover:bg-gray-50'
                      }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm border border-gray-200">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 md:p-3 rounded-lg transition-all duration-200 ${viewMode === 'grid'
                    ? 'bg-black text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                  <Grid size={16} className="md:w-[18px] md:h-[18px]" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 md:p-3 rounded-lg transition-all duration-200 ${viewMode === 'list'
                    ? 'bg-black text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                  <List size={16} className="md:w-[18px] md:h-[18px]" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Projects Grid */}
          {paginatedProjects.length > 0 ? (
            <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 gap-6' : 'grid-cols-1 max-w-5xl mx-auto'
              } gap-6`}>
              {paginatedProjects.map((project) => {
                const categoryInfo = categoryConfig[project.category];
                
                return (
                  <div
                    key={project.id}
                    className={`group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 cursor-pointer ${
                      viewMode === 'list' ? 'flex flex-row' : 'flex flex-col'
                    }`}
                    onClick={() => handleProjectClick(project)}
                  >
                    <div className={`relative overflow-hidden ${viewMode === 'list' ? 'w-80 h-56 flex-shrink-0' : 'h-64'
                      }`}>
                      <img
                        src={project.image}
                        alt={project.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                      {/* Modern badges */}
                      <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                        {project.verified && (
                          <span className="bg-black/90 backdrop-blur-md text-white text-xs px-3 py-2 rounded-full font-semibold border border-white/20">
                            <Shield size={10} className="inline mr-1" />
                            Verified
                          </span>
                        )}
                        {categoryInfo && (
                          <span className="bg-gray-900/90 backdrop-blur-md text-white text-xs px-3 py-2 rounded-full font-semibold border border-white/20">
                            {categoryInfo.label}
                          </span>
                        )}
                      </div>

                      {/* Price overlay */}
                      <div className="absolute bottom-4 right-4">
                        <div className="bg-white/95 backdrop-blur-md rounded-xl px-3 py-2 border border-gray-200/50 shadow-lg">
                          <div className="flex items-baseline gap-1">
                            <span className="text-xs font-medium text-gray-600">$</span>
                            <span className="text-base font-bold text-gray-900">{project.pricePerTon}</span>
                          </div>
                          <div className="text-xs text-gray-500 text-center mt-0.5">per ton CO2</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col bg-white">
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-black transition-colors leading-tight">
                        {project.name}
                      </h3>
                      
                      <div className="flex items-center text-gray-600 mb-4">
                        <Globe size={16} className="mr-2 flex-shrink-0 text-gray-400" />
                        <span className="text-sm font-medium">
                          {project.location}, {project.country}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mb-4 leading-relaxed line-clamp-3">
                        {project.description}
                      </p>
                      
                      <div className="mb-4">
                        <div className="text-sm font-medium text-gray-900 mb-2">Key Benefits:</div>
                        <div className="flex flex-wrap gap-1">
                          {project.benefits.slice(0, 3).map((benefit, index) => (
                            <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full border border-gray-200">
                              {benefit}
                            </span>
                          ))}
                          {project.benefits.length > 3 && (
                            <span className="text-xs text-gray-500">+{project.benefits.length - 3} more</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-4 pt-4 border-t border-gray-100 text-sm">
                        <div>
                          <div className="text-gray-500">Provider:</div>
                          <div className="text-gray-900 font-medium truncate">{project.ngoName}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-gray-500">Available:</div>
                          <div className="text-gray-900 font-medium">{project.availableTons.toLocaleString()} tons</div>
                        </div>
                      </div>
                      
                      <div className="mt-auto">
                        <button
                          className="w-full bg-black text-white py-3 px-6 rounded-xl font-semibold hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 border border-black"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProjectClick(project);
                          }}
                        >
                          Purchase Certificates
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-200">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Info size={32} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No projects found</h3>
              <p className="text-gray-600 max-w-md mx-auto mb-6 leading-relaxed">
                {searchTerm || selectedCategory !== 'all'
                  ? 'No projects match your current search criteria. Try adjusting your filters or search terms.'
                  : 'No projects are currently available. Please check back later or contact us for custom projects.'
                }
              </p>
              {(searchTerm || selectedCategory !== 'all') && (
                <button
                  onClick={clearAllFilters}
                  className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition-colors font-medium"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && paginatedProjects.length > 0 && (
            <div className="flex justify-center items-center mt-16">
              <div className="flex items-center bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-6 py-4 transition-colors ${currentPage === 1
                    ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <ChevronLeft size={20} />
                </button>

                <div className="flex items-center">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => paginate(pageNum)}
                        className={`px-6 py-4 text-sm font-medium transition-colors ${currentPage === pageNum
                          ? 'bg-black text-white'
                          : 'text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-6 py-4 transition-colors ${currentPage === totalPages
                    ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
      
      {/* Multi-step Purchase Modal */}
      {showModal && selectedProject && (
        <PurchaseModal
          project={selectedProject}
          onClose={closeModal}
        />
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSwitchToRegister={() => {
            setShowLoginModal(false);
          }}
          onSuccess={() => {
            setShowLoginModal(false);
          }}
          onSwitchToForgotPassword={() => {
            setShowLoginModal(false);
          }}
        />
      )}
    </div>
  );
};

export default CO2Marketplace;
