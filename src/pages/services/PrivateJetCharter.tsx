import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Calendar, Users, Clock, Info, X, ExternalLink, Search, Send, Plus, ArrowRight,
  Check, Plane, Car, Zap, Star, Shield, Briefcase, Wifi, Coffee,
  Phone, Mail, Globe, Package, Award, ChevronRight, ChevronLeft, Sparkles, Maximize2, Minimize2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import UserMenu from '../../components/UserMenu';
import { supabase } from '../../lib/supabase';
import NavigationMenu from '../../components/NavigationMenu';
import { useNavigate } from 'react-router-dom';
import LoginModal from '../../components/LoginModal';
import RegisterModal from '../../components/RegisterModal';

interface Jet {
  id: string;
  aircraft_model: string;
  description: string;
  aircraft_category: string;
  price_range: string;
  range: string;
  capacity: number;
  manufacturer: string;
  image_url: string;
  image_url_1?: string;
  image_url_2?: string;
  image_url_3?: string;
  image_url_4?: string;
  image_url_5?: string;
  title: string;
}

// Helper function to get all images for any jet
const getAllJetImages = (jet: Jet): string[] => {
  const images: string[] = [];
  
  // Add all available images
  if (jet.image_url && jet.image_url.trim()) images.push(jet.image_url.trim());
  if (jet.image_url_1 && jet.image_url_1.trim()) images.push(jet.image_url_1.trim());
  if (jet.image_url_2 && jet.image_url_2.trim()) images.push(jet.image_url_2.trim());
  if (jet.image_url_3 && jet.image_url_3.trim()) images.push(jet.image_url_3.trim());
  if (jet.image_url_4 && jet.image_url_4.trim()) images.push(jet.image_url_4.trim());
  if (jet.image_url_5 && jet.image_url_5.trim()) images.push(jet.image_url_5.trim());
  
  // If no images, return default
  if (images.length === 0) {
    images.push('https://images.unsplash.com/photo-1540962351504-03099e0a754b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2574&q=80');
  }
  
  return images;
};

interface JetDetailModalProps {
  jet: Jet;
  onClose: () => void;
}

