import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  className?: string;
}

export default function Logo({ className = '' }: LogoProps) {
  return (
    <Link to="/" className="relative flex items-center gap-2 pl-1 sm:pl-2 md:pl-6">
      <img 
        src="https://i.imgur.com/iu42DU1.png" 
        alt="PrivateCharterX"
        className={`h-[70px] sm:h-[75px] md:h-[80px] object-contain ${className}`}
      />
    </Link>
  );
}