import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Check, ChevronDown, Car, Sparkles, Plane, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const PayApplicationPage = ({ user, onClose }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedCardIndex, setSelectedCardIndex] = useState(1); // Start with Gold (middle)
  const [showTitle, setShowTitle] = useState(false);
  const [formData, setFormData] = useState({
    accountType: 'individual',
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    phone: '',
    country: '',
    vatNumber: '',
    monthlySpending: '',
    expectedVolume: '',
  });

  const countries = [
    // Europe
    'Germany', 'United Kingdom', 'France', 'Switzerland', 'Austria',
    'Netherlands', 'Belgium', 'Italy', 'Spain', 'Portugal',
    'Ireland', 'Sweden', 'Norway', 'Denmark', 'Finland',
    'Poland', 'Czech Republic', 'Greece', 'Hungary', 'Romania',
    'Luxembourg', 'Monaco', 'Liechtenstein', 'Cyprus', 'Malta',
    'Croatia', 'Slovenia', 'Slovakia', 'Bulgaria', 'Estonia',
    'Latvia', 'Lithuania', 'Iceland', 'Turkey', 'Russia',
    // North America
    'United States', 'Canada', 'Mexico',
    // South America
    'Brazil', 'Argentina', 'Chile', 'Colombia', 'Peru',
    // Middle East
    'United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain',
    'Oman', 'Israel', 'Jordan', 'Lebanon',
    // Asia
    'China', 'Japan', 'South Korea', 'India', 'Singapore',
    'Hong Kong', 'Taiwan', 'Thailand', 'Vietnam', 'Malaysia',
    'Indonesia', 'Philippines', 'Pakistan', 'Bangladesh', 'Sri Lanka',
    // Oceania
    'Australia', 'New Zealand',
    // Africa
    'South Africa', 'Nigeria', 'Kenya', 'Uganda', 'Ghana',
    'Egypt', 'Morocco', 'Tunisia', 'Tanzania', 'Ethiopia',
    'Rwanda', 'Mauritius', 'Botswana', 'Namibia', 'Zimbabwe',
  ].sort();

  // VAT validation patterns by country
  const vatPatterns = {
    // Europe - EU VAT
    'Germany': { prefix: 'DE', pattern: /^DE\d{9}$/, example: 'DE123456789', label: 'USt-IdNr.' },
    'France': { prefix: 'FR', pattern: /^FR[A-Z0-9]{2}\d{9}$/, example: 'FR12345678901', label: 'TVA' },
    'United Kingdom': { prefix: 'GB', pattern: /^GB(\d{9}|\d{12})$/, example: 'GB123456789', label: 'VAT' },
    'Austria': { prefix: 'ATU', pattern: /^ATU\d{8}$/, example: 'ATU12345678', label: 'UID' },
    'Italy': { prefix: 'IT', pattern: /^IT\d{11}$/, example: 'IT12345678901', label: 'P.IVA' },
    'Spain': { prefix: 'ES', pattern: /^ES[A-Z0-9]\d{7}[A-Z0-9]$/, example: 'ESX1234567X', label: 'NIF' },
    'Netherlands': { prefix: 'NL', pattern: /^NL\d{9}B\d{2}$/, example: 'NL123456789B01', label: 'BTW' },
    'Belgium': { prefix: 'BE', pattern: /^BE[01]\d{9}$/, example: 'BE0123456789', label: 'TVA/BTW' },
    'Switzerland': { prefix: 'CHE', pattern: /^CHE\d{9}(TVA|MWST|IVA)?$/, example: 'CHE123456789', label: 'MWST' },
    'Luxembourg': { prefix: 'LU', pattern: /^LU\d{8}$/, example: 'LU12345678', label: 'TVA' },
    'Portugal': { prefix: 'PT', pattern: /^PT\d{9}$/, example: 'PT123456789', label: 'NIF' },
    'Ireland': { prefix: 'IE', pattern: /^IE\d{7}[A-Z]{1,2}$/, example: 'IE1234567X', label: 'VAT' },
    'Sweden': { prefix: 'SE', pattern: /^SE\d{12}$/, example: 'SE123456789012', label: 'Moms' },
    'Norway': { prefix: 'NO', pattern: /^NO\d{9}MVA$/, example: 'NO123456789MVA', label: 'MVA' },
    'Denmark': { prefix: 'DK', pattern: /^DK\d{8}$/, example: 'DK12345678', label: 'CVR' },
    'Finland': { prefix: 'FI', pattern: /^FI\d{8}$/, example: 'FI12345678', label: 'ALV' },
    'Liechtenstein': { prefix: 'LI', pattern: /^LI\d{5}$/, example: 'LI12345', label: 'MWST' },
    'Monaco': { prefix: 'FR', pattern: /^FR[A-Z0-9]{2}\d{9}$/, example: 'FR12345678901', label: 'TVA' },
    'Poland': { prefix: 'PL', pattern: /^PL\d{10}$/, example: 'PL1234567890', label: 'NIP' },
    'Czech Republic': { prefix: 'CZ', pattern: /^CZ\d{8,10}$/, example: 'CZ12345678', label: 'DIČ' },
    'Greece': { prefix: 'EL', pattern: /^EL\d{9}$/, example: 'EL123456789', label: 'ΑΦΜ' },
    'Hungary': { prefix: 'HU', pattern: /^HU\d{8}$/, example: 'HU12345678', label: 'Adószám' },
    'Romania': { prefix: 'RO', pattern: /^RO\d{2,10}$/, example: 'RO1234567890', label: 'CIF' },
    'Cyprus': { prefix: 'CY', pattern: /^CY\d{8}[A-Z]$/, example: 'CY12345678X', label: 'ΦΠΑ' },
    'Malta': { prefix: 'MT', pattern: /^MT\d{8}$/, example: 'MT12345678', label: 'VAT' },
    'Croatia': { prefix: 'HR', pattern: /^HR\d{11}$/, example: 'HR12345678901', label: 'OIB' },
    'Slovenia': { prefix: 'SI', pattern: /^SI\d{8}$/, example: 'SI12345678', label: 'DDV' },
    'Slovakia': { prefix: 'SK', pattern: /^SK\d{10}$/, example: 'SK1234567890', label: 'IČ DPH' },
    'Bulgaria': { prefix: 'BG', pattern: /^BG\d{9,10}$/, example: 'BG123456789', label: 'ДДС' },
    'Estonia': { prefix: 'EE', pattern: /^EE\d{9}$/, example: 'EE123456789', label: 'KMKR' },
    'Latvia': { prefix: 'LV', pattern: /^LV\d{11}$/, example: 'LV12345678901', label: 'PVN' },
    'Lithuania': { prefix: 'LT', pattern: /^LT(\d{9}|\d{12})$/, example: 'LT123456789', label: 'PVM' },
    'Iceland': { prefix: 'IS', pattern: /^IS\d{5,6}$/, example: 'IS12345', label: 'VSK' },
    'Turkey': { prefix: 'TR', pattern: /^TR\d{10}$/, example: 'TR1234567890', label: 'VKN' },
    'Russia': { prefix: 'RU', pattern: /^RU\d{10,12}$/, example: 'RU1234567890', label: 'ИНН' },
    // North America
    'United States': { prefix: '', pattern: /^(\d{2}-\d{7}|\d{9})$/, example: '12-3456789', label: 'EIN' },
    'Canada': { prefix: '', pattern: /^\d{9}[A-Z]{2}\d{4}$/, example: '123456789RT0001', label: 'BN/GST' },
    'Mexico': { prefix: '', pattern: /^[A-Z]{3,4}\d{6}[A-Z0-9]{3}$/, example: 'ABC123456XYZ', label: 'RFC' },
    // South America
    'Brazil': { prefix: '', pattern: /^\d{14}$/, example: '12345678000195', label: 'CNPJ' },
    'Argentina': { prefix: '', pattern: /^\d{11}$/, example: '12345678901', label: 'CUIT' },
    'Chile': { prefix: '', pattern: /^\d{8,9}-\d$/, example: '12345678-9', label: 'RUT' },
    'Colombia': { prefix: '', pattern: /^\d{9,10}$/, example: '1234567890', label: 'NIT' },
    'Peru': { prefix: '', pattern: /^\d{11}$/, example: '12345678901', label: 'RUC' },
    // Middle East
    'United Arab Emirates': { prefix: '', pattern: /^\d{15}$/, example: '100123456789012', label: 'TRN' },
    'Saudi Arabia': { prefix: '', pattern: /^\d{15}$/, example: '300123456789012', label: 'VAT' },
    'Qatar': { prefix: '', pattern: /^\d{10}$/, example: '1234567890', label: 'TIN' },
    'Kuwait': { prefix: '', pattern: /^\d{9}$/, example: '123456789', label: 'Tax ID' },
    'Bahrain': { prefix: '', pattern: /^\d{9,15}$/, example: '123456789', label: 'VAT' },
    'Oman': { prefix: '', pattern: /^OM\d{10}$/, example: 'OM1234567890', label: 'VAT' },
    'Israel': { prefix: '', pattern: /^\d{9}$/, example: '123456789', label: 'ח.פ.' },
    'Jordan': { prefix: '', pattern: /^\d{8,10}$/, example: '12345678', label: 'TIN' },
    'Lebanon': { prefix: '', pattern: /^\d{8}$/, example: '12345678', label: 'TIN' },
    // Asia
    'China': { prefix: '', pattern: /^[A-Z0-9]{15,18}$/, example: '91110000MA12345X', label: '统一社会信用代码' },
    'Japan': { prefix: '', pattern: /^T\d{13}$/, example: 'T1234567890123', label: '法人番号' },
    'South Korea': { prefix: '', pattern: /^\d{3}-\d{2}-\d{5}$/, example: '123-45-67890', label: '사업자등록번호' },
    'India': { prefix: '', pattern: /^\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z0-9]{2}$/, example: '22AAAAA1234A1Z5', label: 'GSTIN' },
    'Singapore': { prefix: '', pattern: /^[A-Z]\d{7}[A-Z]$/, example: 'T12345678X', label: 'UEN' },
    'Hong Kong': { prefix: '', pattern: /^\d{8}$/, example: '12345678', label: 'BR No.' },
    'Taiwan': { prefix: '', pattern: /^\d{8}$/, example: '12345678', label: '統一編號' },
    'Thailand': { prefix: '', pattern: /^\d{13}$/, example: '1234567890123', label: 'Tax ID' },
    'Vietnam': { prefix: '', pattern: /^\d{10,13}$/, example: '1234567890', label: 'MST' },
    'Malaysia': { prefix: '', pattern: /^\d{12}$/, example: '123456789012', label: 'SST' },
    'Indonesia': { prefix: '', pattern: /^\d{15}$/, example: '123456789012345', label: 'NPWP' },
    'Philippines': { prefix: '', pattern: /^\d{12}$/, example: '123456789012', label: 'TIN' },
    'Pakistan': { prefix: '', pattern: /^\d{7}$/, example: '1234567', label: 'NTN' },
    'Bangladesh': { prefix: '', pattern: /^\d{9,12}$/, example: '123456789', label: 'BIN' },
    'Sri Lanka': { prefix: '', pattern: /^\d{9,12}$/, example: '123456789', label: 'TIN' },
    // Oceania
    'Australia': { prefix: '', pattern: /^\d{11}$/, example: '12345678901', label: 'ABN' },
    'New Zealand': { prefix: '', pattern: /^\d{8,9}$/, example: '123456789', label: 'GST' },
    // Africa
    'South Africa': { prefix: '', pattern: /^\d{10}$/, example: '1234567890', label: 'VAT' },
    'Nigeria': { prefix: '', pattern: /^\d{8}-\d{4}$/, example: '12345678-0001', label: 'TIN' },
    'Kenya': { prefix: '', pattern: /^P\d{9}[A-Z]$/, example: 'P123456789A', label: 'PIN' },
    'Uganda': { prefix: '', pattern: /^\d{10}$/, example: '1234567890', label: 'TIN' },
    'Ghana': { prefix: '', pattern: /^[A-Z]\d{10}$/, example: 'C1234567890', label: 'TIN' },
    'Egypt': { prefix: '', pattern: /^\d{9}$/, example: '123456789', label: 'TIN' },
    'Morocco': { prefix: '', pattern: /^\d{8}$/, example: '12345678', label: 'ICE' },
    'Tunisia': { prefix: '', pattern: /^\d{7}[A-Z]$/, example: '1234567A', label: 'MF' },
    'Tanzania': { prefix: '', pattern: /^\d{9}$/, example: '123456789', label: 'TIN' },
    'Ethiopia': { prefix: '', pattern: /^\d{10}$/, example: '1234567890', label: 'TIN' },
    'Rwanda': { prefix: '', pattern: /^\d{9}$/, example: '123456789', label: 'TIN' },
    'Mauritius': { prefix: '', pattern: /^[A-Z]\d{8}$/, example: 'V12345678', label: 'VAT' },
    'Botswana': { prefix: '', pattern: /^[A-Z]\d{9}$/, example: 'P123456789', label: 'TIN' },
    'Namibia': { prefix: '', pattern: /^\d{10}$/, example: '1234567890', label: 'TIN' },
    'Zimbabwe': { prefix: '', pattern: /^\d{10}$/, example: '1234567890', label: 'TIN' },
  };

  const [vatError, setVatError] = useState('');
  const [vatValid, setVatValid] = useState(false);

  // Validate VAT number based on selected country
  const validateVat = (vat, country) => {
    if (!vat || !country) {
      setVatError('');
      setVatValid(false);
      return false;
    }

    const countryRules = vatPatterns[country];
    if (!countryRules) {
      // Country not in list, accept any format
      setVatError('');
      setVatValid(vat.length >= 5);
      return vat.length >= 5;
    }

    const upperVat = vat.toUpperCase().replace(/\s/g, '');

    if (countryRules.pattern.test(upperVat)) {
      setVatError('');
      setVatValid(true);
      return true;
    } else {
      setVatError(`Invalid format. Example: ${countryRules.example}`);
      setVatValid(false);
      return false;
    }
  };

  // Handle VAT input change
  const handleVatChange = (e) => {
    const value = e.target.value.toUpperCase();
    setFormData({ ...formData, vatNumber: value });
    if (formData.country) {
      validateVat(value, formData.country);
    }
  };

  // Re-validate when country changes
  useEffect(() => {
    if (formData.vatNumber && formData.country) {
      validateVat(formData.vatNumber, formData.country);
    }
  }, [formData.country]);

  // Get VAT label for selected country
  const getVatLabel = () => {
    if (!formData.country || !vatPatterns[formData.country]) return 'VAT Number';
    return `${vatPatterns[formData.country].label} Number`;
  };

  // Get VAT placeholder for selected country
  const getVatPlaceholder = () => {
    if (!formData.country || !vatPatterns[formData.country]) return 'e.g. DE123456789';
    const rules = vatPatterns[formData.country];
    return `e.g. ${rules.example}`;
  };

  const [submitted, setSubmitted] = useState(false);
  const [subStep, setSubStep] = useState(1); // For splitting Step 1 into 1a and 1b
  const [activeLandingVideo, setActiveLandingVideo] = useState(1); // For landing page video switching
  const [activeFormVideo, setActiveFormVideo] = useState(1); // For form sidebar video switching
  const landingVideo1Ref = useRef(null);

  // Video URLs for landing page (before Apply Now)
  const landingVideoUrls = [
    'https://auth.privatecharterx.com/storage/v1/object/public/routes%20bids/9520430-uhd_4096_2160_25fps.mp4',
    'https://auth.privatecharterx.com/storage/v1/object/public/motion%20videos/6700182-uhd_3840_2160_25fps.mp4',
  ];

  // Video URLs for form sidebar (Step 1)
  const formVideoUrls = [
    'https://auth.privatecharterx.com/storage/v1/object/public/routes%20bids/9943175-uhd_2160_4096_25fps.mp4',
    'https://auth.privatecharterx.com/storage/v1/object/public/routes%20bids/12463457_1080_1920_60fps.mp4',
  ];

  // First landing video starts from beginning
  const handleLandingVideo1Load = () => {
    if (landingVideo1Ref.current) {
      landingVideo1Ref.current.currentTime = 0;
    }
  };

  // Switch landing video after 7 seconds (plays from 00:12 to 00:19, then switch)
  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveLandingVideo(2);
    }, 7000);
    return () => clearTimeout(timer);
  }, []);

  // Switch form video once after 12 seconds (then stay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveFormVideo(2);
    }, 12000);
    return () => clearTimeout(timer);
  }, []);

  // Show title after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTitle(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const [extraTransportKm, setExtraTransportKm] = useState('0');

  // Extra km addon (on top of included km) - 15% margin on $6.50/km cost
  const extraKmOptions = [
    { value: '0', label: 'No extra km', price: 0 },
    { value: '10', label: '+10 km/month', price: 75 },
    { value: '25', label: '+25 km/month', price: 189 },
    { value: '50', label: '+50 km/month', price: 375 },
    { value: '100', label: '+100 km/month', price: 749 },
    { value: 'custom', label: 'Custom (contact us)', price: 0 },
  ];

  const cards = [
    {
      id: 'basic',
      name: 'Basic',
      price: '$59',
      priceDetail: 'per month',
      minTopup: 150,
      color: 'linear-gradient(145deg, #e8e8e8 0%, #b8b8b8 50%, #d4d4d4 100%)',
      textColor: 'text-gray-700',
      aiPlan: {
        name: 'Essential',
        chats: '10 chats/mo',
        messages: '5 msgs/chat',
        value: 19,
        aiBenefits: ['Empty Legs Search', 'Restaurant Search', 'Private Jet Search', 'General Queries'],
      },
      groundTransport: '5 km (~1 transfer)',
      staking: '1-2% APY',
      discounts: {
        booking: '5%',
        emptyLegs: '5%',
        hotels: '-',
      },
      benefits: [
        'USDC Wallet & Virtual Card',
        'eIBAN Access (EUR/USD)',
        '24/7 Phone Concierge',
        'Email Support',
        'MEDEVAC Coordination Available',
        'Priority Emergency Line',
      ],
      requirements: null,
    },
    {
      id: 'gold',
      name: 'Gold',
      price: '$99',
      priceDetail: 'per month',
      minTopup: 250,
      color: 'linear-gradient(145deg, #d4af37 0%, #f4e4a6 40%, #d4af37 70%, #c4a030 100%)',
      textColor: 'text-gray-800',
      aiPlan: {
        name: 'Explorer',
        chats: '5 chats/mo',
        messages: '10 msgs/chat',
        value: 99,
        aiBenefits: ['All Essential features', 'Ground Transport Booking', 'Catering Services', 'Custom Travel Planning'],
      },
      groundTransport: '10 km (~1-2 transfers)',
      staking: '2-3% APY',
      discounts: {
        booking: '7%',
        emptyLegs: '10%',
        hotels: '5%',
      },
      benefits: [
        'Everything in Basic',
        'Physical Metal Card',
        'Priority eIBAN',
        'Airport Lounge Access',
        'Priority Support',
        'MEDEVAC Coordination Available',
        'Priority Emergency Line',
      ],
      requirements: null,
    },
    {
      id: 'crew',
      name: 'Crew',
      price: '$129',
      priceDetail: 'per month',
      minTopup: 350,
      color: 'linear-gradient(145deg, #1e3a5f 0%, #2d5a87 40%, #1e3a5f 70%, #0f2940 100%)',
      textColor: 'text-white',
      aiPlan: {
        name: 'Explorer',
        chats: '5 chats/mo',
        messages: '10 msgs/chat',
        value: 99,
        aiBenefits: ['All Essential features', 'Ground Transport Booking', 'Catering Services', 'Custom Travel Planning'],
      },
      groundTransport: '15 km (~2-3 transfers)',
      staking: '2-4% APY + 1.5x PVCX',
      discounts: {
        booking: '7%',
        emptyLegs: '10%',
        hotels: '10%',
      },
      benefits: [
        'Airline Crew Exclusive',
        'Everything in Gold features',
        'PVCX Backed Rewards (+1.5x)',
        'Priority Support',
        'MEDEVAC Coordination Available',
        'Priority Emergency Line',
      ],
      requirements: 'Airline crew ID verification',
      badge: 'CREW',
    },
    {
      id: 'black',
      name: 'Black',
      price: '$229',
      priceDetail: 'per month',
      minTopup: 1000,
      color: 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 30%, #1a1a1a 60%, #0d0d0d 100%)',
      textColor: 'text-white',
      aiPlan: {
        name: 'Traveller',
        chats: '10 chats/mo',
        messages: '25 msgs/chat',
        value: 199,
        aiBenefits: ['All Explorer features', 'MEDEVAC Services', 'Concierge Services', 'Group Charter Requests', 'Event Booking'],
      },
      groundTransport: '25 km',
      staking: '3-4% APY',
      discounts: {
        booking: '10%',
        emptyLegs: '10%',
        hotels: '10%',
      },
      benefits: [
        'Everything in Gold',
        'Exclusive Black Card',
        'Unlimited eIBAN Transactions',
        '24/7 Priority Concierge',
        'Private Jet Priority Booking',
        'VIP Events Access',
        'MEDEVAC Priority Coordination',
        'Priority Emergency Line',
      ],
      requirements: null,
    },
    {
      id: 'platinum',
      name: 'Platinum JetCard',
      price: '$399',
      priceDetail: 'per month',
      minTopup: 10000,
      color: 'linear-gradient(145deg, #e5e4e2 0%, #c0c0c0 20%, #e8e8e8 40%, #b8b8b8 60%, #d4d4d4 80%, #a8a8a8 100%)',
      textColor: 'text-gray-800',
      aiPlan: {
        name: 'Elite',
        chats: 'Unlimited',
        messages: 'Unlimited',
        value: 999,
        aiBenefits: ['All Traveller features', '24/7 Phone Coordination', 'Dedicated Account Manager', 'VIP Event Access', 'Priority Everything'],
      },
      groundTransport: '40 km',
      staking: '3-4% APY (max)',
      discounts: {
        booking: '10%',
        emptyLegs: '10%',
        hotels: '10%',
      },
      benefits: [
        'Everything in Black',
        'Platinum Metal JetCard',
        'Dedicated Account Manager',
        'MEDEVAC Services Included',
        'Priority MEDEVAC Line 24/7',
        'Fixed Hourly Jet Rates',
        'Guaranteed Availability',
        'Fuel Price Protection',
        'VIP Terminal Access Worldwide',
      ],
      requirements: 'Enhanced KYC + $10k minimum',
      badge: 'JETCARD',
    },
  ];

  const selectedCard = cards[selectedCardIndex];
  const displayName = formData.firstName && formData.lastName
    ? `${formData.firstName} ${formData.lastName}`.toUpperCase()
    : 'YOUR NAME';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    const extraKm = extraKmOptions.find(o => o.value === extraTransportKm);

    try {
      // Get card price as number
      const cardPrice = parseFloat(selectedCard.price.replace('$', ''));

      const { error } = await supabase
        .from('card_applications')
        .insert({
          user_id: user?.id || null,
          account_type: formData.accountType,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          country: formData.country,
          vat_number: formData.accountType === 'corporate' ? formData.vatNumber : null,
          monthly_spending: formData.monthlySpending,
          expected_volume: formData.expectedVolume,
          card_tier: selectedCard.id,
          card_price: cardPrice,
          min_topup: selectedCard.minTopup,
          ground_transport_included: selectedCard.groundTransport,
          extra_transport_km: extraTransportKm,
          extra_transport_price: extraKm?.price || 0,
          ai_plan_name: selectedCard.aiPlan.name,
          ai_plan_value: selectedCard.aiPlan.value,
          staking_apy: selectedCard.staking,
          discount_booking: selectedCard.discounts.booking,
          discount_empty_legs: selectedCard.discounts.emptyLegs,
          discount_hotels: selectedCard.discounts.hotels,
        });

      if (error) throw error;

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting application:', error);
      // Handle network errors specifically
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        setSubmitError('Network error. Please check your connection and try again.');
      } else if (error.code === '42P01') {
        // Table doesn't exist
        setSubmitError('Service temporarily unavailable. Please try again later.');
      } else {
        setSubmitError(error.message || 'Failed to submit application. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceedStep1 = formData.firstName && formData.lastName && formData.email && formData.phone && formData.country && formData.monthlySpending && formData.expectedVolume && (formData.accountType === 'individual' || (formData.vatNumber && vatValid));

  const nextCard = () => {
    setSelectedCardIndex((prev) => (prev + 1) % cards.length);
  };

  const prevCard = () => {
    setSelectedCardIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">

      {/* Fullscreen Video Background with Crossfade */}
      <video
        ref={landingVideo1Ref}
        autoPlay
        muted
        loop
        playsInline
        onLoadedMetadata={handleLandingVideo1Load}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${activeLandingVideo === 1 ? 'opacity-100' : 'opacity-0'}`}
      >
        <source src={landingVideoUrls[0]} type="video/mp4" />
      </video>
      <video
        autoPlay
        muted
        loop
        playsInline
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${activeLandingVideo === 2 ? 'opacity-100' : 'opacity-0'}`}
      >
        <source src={landingVideoUrls[1]} type="video/mp4" />
      </video>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Close Button - Top Left */}
      <button
        onClick={onClose}
        className="absolute top-6 left-6 z-30 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Header - Top Right */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-4">
        <img
          src="https://auth.privatecharterx.com/storage/v1/object/public/logos/privatecharterx-icon%20(1).png"
          alt="PrivateCharterX"
          className="h-10 w-auto opacity-90"
        />
        <div className="w-px h-8 bg-white/40" />
        <img
          src="/Mastercard-Logo.png"
          alt="Mastercard"
          className="h-10 w-auto opacity-90"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-8">

        <div className={`transition-all duration-1000 ease-out ${showTitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-xs text-white/60 tracking-widest uppercase mb-4">Web3 · USDC-Backed Fintech Card</p>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white leading-tight mb-6">
            Access the world.<br />
            <span className="text-white/80">Powered by stablecoins.</span><br />
            <span className="text-white/60">Instant. Borderless. Rewarding.</span>
          </h1>

          <p className="text-sm sm:text-base text-white/50 max-w-xl mx-auto mb-8">
            Ground transport, discounts & more included with every card.<br className="hidden sm:block" />
            As it should be. <span className="text-white/70">Simplified banking.</span>
          </p>

          <button
            onClick={() => setShowPopup(true)}
            className="px-10 py-4 bg-white text-black text-sm font-medium hover:bg-gray-100 transition-colors rounded-full"
          >
            Pre-Apply
          </button>
        </div>
      </div>

      {/* Application Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-white z-[110] overflow-y-auto">

          {/* Close Button */}
          <button
            onClick={() => {
              setShowPopup(false);
              setSubmitted(false);
              setStep(1);
              setSubStep(1);
            }}
            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 z-50 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {!submitted ? (
            <div className="min-h-full flex flex-col">

              {/* Step 1: Personal Info */}
              {step === 1 && (
                <div className="flex-1 flex flex-col-reverse lg:flex-row">

                  {/* Left: Form */}
                  <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-4 sm:py-8 lg:py-0">

                    {/* Progress Indicator */}
                    <div className="flex items-center gap-2 mb-3 sm:mb-6">
                      <div className={`w-2 h-2 rounded-full ${subStep >= 1 ? 'bg-black' : 'bg-gray-300'}`} />
                      <div className={`w-8 h-px ${subStep >= 2 ? 'bg-black' : 'bg-gray-300'}`} />
                      <div className={`w-2 h-2 rounded-full ${subStep >= 2 ? 'bg-black' : 'bg-gray-300'}`} />
                      <div className="w-8 h-px bg-gray-300" />
                      <div className="w-2 h-2 rounded-full bg-gray-300" />
                    </div>

                    {/* Sub-Step 1: Basic Info */}
                    {subStep === 1 && (
                      <>
                        <p className="text-xs text-gray-400 tracking-widest uppercase mb-1 sm:mb-3">Personal Details</p>
                        <h2 className="text-xl sm:text-2xl font-light text-black text-center mb-0.5 sm:mb-1">
                          Let's get started
                        </h2>
                        <p className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-6">Basic information for your account</p>

                        <form className="w-full max-w-sm space-y-2 sm:space-y-4">
                          {/* Account Type */}
                          <div>
                            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1 sm:mb-2">
                              Account Type
                            </label>
                            <div className="flex gap-2 sm:gap-3">
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, accountType: 'individual' })}
                                className={`flex-1 py-2 sm:py-2.5 text-xs sm:text-sm border rounded-lg transition-colors ${
                                  formData.accountType === 'individual'
                                    ? 'border-black bg-black text-white'
                                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                                }`}
                              >
                                Individual
                              </button>
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, accountType: 'corporate' })}
                                className={`flex-1 py-2 sm:py-2.5 text-xs sm:text-sm border rounded-lg transition-colors ${
                                  formData.accountType === 'corporate'
                                    ? 'border-black bg-black text-white'
                                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                                }`}
                              >
                                Corporate
                              </button>
                            </div>
                          </div>

                          {/* Name */}
                          <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            <div>
                              <label className="block text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide mb-1">
                                First Name
                              </label>
                              <input
                                type="text"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                className="w-full px-2.5 sm:px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-black"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide mb-1">
                                Last Name
                              </label>
                              <input
                                type="text"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                className="w-full px-2.5 sm:px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-black"
                                required
                              />
                            </div>
                          </div>

                          {/* Email */}
                          <div>
                            <label className="block text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide mb-1">
                              Email
                            </label>
                            <input
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              className="w-full px-2.5 sm:px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-black"
                              required
                            />
                          </div>

                          {/* Phone */}
                          <div>
                            <label className="block text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide mb-1">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              placeholder="+1 234 567 8900"
                              className="w-full px-2.5 sm:px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-black"
                              required
                            />
                          </div>

                          {/* Continue Button */}
                          <button
                            type="button"
                            onClick={() => setSubStep(2)}
                            disabled={!formData.firstName || !formData.lastName || !formData.email || !formData.phone}
                            className="w-full py-2.5 sm:py-3 bg-black text-white text-xs sm:text-sm font-medium hover:bg-gray-900 transition-colors rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed mt-2 sm:mt-4"
                          >
                            Continue
                          </button>
                        </form>
                      </>
                    )}

                    {/* Sub-Step 2: Additional Info */}
                    {subStep === 2 && (
                      <>
                        <p className="text-xs text-gray-400 tracking-widest uppercase mb-1 sm:mb-3">Additional Details</p>
                        <h2 className="text-xl sm:text-2xl font-light text-black text-center mb-0.5 sm:mb-1">
                          Almost there
                        </h2>
                        <p className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-6">Help us understand your needs</p>

                        <form className="w-full max-w-sm space-y-2 sm:space-y-4">
                          {/* Country */}
                          <div>
                            <label className="block text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide mb-1">
                              Country
                            </label>
                            <select
                              value={formData.country}
                              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                              className="w-full px-2.5 sm:px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-black bg-white"
                              required
                            >
                              <option value="">Select country</option>
                              {countries.map((country) => (
                                <option key={country} value={country}>{country}</option>
                              ))}
                            </select>
                          </div>

                          {/* VAT Number - Only for Corporate */}
                          {formData.accountType === 'corporate' && (
                            <div>
                              <label className="block text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide mb-1">
                                {getVatLabel()}
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={formData.vatNumber}
                                  onChange={handleVatChange}
                                  placeholder={getVatPlaceholder()}
                                  className={`w-full px-2.5 sm:px-3 py-2 sm:py-2.5 border rounded-lg text-xs sm:text-sm focus:outline-none transition-colors ${
                                    vatError
                                      ? 'border-red-400 focus:border-red-500'
                                      : vatValid
                                        ? 'border-green-400 focus:border-green-500'
                                        : 'border-gray-300 focus:border-black'
                                  }`}
                                  required
                                />
                                {/* Validation indicator */}
                                {formData.vatNumber && (
                                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                    {vatValid ? (
                                      <Check size={14} className="text-green-500" />
                                    ) : vatError ? (
                                      <span className="text-red-500 text-xs">✗</span>
                                    ) : null}
                                  </div>
                                )}
                              </div>
                              {/* Error message */}
                              {vatError && (
                                <p className="text-[9px] sm:text-[10px] text-red-500 mt-1">{vatError}</p>
                              )}
                              {/* Country-specific hint */}
                              {formData.country && vatPatterns[formData.country] && !vatError && !vatValid && formData.vatNumber && (
                                <p className="text-[9px] sm:text-[10px] text-gray-400 mt-1">
                                  Format: {vatPatterns[formData.country].example}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Monthly Spending */}
                          <div>
                            <label className="block text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide mb-1">
                              Expected Monthly Spending
                            </label>
                            <select
                              value={formData.monthlySpending}
                              onChange={(e) => setFormData({ ...formData, monthlySpending: e.target.value })}
                              className="w-full px-2.5 sm:px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-black bg-white"
                              required
                            >
                              <option value="">Select range</option>
                              <option value="0-5000">$0 - $5,000</option>
                              <option value="5000-25000">$5,000 - $25,000</option>
                              <option value="25000-100000">$25,000 - $100,000</option>
                              <option value="100000+">$100,000+</option>
                            </select>
                          </div>

                          {/* Expected Volume */}
                          <div>
                            <label className="block text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide mb-1">
                              Expected Annual Volume
                            </label>
                            <select
                              value={formData.expectedVolume}
                              onChange={(e) => setFormData({ ...formData, expectedVolume: e.target.value })}
                              className="w-full px-2.5 sm:px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-black bg-white"
                              required
                            >
                              <option value="">Select range</option>
                              <option value="0-50000">$0 - $50,000</option>
                              <option value="50000-250000">$50,000 - $250,000</option>
                              <option value="250000-1000000">$250,000 - $1,000,000</option>
                              <option value="1000000+">$1,000,000+</option>
                            </select>
                          </div>

                          {/* Buttons */}
                          <div className="flex gap-2 sm:gap-3 mt-2 sm:mt-4">
                            <button
                              type="button"
                              onClick={() => setSubStep(1)}
                              className="flex-1 py-2.5 sm:py-3 border border-gray-300 text-gray-700 text-xs sm:text-sm font-medium hover:border-gray-400 transition-colors rounded-full"
                            >
                              Back
                            </button>
                            <button
                              type="button"
                              onClick={() => setStep(2)}
                              disabled={!formData.country || !formData.monthlySpending || !formData.expectedVolume || (formData.accountType === 'corporate' && (!formData.vatNumber || !vatValid))}
                              className="flex-1 py-2.5 sm:py-3 bg-black text-white text-xs sm:text-sm font-medium hover:bg-gray-900 transition-colors rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                              Choose Card
                            </button>
                          </div>
                        </form>
                      </>
                    )}
                  </div>

                  {/* Right: What's Included with Video Background */}
                  <div className="lg:w-1/2 relative overflow-hidden">
                    {/* Background Videos with Crossfade */}
                    <video
                      autoPlay
                      muted
                      loop
                      playsInline
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${activeFormVideo === 1 ? 'opacity-100' : 'opacity-0'}`}
                    >
                      <source src={formVideoUrls[0]} type="video/mp4" />
                    </video>
                    <video
                      autoPlay
                      muted
                      loop
                      playsInline
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${activeFormVideo === 2 ? 'opacity-100' : 'opacity-0'}`}
                    >
                      <source src={formVideoUrls[1]} type="video/mp4" />
                    </video>

                    {/* Dark Overlay */}
                    <div className="absolute inset-0 bg-black/50" />

                    {/* Content Overlay */}
                    <div className="relative z-10 p-3 sm:p-4 lg:p-6 flex flex-col justify-end min-h-[200px] sm:min-h-[300px] lg:min-h-full">
                      <p className="text-[9px] text-white/50 uppercase tracking-widest mb-3 text-center lg:text-left">Included with every card</p>

                      <div className="grid grid-cols-2 gap-2">
                        {/* USDC Wallet */}
                        <div className="flex items-center gap-2 p-2 bg-black/20 rounded-lg border border-white/5">
                          <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-3 h-3 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <path d="M12 6v12M9 9h6M9 15h6" />
                            </svg>
                          </div>
                          <p className="text-[10px] text-white/80">USDC Wallet</p>
                        </div>

                        {/* eIBAN */}
                        <div className="flex items-center gap-2 p-2 bg-black/20 rounded-lg border border-white/5">
                          <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-3 h-3 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="2" y="4" width="20" height="16" rx="2" />
                              <path d="M6 8h4" />
                            </svg>
                          </div>
                          <p className="text-[10px] text-white/80">eIBAN</p>
                        </div>

                        {/* Ground Transport */}
                        <div className="flex items-center gap-2 p-2 bg-black/20 rounded-lg border border-white/5">
                          <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <Car className="w-3 h-3 text-white/80" />
                          </div>
                          <p className="text-[10px] text-white/80">Transport</p>
                        </div>

                        {/* AI Concierge */}
                        <div className="flex items-center gap-2 p-2 bg-black/20 rounded-lg border border-white/5">
                          <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-3 h-3 text-white/80" />
                          </div>
                          <p className="text-[10px] text-white/80">AI Concierge</p>
                        </div>

                        {/* Staking */}
                        <div className="flex items-center gap-2 p-2 bg-black/20 rounded-lg border border-white/5">
                          <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-3 h-3 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                          </div>
                          <p className="text-[10px] text-white/80">4% APY</p>
                        </div>

                        {/* Discounts */}
                        <div className="flex items-center gap-2 p-2 bg-black/20 rounded-lg border border-white/5">
                          <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <Plane className="w-3 h-3 text-white/80" />
                          </div>
                          <p className="text-[10px] text-white/80">Discounts</p>
                        </div>
                      </div>

                      {/* Mastercard Badge */}
                      <div className="mt-4 flex items-center justify-center lg:justify-start gap-2">
                        <img
                          src="/Mastercard-Logo.png"
                          alt="Mastercard"
                          className="h-6 w-auto opacity-60"
                        />
                        <span className="text-[9px] text-white/30">Accepted worldwide</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Card Selection Carousel */}
              {step === 2 && (
                <div className="flex-1 flex flex-col">

                  {/* Back Button */}
                  <button
                    onClick={() => {
                      setStep(1);
                      setSubStep(2);
                    }}
                    className="absolute top-6 left-6 p-2 text-gray-400 hover:text-gray-900 z-10"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  <div className="flex-1 flex flex-col lg:flex-row">

                    {/* Left: Card Carousel */}
                    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:py-0">
                      <p className="text-xs text-gray-400 tracking-widest uppercase mb-4">Step 2 of 2</p>

                      {/* Card Name & Price */}
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <h2 className="text-3xl font-light text-black text-center">
                          {selectedCard.name}
                        </h2>
                        {selectedCard.badge && (
                          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-900 text-white">
                            {selectedCard.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm mb-8">
                        <span className="text-black font-medium">{selectedCard.price}</span> {selectedCard.priceDetail}
                        <span className="text-gray-300 mx-2">•</span>
                        <span className="text-gray-400">${selectedCard.minTopup.toLocaleString()} min</span>
                      </p>

                      {/* Carousel */}
                      <div className="relative w-full max-w-sm flex items-center justify-center mb-6">

                        {/* Left Arrow */}
                        <button
                          onClick={prevCard}
                          className="absolute left-0 z-10 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>

                        {/* Card Visual */}
                        <div
                          className="w-[260px] h-[400px] rounded-2xl shadow-2xl p-6 flex flex-col justify-between transition-all duration-300"
                          style={{ background: selectedCard.color }}
                        >
                          {/* Top */}
                          <div className="flex justify-between items-start">
                            <p className={`text-[10px] tracking-widest uppercase ${selectedCard.id === 'black' ? 'text-gray-400' : 'text-gray-600'}`}>
                              PrivateCharterX
                            </p>
                            <div className="flex -space-x-2">
                              <div className="w-6 h-6 rounded-full bg-red-500 opacity-80" />
                              <div className="w-6 h-6 rounded-full bg-yellow-500 opacity-80" />
                            </div>
                          </div>

                          {/* Name (Vertical) */}
                          <div className="flex-1 flex items-center">
                            <p
                              className={`text-sm font-medium tracking-[0.2em] ${selectedCard.textColor}`}
                              style={{
                                writingMode: 'vertical-rl',
                                textOrientation: 'mixed',
                                transform: 'rotate(180deg)',
                              }}
                            >
                              {displayName}
                            </p>
                          </div>

                          {/* Bottom */}
                          <div className="flex justify-between items-end">
                            <div>
                              <p className={`text-xs ${selectedCard.id === 'black' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {selectedCard.name}
                              </p>
                            </div>
                            {/* Contactless Icon */}
                            <div className={`${selectedCard.id === 'black' ? 'text-gray-400' : 'text-gray-600'}`}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M8.5 14.5c1.5-2 4.5-2 6 0" />
                                <path d="M6 12c2.5-3.5 9.5-3.5 12 0" />
                                <path d="M3.5 9.5c4-5 13-5 17 0" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Right Arrow */}
                        <button
                          onClick={nextCard}
                          className="absolute right-0 z-10 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                        >
                          <ChevronRight className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>

                      {/* Dots */}
                      <div className="flex gap-2 mb-8">
                        {cards.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedCardIndex(index)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              index === selectedCardIndex ? 'bg-black' : 'bg-gray-300'
                            }`}
                          />
                        ))}
                      </div>

                      {/* Error Message */}
                      {submitError && (
                        <div className="lg:hidden w-full max-w-sm mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-xs text-red-600">{submitError}</p>
                        </div>
                      )}

                      {/* Choose Button - Mobile */}
                      <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="lg:hidden w-full max-w-sm py-4 bg-black text-white text-sm font-medium hover:bg-gray-900 transition-colors rounded-full disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>Pre-Apply for {selectedCard.name}</>
                        )}
                      </button>
                    </div>

                    {/* Right: Benefits & Addons */}
                    <div className="lg:w-[440px] bg-gray-50 p-6 lg:p-8 flex flex-col overflow-y-auto max-h-screen">

                      {/* Requirements Badge */}
                      {selectedCard.requirements && (
                        <div className="mb-4 p-3 bg-gray-100 border border-gray-200 rounded-lg">
                          <p className="text-xs text-gray-700 font-medium">{selectedCard.requirements}</p>
                        </div>
                      )}

                      {/* Min Topup & Staking */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
                          <p className="text-lg font-light text-black">${selectedCard.minTopup.toLocaleString()}</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wide">Min. Top-up</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
                          <p className="text-lg font-light text-black">{selectedCard.staking}</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wide">Staking APY</p>
                        </div>
                      </div>

                      {/* Card Benefits - Highlighted */}
                      <div className="mb-4 p-4 bg-black rounded-xl">
                        <h4 className="text-xs font-medium text-white mb-3 uppercase tracking-wide">{selectedCard.name} Benefits</h4>
                        <ul className="space-y-2">
                          {selectedCard.benefits.map((benefit, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                              <span className="text-[11px] text-white/90">{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Discounts */}
                      <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-2 mb-3">
                          <Plane className="w-4 h-4 text-gray-400" />
                          <h4 className="text-xs font-medium text-black uppercase tracking-wide">Discounts</h4>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center p-2.5 bg-white rounded-lg border border-gray-200">
                            <p className="text-base font-light text-black">{selectedCard.discounts.booking}</p>
                            <p className="text-[9px] text-gray-500 uppercase tracking-wide">Bookings</p>
                          </div>
                          <div className="text-center p-2.5 bg-white rounded-lg border border-gray-200">
                            <p className="text-base font-light text-black">{selectedCard.discounts.emptyLegs}</p>
                            <p className="text-[9px] text-gray-500 uppercase tracking-wide">Empty Legs</p>
                          </div>
                          <div className="text-center p-2.5 bg-white rounded-lg border border-gray-200">
                            <p className="text-base font-light text-black">{selectedCard.discounts.hotels}</p>
                            <p className="text-[9px] text-gray-500 uppercase tracking-wide">Hotels</p>
                          </div>
                        </div>
                      </div>

                      {/* Ground Transport - Included + Extra Hours */}
                      <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-2 mb-3">
                          <Car className="w-4 h-4 text-gray-400" />
                          <h4 className="text-xs font-medium text-black uppercase tracking-wide">Ground Transport</h4>
                        </div>

                        {/* Included Km */}
                        <div className="flex items-center justify-between p-2.5 bg-white rounded-lg mb-3 border border-gray-200">
                          <span className="text-[11px] text-gray-500 uppercase tracking-wide">Included</span>
                          <span className="text-xs font-medium text-black">{selectedCard.groundTransport}</span>
                        </div>

                        {/* Extra Km Addon */}
                        <div>
                          <p className="text-[10px] text-gray-500 mb-2">Need more? Add extra km:</p>
                          <div className="relative">
                            <select
                              value={extraTransportKm}
                              onChange={(e) => setExtraTransportKm(e.target.value)}
                              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-black appearance-none cursor-pointer"
                            >
                              {extraKmOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label} {option.price > 0 ? `(+$${option.price}/mo)` : ''}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      {/* Total & Choose Button - Desktop */}
                      <div className="mt-auto pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Monthly Total</span>
                          <span className="text-2xl font-light text-black">
                            {selectedCard.price === 'Free' ? 'Free' : selectedCard.price}
                            {extraTransportKm !== '0' && extraTransportKm !== 'custom' && (
                              <span className="text-sm text-gray-400 font-normal">
                                {' '}+ ${extraKmOptions.find(o => o.value === extraTransportKm)?.price}
                              </span>
                            )}
                          </span>
                        </div>
                        {/* Error Message - Desktop */}
                        {submitError && (
                          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-xs text-red-600">{submitError}</p>
                          </div>
                        )}
                        <button
                          onClick={handleSubmit}
                          disabled={isSubmitting}
                          className="hidden lg:flex w-full py-3.5 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors rounded-full disabled:bg-gray-400 disabled:cursor-not-allowed items-center justify-center gap-2"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>Pre-Apply for {selectedCard.name}</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          ) : (
            /* Success State */
            <div className="min-h-full flex flex-col items-center justify-center px-6 py-12">
              <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-light text-black mb-2">You're on the list</h2>
              <p className="text-gray-500 mb-2">Welcome to PrivateCharterX {selectedCard.name}.</p>
              <p className="text-gray-400 text-sm mb-8">We'll notify you when your USDC-backed card is ready.</p>
              <button
                onClick={() => {
                  setShowPopup(false);
                  setSubmitted(false);
                  setStep(1);
                  setSubStep(1);
                }}
                className="px-8 py-3 border border-gray-300 text-sm text-gray-700 hover:border-black transition-colors rounded-full"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PayApplicationPage;
