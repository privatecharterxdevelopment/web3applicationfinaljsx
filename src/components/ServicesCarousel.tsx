import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ServicesCarousel = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const carouselRef = useRef(null);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const services = [
    {
      id: 'private-jet',
      title: 'Private Jet Charter',
      link: '/services/private-jet-charter',
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/gb/mustang_lenght_BV_0%20(1).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJnYi9tdXN0YW5nX2xlbmdodF9CVl8wICgxKS5wbmciLCJpYXQiOjE3NTQwNDEyOTQsImV4cCI6MTc4NTU3NzI5NH0.e5_lHON0wJIJKXM_MfOIov5s4VXxF59JY1QtrvTy3fY'
    },
    {
      id: 'empty-legs',
      title: 'Empty Leg Offers',
      link: '/empty-legs',
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/gb/private-jet-seat-airplane-chair-4GMok7F-600.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJnYi9wcml2YXRlLWpldC1zZWF0LWFpcnBsYW5lLWNoYWlyLTRHTW9rN0YtNjAwLnBuZyIsImlhdCI6MTc1NDA0MTQ5OSwiZXhwIjoxNzg1NTc3NDk5fQ.-1T9Yacs9Jm01A4TXS1dJrwrQWtd9coK75bIxUSHDbU'
    },
    {
      id: 'group-charter',
      title: 'Group Charter',
      link: '/services/group-charter',
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/gb/Embraer-emb120-brasilia.webp?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJnYi9FbWJyYWVyLWVtYjEyMC1icmFzaWxpYS53ZWJwIiwiaWF0IjoxNzU0MDQxOTIxLCJleHAiOjE3ODU1Nzc5MjF9.TTi6irAaaCn0LOTWtAAqCwIE0QAWJgzxzkdsT_jUYwo'
    },
    {
      id: 'helicopter',
      title: 'Helicopter Charter',
      link: '/services/helicopter-charter',
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/gb/%20.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJnYi8gLnBuZyIsImlhdCI6MTc1NDc2NTgzNywiZXhwIjoxMDY2Mzk1OTI1ODM0Mzd9.czf4O9UQK6_-5G9dyuh9bIDwDX9OANAeyUvOPyMYbcA'
    },
    {
      id: 'evtol',
      title: 'eVTOL Future',
      link: '/pages/eVtolpage',
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/gb/G03-removebg-preview.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJnYi9HMDMtcmVtb3ZlYmctcHJldmlldy5wbmciLCJpYXQiOjE3NTQwNDE5OTIsImV4cCI6MTc4NTU3Nzk5Mn0.vd5ewEQSHvEywC-HgeOR1za8kGErAeK4O4XBMHVUVKA'
    },
    {
      id: 'adventure',
      title: 'Adventure Travel',
      link: '/fixed-offers',
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/gb/pngtree-sport-ball-golf-ball-png-png-image_13030038.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJnYi9wbmd0cmVlLXNwb3J0LWJhbGwtZ29sZi1iYWxsLXBuZy1wbmctaW1hZ2VfMTMwMzAwMzgucG5nIiwiaWF0IjoxNzU0MDQxNjM4LCJleHAiOjE3ODU1Nzc2Mzh9.rF0Yol3fLBKLNyw7MNZL7eivAOYv3WgQavqBpZORAA4'
    },
    {
      id: 'carbon-certificates',
      title: 'Carbon Certificates',
      link: '/web3/carbon-certificates',
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/gb/3d-green-leaf-illustration-with-glossy-organic-look-isolated-on-transparent-background-perfect-for-eco-friendly-botanical-designs-3d-render-png.webp?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJnYi8zZC1ncmVlbi1sZWFmLWlsbHVzdHJhdGlvbi13aXRoLWdsb3NzeS1vcmdhbmljLWxvb2staXNvbGF0ZWQtb24tdHJhbnNwYXJlbnQtYmFja2dyb3VuZC1wZXJmZWN0LWZvci1lY28tZnJpZW5kbHktYm90YW5pY2FsLWRlc2lnbnMtM2QtcmVuZGVyLXBuZy53ZWJwIiwiaWF0IjoxNzU1MzgzNDMzLCJleHAiOjEwNjU1MzkxNDAyMzN9.ST98LGcqgyyLWI5LycbpNvYA26OPwTWvN5uojYKLxng'
    },
    {
      id: 'nft-collection',
      title: 'NFT Collection',
      link: '/web3/nft-collection',
      image: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/sign/gb/PrivateCharterX_transparent%20(1)%20(1).webm?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNzUxNzI0Mi0yZTk0LTQxZDctODM3Ny02Yjc0ZDBjNWM2OTAiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJnYi9Qcml2YXRlQ2hhcnRlclhfdHJhbnNwYXJlbnQgKDEpICgxKS53ZWJtIiwiaWF0IjoxNzU0MDQxNzM2LCJleHAiOjE3ODU1Nzc3MzZ9.Kn72dNKHYuTfB4ng1Yj1DtD9PKc4EDCeFj_8fIRKPDI'
    }
  ];

  // Responsive items per view
  const itemsPerView = isMobile ? 1 : 3;
  const maxIndex = Math.max(0, services.length - itemsPerView);

  // Reset to valid index when switching between mobile/desktop
  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [currentIndex, maxIndex]);

  const handlePrevious = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex(prev => Math.max(0, prev - 1));
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex(prev => Math.min(maxIndex, prev + 1));
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleCardClick = (link) => {
    navigate(link);
  };

  // Touch/swipe handling
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentIndex < maxIndex) {
      handleNext();
    }
    if (isRightSwipe && currentIndex > 0) {
      handlePrevious();
    }
  };

  // Mouse wheel horizontal scroll
  const handleWheel = (e) => {
    e.preventDefault();

    if (e.deltaY > 0 && currentIndex < maxIndex) {
      // Scroll down = go right
      handleNext();
    } else if (e.deltaY < 0 && currentIndex > 0) {
      // Scroll up = go left
      handlePrevious();
    }
  };

  // Add wheel event listener with passive: false
  useEffect(() => {
    const carouselElement = carouselRef.current;
    if (!carouselElement) return;

    const wheelHandler = (e) => {
      e.preventDefault();
      handleWheel(e);
    };

    carouselElement.addEventListener('wheel', wheelHandler, { passive: false });

    return () => {
      carouselElement.removeEventListener('wheel', wheelHandler);
    };
  }, [currentIndex, maxIndex, isAnimating]);

  return (
    <section className="relative z-10 bg-white py-5 shadow-[0_-20px_25px_-5px_rgba(0,0,0,0.08),0_-10px_10px_-5px_rgba(0,0,0,0.03)] border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Services Carousel */}
        <div className="relative py-4">
          {/* Navigation Arrows - Show on mobile too */}
          {currentIndex > 0 && (
            <button
              onClick={handlePrevious}
              disabled={isAnimating}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}

          {currentIndex < maxIndex && (
            <button
              onClick={handleNext}
              disabled={isAnimating}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          )}

          {/* Carousel Container */}
          <div
            ref={carouselRef}
            className="overflow-hidden mx-8 md:mx-4"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="flex transition-transform duration-300 ease-out"
              style={{
                transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`
              }}
            >
              {services.map((service) => (
                <div
                  key={service.id}
                  className={`flex-shrink-0 ${isMobile ? 'px-2' : 'px-4'} py-4`}
                  style={{ width: `${100 / itemsPerView}%` }}
                >
                  <div
                    onClick={() => handleCardClick(service.link)}
                    className="group relative bg-gray-50 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:bg-white hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] hover:scale-[1.02] border border-gray-200/50 hover:border-gray-300 h-24"
                  >
                    {/* Horizontal Layout: Icon + Title (same for mobile and desktop) */}
                    <div className="flex items-center h-full">
                      {/* Icon - Image, video, or emoji */}
                      <div className="w-20 h-14 flex items-center justify-center mr-6 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                        {service.image.startsWith('http') ? (
                          service.image.includes('.webm') || service.image.includes('.mp4') ? (
                            <video
                              src={service.image}
                              autoPlay
                              loop
                              muted
                              playsInline
                              className="w-16 h-16 object-contain"
                            />
                          ) : (
                            <img
                              src={service.image}
                              alt={service.title}
                              className="w-16 h-16 object-contain"
                            />
                          )
                        ) : (
                          <span className="text-3xl" role="img" aria-label={service.title}>
                            {service.image}
                          </span>
                        )}
                      </div>

                      {/* Title Only */}
                      <div className="flex-1 flex items-center">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-800 leading-tight">
                          {service.title}
                        </h3>
                      </div>
                    </div>

                    {/* Hover Gradient Overlay */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination Dots */}
          <div className="flex justify-center mt-8 space-x-2">
            {Array.from({ length: maxIndex + 1 }).map((_, index) => (
              <button
                key={index}
                onClick={() => !isAnimating && setCurrentIndex(index)}
                className={`${isMobile ? 'w-2.5 h-2.5' : 'w-2 h-2'} rounded-full transition-all duration-200 ${index === currentIndex
                    ? `bg-gray-400 ${isMobile ? 'w-7' : 'w-6'}`
                    : 'bg-gray-300 hover:bg-gray-350'
                  }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesCarousel;
