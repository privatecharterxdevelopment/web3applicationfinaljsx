import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const aircraftTypes: { [key: string]: string } = {
  'a4b123': 'Gulfstream G650',
  'a4b124': 'Gulfstream G700',
  'a4b125': 'Gulfstream G280',
  'a4b126': 'Gulfstream G500',
  'a4b127': 'Gulfstream G550',
  'b8c234': 'Bombardier Global 7500',
  'b8c235': 'Bombardier Global 6000',
  'b8c236': 'Bombardier Challenger 650',
  'b8c237': 'Bombardier Challenger 350',
  'b8c238': 'Bombardier Learjet 75',
  'b8c239': 'Bombardier Learjet 60XR',
  'c7d345': 'Dassault Falcon 8X',
  'c7d346': 'Dassault Falcon 7X',
  'c7d347': 'Dassault Falcon 900LX',
  'c7d348': 'Dassault Falcon 2000LXS',
  'd5e456': 'Cessna Citation XLS+',
  'd5e457': 'Cessna Citation CJ4',
  'd5e458': 'Cessna Citation Longitude',
  'd5e459': 'Cessna Citation M2',
  'd5e460': 'Cessna Citation Mustang',
  'd5e461': 'Cessna Citation CJ3+',
  'd5e462': 'Cessna Citation CJ2+',
  'd5e463': 'Cessna Citation Sovereign+',
  'e6f567': 'Embraer Phenom 300E',
  'e6f568': 'Embraer Phenom 100E',
  'e6f569': 'Embraer Legacy 450',
  'e6f570': 'Embraer Legacy 500',
  'e6f571': 'Embraer Praetor 600',
  'e6f572': 'Embraer Praetor 500',
  'f3g678': 'Pilatus PC-24',
  'f3g679': 'Pilatus PC-12 NGX',
  'f3g680': 'HondaJet Elite II',
  'k7l890': 'Beechcraft King Air 350i',
  'k7l891': 'Beechcraft King Air 250',
  'k7l892': 'Beechcraft King Air 260',
  'k7l893': 'Beechcraft King Air C90GTx',
  'g1h789': 'Airbus ACH160',
  'g1h790': 'Airbus H145',
  'g1h791': 'Airbus ACH175',
  'h2j890': 'Bell 429',
  'h2j891': 'Bell 505',
  'h2j892': 'Leonardo AW139',
  'h2j893': 'Leonardo AW169',
};

const handler: Handler = async () => {
  const { data, error } = await supabase
    .from('live_tracker')
    .select('*')
    .order('last_contact', { ascending: false })
    .limit(100);

  if (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }

  const now = new Date().getTime();
  const validCategories = [1, 2, 3, 4, 5];

  const flights = data
    .filter(flight => {
      const arrival = new Date(flight.last_contact).getTime();
      return flight.category && validCategories.includes(flight.category) &&
             arrival >= now - 48 * 60 * 60 * 1000;
    })
    .map(flight => ({
      id: flight.icao24,
      callsign: flight.callsign || 'N/A',
      aircraft_type: aircraftTypes[flight.icao24] || 'Unknown',
      origin: flight.origin_country,
      destination: 'Unknown',
      departure_time: flight.last_contact,
      arrival_time: flight.last_contact,
      status: 'in-flight'
    }));

  return {
    statusCode: 200,
    body: JSON.stringify(flights)
  };
};

export { handler };
