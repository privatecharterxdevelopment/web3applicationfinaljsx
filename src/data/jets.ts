// Utility functions for jet calculations
export const calculateRequiredStops = (distance: number, range: number): number => {
  if (distance <= range) return 0;
  return Math.ceil(distance / range) - 1;
};

export const calculateTotalFlightTime = (distance: number, speed: number, stops: number): number => {
  // Base flight time from distance and speed
  const flightTime = distance / speed;
  // Add 30 minutes (0.5 hours) for each takeoff and landing
  const totalTime = flightTime + (0.5 * (stops + 1));
  // Minimum billable time is 1 hour
  return Math.max(totalTime, 1.0);
};

export const calculateTotalPrice = (distance: number, speed: number, pricePerHour: number, stops: number): number => {
  const flightTime = calculateTotalFlightTime(distance, speed, stops);
  // Always charge minimum 1 hour
  const billableTime = Math.max(flightTime, 1.0);
  return Math.round(billableTime * pricePerHour);
};

// Calculate PVCX token rewards (1.5 PVCX per km)
export const calculatePVCXRewards = (distance: number): number => {
  return Math.round(distance * 1.5);
};

export const jetCategories = [
  {
    id: 'citation-m2',
    name: 'Cessna Citation M2',
    description: 'Entry-level light jet ideal for short trips, featuring advanced avionics and comfortable cabin for up to 6 passengers. Perfect for regional business travel.',
    capacity: 6,
    range: 2400,
    speed: 650,
    pricePerHour: 4800,
    imageUrl: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b',
    category: 'Light Jet',
    specs: {
      height: "13.5 ft",
      wingspan: "42.5 ft",
      length: "42.6 ft",
      baggageCapacity: "46 cu.ft",
      maxAltitude: "41,000 ft",
      maxRange: "2,400 km",
      maxSpeed: "650 km/h",
      engines: "2x Williams FJ44-1AP-21"
    }
  },
  {
    id: 'phenom-100ex',
    name: 'Embraer Phenom 100EX',
    description: 'Modern light jet with exceptional efficiency and premium comfort. Features the latest avionics and a spacious cabin design.',
    capacity: 7,
    range: 2182,
    speed: 750,
    pricePerHour: 5200,
    imageUrl: 'https://images.unsplash.com/photo-1583373834259-46cc92173cb7',
    category: 'Light Jet',
    specs: {
      height: "14.3 ft",
      wingspan: "40.4 ft", 
      length: "42.1 ft",
      baggageCapacity: "70 cu.ft",
      maxAltitude: "41,000 ft",
      maxRange: "2,182 km",
      maxSpeed: "750 km/h",
      engines: "2x Pratt & Whitney PW617F1-E"
    }
  },
  {
    id: 'hondajet-elite',
    name: 'HondaJet Elite',
    description: 'Innovative light jet with unique over-the-wing engine design. Available in Asia & USA markets only. Features exceptional fuel efficiency and cabin comfort.',
    capacity: 5,
    range: 2661,
    speed: 780,
    pricePerHour: 5000,
    imageUrl: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b',
    category: 'Light Jet',
    specs: {
      height: "14.9 ft",
      wingspan: "39.7 ft",
      length: "42.6 ft", 
      baggageCapacity: "66 cu.ft",
      maxAltitude: "43,000 ft",
      maxRange: "2,661 km",
      maxSpeed: "780 km/h",
      engines: "2x GE Honda HF120"
    },
    regionRestriction: ['Asia', 'USA']
  },
  {
    id: 'citation-cj4',
    name: 'Cessna Citation CJ4',
    description: 'Advanced light jet with best-in-class range and superior performance. Features spacious cabin and latest ProLine Fusion avionics.',
    capacity: 9,
    range: 3778,
    speed: 770,
    pricePerHour: 5800,
    imageUrl: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b',
    category: 'Light Jet',
    specs: {
      height: "15.2 ft",
      wingspan: "53.3 ft",
      length: "51.2 ft",
      baggageCapacity: "65 cu.ft",
      maxAltitude: "45,000 ft",
      maxRange: "3,778 km", 
      maxSpeed: "770 km/h",
      engines: "2x Williams FJ44-4A"
    }
  },
  {
    id: 'challenger-350',
    name: 'Challenger 350',
    description: 'Super midsize jet with exceptional comfort and performance. Features one of the widest cabins in its class with flat floor design.',
    capacity: 9,
    range: 5926,
    speed: 850,
    pricePerHour: 7800,
    imageUrl: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b',
    category: 'Super Midsize',
    specs: {
      height: "20.0 ft",
      wingspan: "69.0 ft",
      length: "68.8 ft",
      baggageCapacity: "106 cu.ft",
      maxAltitude: "45,000 ft",
      maxRange: "5,926 km",
      maxSpeed: "850 km/h",
      engines: "2x Honeywell HTF7350"
    }
  },
  {
    id: 'falcon-2000lxs',
    name: 'Falcon 2000 LXS',
    description: 'Large cabin jet with impressive range and short-field capability. Features advanced wing design and superior fuel efficiency.',
    capacity: 10,
    range: 7410,
    speed: 882,
    pricePerHour: 11000,
    imageUrl: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b',
    category: 'Large Jet',
    specs: {
      height: "23.5 ft",
      wingspan: "70.2 ft",
      length: "66.3 ft",
      baggageCapacity: "131 cu.ft",
      maxAltitude: "47,000 ft",
      maxRange: "7,410 km",
      maxSpeed: "882 km/h",
      engines: "2x Pratt & Whitney PW308C"
    }
  },
  {
    id: 'global-6500',
    name: 'Bombardier Global 6500',
    description: 'Ultra-long-range jet with superior comfort and cutting-edge technology. Features Nuage seating and advanced Vision flight deck.',
    capacity: 15,
    range: 12223,
    speed: 956,
    pricePerHour: 15400,
    imageUrl: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b',
    category: 'Large Jet',
    specs: {
      height: "25.5 ft",
      wingspan: "94.0 ft",
      length: "99.4 ft",
      baggageCapacity: "195 cu.ft",
      maxAltitude: "51,000 ft",
      maxRange: "12,223 km",
      maxSpeed: "956 km/h",
      engines: "2x Rolls-Royce Pearl 15"
    }
  },
  {
    id: 'gulfstream-g650er',
    name: 'Gulfstream G650ER',
    description: "Ultra-long-range jet offering unmatched performance and luxury. Features Gulfstream's signature oval windows and advanced flight deck.",
    capacity: 19,
    range: 13890,
    speed: 982,
    pricePerHour: 17200,
    imageUrl: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b',
    category: 'Large Jet',
    specs: {
      height: "25.8 ft",
      wingspan: "99.7 ft",
      length: "99.9 ft",
      baggageCapacity: "195 cu.ft",
      maxAltitude: "51,000 ft",
      maxRange: "13,890 km",
      maxSpeed: "982 km/h",
      engines: "2x Rolls-Royce BR725"
    }
  },
  {
    id: 'global-7500',
    name: 'Bombardier Global 7500',
    description: 'The largest and longest-range purpose-built business jet. Features four living spaces and a dedicated crew suite.',
    capacity: 19,
    range: 14260,
    speed: 1000,
    pricePerHour: 18000,
    imageUrl: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b',
    category: 'Large Jet',
    specs: {
      height: "27.0 ft",
      wingspan: "104.0 ft",
      length: "111.2 ft",
      baggageCapacity: "195 cu.ft",
      maxAltitude: "51,000 ft",
      maxRange: "14,260 km",
      maxSpeed: "1,000 km/h",
      engines: "2x GE Passport"
    }
  }
];