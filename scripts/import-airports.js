import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function importAirports() {
  try {
    console.log('Reading airports.json...');
    const airportsPath = path.join(__dirname, '../src/data', 'airports.json');
    const airportsData = JSON.parse(fs.readFileSync(airportsPath, 'utf8'));

    console.log(`Found ${airportsData.length} airports to import`);

    // Convert the data to match our table schema
    const formattedAirports = airportsData.map(airport => ({
      code: airport.code,
      lat: airport.lat ? parseFloat(airport.lat) : null,
      lon: airport.lon ? parseFloat(airport.lon) : null,
      name: airport.name || null,
      city: airport.city || null,
      state: airport.state || null,
      country: airport.country || null,
      woeid: airport.woeid || null,
      tz: airport.tz || null,
      phone: airport.phone || null,
      type: airport.type || null,
      email: airport.email || null,
      url: airport.url || null,
      runway_length: airport.runway_length ? parseInt(airport.runway_length) : null,
      elev: airport.elev ? parseInt(airport.elev) : null,
      icao: airport.icao || null,
      direct_flights: airport.direct_flights ? parseInt(airport.direct_flights) : null,
      carriers: airport.carriers ? parseInt(airport.carriers) : null
    }));

    // Insert in batches to avoid timeout
    const batchSize = 100;
    let insertedCount = 0;

    for (let i = 0; i < formattedAirports.length; i += batchSize) {
      const batch = formattedAirports.slice(i, i + batchSize);

      console.log(`Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(formattedAirports.length / batchSize)}...`);

      const { data, error } = await supabase
        .from('airports')
        .insert(batch);

      if (error) {
        console.error('Error inserting batch:', error);
        // Continue with next batch if there's an error
      } else {
        insertedCount += batch.length;
        console.log(`Successfully inserted ${insertedCount}/${formattedAirports.length} airports`);
      }
    }

    console.log(`Import completed! Inserted ${insertedCount} airports total.`);

  } catch (error) {
    console.error('Error importing airports:', error);
    process.exit(1);
  }
}

importAirports();