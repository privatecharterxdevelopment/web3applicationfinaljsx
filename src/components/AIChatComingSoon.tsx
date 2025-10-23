import React from 'react';
import { Sparkles, Mail } from 'lucide-react';

export default function AIChatComingSoon() {
  return (
    <div 
      className="w-full h-full flex items-center justify-center p-8"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="max-w-2xl w-full text-center">
        {/* Icon */}
        <div className="flex justify-center mb-12">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-gray-700" strokeWidth={1.5} />
          </div>
        </div>

        {/* Main Message */}
        <h1 className="text-3xl font-light text-gray-900 mb-2 leading-tight">
          World's Most Intelligent
          <br />
          <span className="font-normal bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Luxury Travel Agent
          </span>
        </h1>
        
        <p className="text-sm font-light text-gray-400 mb-2 tracking-wide">
          Powered by Advanced AI
        </p>
        
        <p className="text-base font-normal text-gray-700 mb-16">
          Coming Soon
        </p>

        {/* Contact Information */}
        <div className="border-t border-gray-100 pt-8">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-4 font-medium">
            Get Early Access
          </p>
          <a 
            href="mailto:info@privatecharterx.com"
            className="inline-flex items-center gap-2 text-gray-800 hover:text-gray-600 transition-colors text-sm font-normal"
          >
            <Mail className="w-4 h-4" strokeWidth={1.5} />
            info@privatecharterx.com
          </a>
        </div>
      </div>
    </div>
  );
}
