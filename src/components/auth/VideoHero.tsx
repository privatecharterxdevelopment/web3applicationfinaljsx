import { useState, useRef, useEffect } from 'react';

interface VideoHeroProps {
  videos: string[];
  interval?: number;
}

export default function VideoHero({ videos, interval = 8000 }: VideoHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const nextVideoRef = useRef<HTMLVideoElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Function to switch to next video
  const switchToNext = () => {
    const elapsed = Date.now() - startTimeRef.current;
    console.log(`⏰ Switching video after ${elapsed}ms`);

    startTimeRef.current = Date.now();

    // Start fade transition
    setIsTransitioning(true);

    // Wait for fade out, then switch video
    setTimeout(() => {
      setCurrentIndex(prev => {
        const next = (prev + 1) % videos.length;
        console.log(`📹 Video ${prev} → ${next}`);
        return next;
      });

      // Fade back in
      setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
    }, 500);
  };

  // Load and play video when index changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videos[currentIndex]) return;

    console.log(`▶️ Loading video ${currentIndex}: ${videos[currentIndex]}`);

    // Set video source
    video.src = videos[currentIndex];
    video.currentTime = 0;
    video.load();

    // Play video
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => console.error('Play failed:', err));
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set timeout to switch after exact interval
    console.log(`⏱️ Setting timer for ${interval}ms (${interval/1000}s)`);
    timeoutRef.current = setTimeout(() => {
      switchToNext();
    }, interval);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentIndex, videos, interval]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden rounded-r-2xl">
      {/* Video */}
      <video
        ref={videoRef}
        muted
        playsInline
        className={`absolute inset-0 w-full h-full object-cover rounded-r-2xl transition-opacity duration-500 ease-in-out ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
        onEnded={() => {
          console.log('🔄 Video ended naturally, looping...');
          if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play();
          }
        }}
      >
        Your browser does not support the video tag.
      </video>

      {/* Carousel Indicators */}
      {videos.length > 1 && (
        <div className="absolute bottom-6 right-6 flex gap-2 z-30">
          {videos.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-500 ease-in-out ${
                index === currentIndex
                  ? 'w-8 bg-white shadow-lg'
                  : 'w-1.5 bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
