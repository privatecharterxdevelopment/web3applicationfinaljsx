import React from 'react';

export default function LoadingSpinner() {
  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="w-20 h-20">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-contain"
        >
          <source src="https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/motion%20videos/videoExport-2025-10-19@11-32-10.850-540x540@60fps.mp4" type="video/mp4" />
        </video>
      </div>
    </div>
  );
}