import React, { useState, useRef, useEffect } from 'react';
import {
  Plane, Zap, Mountain, MapPin, Calendar, Users, 
  Clock, Send, Paperclip, Camera, Sparkles,
  MessageSquare, Star, Globe, Shield, ArrowRight,
  CheckCircle, Loader2, Search, Mic, X, Plus,
  History, Settings, User, CreditCard, Car,
  ChevronRight, ChevronDown, Edit3, Trash2,
  DollarSign, Euro, Bell, CalendarDays, Route,
  Building2, Phone, Filter, Wifi, Heart, Share,
  Menu, SlidersHorizontal, ChevronUp, ChevronLeft,
  Anchor, Ship, LogIn, UserPlus
} from 'lucide-react';
import Map, {
  Source,
  Layer,
  Marker,
  Popup,
  NavigationControl,
  FullscreenControl,
  GeolocateControl
} from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';

interface Message {
  id: number;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
  metadata?: any;
  serviceCards?: ServiceCard[];
}

interface ServiceCard {
  id: string;
  type: 'private-jet' | 'luxury-car' | 'adventure-package' | 'helicopter' | 'yacht' | 'empty-leg';
  title: string;
  subtitle: string;
  price: number;
  currency: string;
  details: any;
  image?: string;
}

interface CartItem extends ServiceCard {
  quantity?: number;
  customizations?: any;
}

interface BookingModal {
  isOpen: boolean;
  service: ServiceCard | null;
  type: 'private-jet' | 'luxury-car' | 'adventure-package' | 'helicopter' | 'yacht' | 'empty-leg' | null;
}

