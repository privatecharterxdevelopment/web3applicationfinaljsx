import React from 'react';

interface HeroProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

const Hero: React.FC<HeroProps> = ({
  title = "Tokenizing global luxurious mobility",
  subtitle = "From blockchain memberships to seamless jet access — built for tomorrow's travelers.",
  className = ""
}) => {
  return (
    <main className={`flex-1 flex items-center justify-center px-4 py-32 ${className}`}>
      <div className="w-full max-w-4xl mx-auto text-center">
        <div className="mb-12">
          <h1
            className="text-5xl md:text-6xl font-bold text-gray-900 tracking-tight mb-6"
            style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}
          >
            {title}
          </h1>
          <p
            className="text-2xl md:text-3xl text-gray-600 font-light mb-10"
            style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 400 }}
          >
            {subtitle}
          </p>
        </div>
      </div>
    </main>
  );
};

export default Hero;