const JetDetailModal: React.FC<JetDetailModalProps> = ({ jet, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreenGallery, setIsFullscreenGallery] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState(0);
  const imageRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const jetImages = getAllJetImages(jet);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % jetImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + jetImages.length) % jetImages.length);
  };

  // Touch/Mouse handlers for swipe functionality
  const handleTouchStart = (e: React.TouchEvent) => {
    if (jetImages.length <= 1) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || !isDragging || jetImages.length <= 1) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    
    // Only handle horizontal swipes
    if (deltaY < 50) {
      setDragOffset(deltaX);
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current || !isDragging || jetImages.length <= 1) return;
    
    const threshold = 50; // Minimum swipe distance
    
    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset > 0) {
        prevImage();
      } else {
        nextImage();
      }
    }
    
    setIsDragging(false);
    setDragOffset(0);
    touchStartRef.current = null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (jetImages.length <= 1) return;
    // Don't start dragging if clicking on a button
    if ((e.target as HTMLElement).closest('button')) return;
    setDragStart({ x: e.clientX, y: e.clientY });
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || jetImages.length <= 1) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = Math.abs(e.clientY - dragStart.y);
    
    if (deltaY < 50) {
      setDragOffset(deltaX);
    }
  };

  const handleMouseUp = () => {
    if (!isDragging || jetImages.length <= 1) return;
    
    const threshold = 50;
    
    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset > 0) {
        prevImage();
      } else {
        nextImage();
      }
    }
    
    setIsDragging(false);
    setDragOffset(0);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (jetImages.length <= 1) return;
      
      if (e.key === 'ArrowLeft') {
        prevImage();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      } else if (e.key === 'Escape') {
        if (isFullscreenGallery) {
          setIsFullscreenGallery(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jetImages.length, isFullscreenGallery, onClose]);

  // Fullscreen Gallery Component
  const FullscreenGallery = () => (
    <div className="fixed inset-0 bg-black z-[60] flex items-center justify-center">
      <button
        onClick={() => setIsFullscreenGallery(false)}
        className="absolute top-6 right-6 z-10 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200"
      >
        <X size={24} />
      </button>

      <div 
        className="relative w-full h-full flex items-center justify-center group"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <img 
          src={jetImages[currentImageIndex]} 
          alt={`${jet.aircraft_model} - Image ${currentImageIndex + 1}`} 
          className="max-w-full max-h-full object-contain select-none"
          style={{
            transform: isDragging ? `translateX(${dragOffset}px)` : 'translateX(0)',
            transition: isDragging ? 'none' : 'transform 0.3s ease'
          }}
          draggable={false}
        />

        {jetImages.length > 1 && (
          <>
            {/* Navigation Arrows */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                prevImage();
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200 opacity-0 group-hover:opacity-100 z-10"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                nextImage();
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200 opacity-0 group-hover:opacity-100 z-10"
            >
              <ChevronRight size={24} />
            </button>

            {/* Image Indicators */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
              {jetImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    index === currentImageIndex 
                      ? 'bg-white scale-125' 
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                />
              ))}
            </div>

            {/* Image Counter */}
            <div className="absolute top-6 left-6 bg-black/50 text-white px-4 py-2 rounded-full backdrop-blur-sm">
              {currentImageIndex + 1} of {jetImages.length}
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Fullscreen Gallery */}
      {isFullscreenGallery && <FullscreenGallery />}

      {/* Main Modal */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 overflow-y-auto">
        <div className="min-h-screen py-4 px-4 flex items-center justify-center">
          <div className="relative w-full max-w-5xl bg-gray-50 rounded-2xl shadow-2xl overflow-hidden">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 w-8 h-8 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-white shadow-lg transition-all duration-200"
            >
              <X size={16} />
            </button>

            {/* Enhanced Gallery Section */}
            <div className="relative">
              <div 
                ref={imageRef}
                className="h-80 bg-gray-100 flex items-center justify-center overflow-hidden cursor-pointer relative group"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onClick={() => setIsFullscreenGallery(true)}
              >
                <img 
                  src={jetImages[currentImageIndex]} 
                  alt={`${jet.aircraft_model} - Image ${currentImageIndex + 1}`} 
                  className="w-full h-full object-cover transition-all duration-300 select-none"
                  style={{
                    transform: isDragging ? `translateX(${dragOffset}px)` : 'translateX(0)',
                    transition: isDragging ? 'none' : 'transform 0.3s ease'
                  }}
                  draggable={false}
                />
                
                {/* Fullscreen toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFullscreenGallery(true);
                  }}
                  className="absolute top-4 right-14 w-8 h-8 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-white shadow-lg transition-all duration-200"
                  title="View fullscreen"
                >
                  <Maximize2 size={14} />
                </button>

                {/* Navigation - Only show if more than 1 image */}
                {jetImages.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        prevImage();
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-700 hover:text-gray-900 hover:bg-white shadow-sm transition-all duration-200 opacity-0 group-hover:opacity-100"
                      title="Previous image"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        nextImage();
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-700 hover:text-gray-900 hover:bg-white shadow-sm transition-all duration-200 opacity-0 group-hover:opacity-100"
                      title="Next image"
                    >
                      <ChevronRight size={16} />
                    </button>
                    
                    {/* Image Indicators */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {jetImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImageIndex(index);
                          }}
                          className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                            index === currentImageIndex 
                              ? 'bg-white shadow-sm scale-125' 
                              : 'bg-white/70 hover:bg-white/90'
                          }`}
                        />
                      ))}
                    </div>
                    
                    {/* Image Counter */}
                    <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm opacity-75">
                      {currentImageIndex + 1}/{jetImages.length}
                    </div>
                  </>
                )}

                {/* Hover instruction for gallery */}
                {jetImages.length > 1 && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 bg-black/20">
                    <div className="bg-white/90 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-full text-sm font-medium">
                      Click to view gallery • Swipe to navigate
                    </div>
                  </div>
                )}
              </div>
              
              {/* Aircraft Title Section */}
              <div className="p-6 bg-white border-b border-gray-100">
                <h1 className="text-2xl font-light text-gray-900 mb-2">{jet.aircraft_model}</h1>
                <div className="flex items-center gap-6 text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-700">Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={14} />
                    <span className="text-sm font-medium">{jet.capacity} pax</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe size={14} />
                    <span className="text-sm font-medium">{jet.range}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rest of modal content */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl p-4 border border-gray-200 mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <Users size={20} className="mx-auto mb-1 text-gray-600" />
                        <div className="text-xs text-gray-500">Capacity</div>
                        <div className="font-semibold text-gray-900 text-sm">{jet.capacity}</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <Globe size={20} className="mx-auto mb-1 text-gray-600" />
                        <div className="text-xs text-gray-500">Range</div>
                        <div className="font-semibold text-gray-900 text-sm">{jet.range}</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <Award size={20} className="mx-auto mb-1 text-gray-600" />
                        <div className="text-xs text-gray-500">Category</div>
                        <div className="font-semibold text-gray-900 text-sm">{jet.aircraft_category}</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <Star size={20} className="mx-auto mb-1 text-gray-600" />
                        <div className="text-xs text-gray-500">Manufacturer</div>
                        <div className="font-semibold text-gray-900 text-sm">{jet.manufacturer}</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">About This Aircraft</h2>
                    <p
                      className="text-gray-600 leading-relaxed text-sm whitespace-pre-line"
                      dangerouslySetInnerHTML={{
                        __html: (jet.description || `Experience unparalleled luxury with the ${jet.aircraft_model}.`).replace(/\n/g, '<br />')
                      }}
                    />
                  </div>
                </div>

                <div className="lg:col-span-1">
                  <div className="bg-white rounded-xl p-4 border border-gray-200 sticky top-4">
                    <div className="mb-4">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-xl font-bold text-gray-900">{jet.price_range}</span>
                        <span className="text-gray-500 text-sm">/hour</span>
                      </div>
                      <div className="text-xs text-gray-600">Base charter rate</div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                        <span className="text-gray-600 text-xs">Category</span>
                        <span className="font-medium text-gray-900 text-xs">{jet.aircraft_category}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                        <span className="text-gray-600 text-xs">Availability</span>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="font-medium text-green-700 text-xs">Ready</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-center mb-4">
                      <a 
                        href="mailto:bookings@privatecharterx.com" 
                        className="text-xs text-gray-600 hover:text-gray-800 underline flex items-center justify-center gap-1"
                      >
                        <Mail size={10} />
                        bookings@privatecharterx.com
                      </a>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <h4 className="font-medium text-gray-900 mb-2 text-xs">Information Only</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <Info size={10} className="text-gray-600" />
                          </div>
                          <span className="text-xs text-gray-600">Aircraft specifications</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <Info size={10} className="text-gray-600" />
                          </div>
                          <span className="text-xs text-gray-600">Pricing estimates</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <Info size={10} className="text-gray-600" />
                          </div>
                          <span className="text-xs text-gray-600">Contact for booking</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default function JetCharter() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [jets, setJets] = useState<Jet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedJet, setSelectedJet] = useState<Jet | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [cardImageIndexes, setCardImageIndexes] = useState<{[key: string]: number}>({});

  // Gallery navigation for cards
  const nextCardImage = (jetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const jet = jets.find(j => j.id === jetId);
    if (!jet) return;
    
    const totalImages = getAllJetImages(jet).length;
    setCardImageIndexes(prev => ({
      ...prev,
      [jetId]: ((prev[jetId] || 0) + 1) % totalImages
    }));
  };

  const prevCardImage = (jetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const jet = jets.find(j => j.id === jetId);
    if (!jet) return;
    
    const totalImages = getAllJetImages(jet).length;
    setCardImageIndexes(prev => ({
      ...prev,
      [jetId]: ((prev[jetId] || 0) - 1 + totalImages) % totalImages
    }));
  };

  useEffect(() => {
    checkAdminStatus();
    fetchJets();
  }, [user]);

  useEffect(() => {
    const categories = [...new Set(jets.map(jet => jet.aircraft_category).filter(Boolean))];
    setAvailableCategories(categories);
  }, [jets]);

  const fetchJets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('jets').select('*');
      if (error) throw error;
      setJets(data || []);
    } catch (error) {
      console.error('Error fetching jets:', error);
      setJets([]);
    } finally {
      setLoading(false);
    }
  };

  const checkAdminStatus = async () => {
    if (!user) return;
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('user_role')
        .eq('id', user.id)
        .single();
      if (!error && userData) {
        setIsAdmin(userData.user_role === 'admin');
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const handleJetClick = (jet: Jet) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    setSelectedJet(jet);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedJet(null);
  };

  const filteredJets = jets.filter(jet => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch = (
        (jet.aircraft_model || '').toLowerCase().includes(search) ||
        (jet.description || '').toLowerCase().includes(search) ||
        (jet.aircraft_category || '').toLowerCase().includes(search) ||
        (jet.manufacturer || '').toLowerCase().includes(search)
      );
      if (!matchesSearch) return false;
    }
    if (filterCategory !== 'all') {
      return (jet.aircraft_category || '').toLowerCase() === filterCategory.toLowerCase();
    }
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-[88px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-light text-gray-900 text-center mb-4 tracking-tighter">
              Global private jet charter with transparent pricing and luxury aviation excellence
            </h1>
            <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto font-light">
              Direct worldwide flights with uncompromised luxury and privacy. Executive transport, 
              leisure travel, and specialized aviation services with dedicated concierge support.
            </p>
          </div>

          <div className="mb-8">
            <div className="max-w-md mx-auto">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by model, category, or manufacturer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent shadow-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="mb-6 flex justify-end">
              <a 
                href="/admin/jets" 
                className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Plus size={18} />
                <span>Add New Jet</span>
              </a>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterCategory === 'all' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Jets
            </button>
            {availableCategories.map((category) => (
              <button
                key={category}
                onClick={() => setFilterCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterCategory === category ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
            </div>
          ) : filteredJets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJets.map((jet) => {
                const jetImages = getAllJetImages(jet);
                const currentImageIndex = cardImageIndexes[jet.id] || 0;
                const hasMultipleImages = jetImages.length > 1;
                
                return (
                  <div 
                    key={jet.id} 
                    className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-gray-100 cursor-pointer group flex flex-col h-full"
                    onClick={() => handleJetClick(jet)}
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={jetImages[currentImageIndex]} 
                        alt={`${jet.aircraft_model} - Image ${currentImageIndex + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                      />
                      
                      {/* GALLERY CONTROLS - ALWAYS VISIBLE WHEN MULTIPLE IMAGES */}
                      {hasMultipleImages && (
                        <>
                          {/* Previous Button */}
                          <button
                            onClick={(e) => prevCardImage(jet.id, e)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-700 hover:text-gray-900 hover:bg-white shadow-lg transition-all duration-200 z-10"
                            title="Previous image"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          
                          {/* Next Button */}
                          <button
                            onClick={(e) => nextCardImage(jet.id, e)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-700 hover:text-gray-900 hover:bg-white shadow-lg transition-all duration-200 z-10"
                            title="Next image"
                          >
                            <ChevronRight size={16} />
                          </button>
                          
                          {/* Image Indicators */}
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                            {jetImages.map((_, index) => (
                              <div
                                key={index}
                                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                                  index === currentImageIndex 
                                    ? 'bg-white shadow-lg scale-110' 
                                    : 'bg-white/70'
                                }`}
                              />
                            ))}
                          </div>
                          
                          {/* Image Counter */}
                          <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                            {currentImageIndex + 1}/{jetImages.length}
                          </div>
                        </>
                      )}
                      
                      {/* Category Badge */}
                      <div className="absolute top-3 left-3 bg-blue-500 text-white text-xs px-3 py-1 rounded-full">
                        {jet.aircraft_category}
                      </div>
                    </div>
                    
                    <div className="p-5 flex flex-col flex-grow">
                      <h3 className="text-lg font-bold mb-2">{jet.aircraft_model}</h3>
                      <p
                        className="text-gray-600 text-sm mb-3 line-clamp-2 flex-grow"
                        dangerouslySetInnerHTML={{
                          __html: (jet.description || '').replace(/\n/g, '<br />')
                        }}
                      />
                      <div className="flex flex-wrap gap-3 mb-4">
                        <div className="flex items-center text-xs bg-gray-100 px-2 py-1 rounded-full">
                          <Users size={14} className="mr-1" />
                          <span>{jet.capacity} passengers</span>
                        </div>
                        <div className="flex items-center text-xs bg-gray-100 px-2 py-1 rounded-full">
                          <MapPin size={14} className="mr-1" />
                          <span>{jet.range}</span>
                        </div>
                        <div className="flex items-center text-xs bg-gray-100 px-2 py-1 rounded-full">
                          <span>{jet.manufacturer}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-auto">
                        <div className="flex items-baseline gap-1">
                          <span className="text-xs font-light text-gray-500">from</span>
                          <span className="text-lg font-bold">{jet.price_range}</span>
                        </div>
                        <button className="text-xs bg-black text-white px-3 py-1.5 rounded-lg font-medium hover:bg-gray-800 transition-colors">
                          {isAuthenticated ? 'View Details' : 'Login to View'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-xl">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Info size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No jets found</h3>
              <p className="text-gray-500 mt-2">
                No jets match your search criteria. Please try different search terms or filters.
              </p>
            </div>
          )}

          <div className="bg-black text-white p-12 rounded-2xl text-center mt-16">
            <h2 className="text-3xl font-bold mb-4">Ready to Experience Private Aviation?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Contact us today to book your private jet charter or learn more about our services.
            </p>
            <a 
              href="mailto:bookings@privatecharterx.com" 
              className="inline-flex items-center gap-2 bg-white text-black px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Request a Quote <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </main>
      <Footer />
      {showModal && selectedJet && (
        <JetDetailModal jet={selectedJet} onClose={closeModal} />
      )}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSwitchToRegister={() => {
            setShowLoginModal(false);
            setShowRegisterModal(true);
          }}
          onSuccess={() => setShowLoginModal(false)}
          onSwitchToForgotPassword={() => {
            setShowLoginModal(false);
            // You can add forgot password modal here if needed
          }}
        />
      )}

      {showRegisterModal && (
        <RegisterModal
          onClose={() => setShowRegisterModal(false)}
          onSwitchToLogin={() => {
            setShowRegisterModal(false);
            setShowLoginModal(true);
          }}
          onSuccess={() => setShowRegisterModal(false)}
        />
      )}
    </div>
  );
}
