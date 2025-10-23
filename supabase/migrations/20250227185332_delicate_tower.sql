-- Check if fixed_offers table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'fixed_offers') THEN
    -- Create fixed_offers table
    CREATE TABLE fixed_offers (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      title text NOT NULL,
      description text NOT NULL,
      origin text NOT NULL,
      destination text NOT NULL,
      price integer NOT NULL,
      currency text NOT NULL DEFAULT '€',
      departure_date date NOT NULL,
      return_date date,
      image_url text,
      aircraft_type text NOT NULL,
      passengers integer NOT NULL,
      duration text NOT NULL,
      is_featured boolean NOT NULL DEFAULT false,
      is_empty_leg boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE fixed_offers ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Allow public to read fixed offers"
      ON fixed_offers
      FOR SELECT
      TO public
      USING (true);

    CREATE POLICY "Allow authenticated users to manage fixed offers"
      ON fixed_offers
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Insert sample data only if the table is empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM fixed_offers LIMIT 1) THEN
    INSERT INTO fixed_offers (title, description, origin, destination, price, currency, departure_date, return_date, image_url, aircraft_type, passengers, duration, is_featured, is_empty_leg)
    VALUES 
      (
        'Luxury Weekend in Paris',
        E'Experience the ultimate luxury weekend getaway to the City of Light. This exclusive package includes round-trip private jet transportation, VIP terminal access, and premium onboard catering.\n\nYour journey begins at our private terminal where you\'ll enjoy expedited security and boarding. Once aboard, relax in the plush leather seats of our Citation XLS+ as you enjoy champagne and gourmet canapés prepared by our award-winning chef.\n\nWith a flight time of just 1 hour and 15 minutes, you\'ll arrive in Paris refreshed and ready to explore. Our concierge team can arrange luxury accommodations, restaurant reservations, and exclusive experiences to make your Paris weekend truly unforgettable.',
        'London (LTN)',
        'Paris (LBG)',
        12500,
        '€',
        '2025-04-15',
        '2025-04-17',
        'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80',
        'Citation XLS+',
        8,
        '1h 15m',
        true,
        false
      ),
      (
        'Swiss Alps Ski Adventure',
        E'Escape to the pristine slopes of the Swiss Alps with our exclusive ski adventure package. This all-inclusive journey takes you from the heart of London directly to Sion, Switzerland, just minutes from world-class ski resorts.\n\nYour private jet experience includes dedicated concierge service, premium catering with Swiss specialties, and complimentary ski equipment transport. The Phenom 300 offers exceptional comfort with its spacious cabin and large windows, perfect for taking in the breathtaking Alpine views during your approach.\n\nUpon arrival, our ground team will transfer you directly to your chosen resort, with options including Verbier, Zermatt, or Gstaad. This package can be customized to include luxury accommodation and lift passes upon request.',
        'London (LTN)',
        'Sion (SIR)',
        18900,
        '€',
        '2025-01-20',
        '2025-01-27',
        'https://images.unsplash.com/photo-1551867633-194f125bddfa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80',
        'Embraer Phenom 300',
        8,
        '1h 45m',
        true,
        false
      ),
      (
        'Mediterranean Yacht Connection',
        E'Connect seamlessly to your Mediterranean yacht charter with our bespoke private jet service. This exclusive package flies you directly from London to Nice, where our team will arrange helicopter transfer to Monaco or your yacht\'s specific location.\n\nThe Challenger 350 offers exceptional comfort for up to 9 passengers, with a spacious stand-up cabin, fully reclining seats, and a comprehensive entertainment system. Enjoy custom catering featuring Mediterranean cuisine and fine wines during your journey.\n\nThis service is designed for discerning travelers who value time and comfort, eliminating the hassles of commercial travel and ensuring you arrive at your yacht refreshed and ready to begin your maritime adventure.',
        'London (LTN)',
        'Nice (NCE)',
        22500,
        '€',
        '2025-06-10',
        '2025-06-20',
        'https://images.unsplash.com/photo-1570444952548-8d8b9b9b5a23?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80',
        'Challenger 350',
        9,
        '2h',
        false,
        false
      ),
      (
        'Caribbean Island Hopping',
        E'Experience the ultimate Caribbean adventure with our exclusive island-hopping package. This bespoke journey allows you to explore multiple Caribbean destinations in style and comfort.\n\nYour private jet will be at your disposal for the entire week, enabling flexible travel between islands such as St. Barts, Anguilla, Antigua, and the British Virgin Islands. The Gulfstream G280 offers exceptional range and comfort, with a spacious cabin featuring fully reclining seats, a comprehensive entertainment system, and a dedicated flight attendant.\n\nThis package includes all flights between islands, gourmet catering onboard, and VIP handling at each destination. Our concierge team can arrange luxury accommodations, yacht charters, and exclusive experiences at each stop.',
        'Miami (OPF)',
        'St. Barts (SBH)',
        85000,
        '$',
        '2025-02-15',
        '2025-02-22',
        'https://images.unsplash.com/photo-1506929562872-bb421503ef21?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2368&q=80',
        'Gulfstream G280',
        10,
        '2h 30m',
        true,
        false
      ),
      (
        'Empty Leg: Zurich to London',
        E'Take advantage of this exclusive empty leg flight from Zurich to London at a fraction of the regular charter price. This flight is available due to an aircraft repositioning and offers exceptional value for flexible travelers.\n\nThe Citation XLS+ accommodates up to 8 passengers in luxurious comfort, with a spacious cabin, fully reclining leather seats, and a well-appointed refreshment center. Despite the discounted price, you\'ll still enjoy our premium service, including VIP terminal access and onboard catering.\n\nThis is a one-way flight with a fixed departure date and time. Book quickly as empty leg flights are highly sought after and sell out rapidly.',
        'Zurich (ZRH)',
        'London (LTN)',
        4500,
        '€',
        '2025-03-10',
        NULL,
        'https://images.unsplash.com/photo-1494412651409-8963ce7935a7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80',
        'Citation XLS+',
        8,
        '1h 30m',
        false,
        true
      ),
      (
        'Empty Leg: Nice to Paris',
        E'Seize this opportunity to fly from Nice to Paris on a luxury private jet at a significantly reduced price. This empty leg flight is available due to aircraft repositioning and offers exceptional value.\n\nThe Phenom 300 provides a premium travel experience with its spacious cabin, comfortable seating for up to 7 passengers, and excellent baggage capacity. You\'ll enjoy the same high-quality service as our regular charter clients, including VIP terminal access, expedited security, and premium catering.\n\nThis is a one-way flight with a fixed departure date. Empty leg flights are subject to the primary charter\'s schedule, but our team will keep you informed of any changes.',
        'Nice (NCE)',
        'Paris (LBG)',
        3800,
        '€',
        '2025-03-15',
        NULL,
        'https://images.unsplash.com/photo-1507666664345-c49223375e33?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80',
        'Embraer Phenom 300',
        7,
        '1h 15m',
        false,
        true
      ),
      (
        'Empty Leg: Miami to New York',
        E'Take advantage of this premium empty leg flight from Miami to New York at a substantial discount. This is an excellent opportunity to experience private jet travel at a fraction of the usual cost.\n\nThe Challenger 350 offers a spacious stand-up cabin with comfortable seating for up to 9 passengers, a fully equipped galley, and a comprehensive entertainment system. Despite the reduced price, you\'ll receive our full-service experience, including VIP terminal access, expedited security, and premium onboard catering.\n\nThis is a one-way flight with a fixed departure date. As with all empty leg flights, there is some flexibility required as the schedule depends on the primary charter, but our team will keep you fully informed of any changes.',
        'Miami (OPF)',
        'New York (TEB)',
        12000,
        '$',
        '2025-04-05',
        NULL,
        'https://images.unsplash.com/photo-1507666664345-c49223375e33?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80',
        'Challenger 350',
        9,
        '2h 45m',
        false,
        true
      );
  END IF;
END $$;