const TravelDesigner = () => {
  // Auth State
  const { user, isAuthenticated, initializing } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  
  // Landing Page State
  const [showMainModal, setShowMainModal] = useState(false);
  const [landingInput, setLandingInput] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  
  // Main Modal State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [sidebarView, setSidebarView] = useState('chat');
  const [showCart, setShowCart] = useState(false);
  const [bookingModal, setBookingModal] = useState<BookingModal>({ isOpen: false, service: null, type: null });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const messagesEndRef = useRef(null);

  // Map-related state from enhancedMap
  const [mapViewState, setMapViewState] = useState({
    longitude: 10.0,
    latitude: 51.0,
    zoom: 4.0,
    pitch: 0,
    bearing: 0
  });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rotationPaused, setRotationPaused] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);
  const [is3DMode, setIs3DMode] = useState(false);
  const [mapSidebarCollapsed, setMapSidebarCollapsed] = useState(false);
  const [luxuryCars, setLuxuryCars] = useState([]);
  const [adventurePackages, setAdventurePackages] = useState([]);
  const [mapIsLoading, setMapIsLoading] = useState(true);
  const [mapError, setMapError] = useState(null);
  const mapRef = useRef();

  const MAPBOX_TOKEN = 'pk.eyJ1IjoicHJpdmF0ZWNoYXJ0ZXJ4IiwiYSI6ImNtN2Z4empwNzA2Z2wyanM3NWN2Znpmbm4ifQ.nuvmpND_qtdsauY-n8F_9g';

  // Service Options for Landing Page
  const serviceOptions = [
    { 
      id: 'private-jet', 
      label: 'Private Jet Booking', 
      icon: Plane,
      description: 'Luxury private aviation worldwide'
    },
    { 
      id: 'helicopter', 
      label: 'Helicopter Charter', 
      icon: Zap,
      description: 'Premium helicopter services'
    },
    { 
      id: 'yacht', 
      label: 'Yacht Charter', 
      icon: Ship,
      description: 'Exclusive yacht experiences'
    },
    { 
      id: 'luxury-car', 
      label: 'Luxury Cars', 
      icon: Car,
      description: 'Premium vehicle rentals'
    },
    { 
      id: 'adventure', 
      label: 'Adventure Packages', 
      icon: Mountain,
      description: 'Curated luxury experiences'
    },
    { 
      id: 'concierge', 
      label: 'Concierge Services', 
      icon: Building2,
      description: 'Personal travel assistance'
    }
  ];

  const OFFICE_LOCATIONS = [
    {
      id: "london",
      name: "London Office",
      address: "71-75 Shelton Street, Covent Garden",
      city: "London",
      postcode: "WC2H 9JQ",
      country: "United Kingdom",
      hours: "Mo-Su, 00:00 - 23:59",
      lat: 51.5155,
      lng: -0.1229,
      type: 'office'
    },
    {
      id: "zurich",
      name: "Zurich Office",
      address: "Bahnhofstrasse 37/10",
      city: "Zurich",
      postcode: "8001",
      country: "Switzerland",
      hours: "Mo-Su, 00:00 - 23:59",
      lat: 47.3769,
      lng: 8.5417,
      type: 'office'
    },
    {
      id: "miami",
      name: "Miami Office",
      address: "1000 Brickell Ave, Suite 715",
      city: "Miami",
      postcode: "33131",
      country: "United States",
      hours: "Mo-Su, 00:00 - 23:59",
      lat: 25.7617,
      lng: -80.1918,
      type: 'office'
    }
  ];

  const currencies = [
    { code: 'EUR', symbol: '€', icon: Euro },
    { code: 'USD', symbol: '$', icon: DollarSign },
    { code: 'GBP', symbol: '£', icon: DollarSign },
    { code: 'CHF', symbol: 'CHF', icon: DollarSign },
  ];

  const getCurrencySymbol = (code) => {
    return currencies.find(c => c.code === code)?.symbol || code;
  };

  const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
      const checkIsMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };

      checkIsMobile();
      window.addEventListener('resize', checkIsMobile);
      return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    return isMobile;
  };

  const isMobile = useIsMobile();

  // Mock data for services - PrivateCharterX Database
  const mockServices = {
    privateJets: [
      {
        id: 'vlight-1',
        type: 'private-jet',
        category: 'Very Light Jet',
        name: 'Cessna Citation Mustang',
        pricePerHour: 4300,
        capacity: 4,
        range: 1500,
        currency: 'EUR',
        image: '✈️'
      },
      {
        id: 'light-1',
        type: 'private-jet',
        category: 'Light Jet',
        name: 'Embraer Phenom 300',
        pricePerHour: 5100,
        capacity: 6,
        range: 2500,
        currency: 'EUR',
        image: '✈️'
      },
      {
        id: 'midsize-1',
        type: 'private-jet',
        category: 'Midsize Jet',
        name: 'Hawker 900XP',
        pricePerHour: 6800,
        capacity: 8,
        range: 3500,
        currency: 'EUR',
        image: '✈️'
      },
      {
        id: 'super-mid-1',
        type: 'private-jet',
        category: 'Super Midsize Jet',
        name: 'Cessna Citation X+',
        pricePerHour: 8900,
        capacity: 9,
        range: 4500,
        currency: 'EUR',
        image: '✈️'
      },
      {
        id: 'heavy-1',
        type: 'private-jet',
        category: 'Heavy Jet',
        name: 'Gulfstream G550',
        pricePerHour: 11500,
        capacity: 14,
        range: 6750,
        currency: 'EUR',
        image: '✈️'
      }
    ],
    helicopters: [
      {
        id: 'heli-1',
        type: 'helicopter',
        name: 'Eurocopter EC145',
        pricePerHour: 3200,
        capacity: 6,
        range: 680,
        currency: 'EUR',
        image: '🚁'
      },
      {
        id: 'heli-2',
        type: 'helicopter',
        name: 'Augusta Westland AW139',
        pricePerHour: 4100,
        capacity: 8,
        range: 850,
        currency: 'EUR',
        image: '🚁'
      },
      {
        id: 'heli-3',
        type: 'helicopter',
        name: 'Sikorsky S-76D',
        pricePerHour: 4800,
        capacity: 8,
        range: 750,
        currency: 'EUR',
        image: '🚁'
      }
    ],
    yachts: [
      {
        id: 'yacht-1',
        type: 'yacht',
        name: 'Sunseeker Predator 68',
        pricePerDay: 8500,
        capacity: 8,
        length: 68,
        currency: 'EUR',
        image: '🛥️'
      },
      {
        id: 'yacht-2',
        type: 'yacht',
        name: 'Ferretti 850',
        pricePerDay: 12000,
        capacity: 10,
        length: 85,
        currency: 'EUR',
        image: '🛥️'
      },
      {
        id: 'yacht-3',
        type: 'yacht',
        name: 'Princess Y95',
        pricePerDay: 18000,
        capacity: 12,
        length: 95,
        currency: 'EUR',
        image: '🛥️'
      }
    ],
    luxuryCars: [
      {
        id: 'car-1',
        type: 'luxury-car',
        brand: 'Mercedes-Benz',
        model: 'S-Class',
        pricePerDay: 350,
        location: 'Zurich',
        currency: 'EUR',
        image: '🚗'
      },
      {
        id: 'car-2',
        type: 'luxury-car',
        brand: 'BMW',
        model: '7 Series',
        pricePerDay: 320,
        location: 'Zurich',
        currency: 'EUR',
        image: '🚗'
      },
      {
        id: 'car-3',
        type: 'luxury-car',
        brand: 'Rolls-Royce',
        model: 'Phantom',
        pricePerDay: 1200,
        location: 'London',
        currency: 'EUR',
        image: '🚗'
      },
      {
        id: 'car-4',
        type: 'luxury-car',
        brand: 'Bentley',
        model: 'Continental GT',
        pricePerDay: 800,
        location: 'Monaco',
        currency: 'EUR',
        image: '🚗'
      },
      {
        id: 'car-5',
        type: 'luxury-car',
        brand: 'Lamborghini',
        model: 'Huracan',
        pricePerDay: 1500,
        location: 'Miami',
        currency: 'EUR',
        image: '🚗'
      }
    ],
    adventurePackages: [
      {
        id: 'adv-1',
        type: 'adventure-package',
        title: 'Swiss Alps Helicopter Tour',
        location: 'Switzerland',
        duration: '3 hours',
        price: 1200,
        currency: 'EUR',
        image: '🏔️'
      },
      {
        id: 'adv-2',
        type: 'adventure-package',
        title: 'Monaco Grand Prix Experience',
        location: 'Monaco',
        duration: '3 days',
        price: 15000,
        currency: 'EUR',
        image: '🏎️'
      },
      {
        id: 'adv-3',
        type: 'adventure-package',
        title: 'Champagne Region Wine Tour',
        location: 'France',
        duration: '2 days',
        price: 2800,
        currency: 'EUR',
        image: '🍾'
      },
      {
        id: 'adv-4',
        type: 'adventure-package',
        title: 'St. Moritz Ski Experience',
        location: 'Switzerland',
        duration: '5 days',
        price: 8500,
        currency: 'EUR',
        image: '🎿'
      }
    ],
    emptyLegs: [
      {
        id: 'empty-1',
        type: 'empty-leg',
        aircraft: 'Gulfstream G550',
        route: 'ZRH → LHR',
        departure: '2024-01-15T14:00:00Z',
        price: 8500,
        currency: 'EUR',
        discount: 60,
        image: '✈️'
      },
      {
        id: 'empty-2',
        type: 'empty-leg',
        aircraft: 'Cessna Citation X',
        route: 'CDG → BCN',
        departure: '2024-01-16T09:30:00Z',
        price: 5200,
        currency: 'EUR',
        discount: 45,
        image: '✈️'
      },
      {
        id: 'empty-3',
        type: 'empty-leg',
        aircraft: 'Embraer Phenom 300',
        route: 'MUC → VCE',
        departure: '2024-01-17T16:15:00Z',
        price: 3800,
        currency: 'EUR',
        discount: 50,
        image: '✈️'
      }
    ]
  };

  // Landing Page Functions
  const handleServiceSelect = (serviceId) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleStartSearch = () => {
    if (!landingInput.trim() && selectedServices.length === 0) return;
    
    // Check authentication before proceeding
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    
    // Initialize the conversation with user's input
    const initialMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: `I'm traveling to ${landingInput}${selectedServices.length > 0 ? ` and I'm interested in: ${selectedServices.map(s => serviceOptions.find(opt => opt.id === s)?.label).join(', ')}` : ''}`,
      timestamp: new Date()
    };
    
    setMessages([initialMessage]);
    setShowMainModal(true);
    
    // Generate AI response based on destination and selected services
    setTimeout(() => {
      handleInitialAIResponse(landingInput, selectedServices);
    }, 500);
  };

  const handleInitialAIResponse = async (destination: string, services: string[]) => {
    setIsLoading(true);
    
    try {
      const recommendations = generateInitialRecommendations(destination, services);
      
      let aiResponse = `Perfect! I can help you plan your trip to ${destination}. `;
      
      if (recommendations.length > 0) {
        aiResponse += `Based on your interests, I've found ${recommendations.length} service${recommendations.length > 1 ? 's' : ''} from our PrivateCharterX collection that match your requirements:`;
      } else {
        aiResponse += `Let me show you our available services for your destination:`;
      }
      
      const aiMessage: Message = {
        id: Date.now() + 1,
        type: 'agent',
        content: aiResponse,
        timestamp: new Date(),
        serviceCards: recommendations.length > 0 ? recommendations : undefined
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      if (recommendations.length > 0) {
        setShowCart(true);
      }
      
    } catch (error) {
      console.error('AI response error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateInitialRecommendations = (destination: string, services: string[]) => {
    const recommendations: ServiceCard[] = [];
    
    // Generate recommendations based on selected services
    services.forEach(serviceType => {
      switch (serviceType) {
        case 'private-jet':
          mockServices.privateJets.forEach(jet => {
            const estimatedHours = 2;
            const totalPrice = jet.pricePerHour * estimatedHours;
            
            recommendations.push({
              id: jet.id,
              type: 'private-jet',
              title: jet.name,
              subtitle: `${jet.category} • ${jet.capacity} passengers • ${estimatedHours}h flight`,
              price: totalPrice,
              currency: jet.currency,
              details: { ...jet, estimatedHours, route: `→ ${destination}` },
              image: jet.image
            });
          });
          break;
          
        case 'helicopter':
          mockServices.helicopters.forEach(heli => {
            recommendations.push({
              id: heli.id,
              type: 'helicopter',
              title: heli.name,
              subtitle: `${heli.capacity} passengers • ${heli.range}km range`,
              price: heli.pricePerHour * 2,
              currency: heli.currency,
              details: { ...heli, route: `→ ${destination}` },
              image: heli.image
            });
          });
          break;
          
        case 'yacht':
          mockServices.yachts.forEach(yacht => {
            recommendations.push({
              id: yacht.id,
              type: 'yacht',
              title: yacht.name,
              subtitle: `${yacht.length}ft • ${yacht.capacity} guests • Per day`,
              price: yacht.pricePerDay,
              currency: yacht.currency,
              details: yacht,
              image: yacht.image
            });
          });
          break;
          
        case 'luxury-car':
          const destinationCars = mockServices.luxuryCars.filter(car =>
            car.location.toLowerCase().includes(destination?.toLowerCase() || '') ||
            destination?.toLowerCase().includes(car.location.toLowerCase()) ||
            true // Show all cars if no specific match
          );
          
          destinationCars.forEach(car => {
            recommendations.push({
              id: car.id,
              type: 'luxury-car',
              title: `${car.brand} ${car.model}`,
              subtitle: `Available in ${car.location} • Per day`,
              price: car.pricePerDay,
              currency: car.currency,
              details: car,
              image: car.image
            });
          });
          break;
          
        case 'adventure':
          mockServices.adventurePackages.forEach(pkg => {
            recommendations.push({
              id: pkg.id,
              type: 'adventure-package',
              title: pkg.title,
              subtitle: `${pkg.duration} • ${pkg.location}`,
              price: pkg.price,
              currency: pkg.currency,
              details: pkg,
              image: pkg.image
            });
          });
          break;
      }
    });
    
    // If no specific services selected, show empty legs and popular options
    if (services.length === 0) {
      mockServices.emptyLegs.slice(0, 2).forEach(emptyLeg => {
        recommendations.push({
          id: emptyLeg.id,
          type: 'empty-leg',
          title: `${emptyLeg.aircraft} Empty Leg`,
          subtitle: `${emptyLeg.route} • ${emptyLeg.discount}% off • ${new Date(emptyLeg.departure).toLocaleDateString()}`,
          price: emptyLeg.price,
          currency: emptyLeg.currency,
          details: emptyLeg,
          image: emptyLeg.image
        });
      });
    }
    
    return recommendations.slice(0, 8); // Limit to 8 recommendations
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // AI Service recommendation logic
  const analyzeUserRequest = (message: string) => {
    const lowerMessage = message.toLowerCase();
    
    const fromMatch = lowerMessage.match(/from\s+([^to]+)(?=\s+to|\s*$)/);
    const toMatch = lowerMessage.match(/to\s+([^.!?]+)/);
    const passengerMatch = lowerMessage.match(/(\d+)\s*(?:person|people|passenger)/);
    
    const needsJet = lowerMessage.includes('fly') || lowerMessage.includes('flight') || lowerMessage.includes('jet');
    const needsCar = lowerMessage.includes('car') || lowerMessage.includes('transport') || lowerMessage.includes('drive');
    const needsAdventure = lowerMessage.includes('adventure') || lowerMessage.includes('tour') || lowerMessage.includes('experience');
    const needsEmptyLeg = lowerMessage.includes('empty leg') || lowerMessage.includes('discount') || lowerMessage.includes('last minute');
    const needsYacht = lowerMessage.includes('yacht') || lowerMessage.includes('boat') || lowerMessage.includes('charter');
    const needsHelicopter = lowerMessage.includes('helicopter') || lowerMessage.includes('heli');

    return {
      from: fromMatch ? fromMatch[1].trim() : null,
      to: toMatch ? toMatch[1].trim() : null,
      passengers: passengerMatch ? parseInt(passengerMatch[1]) : null,
      needsJet,
      needsCar,
      needsAdventure,
      needsEmptyLeg,
      needsYacht,
      needsHelicopter
    };
  };

  const generateServiceRecommendations = (analysis: any) => {
    const recommendations: ServiceCard[] = [];

    if (analysis.needsEmptyLeg) {
      mockServices.emptyLegs.forEach(emptyLeg => {
        recommendations.push({
          id: emptyLeg.id,
          type: 'empty-leg',
          title: `${emptyLeg.aircraft} Empty Leg`,
          subtitle: `${emptyLeg.route} • ${emptyLeg.discount}% off • ${new Date(emptyLeg.departure).toLocaleDateString()}`,
          price: emptyLeg.price,
          currency: emptyLeg.currency,
          details: emptyLeg,
          image: emptyLeg.image
        });
      });
    }

    if (analysis.needsJet && analysis.passengers) {
      const suitableJets = mockServices.privateJets.filter(jet => 
        jet.capacity >= analysis.passengers
      );
      
      suitableJets.forEach(jet => {
        const estimatedHours = 2;
        const totalPrice = jet.pricePerHour * estimatedHours;
        
        recommendations.push({
          id: jet.id,
          type: 'private-jet',
          title: jet.name,
          subtitle: `${jet.category} • ${jet.capacity} passengers • ${estimatedHours}h flight`,
          price: totalPrice,
          currency: jet.currency,
          details: { ...jet, estimatedHours, route: `${analysis.from} → ${analysis.to}` },
          image: jet.image
        });
      });
    }

    if (analysis.needsHelicopter) {
      mockServices.helicopters.forEach(heli => {
        recommendations.push({
          id: heli.id,
          type: 'helicopter',
          title: heli.name,
          subtitle: `${heli.capacity} passengers • ${heli.range}km range`,
          price: heli.pricePerHour * 2,
          currency: heli.currency,
          details: heli,
          image: heli.image
        });
      });
    }

    if (analysis.needsYacht) {
      mockServices.yachts.forEach(yacht => {
        recommendations.push({
          id: yacht.id,
          type: 'yacht',
          title: yacht.name,
          subtitle: `${yacht.length}ft • ${yacht.capacity} guests • Per day`,
          price: yacht.pricePerDay,
          currency: yacht.currency,
          details: yacht,
          image: yacht.image
        });
      });
    }

    if (analysis.needsCar && analysis.to) {
      const destinationCars = mockServices.luxuryCars.filter(car =>
        car.location.toLowerCase().includes(analysis.to?.toLowerCase() || '')
      );
      
      destinationCars.forEach(car => {
        recommendations.push({
          id: car.id,
          type: 'luxury-car',
          title: `${car.brand} ${car.model}`,
          subtitle: `Available in ${car.location} • Per day`,
          price: car.pricePerDay,
          currency: car.currency,
          details: car,
          image: car.image
        });
      });
    }

    if (analysis.needsAdventure && analysis.to) {
      const localAdventures = mockServices.adventurePackages.filter(pkg =>
        pkg.location.toLowerCase().includes(analysis.to?.toLowerCase() || '')
      );
      
      localAdventures.forEach(pkg => {
        recommendations.push({
          id: pkg.id,
          type: 'adventure-package',
          title: pkg.title,
          subtitle: `${pkg.duration} • ${pkg.location}`,
          price: pkg.price,
          currency: pkg.currency,
          details: pkg,
          image: pkg.image
        });
      });
    }

    return recommendations;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    // Check authentication before sending messages
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    
    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      const analysis = analyzeUserRequest(userMessage.content);
      const recommendations = generateServiceRecommendations(analysis);
      
      let aiResponse = '';
      
      if (analysis.from && analysis.to) {
        aiResponse = `Perfect! I can help you plan your trip from ${analysis.from} to ${analysis.to}. `;
        
        if (!analysis.passengers) {
          aiResponse += 'How many passengers will be traveling? ';
        }
        
        if (recommendations.length > 0) {
          aiResponse += `Here are some options from our PrivateCharterX fleet:\n\nI've found ${recommendations.length} service${recommendations.length > 1 ? 's' : ''} that match your requirements. You can select any of these to add to your booking.`;
        }
      } else {
        aiResponse = "I'd be happy to help you plan your travel! Could you tell me more about your trip? For example:\n\n• Where are you traveling from and to?\n• How many passengers?\n• What type of services do you need? (private jet, helicopter, yacht, luxury car, experiences)";
      }
      
      const aiMessage: Message = {
        id: Date.now() + 1,
        type: 'agent',
        content: aiResponse,
        timestamp: new Date(),
        serviceCards: recommendations.length > 0 ? recommendations : undefined
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      if (recommendations.length > 0) {
        setShowCart(true);
      }
      
    } catch (error) {
      console.error('AI response error:', error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        type: 'agent',
        content: "I apologize for the technical difficulty. Please try again or provide more specific details about your travel requirements.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auth Modal Handlers
  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    // If user was trying to start a search, continue with it
    if (landingInput.trim() || selectedServices.length > 0) {
      setTimeout(() => {
        handleStartSearch();
      }, 100);
    }
  };

  const handleSwitchToRegister = () => {
    setShowLoginModal(false);
    setShowRegisterForm(true);
  };

  const handleSwitchToLogin = () => {
    setShowRegisterForm(false);
    setShowLoginModal(true);
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (!user) return 'Guest';
    if (user.first_name) {
      return user.first_name;
    }
    // Extract name from email if no first name
    return user.email?.split('@')[0] || 'Guest';
  };

  const openBookingModal = (serviceCard: ServiceCard) => {
    setBookingModal({
      isOpen: true,
      service: serviceCard,
      type: serviceCard.type
    });
  };

  const closeBookingModal = () => {
    setBookingModal({ isOpen: false, service: null, type: null });
  };

  const addToCart = (serviceCard: ServiceCard, customizations?: any) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === serviceCard.id);
      if (existing) {
        return prev.map(item => 
          item.id === serviceCard.id 
            ? { ...item, quantity: (item.quantity || 1) + 1, customizations }
            : item
        );
      } else {
        return [...prev, { ...serviceCard, quantity: 1, customizations }];
      }
    });
    closeBookingModal();
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  const formatPrice = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleLandingKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleStartSearch();
    }
  };

  const sidebarItems = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'history', label: 'History', icon: History },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
    { id: 'events', label: 'Upcoming Events', icon: Bell },
    { id: 'emptylegs', label: 'Empty Legs', icon: Route },
    { id: 'tokenization', label: 'Tokenization', icon: Shield },
    { id: 'mapx', label: 'MapX', icon: MapPin }
  ];

  // Map functions from enhancedMap
  const geocodeLocation = async (location) => {
    if (!location) {
      console.warn('No location provided for geocoding');
      return null;
    }

    try {
      // Mock geocoding for demo
      const mockCoords = {
        'zurich': { lat: 47.3769, lng: 8.5417 },
        'london': { lat: 51.5155, lng: -0.1229 },
        'miami': { lat: 25.7617, lng: -80.1918 },
        'switzerland': { lat: 46.8182, lng: 8.2275 }
      };
      
      const key = location.toLowerCase();
      return mockCoords[key] || { lat: 47.3769, lng: 8.5417 };
    } catch (error) {
      console.error('Geocoding failed:', error);
      return null;
    }
  };

  const fetchLuxuryCars = async () => {
    try {
      // Mock data for demo
      const mockCars = [
        {
          id: 'car-1',
          name: 'Mercedes-Benz S-Class',
          brand: 'Mercedes-Benz',
          model: 'S-Class',
          price_per_day: 350,
          location: 'Zurich',
          currency: 'EUR',
          type_category: 'luxury-car',
          image_url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=200&q=80',
          lat: 47.3769,
          lng: 8.5417
        },
        {
          id: 'car-2',
          name: 'BMW 7 Series',
          brand: 'BMW',
          model: '7 Series',
          price_per_day: 320,
          location: 'London',
          currency: 'EUR',
          type_category: 'luxury-car',
          image_url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=200&q=80',
          lat: 51.5155,
          lng: -0.1229
        }
      ];
      setLuxuryCars(mockCars);
    } catch (error) {
      console.error('Error fetching luxury cars:', error);
      setMapError('Failed to fetch luxury cars');
    }
  };

  const fetchAdventurePackages = async () => {
    try {
      // Mock data for demo
      const mockPackages = [
        {
          id: 'adv-1',
          title: 'Swiss Alps Helicopter Tour',
          name: 'Swiss Alps Helicopter Tour',
          location: 'Switzerland',
          destination: 'Switzerland',
          duration: '3 hours',
          price: 1200,
          currency: 'EUR',
          type_category: 'adventure-package',
          image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=200&q=80',
          lat: 46.8182,
          lng: 8.2275
        }
      ];
      setAdventurePackages(mockPackages);
    } catch (error) {
      console.error('Error fetching adventure packages:', error);
      setMapError('Failed to fetch adventure packages');
    }
  };

  useEffect(() => {
    if (sidebarView === 'mapx') {
      const fetchMapData = async () => {
        setMapIsLoading(true);
        setMapError(null);
        try {
          await Promise.all([
            fetchLuxuryCars(),
            fetchAdventurePackages()
          ]);
        } catch (err) {
          setMapError(`Failed to load services: ${err.message}`);
        } finally {
          setMapIsLoading(false);
        }
      };
      fetchMapData();
    }
  }, [sidebarView]);

  const allServices = [
    ...OFFICE_LOCATIONS,
    ...luxuryCars,
    ...adventurePackages
  ];

  const filteredServices = allServices.filter(service => {
    const matchesSearch = searchTerm === '' ||
      service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.origin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' ||
      service.type_category === selectedCategory ||
      (selectedCategory === 'office' && service.type === 'office');

    const servicePrice = service.price_per_day || service.price || 0;
    const matchesPrice = priceRange === 'all' ||
      (priceRange === 'budget' && servicePrice < 5000) ||
      (priceRange === 'mid' && servicePrice >= 5000 && servicePrice < 20000) ||
      (priceRange === 'luxury' && servicePrice >= 20000);

    return matchesSearch && matchesCategory && matchesPrice;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'featured':
        return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
      case 'price-low':
        return (a.price_per_day || a.price || 0) - (b.price_per_day || b.price || 0);
      case 'price-high':
        return (b.price_per_day || b.price || 0) - (a.price_per_day || a.price || 0);
      case 'name':
        return (a.name || a.title || '').localeCompare(b.name || b.title || '');
      default:
        return 0;
    }
  });

  // Map event handlers
  useEffect(() => {
    if (isMobile) return;

    let isActive = true;
    let animationId = null;

    const animate = () => {
      if (!isActive || !mapLoaded || !mapRef.current || rotationPaused) return;

      const shouldRotate = !searchTerm &&
        selectedCategory === 'all' &&
        !selectedLocation &&
        !showPopup;

      if (shouldRotate) {
        setMapViewState(prev => ({
          ...prev,
          bearing: (prev.bearing + 0.03) % 360,
          transitionDuration: 0
        }));

        if (isActive) {
          animationId = requestAnimationFrame(animate);
        }
      }
    };

    if (mapLoaded && !rotationPaused && sidebarView === 'mapx') {
      const timeoutId = setTimeout(() => {
        if (isActive && !searchTerm && selectedCategory === 'all' && !selectedLocation) {
          animationId = requestAnimationFrame(animate);
        }
      }, 2000);

      return () => {
        isActive = false;
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
        clearTimeout(timeoutId);
      };
    }

    return () => {
      isActive = false;
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [mapLoaded, searchTerm, selectedCategory, isMobile, rotationPaused, selectedLocation, showPopup, sidebarView]);

  useEffect(() => {
    if (mapRef.current && mapViewState.zoom >= 14 && !is3DMode) {
      setIs3DMode(true);
      mapRef.current.easeTo({
        pitch: 60,
        bearing: 45,
        duration: 1000
      });
    } else if (mapRef.current && mapViewState.zoom < 12 && is3DMode) {
      setIs3DMode(false);
      mapRef.current.easeTo({
        pitch: 0,
        bearing: 0,
        duration: 1000
      });
    }
  }, [mapViewState.zoom, is3DMode]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        setIsCtrlPressed(true);
      }
    };

    const handleKeyUp = (e) => {
      if (!e.ctrlKey && !e.metaKey) {
        setIsCtrlPressed(false);
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleWheel = (e) => {
      if ((e.ctrlKey || e.metaKey) && mapRef.current) {
        const mapContainer = mapRef.current.getContainer();
        const rect = mapContainer.getBoundingClientRect();
        const isOverMap = e.clientX >= rect.left && e.clientX <= rect.right &&
          e.clientY >= rect.top && e.clientY <= rect.bottom;

        if (isOverMap) {
          e.preventDefault();
          e.stopPropagation();

          const map = mapRef.current.getMap();
          const zoomDelta = e.deltaY > 0 ? -1 : 1;
          const currentZoom = map.getZoom();
          const newZoom = Math.max(map.getMinZoom(), Math.min(map.getMaxZoom(), currentZoom + zoomDelta));

          map.easeTo({
            zoom: newZoom,
            duration: 250
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const handleMapLoad = () => {
    if (!mapLoaded) {
      setMapLoaded(true);
    }
  };

  const handleMarkerClick = (location) => {
    if (!location) return;
    setSelectedLocation(location);
    setShowPopup(true);
    setRotationPaused(true);
  };

  const handleMapClick = () => {
    setRotationPaused(true);
  };

  const getMarkerIcon = (service) => {
    if (service.type === 'office') return Building2;
    if (service.type_category === 'luxury-car') return Car;
    if (service.type_category === 'adventure-package') return Mountain;
    return MapPin;
  };

  const getServicePrice = (service) => {
    if (service.price_per_day) {
      return `${getCurrencySymbol(service.currency)} ${service.price_per_day.toLocaleString()}/day`;
    }
    if (service.price) {
      return `${getCurrencySymbol(service.currency)} ${service.price.toLocaleString()}`;
    }
    if (service.price_on_request) {
      return 'Price on Request';
    }
    return 'Contact for pricing';
  };

  const getMarkerSize = () => isMobile ? 20 : 16;
  const getMarkerPadding = () => isMobile ? 'p-3' : 'p-2';

  // Booking Modal Component
  const BookingModalComponent = () => {
    const [formData, setFormData] = useState({
      passengers: 1,
      luggage: 1,
      departureDate: '',
      departureTime: '10:00',
      returnDate: '',
      notes: ''
    });

    if (!bookingModal.isOpen || !bookingModal.service) return null;

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      addToCart(bookingModal.service!, formData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="p-8 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-light text-gray-900">Customize Your Booking</h2>
              <button
                onClick={closeBookingModal}
                className="p-2 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <h3 className="font-medium text-gray-900 mb-2">{bookingModal.service.title}</h3>
              <p className="text-sm text-gray-500 mb-3">{bookingModal.service.subtitle}</p>
              <p className="text-lg font-light text-gray-900">
                {formatPrice(bookingModal.service.price, bookingModal.service.currency)}
              </p>
            </div>

            {(bookingModal.type === 'private-jet' || bookingModal.type === 'helicopter') && (
              <>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Passengers</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={formData.passengers}
                      onChange={(e) => setFormData(prev => ({ ...prev, passengers: parseInt(e.target.value) }))}
                      className="w-full p-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Luggage pieces</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={formData.luggage}
                      onChange={(e) => setFormData(prev => ({ ...prev, luggage: parseInt(e.target.value) }))}
                      className="w-full p-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Departure Date</label>
                    <input
                      type="date"
                      value={formData.departureDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, departureDate: e.target.value }))}
                      className="w-full p-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Departure Time</label>
                    <input
                      type="time"
                      value={formData.departureTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, departureTime: e.target.value }))}
                      className="w-full p-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            {(bookingModal.type === 'luxury-car' || bookingModal.type === 'yacht') && (
              <>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Start Date</label>
                    <input
                      type="date"
                      value={formData.departureDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, departureDate: e.target.value }))}
                      className="w-full p-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">End Date</label>
                    <input
                      type="date"
                      value={formData.returnDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, returnDate: e.target.value }))}
                      className="w-full p-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Special Requirements</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any special requests or requirements..."
                className="w-full p-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all h-24 resize-none"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={closeBookingModal}
                className="flex-1 py-4 px-6 border border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-4 px-6 bg-black text-white rounded-2xl hover:bg-gray-800 transition-colors font-medium"
              >
                Add to Cart
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Sidebar Content Components
  const renderSidebarContent = () => {
    switch (sidebarView) {
      case 'history':
        return (
          <div className="p-6 space-y-4">
            <h3 className="font-medium text-gray-900">Chat History</h3>
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer hover:border-gray-200 transition-colors">
                <p className="font-medium text-sm text-gray-900">Trip to Switzerland</p>
                <p className="text-xs text-gray-500 mt-1">2 days ago</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer hover:border-gray-200 transition-colors">
                <p className="font-medium text-sm text-gray-900">London Business Trip</p>
                <p className="text-xs text-gray-500 mt-1">1 week ago</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer hover:border-gray-200 transition-colors">
                <p className="font-medium text-sm text-gray-900">Monaco Grand Prix</p>
                <p className="text-xs text-gray-500 mt-1">2 weeks ago</p>
              </div>
            </div>
          </div>
        );

      case 'bookings':
        return (
          <div className="p-6 space-y-4">
            <h3 className="font-medium text-gray-900">My Bookings</h3>
            <div className="space-y-3">
              <div className="p-4 bg-green-50 border border-green-100 rounded-2xl">
                <p className="font-medium text-sm text-green-900">Confirmed</p>
                <p className="text-xs text-green-700 mt-1">ZRH → LHR • Jan 15</p>
                <p className="text-xs text-green-600 mt-1">Gulfstream G550</p>
              </div>
              <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-2xl">
                <p className="font-medium text-sm text-yellow-900">Pending</p>
                <p className="text-xs text-yellow-700 mt-1">Car Rental • Jan 16</p>
                <p className="text-xs text-yellow-600 mt-1">Mercedes S-Class</p>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                <p className="font-medium text-sm text-blue-900">Quote Requested</p>
                <p className="text-xs text-blue-700 mt-1">Yacht Charter • Jan 20</p>
                <p className="text-xs text-blue-600 mt-1">Sunseeker Predator 68</p>
              </div>
            </div>
          </div>
        );

      case 'calendar':
        return (
          <div className="p-6">
            <h3 className="font-medium text-gray-900 mb-4">Calendar View</h3>
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <div className="space-y-4">
                <div className="p-3 bg-white rounded-lg border">
                  <p className="text-sm font-medium text-gray-900">Flight to Zurich</p>
                  <p className="text-xs text-gray-500">Tomorrow, 10:00 AM</p>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <p className="text-sm font-medium text-gray-900">Meeting in London</p>
                  <p className="text-xs text-gray-500">Jan 16, 2:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'events':
        return (
          <div className="p-6 space-y-4">
            <h3 className="font-medium text-gray-900">Upcoming Events</h3>
            <div className="space-y-3">
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                <p className="font-medium text-sm text-blue-900">Board Meeting</p>
                <p className="text-xs text-blue-700 mt-1">Tomorrow, 10:00 AM</p>
                <p className="text-xs text-blue-600 mt-1">London Office</p>
              </div>
              <div className="p-4 bg-purple-50 border border-purple-100 rounded-2xl">
                <p className="font-medium text-sm text-purple-900">Monaco Grand Prix</p>
                <p className="text-xs text-purple-700 mt-1">May 26-28, 2024</p>
                <p className="text-xs text-purple-600 mt-1">VIP Package Available</p>
              </div>
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                <p className="font-medium text-sm text-indigo-900">Cannes Film Festival</p>
                <p className="text-xs text-indigo-700 mt-1">May 14-25, 2024</p>
                <p className="text-xs text-indigo-600 mt-1">Yacht Charter Available</p>
              </div>
            </div>
          </div>
        );

      case 'emptylegs':
        return (
          <div className="p-6 space-y-4">
            <h3 className="font-medium text-gray-900">Empty Legs</h3>
            <div className="space-y-3">
              {mockServices.emptyLegs.map(leg => (
                <div key={leg.id} className="p-4 bg-orange-50 border border-orange-100 rounded-2xl">
                  <p className="font-medium text-sm text-orange-900">{leg.aircraft}</p>
                  <p className="text-xs text-orange-700 mt-1">{leg.route} • {leg.discount}% off</p>
                  <p className="text-xs font-medium text-orange-900 mt-2">{formatPrice(leg.price)}</p>
                  <p className="text-xs text-orange-600 mt-1">{new Date(leg.departure).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'tokenization':
        return (
          <div className="p-6 space-y-4">
            <h3 className="font-medium text-gray-900">Tokenization</h3>
            <div className="space-y-3">
              <div className="p-4 bg-purple-50 border border-purple-100 rounded-2xl">
                <p className="font-medium text-sm text-purple-900">Flight Token #001</p>
                <p className="text-xs text-purple-700 mt-1">ZRH → LHR • Valid until Dec 31</p>
                <p className="text-xs font-medium text-purple-900 mt-2">€12,500</p>
              </div>
              <div className="p-4 bg-purple-50 border border-purple-100 rounded-2xl">
                <p className="font-medium text-sm text-purple-900">Charter Token #002</p>
                <p className="text-xs text-purple-700 mt-1">Multi-route package • 10h remaining</p>
                <p className="text-xs font-medium text-purple-900 mt-2">€45,000</p>
              </div>
              <div className="p-4 bg-purple-50 border border-purple-100 rounded-2xl">
                <p className="font-medium text-sm text-purple-900">Yacht Token #003</p>
                <p className="text-xs text-purple-700 mt-1">Mediterranean package • 7 days</p>
                <p className="text-xs font-medium text-purple-900 mt-2">€85,000</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // MapX Component - Complete enhanced map inside floating container
  const MapXComponent = () => (
    <div className="flex h-full">
      {/* Map Services Sidebar - Collapsible */}
      <div className={`border-r border-gray-100 flex flex-col bg-white/80 backdrop-blur-sm transition-all duration-300 ${
        mapSidebarCollapsed ? 'w-16' : 'w-96'
      }`}>
        
        <button
          onClick={() => setMapSidebarCollapsed(!mapSidebarCollapsed)}
          className="absolute top-6 -right-3 w-6 h-6 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors z-20"
        >
          <ChevronLeft
            size={14}
            className={`text-gray-600 transition-transform ${mapSidebarCollapsed ? 'rotate-180' : ''}`}
          />
        </button>

        {mapSidebarCollapsed ? (
          <div className="p-4 flex flex-col items-center gap-4 pt-8">
            <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
              <Search size={16} className="text-gray-400" />
            </div>
            <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
              <SlidersHorizontal size={16} className="text-gray-400" />
            </div>
            <div className="text-xs text-gray-500 font-medium transform -rotate-90 mt-4">
              {filteredServices.length}
            </div>
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-medium text-gray-900">Services</h1>
                <div className="text-sm text-gray-500">{filteredServices.length} results</div>
              </div>

              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setRotationPaused(true);
                  }}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
                />
                <Search size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'luxury-car', label: 'Cars' },
                  { id: 'adventure-package', label: 'Adventures' },
                  { id: 'office', label: 'Offices' }
                ].map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${selectedCategory === category.id
                        ? 'bg-black text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100'
                      }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors border border-gray-100 rounded-xl w-full justify-center bg-gray-50 hover:bg-gray-100"
              >
                <SlidersHorizontal size={16} />
                Filters
                {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showFilters && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-4 border border-gray-100">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Price Range</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'all', label: 'All' },
                        { id: 'budget', label: '< €5k' },
                        { id: 'mid', label: '€5k-20k' },
                        { id: 'luxury', label: '€20k+' }
                      ].map((range) => (
                        <button
                          key={range.id}
                          onClick={() => setPriceRange(range.id)}
                          className={`px-3 py-2 rounded-lg text-xs transition-all ${priceRange === range.id
                              ? 'bg-black text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                            }`}
                        >
                          {range.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                      <option value="featured">Featured</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="name">Name A-Z</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {mapIsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin"></div>
                </div>
              ) : mapError ? (
                <div className="text-center py-12 px-6">
                  <p className="text-red-600 mb-3 text-sm">{mapError}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="text-gray-700 hover:text-black underline text-sm font-medium"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="p-6 pt-0 space-y-4">
                  {filteredServices.map((service) => (
                    <div
                      key={service.id}
                      className="bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:border-gray-200 group"
                      onClick={() => {
                        setSelectedLocation(service);
                        setShowPopup(true);
                        setRotationPaused(true);

                        if (mapRef.current && service.lat && service.lng) {
                          mapRef.current.flyTo({
                            center: [service.lng, service.lat],
                            zoom: 12,
                            pitch: is3DMode ? 60 : 0,
                            bearing: is3DMode ? 45 : 0,
                            duration: 2000
                          });
                        }
                      }}
                    >
                      <div className="flex gap-4 p-4">
                        <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                          <img
                            src={service.image_url || 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=200&q=80'}
                            alt={service.name || service.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h3 className="font-medium text-gray-900 text-sm truncate pr-2">
                              {service.name || service.title}
                            </h3>
                            {service.is_featured && (
                              <div className="bg-black text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 flex-shrink-0">
                                <Star size={8} />
                              </div>
                            )}
                          </div>

                          <p className="text-xs text-gray-500 mb-2 truncate">
                            {service.location || service.destination || service.city}
                          </p>

                          <div className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-medium mb-2 bg-gray-100 text-gray-700 border border-gray-200">
                            {service.type_category === 'luxury-car' && <Car size={8} />}
                            {service.type_category === 'adventure-package' && <Mountain size={8} />}
                            {service.type === 'office' && <Building2 size={8} />}
                            {service.type || service.package_type || 'Office'}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-gray-900">
                              {(service.price_per_day || service.price) ? getServicePrice(service) : 'Contact for pricing'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredServices.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-gray-500 mb-3 text-sm">No services found</p>
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedCategory('all');
                          setPriceRange('all');
                          setRotationPaused(false);
                        }}
                        className="text-gray-700 hover:text-black underline text-sm font-medium"
                      >
                        Clear all filters
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Map Container */}
      <div className="flex-1 relative rounded-3xl overflow-hidden">
        <Map
          ref={mapRef}
          {...mapViewState}
          onMove={evt => setMapViewState(evt.viewState)}
          onLoad={handleMapLoad}
          onClick={handleMapClick}
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            zIndex: 1
          }}
          mapStyle={is3DMode ? "mapbox://styles/mapbox/satellite-streets-v12" : "mapbox://styles/mapbox/light-v11"}
          mapboxAccessToken={MAPBOX_TOKEN}
          attributionControl={false}
          scrollZoom={isCtrlPressed || isFullscreen}
          dragRotate={true}
          touchZoomRotate={true}
          minZoom={2}
          maxZoom={18}
          doubleClickZoom={false}
          touchPitch={true}
          projection="mercator"
        >
          
          {/* 3D Buildings and Terrain */}
          {is3DMode && mapLoaded && (
            <>
              <Source
                id="mapbox-dem"
                type="raster-dem"
                url="mapbox://mapbox.mapbox-terrain-dem-v1"
                tileSize={512}
                maxzoom={14}
              />
              <Source
                id="composite"
                type="vector"
                url="mapbox://mapbox.mapbox-streets-v8"
              >
                <Layer
                  id="building-3d"
                  source-layer="building"
                  type="fill-extrusion"
                  minzoom={14}
                  paint={{
                    'fill-extrusion-color': [
                      'case',
                      ['boolean', ['feature-state', 'hover'], false],
                      '#ff0000',
                      '#aaa'
                    ],
                    'fill-extrusion-height': [
                      'interpolate',
                      ['linear'],
                      ['zoom'],
                      15, 0,
                      15.05, ['coalesce', ['get', 'height'], 30]
                    ],
                    'fill-extrusion-base': [
                      'interpolate',
                      ['linear'],
                      ['zoom'],
                      15, 0,
                      15.05, ['coalesce', ['get', 'min_height'], 0]
                    ],
                    'fill-extrusion-opacity': 0.8
                  }}
                />
              </Source>
            </>
          )}

          {/* Map Controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
            <NavigationControl showCompass={true} showZoom={true} />
            {!isMobile && <FullscreenControl />}
            <GeolocateControl
              trackUserLocation
              showUserHeading={true}
              showAccuracyCircle={false}
            />

            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <button
                onClick={() => {
                  const newMode = !is3DMode;
                  setIs3DMode(newMode);

                  if (mapRef.current) {
                    if (newMode) {
                      mapRef.current.easeTo({
                        pitch: 60,
                        bearing: 45,
                        zoom: Math.max(mapViewState.zoom, 12),
                        duration: 1500
                      });
                    } else {
                      mapRef.current.easeTo({
                        pitch: 0,
                        bearing: 0,
                        duration: 1500
                      });
                    }
                  }
                }}
                className="flex items-center w-full px-3 py-2 transition-all duration-200 hover:bg-gray-50"
                title={is3DMode ? 'Switch to 2D View' : 'Switch to 3D View'}
              >
                <div className="flex items-center gap-2">
                  <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${is3DMode ? 'bg-black' : 'bg-gray-200'
                    }`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition-transform ${is3DMode ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                  </div>

                  <span className="text-sm font-medium text-gray-700">
                    3D View
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Markers */}
          {filteredServices.map((service) => {
            if (service.type === 'office') {
              const IconComponent = getMarkerIcon(service);
              return (
                <Marker
                  key={service.id}
                  longitude={service.lng}
                  latitude={service.lat}
                  anchor="center"
                  onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    handleMarkerClick(service);
                  }}
                >
                  <div className="relative cursor-pointer group">
                    <div className={`${getMarkerPadding()} bg-gradient-to-b from-gray-600 to-gray-800 rounded-lg shadow-xl transform transition-transform group-hover:scale-110 relative border-2 border-white`}>
                      <IconComponent size={getMarkerSize()} className="text-white" />
                    </div>
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45 border border-white" />
                  </div>
                </Marker>
              );
            }

            return (
              <Marker
                key={service.id}
                longitude={service.lng}
                latitude={service.lat}
                anchor="center"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  handleMarkerClick(service);
                }}
              >
                <div className="relative cursor-pointer group">
                  <div className="w-5 h-5 bg-gradient-to-b from-gray-500 to-gray-700 rounded-full shadow-xl transform transition-transform group-hover:scale-125 relative border-2 border-white">
                    {service.is_featured && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-black rounded-full flex items-center justify-center border border-white">
                        <Star size={8} className="text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </Marker>
            );
          })}

          {/* Popup */}
          {showPopup && selectedLocation && (
            <Popup
              longitude={selectedLocation.lng}
              latitude={selectedLocation.lat}
              anchor="bottom"
              onClose={() => {
                setShowPopup(false);
                setRotationPaused(false);
              }}
              closeButton={false}
              closeOnClick={false}
              className="z-50"
              offset={25}
              maxWidth="350px"
            >
              <div className="p-0 overflow-hidden rounded-2xl shadow-2xl bg-white/95 backdrop-blur-xl border border-gray-100">
                {selectedLocation.image_url && (
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={selectedLocation.image_url}
                      alt={selectedLocation.name || selectedLocation.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>

                    {selectedLocation.is_featured && (
                      <div className="absolute top-3 right-3 bg-black text-white text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1 shadow-lg">
                        <Star size={12} />
                        Featured
                      </div>
                    )}
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900 text-lg">
                      {selectedLocation.name || selectedLocation.title}
                    </h3>
                    <button
                      onClick={() => {
                        setShowPopup(false);
                        setRotationPaused(false);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="mb-4">
                    <span className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full font-medium bg-gray-50 text-gray-800 border border-gray-100">
                      {selectedLocation.type_category === 'luxury-car' && <Car size={14} />}
                      {selectedLocation.type_category === 'adventure-package' && <Mountain size={14} />}
                      {selectedLocation.type === 'office' && <Building2 size={14} />}
                      {selectedLocation.type || selectedLocation.package_type || 'Office'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-gray-600">
                      <MapPin size={16} />
                      <span className="text-sm font-medium">
                        {selectedLocation.location || selectedLocation.destination || selectedLocation.city}
                      </span>
                    </div>

                    {(selectedLocation.price_per_day || selectedLocation.price) && (
                      <div className="flex items-center gap-3 text-gray-600">
                        <DollarSign size={16} />
                        <span className="text-sm font-medium">{getServicePrice(selectedLocation)}</span>
                      </div>
                    )}

                    {selectedLocation.duration && (
                      <div className="flex items-center gap-3 text-gray-600">
                        <Clock size={16} />
                        <span className="text-sm font-medium">{selectedLocation.duration}</span>
                      </div>
                    )}
                  </div>

                  {selectedLocation.type === 'office' && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock size={12} />
                        <span className="font-medium">{selectedLocation.hours}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          )}
        </Map>
      </div>
    </div>
  );

  // LANDING PAGE - Show this first
  if (!showMainModal) {
    // Show loading spinner while initializing auth
    if (initializing) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white" style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
          fontWeight: '400',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale'
        }}>
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500 text-sm">Loading PrivateCharterX...</p>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="min-h-screen flex flex-col bg-white" style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
          fontWeight: '400',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale'
        }}>
          <Header />
          
          <main className="flex-1 flex items-center justify-center px-4 py-8 pt-24">
            <div className="w-full max-w-4xl mx-auto">
              
              {/* Hero Title - Show user name or guest, always show search interface */}
              <div className="text-center mb-8">
                <h1 className="text-2xl md:text-4xl font-light text-gray-900 tracking-tight mb-2">
                  Hello, {getUserDisplayName()}
                </h1>
                <p className="text-base text-gray-500 font-light">
                  Find What Matters, Faster.
                </p>
              </div>

              {/* Always Show Search Interface - No Auth Gate */}
              <div className="mb-6">
                <div className="max-w-3xl mx-auto">
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
                    
                    {/* Location Input */}
                    <div className="relative mb-3">
                      <div className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg">
                        <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                        <input
                          type="text"
                          value={landingInput}
                          onChange={(e) => setLandingInput(e.target.value)}
                          onKeyDown={handleLandingKeyDown}
                          placeholder="New York, NY 10038, United States"
                          className="flex-1 text-sm bg-transparent border-0 outline-none placeholder-gray-400 text-gray-900"
                        />
                        <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                          <X size={14} className="text-gray-400" />
                        </button>
                      </div>
                    </div>

                    {/* Date and Time Selection */}
                    <div className="flex flex-col md:flex-row gap-2 mb-3">
                      <div className="flex-1 flex items-center gap-2 p-3 border border-gray-200 rounded-lg">
                        <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-700">Mon 16 Aug</span>
                      </div>
                      
                      <div className="flex-1 flex items-center gap-2 p-3 border border-gray-200 rounded-lg">
                        <Clock size={16} className="text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-700">10:00</span>
                      </div>
                      
                      <div className="flex-1 flex items-center gap-2 p-3 border border-gray-200 rounded-lg">
                        <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-700">Wed 18 Aug</span>
                      </div>
                      
                      <div className="flex-1 flex items-center gap-2 p-3 border border-gray-200 rounded-lg">
                        <Clock size={16} className="text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-700">14:00</span>
                      </div>
                      
                      <button
                        onClick={handleStartSearch}
                        disabled={!landingInput.trim() && selectedServices.length === 0}
                        className="bg-black hover:bg-gray-800 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg transition-colors disabled:cursor-not-allowed font-medium text-sm"
                      >
                        Search
                      </button>
                    </div>

                    {/* Service Category Filters */}
                    <div className="flex flex-wrap gap-1.5">
                      {serviceOptions.slice(0, 4).map((service) => {
                        const isSelected = selectedServices.includes(service.id);
                        
                        return (
                          <button
                            key={service.id}
                            onClick={() => handleServiceSelect(service.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                              isSelected 
                                ? 'bg-black text-white' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {service.label.replace(' Booking', '').replace(' Charter', '')}
                          </button>
                        );
                      })}
                      
                      <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 transition-colors border border-gray-200 rounded-full hover:border-gray-300">
                        <SlidersHorizontal size={12} />
                        Filter
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Access Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-w-3xl mx-auto mb-6">
                {[
                  { title: 'Next opportunity?', icon: Search },
                  { title: 'Analyze data?', icon: MessageSquare },
                  { title: 'Latest info?', icon: Globe },
                  { title: 'Plan smoothly?', icon: Calendar }
                ].map((item, index) => {
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        setLandingInput(item.title);
                        handleStartSearch();
                      }}
                      className="bg-gray-50 hover:bg-gray-100 rounded-lg p-3 text-left transition-colors border border-gray-100 hover:border-gray-200"
                    >
                      <div className="mb-2">
                        <IconComponent size={14} className="text-gray-500" />
                      </div>
                      <h3 className="text-xs font-medium text-gray-900">
                        {item.title}
                      </h3>
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-2">
                  Powered by PrivateCharterX
                </p>
                <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                  <span>Secure</span>
                  <span>24/7</span>
                  <span>Luxury Fleet</span>
                </div>
              </div>
            </div>
          </main>
          
          <Footer />
        </div>

        {/* Authentication Modals - Only show when needed */}
        {showLoginModal && (
          <LoginModal
            onClose={() => setShowLoginModal(false)}
            onSwitchToRegister={handleSwitchToRegister}
            onSuccess={handleLoginSuccess}
          />
        )}
      </>
    );
  }

  // MAIN MODAL - Complete chat interface with all features
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-7xl h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden relative">
        
        {/* Close Button */}
        <button
          onClick={() => {
            setShowMainModal(false);
            setMessages([]);
            setCartItems([]);
            setSelectedServices([]);
            setLandingInput('');
          }}
          className="absolute top-6 right-6 z-50 p-2 hover:bg-gray-100 rounded-full transition-colors bg-white shadow-lg"
        >
          <X size={20} className="text-gray-600" />
        </button>
        
        <div className="flex h-full">
          
          {/* Collapsible Left Sidebar - Inside frame */}
          <div className={`border-r border-gray-100 flex flex-col bg-white/80 backdrop-blur-sm transition-all duration-300 ${
            sidebarCollapsed ? 'w-16' : 'w-64'
          }`}>
            
            {/* Sidebar Toggle Button */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              {!sidebarCollapsed && (
                <div>
                  <h2 className="font-medium text-gray-900">AI Travel Designer</h2>
                  <p className="text-sm text-gray-500 mt-1">PrivateCharterX</p>
                </div>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <ChevronLeft className={`w-4 h-4 text-gray-400 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
              </button>
            </div>
            
            {/* Navigation */}
            <nav className="flex-1 p-4">
              {sidebarItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSidebarView(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors mb-1 text-sm ${
                      sidebarView === item.id 
                        ? 'bg-black text-white' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } ${sidebarCollapsed ? 'justify-center' : ''}`}
                    title={sidebarCollapsed ? item.label : ''}
                  >
                    <IconComponent size={16} />
                    {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
                  </button>
                );
              })}
            </nav>
            
            {/* Cart Button */}
            {cartItems.length > 0 && (
              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={() => setShowCart(!showCart)}
                  className={`w-full flex items-center justify-between px-4 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors text-sm font-medium ${
                    sidebarCollapsed ? 'justify-center' : ''
                  }`}
                  title={sidebarCollapsed ? `Cart (${cartItems.length})` : ''}
                >
                  {sidebarCollapsed ? (
                    <div className="relative">
                      <CreditCard size={16} />
                      <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {cartItems.length}
                      </div>
                    </div>
                  ) : (
                    <>
                      <span>Cart ({cartItems.length})</span>
                      <span>{formatPrice(getTotalPrice())}</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Sidebar Content */}
            {sidebarView !== 'chat' && sidebarView !== 'mapx' && !sidebarCollapsed && (
              <div className="border-t border-gray-100 max-h-64 overflow-y-auto">
                {renderSidebarContent()}
              </div>
            )}
          </div>

          {/* Main Chat Area */}
          {sidebarView === 'chat' && (
            <div className="flex-1 flex flex-col">
              
              {/* Chat Header - Contemporary styling */}
              <div className="p-6 border-b border-gray-100">
                <h1 className="text-2xl font-light text-gray-900 mb-2">
                  AI Travel Designer
                </h1>
                <p className="text-gray-500 text-base font-light">
                  PrivateCharterX • Plan your perfect luxury journey
                </p>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="max-w-4xl mx-auto">
                  {messages.map((message) => (
                    <div key={message.id}>
                      <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-2xl rounded-2xl px-6 py-4 ${
                            message.type === 'user'
                              ? 'bg-black text-white'
                              : 'bg-gray-50 text-gray-900 border border-gray-100'
                          }`}
                        >
                          {message.type === 'agent' && (
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                                <Sparkles size={12} className="text-gray-500" />
                              </div>
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                AI Travel Designer
                              </span>
                            </div>
                          )}
                          <div className="whitespace-pre-wrap leading-relaxed text-sm">
                            {message.content}
                          </div>
                        </div>
                      </div>

                      {/* Service Cards */}
                      {message.serviceCards && message.serviceCards.length > 0 && (
                        <div className="mt-4 space-y-3 max-w-2xl">
                          {message.serviceCards.map((card) => (
                            <div
                              key={card.id}
                              className="bg-gray-50 rounded-2xl p-4 border border-gray-100 hover:border-gray-200 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="text-2xl">{card.image}</div>
                                  <div>
                                    <h4 className="font-medium text-gray-900 text-sm">{card.title}</h4>
                                    <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
                                    <p className="text-sm font-light text-gray-900 mt-2">
                                      {formatPrice(card.price, card.currency)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => openBookingModal(card)}
                                    className="bg-gray-100 text-gray-700 px-3 py-2 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium"
                                  >
                                    Customize
                                  </button>
                                  <button
                                    onClick={() => addToCart(card)}
                                    className="bg-black text-white px-3 py-2 rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm font-medium"
                                  >
                                    <Plus size={14} />
                                    Add to Cart
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-50 rounded-2xl px-6 py-4 max-w-2xl border border-gray-100">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                            <Sparkles size={12} className="text-gray-500" />
                          </div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Searching PrivateCharterX fleet...
                          </span>
                        </div>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input Area - Contemporary styling */}
              <div className="p-6 border-t border-gray-100">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center gap-3 bg-gray-100 rounded-2xl border border-gray-200 p-4">
                    <div className="flex gap-2">
                      <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-xl transition-colors">
                        <Paperclip size={16} />
                      </button>
                      <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-xl transition-colors">
                        <Camera size={16} />
                      </button>
                    </div>
                    
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Tell me more about your travel plans..."
                      disabled={isLoading}
                      className="flex-1 bg-transparent border-0 outline-none placeholder-gray-500 text-gray-900 disabled:opacity-50 text-base"
                    />
                    
                    <div className="flex gap-2">
                      <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-xl transition-colors">
                        <Mic size={16} />
                      </button>
                      <button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isLoading}
                        className="bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white p-2 rounded-xl transition-colors disabled:cursor-not-allowed"
                      >
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MapX - Enhanced Map Component */}
          {sidebarView === 'mapx' && (
            <MapXComponent />
          )}

          {/* Other Sidebar Views */}
          {sidebarView !== 'chat' && sidebarView !== 'mapx' && (
            <div className="flex-1 flex flex-col p-6">
              <div className="flex-1 overflow-y-auto">
                {renderSidebarContent()}
              </div>
            </div>
          )}

          {/* Right Cart Sidebar - Contemporary styling */}
          {showCart && cartItems.length > 0 && (
            <div className="w-80 border-l border-gray-100 flex flex-col bg-white/80 backdrop-blur-sm">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">Your Journey</h3>
                  <button
                    onClick={() => setShowCart(false)}
                    className="p-2 hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    <X size={16} className="text-gray-400" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">{item.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">{item.subtitle}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X size={12} className="text-gray-400" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 text-sm">
                        {formatPrice(item.price * (item.quantity || 1), item.currency)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Qty: {item.quantity || 1}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-6 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-medium text-gray-900">Total</span>
                  <span className="text-lg font-light text-gray-900">
                    {formatPrice(getTotalPrice())}
                  </span>
                </div>
                <button className="w-full bg-black text-white py-3 rounded-2xl hover:bg-gray-800 transition-colors font-medium text-sm mb-2">
                  Get a Quote
                </button>
                <button className="w-full bg-gray-100 text-gray-900 py-3 rounded-2xl hover:bg-gray-200 transition-colors font-medium text-sm">
                  Request Now
                </button>
                <p className="text-xs text-gray-400 mt-3 text-center">
                  Exclusive PrivateCharterX services • 24/7 concierge support
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <BookingModalComponent />
    </div>
  );
};

export default TravelDesigner;
