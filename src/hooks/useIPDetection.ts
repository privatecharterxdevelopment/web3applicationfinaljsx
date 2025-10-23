import { useState, useEffect } from 'react';

interface IPDetectionResult {
  country: string | null;
  isBlocked: boolean;
  isLoading: boolean;
}

// Mock blocked countries list
const blockedCountries = ['CN', 'RU', 'IR', 'KP']; // China, Russia, Iran, North Korea

export function useIPDetection(): IPDetectionResult {
  const [country, setCountry] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const detectIP = async () => {
      try {
        // Mock IP detection - in a real app, this would use a service like ipapi.co
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay

        // For demo purposes, randomly assign a country (mostly non-blocked)
        const countries = ['US', 'GB', 'DE', 'FR', 'CA', 'AU', 'CH', 'JP'];
        const randomCountry = countries[Math.floor(Math.random() * countries.length)];

        setCountry(randomCountry);
        setIsBlocked(blockedCountries.includes(randomCountry));
      } catch (error) {
        console.error('Failed to detect IP:', error);
        setCountry('US'); // Default to US
        setIsBlocked(false);
      } finally {
        setIsLoading(false);
      }
    };

    detectIP();
  }, []);

  return { country, isBlocked, isLoading };
}