import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plane, Calendar, Users, MapPin, Clock, Luggage, ArrowRight, AlertCircle, RefreshCw, SlidersHorizontal, X } from 'lucide-react';
import LandingHeader from '../components/Landingpagenew/LandingHeader';
import Footer from '../components/Landingpagenew/Footer';
import { supabase } from '../lib/supabase';

// Popular airports for autocomplete
const POPULAR_AIRPORTS = [
  { code: 'LHR', name: 'London Heathrow', city: 'London', country: 'UK' },
  { code: 'JFK', name: 'John F. Kennedy', city: 'New York', country: 'USA' },
  { code: 'LAX', name: 'Los Angeles Intl', city: 'Los Angeles', country: 'USA' },
  { code: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'France' },
  { code: 'DXB', name: 'Dubai Intl', city: 'Dubai', country: 'UAE' },
  { code: 'SIN', name: 'Changi', city: 'Singapore', country: 'Singapore' },
  { code: 'HKG', name: 'Hong Kong Intl', city: 'Hong Kong', country: 'China' },
  { code: 'FRA', name: 'Frankfurt', city: 'Frankfurt', country: 'Germany' },
  { code: 'AMS', name: 'Schiphol', city: 'Amsterdam', country: 'Netherlands' },
  { code: 'ZRH', name: 'Zurich', city: 'Zurich', country: 'Switzerland' },
  { code: 'GVA', name: 'Geneva', city: 'Geneva', country: 'Switzerland' },
  { code: 'MUC', name: 'Munich', city: 'Munich', country: 'Germany' },
  { code: 'BCN', name: 'Barcelona El Prat', city: 'Barcelona', country: 'Spain' },
  { code: 'MAD', name: 'Madrid Barajas', city: 'Madrid', country: 'Spain' },
  { code: 'FCO', name: 'Fiumicino', city: 'Rome', country: 'Italy' },
  { code: 'MXP', name: 'Malpensa', city: 'Milan', country: 'Italy' },
  { code: 'VIE', name: 'Vienna Intl', city: 'Vienna', country: 'Austria' },
  { code: 'IST', name: 'Istanbul', city: 'Istanbul', country: 'Turkey' },
  { code: 'ORD', name: "O'Hare", city: 'Chicago', country: 'USA' },
  { code: 'MIA', name: 'Miami Intl', city: 'Miami', country: 'USA' },
  { code: 'SFO', name: 'San Francisco', city: 'San Francisco', country: 'USA' },
  { code: 'ATL', name: 'Hartsfield-Jackson', city: 'Atlanta', country: 'USA' },
  { code: 'BOS', name: 'Logan Intl', city: 'Boston', country: 'USA' },
  { code: 'SEA', name: 'Seattle-Tacoma', city: 'Seattle', country: 'USA' },
  { code: 'YYZ', name: 'Toronto Pearson', city: 'Toronto', country: 'Canada' },
  { code: 'SYD', name: 'Sydney Kingsford', city: 'Sydney', country: 'Australia' },
  { code: 'MEL', name: 'Melbourne Tullamarine', city: 'Melbourne', country: 'Australia' },
  { code: 'NRT', name: 'Narita', city: 'Tokyo', country: 'Japan' },
  { code: 'HND', name: 'Haneda', city: 'Tokyo', country: 'Japan' },
  { code: 'ICN', name: 'Incheon', city: 'Seoul', country: 'South Korea' },
  { code: 'BKK', name: 'Suvarnabhumi', city: 'Bangkok', country: 'Thailand' },
  { code: 'KUL', name: 'Kuala Lumpur Intl', city: 'Kuala Lumpur', country: 'Malaysia' },
  { code: 'DEL', name: 'Indira Gandhi', city: 'Delhi', country: 'India' },
  { code: 'BOM', name: 'Chhatrapati Shivaji', city: 'Mumbai', country: 'India' },
  { code: 'CPT', name: 'Cape Town Intl', city: 'Cape Town', country: 'South Africa' },
  { code: 'JNB', name: 'O.R. Tambo', city: 'Johannesburg', country: 'South Africa' },
  { code: 'LOS', name: 'Murtala Muhammed', city: 'Lagos', country: 'Nigeria' },
  { code: 'ABV', name: 'Nnamdi Azikiwe', city: 'Abuja', country: 'Nigeria' },
  { code: 'NBO', name: 'Jomo Kenyatta', city: 'Nairobi', country: 'Kenya' },
  { code: 'MBA', name: 'Moi Intl', city: 'Mombasa', country: 'Kenya' },
  { code: 'CAI', name: 'Cairo Intl', city: 'Cairo', country: 'Egypt' },
  { code: 'HRG', name: 'Hurghada Intl', city: 'Hurghada', country: 'Egypt' },
  { code: 'ADD', name: 'Bole Intl', city: 'Addis Ababa', country: 'Ethiopia' },
  { code: 'ACC', name: 'Kotoka Intl', city: 'Accra', country: 'Ghana' },
  { code: 'CMN', name: 'Mohammed V', city: 'Casablanca', country: 'Morocco' },
  { code: 'RAK', name: 'Menara', city: 'Marrakech', country: 'Morocco' },
  { code: 'ALG', name: 'Houari Boumediene', city: 'Algiers', country: 'Algeria' },
  { code: 'TUN', name: 'Tunis-Carthage', city: 'Tunis', country: 'Tunisia' },
  { code: 'DAR', name: 'Julius Nyerere', city: 'Dar es Salaam', country: 'Tanzania' },
  { code: 'EBB', name: 'Entebbe Intl', city: 'Entebbe', country: 'Uganda' },
  { code: 'KGL', name: 'Kigali Intl', city: 'Kigali', country: 'Rwanda' },
  { code: 'DKR', name: 'Blaise Diagne', city: 'Dakar', country: 'Senegal' },
  { code: 'ABJ', name: 'Félix-Houphouët-Boigny', city: 'Abidjan', country: 'Ivory Coast' },
  { code: 'MRU', name: 'Sir Seewoosagur Ramgoolam', city: 'Mauritius', country: 'Mauritius' },
  { code: 'GRU', name: 'Guarulhos', city: 'São Paulo', country: 'Brazil' },
  { code: 'MEX', name: 'Benito Juárez', city: 'Mexico City', country: 'Mexico' },
  { code: 'EZE', name: 'Ezeiza', city: 'Buenos Aires', country: 'Argentina' },
  { code: 'DOH', name: 'Hamad Intl', city: 'Doha', country: 'Qatar' },
  { code: 'AUH', name: 'Abu Dhabi Intl', city: 'Abu Dhabi', country: 'UAE' },
  { code: 'LGW', name: 'Gatwick', city: 'London', country: 'UK' },
  { code: 'STN', name: 'Stansted', city: 'London', country: 'UK' },
  { code: 'LTN', name: 'Luton', city: 'London', country: 'UK' },
  { code: 'MAN', name: 'Manchester', city: 'Manchester', country: 'UK' },
  { code: 'EDI', name: 'Edinburgh', city: 'Edinburgh', country: 'UK' },
  { code: 'DUB', name: 'Dublin', city: 'Dublin', country: 'Ireland' },
  { code: 'LIS', name: 'Lisbon Portela', city: 'Lisbon', country: 'Portugal' },
  { code: 'ATH', name: 'Athens Intl', city: 'Athens', country: 'Greece' },
  { code: 'OSL', name: 'Oslo Gardermoen', city: 'Oslo', country: 'Norway' },
  { code: 'ARN', name: 'Stockholm Arlanda', city: 'Stockholm', country: 'Sweden' },
  { code: 'CPH', name: 'Copenhagen', city: 'Copenhagen', country: 'Denmark' },
  { code: 'HEL', name: 'Helsinki Vantaa', city: 'Helsinki', country: 'Finland' },
  { code: 'WAW', name: 'Warsaw Chopin', city: 'Warsaw', country: 'Poland' },
  { code: 'PRG', name: 'Václav Havel', city: 'Prague', country: 'Czech Republic' },
  { code: 'BUD', name: 'Budapest Ferenc', city: 'Budapest', country: 'Hungary' },
  // More Asia Pacific
  { code: 'PVG', name: 'Pudong Intl', city: 'Shanghai', country: 'China' },
  { code: 'PEK', name: 'Beijing Capital', city: 'Beijing', country: 'China' },
  { code: 'CAN', name: 'Baiyun Intl', city: 'Guangzhou', country: 'China' },
  { code: 'SZX', name: 'Bao\'an Intl', city: 'Shenzhen', country: 'China' },
  { code: 'CTU', name: 'Shuangliu Intl', city: 'Chengdu', country: 'China' },
  { code: 'HGH', name: 'Xiaoshan Intl', city: 'Hangzhou', country: 'China' },
  { code: 'XIY', name: 'Xianyang Intl', city: 'Xi\'an', country: 'China' },
  { code: 'TPE', name: 'Taiwan Taoyuan', city: 'Taipei', country: 'Taiwan' },
  { code: 'KHH', name: 'Kaohsiung Intl', city: 'Kaohsiung', country: 'Taiwan' },
  { code: 'MNL', name: 'Ninoy Aquino', city: 'Manila', country: 'Philippines' },
  { code: 'CEB', name: 'Mactan-Cebu Intl', city: 'Cebu', country: 'Philippines' },
  { code: 'CGK', name: 'Soekarno-Hatta', city: 'Jakarta', country: 'Indonesia' },
  { code: 'DPS', name: 'Ngurah Rai', city: 'Bali', country: 'Indonesia' },
  { code: 'SUB', name: 'Juanda Intl', city: 'Surabaya', country: 'Indonesia' },
  { code: 'SGN', name: 'Tan Son Nhat', city: 'Ho Chi Minh City', country: 'Vietnam' },
  { code: 'HAN', name: 'Noi Bai Intl', city: 'Hanoi', country: 'Vietnam' },
  { code: 'DAD', name: 'Da Nang Intl', city: 'Da Nang', country: 'Vietnam' },
  { code: 'PNH', name: 'Phnom Penh Intl', city: 'Phnom Penh', country: 'Cambodia' },
  { code: 'REP', name: 'Siem Reap Intl', city: 'Siem Reap', country: 'Cambodia' },
  { code: 'RGN', name: 'Yangon Intl', city: 'Yangon', country: 'Myanmar' },
  { code: 'VTE', name: 'Wattay Intl', city: 'Vientiane', country: 'Laos' },
  { code: 'BNE', name: 'Brisbane Airport', city: 'Brisbane', country: 'Australia' },
  { code: 'PER', name: 'Perth Airport', city: 'Perth', country: 'Australia' },
  { code: 'ADL', name: 'Adelaide Airport', city: 'Adelaide', country: 'Australia' },
  { code: 'AKL', name: 'Auckland Intl', city: 'Auckland', country: 'New Zealand' },
  { code: 'CHC', name: 'Christchurch Intl', city: 'Christchurch', country: 'New Zealand' },
  { code: 'WLG', name: 'Wellington Intl', city: 'Wellington', country: 'New Zealand' },
  { code: 'ZQN', name: 'Queenstown', city: 'Queenstown', country: 'New Zealand' },
  { code: 'NAN', name: 'Nadi Intl', city: 'Nadi', country: 'Fiji' },
  { code: 'PPT', name: 'Faa\'a Intl', city: 'Papeete', country: 'French Polynesia' },
  { code: 'HNL', name: 'Daniel K. Inouye', city: 'Honolulu', country: 'USA' },
  { code: 'OGG', name: 'Kahului Airport', city: 'Maui', country: 'USA' },
  { code: 'KIX', name: 'Kansai Intl', city: 'Osaka', country: 'Japan' },
  { code: 'FUK', name: 'Fukuoka Airport', city: 'Fukuoka', country: 'Japan' },
  { code: 'CTS', name: 'New Chitose', city: 'Sapporo', country: 'Japan' },
  { code: 'NGO', name: 'Chubu Centrair', city: 'Nagoya', country: 'Japan' },
  { code: 'GMP', name: 'Gimpo Intl', city: 'Seoul', country: 'South Korea' },
  { code: 'PUS', name: 'Gimhae Intl', city: 'Busan', country: 'South Korea' },
  // More India
  { code: 'BLR', name: 'Kempegowda Intl', city: 'Bangalore', country: 'India' },
  { code: 'MAA', name: 'Chennai Intl', city: 'Chennai', country: 'India' },
  { code: 'HYD', name: 'Rajiv Gandhi Intl', city: 'Hyderabad', country: 'India' },
  { code: 'CCU', name: 'Netaji Subhas Chandra', city: 'Kolkata', country: 'India' },
  { code: 'COK', name: 'Cochin Intl', city: 'Kochi', country: 'India' },
  { code: 'GOI', name: 'Goa Intl', city: 'Goa', country: 'India' },
  { code: 'AMD', name: 'Sardar Vallabhbhai', city: 'Ahmedabad', country: 'India' },
  { code: 'JAI', name: 'Jaipur Intl', city: 'Jaipur', country: 'India' },
  // Sri Lanka, Nepal, Bangladesh, Pakistan
  { code: 'CMB', name: 'Bandaranaike Intl', city: 'Colombo', country: 'Sri Lanka' },
  { code: 'KTM', name: 'Tribhuvan Intl', city: 'Kathmandu', country: 'Nepal' },
  { code: 'DAC', name: 'Hazrat Shahjalal', city: 'Dhaka', country: 'Bangladesh' },
  { code: 'KHI', name: 'Jinnah Intl', city: 'Karachi', country: 'Pakistan' },
  { code: 'LHE', name: 'Allama Iqbal Intl', city: 'Lahore', country: 'Pakistan' },
  { code: 'ISB', name: 'Islamabad Intl', city: 'Islamabad', country: 'Pakistan' },
  // More Middle East
  { code: 'RUH', name: 'King Khalid Intl', city: 'Riyadh', country: 'Saudi Arabia' },
  { code: 'JED', name: 'King Abdulaziz', city: 'Jeddah', country: 'Saudi Arabia' },
  { code: 'DMM', name: 'King Fahd Intl', city: 'Dammam', country: 'Saudi Arabia' },
  { code: 'BAH', name: 'Bahrain Intl', city: 'Manama', country: 'Bahrain' },
  { code: 'KWI', name: 'Kuwait Intl', city: 'Kuwait City', country: 'Kuwait' },
  { code: 'MCT', name: 'Muscat Intl', city: 'Muscat', country: 'Oman' },
  { code: 'AMM', name: 'Queen Alia Intl', city: 'Amman', country: 'Jordan' },
  { code: 'BEY', name: 'Rafic Hariri Intl', city: 'Beirut', country: 'Lebanon' },
  { code: 'TLV', name: 'Ben Gurion', city: 'Tel Aviv', country: 'Israel' },
  { code: 'SHJ', name: 'Sharjah Intl', city: 'Sharjah', country: 'UAE' },
  { code: 'DWC', name: 'Al Maktoum Intl', city: 'Dubai', country: 'UAE' },
  // More Europe
  { code: 'BRU', name: 'Brussels Airport', city: 'Brussels', country: 'Belgium' },
  { code: 'VCE', name: 'Marco Polo', city: 'Venice', country: 'Italy' },
  { code: 'FLR', name: 'Peretola', city: 'Florence', country: 'Italy' },
  { code: 'BLQ', name: 'Guglielmo Marconi', city: 'Bologna', country: 'Italy' },
  { code: 'TRN', name: 'Caselle', city: 'Turin', country: 'Italy' },
  { code: 'PMO', name: 'Falcone Borsellino', city: 'Palermo', country: 'Italy' },
  { code: 'CTA', name: 'Fontanarossa', city: 'Catania', country: 'Italy' },
  { code: 'OLB', name: 'Costa Smeralda', city: 'Olbia', country: 'Italy' },
  { code: 'AGP', name: 'Malaga Airport', city: 'Malaga', country: 'Spain' },
  { code: 'ALC', name: 'Alicante-Elche', city: 'Alicante', country: 'Spain' },
  { code: 'VLC', name: 'Valencia Airport', city: 'Valencia', country: 'Spain' },
  { code: 'SVQ', name: 'San Pablo', city: 'Seville', country: 'Spain' },
  { code: 'BIO', name: 'Bilbao Airport', city: 'Bilbao', country: 'Spain' },
  { code: 'IBZ', name: 'Ibiza Airport', city: 'Ibiza', country: 'Spain' },
  { code: 'PMI', name: 'Palma de Mallorca', city: 'Palma', country: 'Spain' },
  { code: 'TFS', name: 'Tenerife South', city: 'Tenerife', country: 'Spain' },
  { code: 'LPA', name: 'Gran Canaria', city: 'Las Palmas', country: 'Spain' },
  { code: 'FNC', name: 'Cristiano Ronaldo', city: 'Funchal', country: 'Portugal' },
  { code: 'OPO', name: 'Francisco Sa Carneiro', city: 'Porto', country: 'Portugal' },
  { code: 'FAO', name: 'Faro Airport', city: 'Faro', country: 'Portugal' },
  { code: 'GLA', name: 'Glasgow Intl', city: 'Glasgow', country: 'UK' },
  { code: 'BHX', name: 'Birmingham Airport', city: 'Birmingham', country: 'UK' },
  { code: 'BRS', name: 'Bristol Airport', city: 'Bristol', country: 'UK' },
  { code: 'NCL', name: 'Newcastle Intl', city: 'Newcastle', country: 'UK' },
  { code: 'BFS', name: 'Belfast Intl', city: 'Belfast', country: 'UK' },
  { code: 'SNN', name: 'Shannon Airport', city: 'Shannon', country: 'Ireland' },
  { code: 'ORK', name: 'Cork Airport', city: 'Cork', country: 'Ireland' },
  { code: 'AMS', name: 'Schiphol', city: 'Amsterdam', country: 'Netherlands' },
  { code: 'RTM', name: 'Rotterdam The Hague', city: 'Rotterdam', country: 'Netherlands' },
  { code: 'CGN', name: 'Cologne Bonn', city: 'Cologne', country: 'Germany' },
  { code: 'STR', name: 'Stuttgart Airport', city: 'Stuttgart', country: 'Germany' },
  { code: 'NUE', name: 'Albrecht Durer', city: 'Nuremberg', country: 'Germany' },
  { code: 'HAJ', name: 'Hannover Airport', city: 'Hannover', country: 'Germany' },
  { code: 'LEJ', name: 'Leipzig/Halle', city: 'Leipzig', country: 'Germany' },
  { code: 'BSL', name: 'EuroAirport', city: 'Basel', country: 'Switzerland' },
  { code: 'LUG', name: 'Lugano Airport', city: 'Lugano', country: 'Switzerland' },
  { code: 'INN', name: 'Innsbruck Airport', city: 'Innsbruck', country: 'Austria' },
  { code: 'SZG', name: 'Salzburg Airport', city: 'Salzburg', country: 'Austria' },
  { code: 'GRZ', name: 'Graz Airport', city: 'Graz', country: 'Austria' },
  { code: 'KRK', name: 'John Paul II Intl', city: 'Krakow', country: 'Poland' },
  { code: 'GDN', name: 'Lech Walesa', city: 'Gdansk', country: 'Poland' },
  { code: 'WRO', name: 'Copernicus', city: 'Wroclaw', country: 'Poland' },
  { code: 'OTP', name: 'Henri Coanda', city: 'Bucharest', country: 'Romania' },
  { code: 'CLJ', name: 'Avram Iancu', city: 'Cluj-Napoca', country: 'Romania' },
  { code: 'SOF', name: 'Sofia Airport', city: 'Sofia', country: 'Bulgaria' },
  { code: 'VAR', name: 'Varna Airport', city: 'Varna', country: 'Bulgaria' },
  { code: 'BEG', name: 'Nikola Tesla', city: 'Belgrade', country: 'Serbia' },
  { code: 'ZAG', name: 'Franjo Tudman', city: 'Zagreb', country: 'Croatia' },
  { code: 'SPU', name: 'Split Airport', city: 'Split', country: 'Croatia' },
  { code: 'DBV', name: 'Dubrovnik Airport', city: 'Dubrovnik', country: 'Croatia' },
  { code: 'LJU', name: 'Joze Pucnik', city: 'Ljubljana', country: 'Slovenia' },
  { code: 'SKG', name: 'Makedonia', city: 'Thessaloniki', country: 'Greece' },
  { code: 'HER', name: 'Heraklion Intl', city: 'Heraklion', country: 'Greece' },
  { code: 'RHO', name: 'Diagoras', city: 'Rhodes', country: 'Greece' },
  { code: 'JMK', name: 'Mykonos Intl', city: 'Mykonos', country: 'Greece' },
  { code: 'JTR', name: 'Santorini Intl', city: 'Santorini', country: 'Greece' },
  { code: 'CFU', name: 'Ioannis Kapodistrias', city: 'Corfu', country: 'Greece' },
  { code: 'AYT', name: 'Antalya Airport', city: 'Antalya', country: 'Turkey' },
  { code: 'ADB', name: 'Adnan Menderes', city: 'Izmir', country: 'Turkey' },
  { code: 'DLM', name: 'Dalaman Airport', city: 'Dalaman', country: 'Turkey' },
  { code: 'BJV', name: 'Milas-Bodrum', city: 'Bodrum', country: 'Turkey' },
  { code: 'ESB', name: 'Esenboga Intl', city: 'Ankara', country: 'Turkey' },
  { code: 'TIA', name: 'Tirana Intl', city: 'Tirana', country: 'Albania' },
  { code: 'SKP', name: 'Skopje Intl', city: 'Skopje', country: 'North Macedonia' },
  { code: 'KEF', name: 'Keflavik Intl', city: 'Reykjavik', country: 'Iceland' },
  { code: 'GOT', name: 'Landvetter', city: 'Gothenburg', country: 'Sweden' },
  { code: 'BGO', name: 'Bergen Flesland', city: 'Bergen', country: 'Norway' },
  { code: 'TRD', name: 'Trondheim Vaernes', city: 'Trondheim', country: 'Norway' },
  { code: 'AAL', name: 'Aalborg Airport', city: 'Aalborg', country: 'Denmark' },
  { code: 'BLL', name: 'Billund Airport', city: 'Billund', country: 'Denmark' },
  { code: 'TLL', name: 'Lennart Meri', city: 'Tallinn', country: 'Estonia' },
  { code: 'RIX', name: 'Riga Intl', city: 'Riga', country: 'Latvia' },
  { code: 'VNO', name: 'Vilnius Intl', city: 'Vilnius', country: 'Lithuania' },
  { code: 'SVO', name: 'Sheremetyevo', city: 'Moscow', country: 'Russia' },
  { code: 'DME', name: 'Domodedovo', city: 'Moscow', country: 'Russia' },
  { code: 'LED', name: 'Pulkovo', city: 'St. Petersburg', country: 'Russia' },
  // More Americas
  { code: 'DEN', name: 'Denver Intl', city: 'Denver', country: 'USA' },
  { code: 'PHX', name: 'Phoenix Sky Harbor', city: 'Phoenix', country: 'USA' },
  { code: 'LAS', name: 'Harry Reid Intl', city: 'Las Vegas', country: 'USA' },
  { code: 'SAN', name: 'San Diego Intl', city: 'San Diego', country: 'USA' },
  { code: 'PDX', name: 'Portland Intl', city: 'Portland', country: 'USA' },
  { code: 'SLC', name: 'Salt Lake City', city: 'Salt Lake City', country: 'USA' },
  { code: 'AUS', name: 'Austin-Bergstrom', city: 'Austin', country: 'USA' },
  { code: 'MSP', name: 'Minneapolis-St. Paul', city: 'Minneapolis', country: 'USA' },
  { code: 'DTW', name: 'Detroit Metro', city: 'Detroit', country: 'USA' },
  { code: 'IAH', name: 'George Bush Intl', city: 'Houston', country: 'USA' },
  { code: 'MCO', name: 'Orlando Intl', city: 'Orlando', country: 'USA' },
  { code: 'TPA', name: 'Tampa Intl', city: 'Tampa', country: 'USA' },
  { code: 'FLL', name: 'Fort Lauderdale', city: 'Fort Lauderdale', country: 'USA' },
  { code: 'PHL', name: 'Philadelphia Intl', city: 'Philadelphia', country: 'USA' },
  { code: 'BWI', name: 'Baltimore-Washington', city: 'Baltimore', country: 'USA' },
  { code: 'IAD', name: 'Washington Dulles', city: 'Washington D.C.', country: 'USA' },
  { code: 'DCA', name: 'Reagan National', city: 'Washington D.C.', country: 'USA' },
  { code: 'EWR', name: 'Newark Liberty', city: 'Newark', country: 'USA' },
  { code: 'CLT', name: 'Charlotte Douglas', city: 'Charlotte', country: 'USA' },
  { code: 'RDU', name: 'Raleigh-Durham', city: 'Raleigh', country: 'USA' },
  { code: 'BNA', name: 'Nashville Intl', city: 'Nashville', country: 'USA' },
  { code: 'STL', name: 'Lambert-St. Louis', city: 'St. Louis', country: 'USA' },
  { code: 'MCI', name: 'Kansas City Intl', city: 'Kansas City', country: 'USA' },
  { code: 'SNA', name: 'John Wayne', city: 'Orange County', country: 'USA' },
  { code: 'OAK', name: 'Oakland Intl', city: 'Oakland', country: 'USA' },
  { code: 'SJC', name: 'San Jose Intl', city: 'San Jose', country: 'USA' },
  { code: 'SMF', name: 'Sacramento Intl', city: 'Sacramento', country: 'USA' },
  { code: 'YYC', name: 'Calgary Intl', city: 'Calgary', country: 'Canada' },
  { code: 'YEG', name: 'Edmonton Intl', city: 'Edmonton', country: 'Canada' },
  { code: 'YOW', name: 'Ottawa Intl', city: 'Ottawa', country: 'Canada' },
  { code: 'YWG', name: 'Winnipeg Intl', city: 'Winnipeg', country: 'Canada' },
  { code: 'YHZ', name: 'Halifax Stanfield', city: 'Halifax', country: 'Canada' },
  { code: 'CUN', name: 'Cancun Intl', city: 'Cancun', country: 'Mexico' },
  { code: 'GDL', name: 'Don Miguel Hidalgo', city: 'Guadalajara', country: 'Mexico' },
  { code: 'MTY', name: 'Monterrey Intl', city: 'Monterrey', country: 'Mexico' },
  { code: 'SJD', name: 'Los Cabos Intl', city: 'San Jose del Cabo', country: 'Mexico' },
  { code: 'PVR', name: 'Gustavo Diaz Ordaz', city: 'Puerto Vallarta', country: 'Mexico' },
  // Caribbean
  { code: 'MBJ', name: 'Sangster Intl', city: 'Montego Bay', country: 'Jamaica' },
  { code: 'KIN', name: 'Norman Manley', city: 'Kingston', country: 'Jamaica' },
  { code: 'NAS', name: 'Lynden Pindling', city: 'Nassau', country: 'Bahamas' },
  { code: 'PUJ', name: 'Punta Cana Intl', city: 'Punta Cana', country: 'Dominican Republic' },
  { code: 'SDQ', name: 'Las Americas Intl', city: 'Santo Domingo', country: 'Dominican Republic' },
  { code: 'SJU', name: 'Luis Munoz Marin', city: 'San Juan', country: 'Puerto Rico' },
  { code: 'AUA', name: 'Queen Beatrix', city: 'Oranjestad', country: 'Aruba' },
  { code: 'CUR', name: 'Hato Intl', city: 'Willemstad', country: 'Curacao' },
  { code: 'SXM', name: 'Princess Juliana', city: 'St. Maarten', country: 'Sint Maarten' },
  { code: 'BGI', name: 'Grantley Adams', city: 'Bridgetown', country: 'Barbados' },
  { code: 'POS', name: 'Piarco Intl', city: 'Port of Spain', country: 'Trinidad and Tobago' },
  { code: 'GCM', name: 'Owen Roberts', city: 'George Town', country: 'Cayman Islands' },
  { code: 'HAV', name: 'Jose Marti Intl', city: 'Havana', country: 'Cuba' },
  // South America
  { code: 'GIG', name: 'Galeao Intl', city: 'Rio de Janeiro', country: 'Brazil' },
  { code: 'BSB', name: 'Presidente Juscelino', city: 'Brasilia', country: 'Brazil' },
  { code: 'CNF', name: 'Tancredo Neves', city: 'Belo Horizonte', country: 'Brazil' },
  { code: 'SSA', name: 'Deputado Luis Eduardo', city: 'Salvador', country: 'Brazil' },
  { code: 'REC', name: 'Guararapes Intl', city: 'Recife', country: 'Brazil' },
  { code: 'FOR', name: 'Pinto Martins Intl', city: 'Fortaleza', country: 'Brazil' },
  { code: 'POA', name: 'Salgado Filho', city: 'Porto Alegre', country: 'Brazil' },
  { code: 'CWB', name: 'Afonso Pena', city: 'Curitiba', country: 'Brazil' },
  { code: 'SCL', name: 'Arturo Merino Benitez', city: 'Santiago', country: 'Chile' },
  { code: 'LIM', name: 'Jorge Chavez', city: 'Lima', country: 'Peru' },
  { code: 'CUZ', name: 'Velasco Astete', city: 'Cusco', country: 'Peru' },
  { code: 'BOG', name: 'El Dorado Intl', city: 'Bogota', country: 'Colombia' },
  { code: 'MDE', name: 'Jose Maria Cordova', city: 'Medellin', country: 'Colombia' },
  { code: 'CTG', name: 'Rafael Nunez', city: 'Cartagena', country: 'Colombia' },
  { code: 'UIO', name: 'Mariscal Sucre', city: 'Quito', country: 'Ecuador' },
  { code: 'GYE', name: 'Jose Joaquin de Olmedo', city: 'Guayaquil', country: 'Ecuador' },
  { code: 'CCS', name: 'Simon Bolivar', city: 'Caracas', country: 'Venezuela' },
  { code: 'MVD', name: 'Carrasco Intl', city: 'Montevideo', country: 'Uruguay' },
  { code: 'ASU', name: 'Silvio Pettirossi', city: 'Asuncion', country: 'Paraguay' },
  { code: 'LPB', name: 'El Alto Intl', city: 'La Paz', country: 'Bolivia' },
  { code: 'VVI', name: 'Viru Viru Intl', city: 'Santa Cruz', country: 'Bolivia' },
  { code: 'PTY', name: 'Tocumen Intl', city: 'Panama City', country: 'Panama' },
  { code: 'SJO', name: 'Juan Santamaria', city: 'San Jose', country: 'Costa Rica' },
  { code: 'GUA', name: 'La Aurora Intl', city: 'Guatemala City', country: 'Guatemala' },
  { code: 'SAL', name: 'Oscar Arnulfo Romero', city: 'San Salvador', country: 'El Salvador' },
  // Additional airports from Duffel API
  // AG
  { code: 'ANU', name: 'V. C. Bird Intl', city: 'Antigua', country: 'AG' },
  // AM
  { code: 'EVN', name: 'Zvartnots Intl', city: 'Yerevan', country: 'AM' },
  // AR
  { code: 'AEP', name: 'Jorge Newbery Airfield', city: 'Buenos Aires', country: 'AR' },
  { code: 'CRD', name: 'Comodoro Rivadavia', city: 'Comodoro Rivadavia', country: 'AR' },
  { code: 'COR', name: 'Ingeniero Aeronautico', city: 'Cordoba', country: 'AR' },
  { code: 'FTE', name: 'El Calafate Intl', city: 'El Calafate', country: 'AR' },
  { code: 'IGR', name: 'Cataratas Del Iguazu Intl', city: 'Iguazu', country: 'AR' },
  { code: 'NQN', name: 'Presidente Peron Intl', city: 'Neuquen', country: 'AR' },
  { code: 'RGL', name: 'Piloto Civil Norberto', city: 'Rio Gallegos', country: 'AR' },
  { code: 'SLA', name: 'Martin Miguel de Guemes', city: 'Salta', country: 'AR' },
  { code: 'BRC', name: 'San Carlos de Bariloche', city: 'San Carlos de Bariloche', country: 'AR' },
  { code: 'REL', name: 'Trelew Intl', city: 'Trelew', country: 'AR' },
  { code: 'USH', name: 'Ushuaia Malvinas', city: 'Ushuaia', country: 'AR' },
  // AU
  { code: 'ABX', name: 'Albury', city: 'Albury', country: 'AU' },
  { code: 'ASP', name: 'Alice Springs', city: 'Alice Springs', country: 'AU' },
  { code: 'ARM', name: 'Armidale', city: 'Armidale', country: 'AU' },
  { code: 'AYQ', name: 'Ayers Rock', city: 'Ayers Rock', country: 'AU' },
  { code: 'BNK', name: 'Ballina Byron Gateway', city: 'Ballina', country: 'AU' },
  { code: 'BHQ', name: 'Broken Hill', city: 'Broken Hill', country: 'AU' },
  { code: 'BME', name: 'Broome Intl', city: 'Broome', country: 'AU' },
  { code: 'BDB', name: 'Bundaberg', city: 'Bundaberg', country: 'AU' },
  { code: 'CNS', name: 'Cairns', city: 'Cairns', country: 'AU' },
  { code: 'CBR', name: 'Canberra', city: 'Canberra', country: 'AU' },
  { code: 'CFS', name: 'Coffs Harbour', city: 'Coffs Harbour', country: 'AU' },
  { code: 'DRW', name: 'Darwin Intl', city: 'Darwin', country: 'AU' },
  { code: 'DBO', name: 'Dubbo City Regional', city: 'Dubbo', country: 'AU' },
  { code: 'EMD', name: 'Emerald', city: 'Emerald', country: 'AU' },
  { code: 'GET', name: 'Geraldton', city: 'Geraldton', country: 'AU' },
  { code: 'GLT', name: 'Gladstone', city: 'Gladstone', country: 'AU' },
  { code: 'OOL', name: 'Gold Coast', city: 'Gold Coast', country: 'AU' },
  { code: 'AVV', name: 'Avalon', city: 'Greater Geelong', country: 'AU' },
  { code: 'HTI', name: 'Hamilton Island', city: 'Hamilton Island', country: 'AU' },
  { code: 'KGI', name: 'Kalgoorlie-Boulder', city: 'Kalgoorlie', country: 'AU' },
  { code: 'KNX', name: 'East Kimberley Regional', city: 'Kununurra', country: 'AU' },
  { code: 'LSY', name: 'Lismore', city: 'Lismore', country: 'AU' },
  { code: 'LDH', name: 'Lord Howe Island', city: 'Lord Howe Island', country: 'AU' },
  { code: 'MKY', name: 'Mackay', city: 'Mackay', country: 'AU' },
  { code: 'MIM', name: 'Merimbula', city: 'Merimbula', country: 'AU' },
  { code: 'MQL', name: 'Mildura', city: 'Mildura', country: 'AU' },
  { code: 'ISA', name: 'Mount Isa', city: 'Mount Isa', country: 'AU' },
  { code: 'NTL', name: 'Newcastle', city: 'Newcastle', country: 'AU' },
  { code: 'ZNE', name: 'Newman', city: 'Newman', country: 'AU' },
  { code: 'GOV', name: 'Gove', city: 'Nhulunbuy', country: 'AU' },
  { code: 'PHE', name: 'Port Hedland Intl', city: 'Port Hedland', country: 'AU' },
  { code: 'PLO', name: 'Port Lincoln', city: 'Port Lincoln', country: 'AU' },
  { code: 'PPP', name: 'Whitsunday Coast', city: 'Proserpine', country: 'AU' },
  { code: 'ROK', name: 'Rockhampton', city: 'Rockhampton', country: 'AU' },
  { code: 'MCY', name: 'Sunshine Coast', city: 'Sunshine Coast', country: 'AU' },
  { code: 'TMW', name: 'Tamworth', city: 'Tamworth', country: 'AU' },
  { code: 'TSV', name: 'Townsville', city: 'Townsville', country: 'AU' },
  { code: 'WGA', name: 'Wagga Wagga', city: 'Wagga Wagga', country: 'AU' },
  // AZ
  { code: 'GYD', name: 'Heydar Aliyev Intl', city: 'Baku', country: 'AZ' },
  // BA
  { code: 'BNX', name: 'Banja Luka Intl', city: 'Banja Luka', country: 'BA' },
  { code: 'SJJ', name: 'Sarajevo Intl', city: 'Sarajevo', country: 'BA' },
  { code: 'TZL', name: 'Tuzla Intl', city: 'Tuzla', country: 'BA' },
  // BE
  { code: 'ANR', name: 'Antwerp Intl', city: 'Antwerp', country: 'BE' },
  { code: 'CRL', name: 'Brussels South Charleroi', city: 'Brussels', country: 'BE' },
  // BF
  { code: 'OUA', name: 'Ouagadougou', city: 'Ouagadougou', country: 'BF' },
  // BG
  { code: 'BOJ', name: 'Burgas', city: 'Burgas', country: 'BG' },
  { code: 'PDV', name: 'Plovdiv', city: 'Plovdiv', country: 'BG' },
  // BI
  { code: 'BJM', name: 'Bujumbura Intl', city: 'Bujumbura', country: 'BI' },
  // BJ
  { code: 'COO', name: 'Cadjehoun', city: 'Cotonou', country: 'BJ' },
  // BL
  { code: 'SBH', name: 'Gustaf III', city: 'Gustavia', country: 'BL' },
  // BN
  { code: 'BWN', name: 'Brunei Intl', city: 'Bandar Seri Begawan', country: 'BN' },
  // BO
  { code: 'CBB', name: 'Jorge Wilstermann Intl', city: 'Cochabamba', country: 'BO' },
  { code: 'ORU', name: 'Juan Mendoza', city: 'Oruro', country: 'BO' },
  { code: 'SRZ', name: 'El Trompillo', city: 'Santa Cruz', country: 'BO' },
  { code: 'SRE', name: 'Juana Azurduy de Padilla', city: 'Sucre', country: 'BO' },
  { code: 'TJA', name: 'Capitan Oriel Lea Plaza', city: 'Tarija', country: 'BO' },
  { code: 'TDD', name: 'Teniente Jorge Henrich', city: 'Trinidad', country: 'BO' },
  // BR
  { code: 'AJU', name: 'Santa Maria', city: 'Aracaju', country: 'BR' },
  { code: 'BEL', name: 'Val de Cans Intl', city: 'Belem', country: 'BR' },
  { code: 'BVB', name: 'Boa Vista Atlas Brasil', city: 'Boa Vista', country: 'BR' },
  { code: 'VCP', name: 'Viracopos Intl', city: 'Campinas', country: 'BR' },
  { code: 'CGB', name: 'Marechal Rondon Intl', city: 'Cuiaba', country: 'BR' },
  { code: 'FLN', name: 'Hercilio Luz Intl', city: 'Florianopolis', country: 'BR' },
  { code: 'IGU', name: 'Foz do Iguacu Intl', city: 'Foz do Iguacu', country: 'BR' },
  { code: 'JPA', name: 'Presidente Castro Pinto', city: 'Joao Pessoa', country: 'BR' },
  { code: 'JOI', name: 'Joinville', city: 'Joinville', country: 'BR' },
  { code: 'MCZ', name: 'Maceio Zumbi dos Palmares', city: 'Maceio', country: 'BR' },
  { code: 'MAO', name: 'Eduardo Gomes Intl', city: 'Manaus', country: 'BR' },
  { code: 'NAT', name: 'Natal Intl', city: 'Natal', country: 'BR' },
  { code: 'NVT', name: 'Navegantes', city: 'Navegantes', country: 'BR' },
  { code: 'PMW', name: 'Palmas', city: 'Palmas', country: 'BR' },
  { code: 'PVH', name: 'Porto Velho', city: 'Porto Velho', country: 'BR' },
  { code: 'RBR', name: 'Rio Branco Intl', city: 'Rio Branco', country: 'BR' },
  { code: 'SDU', name: 'Santos Dumont', city: 'Rio de Janeiro', country: 'BR' },
  { code: 'SLZ', name: 'Marechal Cunha Machado', city: 'Sao Luis', country: 'BR' },
  { code: 'CGH', name: 'Sao Paulo Congonhas', city: 'Sao Paulo', country: 'BR' },
  { code: 'THE', name: 'Teresina Senador Petronio', city: 'Teresina', country: 'BR' },
  { code: 'VIX', name: 'Eurico de Aguiar Salles', city: 'Vitoria', country: 'BR' },
  // BW
  { code: 'GBE', name: 'Sir Seretse Khama Intl', city: 'Gaborone', country: 'BW' },
  // BZ
  { code: 'BZE', name: 'Philip S. W. Goldson Intl', city: 'Belize City', country: 'BZ' },
  // CA
  { code: 'YYG', name: 'Charlottetown', city: 'Charlottetown', country: 'CA' },
  { code: 'YFC', name: 'Fredericton Intl', city: 'Fredericton', country: 'CA' },
  { code: 'YFB', name: 'Iqaluit', city: 'Iqaluit', country: 'CA' },
  { code: 'YKA', name: 'Kamloops', city: 'Kamloops', country: 'CA' },
  { code: 'YLW', name: 'Kelowna Intl', city: 'Kelowna', country: 'CA' },
  { code: 'YQM', name: 'Greater Moncton', city: 'Moncton', country: 'CA' },
  { code: 'YQB', name: 'Quebec City Jean-Lesage', city: 'Quebec', country: 'CA' },
  { code: 'YQR', name: 'Regina Intl', city: 'Regina', country: 'CA' },
  { code: 'YXE', name: 'Saskatoon John G. Diefenb', city: 'Saskatoon', country: 'CA' },
  { code: 'YYJ', name: 'Victoria Intl', city: 'Victoria', country: 'CA' },
  { code: 'YXY', name: 'Whitehorse Intl', city: 'Whitehorse', country: 'CA' },
  { code: 'YZF', name: 'Yellowknife', city: 'Yellowknife', country: 'CA' },
  // CD
  { code: 'FIH', name: 'Kinshasa NDjili', city: 'Kinshasa', country: 'CD' },
  // CF
  { code: 'BGF', name: 'Bangui MPoko Intl', city: 'Bangui', country: 'CF' },
  // CG
  { code: 'BZV', name: 'Maya-Maya', city: 'Brazzaville', country: 'CG' },
  { code: 'PNR', name: 'Pointe Noire', city: 'Pointe-Noire', country: 'CG' },
  // CK
  { code: 'AIT', name: 'Aitutaki', city: 'Aitutaki', country: 'CK' },
  { code: 'RAR', name: 'Rarotonga Intl', city: 'Avarua', country: 'CK' },
  // CL
  { code: 'ANF', name: 'Antofagasta', city: 'Antofagasta', country: 'CL' },
  { code: 'BBA', name: 'Balmaceda', city: 'Balmaceda', country: 'CL' },
  { code: 'CCP', name: 'Concepcion', city: 'Concepcion', country: 'CL' },
  { code: 'IQQ', name: 'Iquique Diego Aracena', city: 'Iquique', country: 'CL' },
  { code: 'LSC', name: 'La Florida', city: 'La Serena', country: 'CL' },
  { code: 'PMC', name: 'El Tepual', city: 'Puerto Montt', country: 'CL' },
  { code: 'PUQ', name: 'Punta Arenas', city: 'Punta Arenas', country: 'CL' },
  { code: 'ZCO', name: 'La Araucania', city: 'Temuco', country: 'CL' },
  { code: 'ZAL', name: 'Pichoy', city: 'Valdivia', country: 'CL' },
  // CM
  { code: 'DLA', name: 'Douala Intl', city: 'Douala', country: 'CM' },
  { code: 'YAO', name: 'Yaounde', city: 'Yaounde', country: 'CM' },
  // CN
  { code: 'CSX', name: 'Changsha Huanghua Intl', city: 'Changsha', country: 'CN' },
  { code: 'CKG', name: 'Chongqing Jiangbei Intl', city: 'Chongqing', country: 'CN' },
  { code: 'DLC', name: 'Dalian Zhoushuizi Intl', city: 'Dalian', country: 'CN' },
  { code: 'FOC', name: 'Fuzhou Changle Intl', city: 'Fuzhou', country: 'CN' },
  { code: 'KWL', name: 'Guilin Liangjiang Intl', city: 'Guilin', country: 'CN' },
  { code: 'KWE', name: 'Guiyang Longdongbao Intl', city: 'Guiyang', country: 'CN' },
  { code: 'HAK', name: 'Haikou Meilan Intl', city: 'Haikou', country: 'CN' },
  { code: 'HRB', name: 'Harbin Taiping Intl', city: 'Harbin', country: 'CN' },
  { code: 'HET', name: 'Hohhot Baita Intl', city: 'Hohhot', country: 'CN' },
  { code: 'TNA', name: 'Jinan Yaoqiang Intl', city: 'Jinan', country: 'CN' },
  { code: 'KMG', name: 'Kunming Changshui Intl', city: 'Kunming', country: 'CN' },
  { code: 'LHW', name: 'Lanzhou Zhongchuan Intl', city: 'Lanzhou', country: 'CN' },
  { code: 'LXA', name: 'Lhasa Gonggar', city: 'Lhasa', country: 'CN' },
  { code: 'NKG', name: 'Nanjing Lukou Intl', city: 'Nanjing', country: 'CN' },
  { code: 'NNG', name: 'Nanning Wuxu Intl', city: 'Nanning', country: 'CN' },
  { code: 'NGB', name: 'Ningbo Lishe Intl', city: 'Ningbo', country: 'CN' },
  { code: 'TAO', name: 'Qingdao Liuting Intl', city: 'Qingdao', country: 'CN' },
  { code: 'JJN', name: 'Quanzhou Jinjiang Intl', city: 'Quanzhou', country: 'CN' },
  { code: 'SYX', name: 'Sanya Phoenix Intl', city: 'Sanya', country: 'CN' },
  { code: 'SWA', name: 'Jieyang Chaoshan Intl', city: 'Shantou', country: 'CN' },
  { code: 'SHE', name: 'Shenyang Taoxian Intl', city: 'Shenyang', country: 'CN' },
  { code: 'TYN', name: 'Taiyuan Wusu Intl', city: 'Taiyuan', country: 'CN' },
  { code: 'TSN', name: 'Tianjin Binhai Intl', city: 'Tianjin', country: 'CN' },
  { code: 'URC', name: 'Urumqi Diwopu Intl', city: 'Urumqi', country: 'CN' },
  { code: 'WNZ', name: 'Wenzhou Longwan Intl', city: 'Wenzhou', country: 'CN' },
  { code: 'WUH', name: 'Wuhan Tianhe Intl', city: 'Wuhan', country: 'CN' },
  { code: 'XMN', name: 'Xiamen Gaoqi Intl', city: 'Xiamen', country: 'CN' },
  { code: 'YNT', name: 'Yantai Penglai Intl', city: 'Yantai', country: 'CN' },
  { code: 'INC', name: 'Yinchuan Hedong Intl', city: 'Yinchuan', country: 'CN' },
  { code: 'ZHA', name: 'Zhanjiang', city: 'Zhanjiang', country: 'CN' },
  { code: 'CGO', name: 'Zhengzhou Xinzheng Intl', city: 'Zhengzhou', country: 'CN' },
  { code: 'ZUH', name: 'Zhuhai Jinwan', city: 'Zhuhai', country: 'CN' },
  // CO
  { code: 'AXM', name: 'El Eden Intl', city: 'Armenia', country: 'CO' },
  { code: 'BAQ', name: 'Ernesto Cortissoz Intl', city: 'Barranquilla', country: 'CO' },
  { code: 'BGA', name: 'Palonegro Intl', city: 'Bucaramanga', country: 'CO' },
  { code: 'CLO', name: 'Alfonso Bonilla Aragon', city: 'Cali', country: 'CO' },
  { code: 'LET', name: 'Alfredo Vasquez Cobo Intl', city: 'Leticia', country: 'CO' },
  { code: 'EOH', name: 'Enrique Olaya Herrera', city: 'Medellin', country: 'CO' },
  { code: 'MTR', name: 'Los Garzones', city: 'Monteria', country: 'CO' },
  { code: 'NVA', name: 'Benito Salas', city: 'Neiva', country: 'CO' },
  { code: 'PEI', name: 'Matecana Intl', city: 'Pereira', country: 'CO' },
  { code: 'ADZ', name: 'Gustavo Rojas Pinilla', city: 'San Andres', country: 'CO' },
  { code: 'SMR', name: 'Simon Bolivar Intl', city: 'Santa Marta', country: 'CO' },
  // CR
  { code: 'LIR', name: 'Daniel Oduber Quiros Intl', city: 'Liberia', country: 'CR' },
  { code: 'XQP', name: 'Quepos La Managua', city: 'Quepos', country: 'CR' },
  // CY
  { code: 'LCA', name: 'Larnaca Intl', city: 'Larnaca', country: 'CY' },
  { code: 'ECN', name: 'Ercan Intl', city: 'Nicosia', country: 'CY' },
  { code: 'PFO', name: 'Paphos Intl', city: 'Paphos', country: 'CY' },
  // DJ
  { code: 'JIB', name: 'Djibouti-Ambouli Intl', city: 'Djibouti', country: 'DJ' },
  // DM
  { code: 'DOM', name: 'Douglas-Charles', city: 'Dominica', country: 'DM' },
  // EC
  { code: 'GPS', name: 'Seymour', city: 'Baltra Island', country: 'EC' },
  { code: 'OCC', name: 'Francisco de Orellana', city: 'Coca', country: 'EC' },
  { code: 'CUE', name: 'Mariscal Lamar Intl', city: 'Cuenca', country: 'EC' },
  { code: 'ESM', name: 'Colonel Carlos Concha', city: 'Esmeraldas', country: 'EC' },
  { code: 'LGQ', name: 'Lago Agrio', city: 'Lago Agrio', country: 'EC' },
  { code: 'MEC', name: 'Eloy Alfaro Intl', city: 'Manta', country: 'EC' },
  { code: 'SCY', name: 'San Cristobal', city: 'San Cristobal', country: 'EC' },
  // ER
  { code: 'ASM', name: 'Asmara Intl', city: 'Asmara', country: 'ER' },
  // ES
  { code: 'LEI', name: 'Almeria', city: 'Almeria', country: 'ES' },
  { code: 'ACE', name: 'Lanzarote', city: 'Arrecife', country: 'ES' },
  { code: 'SPC', name: 'La Palma', city: 'Brena Baja', country: 'ES' },
  { code: 'FUE', name: 'Fuerteventura', city: 'Fuerteventura', country: 'ES' },
  { code: 'GRO', name: 'Girona-Costa Brava', city: 'Girona', country: 'ES' },
  { code: 'XRY', name: 'Jerez', city: 'Jerez', country: 'ES' },
  { code: 'REU', name: 'Reus', city: 'Reus', country: 'ES' },
  { code: 'SCQ', name: 'Santiago de Compostela', city: 'Santiago de Compostela', country: 'ES' },
  // FJ
  { code: 'LBS', name: 'Labasa', city: 'Labasa', country: 'FJ' },
  { code: 'TVU', name: 'Matei', city: 'Matei', country: 'FJ' },
  { code: 'SVU', name: 'Savusavu', city: 'Savusavu', country: 'FJ' },
  { code: 'SUV', name: 'Nausori Intl', city: 'Suva', country: 'FJ' },
  // FR
  { code: 'AJA', name: 'Ajaccio Napoleon Bonaparte', city: 'Ajaccio', country: 'FR' },
  { code: 'BIA', name: 'Bastia Poretta', city: 'Bastia', country: 'FR' },
  { code: 'BOD', name: 'Bordeaux-Merignac', city: 'Bordeaux', country: 'FR' },
  { code: 'CFE', name: 'Clermont-Ferrand Auvergne', city: 'Clermont-Ferrand', country: 'FR' },
  { code: 'FSC', name: 'Figari-Sud-Corse', city: 'Figari', country: 'FR' },
  { code: 'LIL', name: 'Lille', city: 'Lille', country: 'FR' },
  { code: 'LYS', name: 'Lyon-Saint-Exupery', city: 'Lyon', country: 'FR' },
  { code: 'MRS', name: 'Marseille Provence', city: 'Marseille', country: 'FR' },
  { code: 'MPL', name: 'Montpellier-Mediterranee', city: 'Montpellier', country: 'FR' },
  { code: 'NTE', name: 'Nantes Atlantique', city: 'Nantes', country: 'FR' },
  { code: 'ORY', name: 'Paris-Orly', city: 'Paris', country: 'FR' },
  { code: 'TLS', name: 'Toulouse-Blagnac', city: 'Toulouse', country: 'FR' },
  // GA
  { code: 'LBV', name: 'Libreville', city: 'Libreville', country: 'GA' },
  // GD
  { code: 'GND', name: 'Maurice Bishop Intl', city: 'Grenada', country: 'GD' },
  // GE
  { code: 'BUS', name: 'Batumi Intl', city: 'Batumi', country: 'GE' },
  { code: 'KUT', name: 'Kutaisi Intl', city: 'Kutaisi', country: 'GE' },
  { code: 'TBS', name: 'Tbilisi Intl', city: 'Tbilisi', country: 'GE' },
  // GP
  { code: 'PTP', name: 'Pointe-a-Pitre Intl', city: 'Pointe-a-Pitre', country: 'GP' },
  // GQ
  { code: 'SSG', name: 'Malabo Intl', city: 'Malabo', country: 'GQ' },
  // GR
  { code: 'AXD', name: 'Alexandroupolis', city: 'Alexandroupolis', country: 'GR' },
  { code: 'CHQ', name: 'Chania Intl', city: 'Chania', country: 'GR' },
  { code: 'JKH', name: 'Chios Island National', city: 'Chios', country: 'GR' },
  { code: 'IOA', name: 'Ioannina National', city: 'Ioannina', country: 'GR' },
  { code: 'KLX', name: 'Kalamata Intl', city: 'Kalamata', country: 'GR' },
  { code: 'AOK', name: 'Karpathos Island National', city: 'Karpathos', country: 'GR' },
  { code: 'KVA', name: 'Kavala Intl', city: 'Kavala', country: 'GR' },
  { code: 'EFL', name: 'Kefalonia Cephalonia Intl', city: 'Kefallinia', country: 'GR' },
  { code: 'KGS', name: 'Kos Intl', city: 'Kos', country: 'GR' },
  { code: 'LRS', name: 'Leros Municipal', city: 'Leros', country: 'GR' },
  { code: 'MLO', name: 'Milos Island National', city: 'Milos', country: 'GR' },
  { code: 'MJT', name: 'Mytilene Intl', city: 'Mytilene', country: 'GR' },
  { code: 'GPA', name: 'Araxos', city: 'Patras', country: 'GR' },
  { code: 'PVK', name: 'Aktion National', city: 'Preveza', country: 'GR' },
  { code: 'SMI', name: 'Samos Intl', city: 'Samos', country: 'GR' },
  { code: 'JSI', name: 'Skiathos Island National', city: 'Skiathos', country: 'GR' },
  { code: 'SKU', name: 'Skyros Island National', city: 'Skyros', country: 'GR' },
  { code: 'VOL', name: 'Nea Anchialos National', city: 'Volos', country: 'GR' },
  { code: 'ZTH', name: 'Zakynthos Intl', city: 'Zakynthos', country: 'GR' },
  // GY
  { code: 'GEO', name: 'Cheddi Jagan Intl', city: 'Georgetown', country: 'GY' },
  // HN
  { code: 'RTB', name: 'Juan Manuel Galvez Intl', city: 'Roatan', country: 'HN' },
  { code: 'SAP', name: 'Ramon Villeda Morales', city: 'San Pedro Sula', country: 'HN' },
  { code: 'TGU', name: 'Toncontin Intl', city: 'Tegucigalpa', country: 'HN' },
  // HT
  { code: 'CAP', name: 'Cap-Haitien Intl', city: 'Cap-Haitien', country: 'HT' },
  { code: 'PAP', name: 'Toussaint Louverture Intl', city: 'Port-au-Prince', country: 'HT' },
  // ID
  { code: 'AMQ', name: 'Pattimura', city: 'Ambon', country: 'ID' },
  { code: 'BPN', name: 'Sultan Aji Muhammad', city: 'Balikpapan', country: 'ID' },
  { code: 'TKG', name: 'Radin Inten II', city: 'Bandar Lampung', country: 'ID' },
  { code: 'BDO', name: 'Husein Sastranegara Intl', city: 'Bandung', country: 'ID' },
  { code: 'BDJ', name: 'Syamsudin Noor', city: 'Banjarmasin', country: 'ID' },
  { code: 'BTH', name: 'Hang Nadim Intl', city: 'Batam', country: 'ID' },
  { code: 'DJJ', name: 'Sentani', city: 'Jayapura', country: 'ID' },
  { code: 'KOE', name: 'El Tari', city: 'Kupang', country: 'ID' },
  { code: 'LOP', name: 'Lombok Intl', city: 'Lombok', country: 'ID' },
  { code: 'UPG', name: 'Sultan Hasanuddin Intl', city: 'Makassar', country: 'ID' },
  { code: 'MDC', name: 'Sam Ratulangi Intl', city: 'Manado', country: 'ID' },
  { code: 'KNO', name: 'Kualanamu Intl', city: 'Medan', country: 'ID' },
  { code: 'PDG', name: 'Minangkabau Intl', city: 'Padang', country: 'ID' },
  { code: 'PLM', name: 'Sultan Mahmud Badaruddin', city: 'Palembang', country: 'ID' },
  { code: 'PKU', name: 'Sultan Syarif Kasim II', city: 'Pekanbaru', country: 'ID' },
  { code: 'SRG', name: 'Semarang', city: 'Semarang', country: 'ID' },
  { code: 'SOC', name: 'Adisumarmo Intl', city: 'Surakarta', country: 'ID' },
  { code: 'JOG', name: 'Yogyakarta Intl', city: 'Yogyakarta', country: 'ID' },
  // IL
  { code: 'ETH', name: 'Eilat', city: 'Eilat', country: 'IL' },
  { code: 'VDA', name: 'Ovda', city: 'Ovda', country: 'IL' },
  // IN
  { code: 'TRZ', name: 'Tiruchirappalli Intl', city: 'Tiruchirappalli', country: 'IN' },
  // IQ
  { code: 'BGW', name: 'Baghdad Intl', city: 'Baghdad', country: 'IQ' },
  { code: 'BSR', name: 'Basrah Intl', city: 'Basrah', country: 'IQ' },
  { code: 'EBL', name: 'Erbil Intl', city: 'Erbil', country: 'IQ' },
  { code: 'NJF', name: 'Al Najaf Intl', city: 'Najaf', country: 'IQ' },
  { code: 'ISU', name: 'Sulaimaniyah Intl', city: 'Sulaymaniyah', country: 'IQ' },
  // IR
  { code: 'ABD', name: 'Abadan', city: 'Abadan', country: 'IR' },
  { code: 'AWZ', name: 'Ahwaz', city: 'Ahwaz', country: 'IR' },
  { code: 'BND', name: 'Bandar Abbas Intl', city: 'Bandar Abbas', country: 'IR' },
  { code: 'IFN', name: 'Isfahan Intl', city: 'Isfahan', country: 'IR' },
  { code: 'KER', name: 'Kerman', city: 'Kerman', country: 'IR' },
  { code: 'KIH', name: 'Kish Intl', city: 'Kish Island', country: 'IR' },
  { code: 'MHD', name: 'Mashhad Intl', city: 'Mashhad', country: 'IR' },
  { code: 'SYZ', name: 'Shiraz Intl', city: 'Shiraz', country: 'IR' },
  { code: 'TBZ', name: 'Tabriz Intl', city: 'Tabriz', country: 'IR' },
  { code: 'THR', name: 'Mehrabad Intl', city: 'Tehran', country: 'IR' },
  { code: 'IKA', name: 'Tehran Imam Khomeini Intl', city: 'Tehran', country: 'IR' },
  { code: 'ZAH', name: 'Zahedan Intl', city: 'Zahedan', country: 'IR' },
  // IT
  { code: 'AHO', name: 'Alghero-Fertilia', city: 'Alghero', country: 'IT' },
  { code: 'BRI', name: 'Bari Karol Wojtyla', city: 'Bari', country: 'IT' },
  { code: 'BGY', name: 'Il Caravaggio Intl', city: 'Bergamo', country: 'IT' },
  { code: 'BDS', name: 'Brindisi', city: 'Brindisi', country: 'IT' },
  { code: 'CAG', name: 'Cagliari Elmas', city: 'Cagliari', country: 'IT' },
  { code: 'GOA', name: 'Genoa Cristoforo Colombo', city: 'Genoa', country: 'IT' },
  { code: 'SUF', name: 'Lamezia Terme Intl', city: 'Lamezia Terme', country: 'IT' },
  { code: 'LIN', name: 'Linate', city: 'Milan', country: 'IT' },
  { code: 'PSA', name: 'Pisa Intl', city: 'Pisa', country: 'IT' },
  { code: 'REG', name: 'Reggio Calabria', city: 'Reggio Calabria', country: 'IT' },
  { code: 'TSF', name: 'Treviso', city: 'Treviso', country: 'IT' },
  { code: 'TRS', name: 'Trieste Friuli Venezia', city: 'Trieste', country: 'IT' },
  // JO
  { code: 'AQJ', name: 'King Hussein Intl', city: 'Aqaba', country: 'JO' },
  // KN
  { code: 'SKB', name: 'Robert L. Bradshaw Intl', city: 'St Kitts', country: 'KN' },
  // KZ
  { code: 'ALA', name: 'Almaty Intl', city: 'Almaty', country: 'KZ' },
  { code: 'NQZ', name: 'Nursultan Nazarbayev Intl', city: 'Nur-Sultan', country: 'KZ' },
  { code: 'CIT', name: 'Shymkent Intl', city: 'Shymkent', country: 'KZ' },
  // LA
  { code: 'LPQ', name: 'Luang Prabang Intl', city: 'Luang Prabang', country: 'LA' },
  { code: 'PKZ', name: 'Pakse Intl', city: 'Pakse', country: 'LA' },
  // LC
  { code: 'SLU', name: 'George F. L. Charles', city: 'Castries', country: 'LC' },
  { code: 'UVF', name: 'Hewanorra Intl', city: 'St Lucia', country: 'LC' },
  // LR
  { code: 'ROB', name: 'Roberts Intl', city: 'Monrovia', country: 'LR' },
  // LU
  { code: 'LUX', name: 'Luxembourg', city: 'Luxembourg', country: 'LU' },
  // ME
  { code: 'TGD', name: 'Podgorica', city: 'Podgorica', country: 'ME' },
  { code: 'TIV', name: 'Tivat', city: 'Tivat', country: 'ME' },
  // MG
  { code: 'TNR', name: 'Ivato Intl', city: 'Antananarivo', country: 'MG' },
  // ML
  { code: 'BKO', name: 'Bamako-Senou Intl', city: 'Bamako', country: 'ML' },
  // MM
  { code: 'MDL', name: 'Mandalay Intl', city: 'Mandalay', country: 'MM' },
  { code: 'NYT', name: 'Naypyidaw', city: 'Naypyitaw', country: 'MM' },
  // MO
  { code: 'MFM', name: 'Macau Intl', city: 'Macau', country: 'MO' },
  // MQ
  { code: 'FDF', name: 'Martinique Aime Cesaire', city: 'Fort-de-France', country: 'MQ' },
  // MR
  { code: 'NKC', name: 'Nouakchott Oumtounsy Intl', city: 'Nouakchott', country: 'MR' },
  // MW
  { code: 'BLZ', name: 'Chileka Intl', city: 'Blantyre', country: 'MW' },
  { code: 'LLW', name: 'Lilongwe Intl', city: 'Lilongwe', country: 'MW' },
  // MX
  { code: 'ACA', name: 'General Juan N. Alvarez', city: 'Acapulco', country: 'MX' },
  { code: 'AGU', name: 'Aguascalientes Intl', city: 'Aguascalientes', country: 'MX' },
  { code: 'CME', name: 'Ciudad del Carmen Intl', city: 'Ciudad del Carmen', country: 'MX' },
  { code: 'CJS', name: 'Ciudad Juarez Intl', city: 'Ciudad Juarez', country: 'MX' },
  { code: 'CUL', name: 'Bachigualato Federal Intl', city: 'Culiacan', country: 'MX' },
  { code: 'HUX', name: 'Bahias de Huatulco Intl', city: 'Huatulco', country: 'MX' },
  { code: 'ZIH', name: 'Ixtapa Zihuatanejo Intl', city: 'Ixtapa', country: 'MX' },
  { code: 'LAP', name: 'La Paz Intl', city: 'La Paz', country: 'MX' },
  { code: 'BJX', name: 'Del Bajio Intl', city: 'Leon', country: 'MX' },
  { code: 'ZLO', name: 'Playa de Oro Intl', city: 'Manzanillo', country: 'MX' },
  { code: 'MZT', name: 'Mazatlan Intl', city: 'Mazatlan', country: 'MX' },
  { code: 'MID', name: 'Manuel Crescencio Rejon', city: 'Merida', country: 'MX' },
  { code: 'MLM', name: 'Morelia Intl', city: 'Morelia', country: 'MX' },
  { code: 'OAX', name: 'Oaxaca Intl', city: 'Oaxaca', country: 'MX' },
  { code: 'PBC', name: 'Puebla Intl', city: 'Puebla', country: 'MX' },
  { code: 'QRO', name: 'Queretaro Intercontinental', city: 'Queretaro', country: 'MX' },
  { code: 'SLP', name: 'San Luis Potosi Intl', city: 'San Luis Potosi', country: 'MX' },
  { code: 'TAM', name: 'Tampico Intl', city: 'Tampico', country: 'MX' },
  { code: 'TIJ', name: 'Tijuana Intl', city: 'Tijuana', country: 'MX' },
  { code: 'VER', name: 'Veracruz Intl', city: 'Veracruz', country: 'MX' },
  { code: 'VSA', name: 'Villahermosa Intl', city: 'Villahermosa', country: 'MX' },
  { code: 'ZCL', name: 'Zacatecas Intl', city: 'Zacatecas', country: 'MX' },
  // MY
  { code: 'BTU', name: 'Bintulu', city: 'Bintulu', country: 'MY' },
  { code: 'IPH', name: 'Sultan Azlan Shah', city: 'Ipoh', country: 'MY' },
  { code: 'JHB', name: 'Senai Intl', city: 'Johor Bahru', country: 'MY' },
  { code: 'KBR', name: 'Sultan Ismail Petra', city: 'Kota Bharu', country: 'MY' },
  { code: 'BKI', name: 'Kota Kinabalu Intl', city: 'Kota Kinabalu', country: 'MY' },
  { code: 'SZB', name: 'Sultan Abdul Aziz Shah', city: 'Kuala Lumpur', country: 'MY' },
  { code: 'TGG', name: 'Sultan Mahmud', city: 'Kuala Terengganu', country: 'MY' },
  { code: 'KUA', name: 'Sultan Haji Ahmad Shah', city: 'Kuantan', country: 'MY' },
  { code: 'KCH', name: 'Kuching Intl', city: 'Kuching', country: 'MY' },
  { code: 'LGK', name: 'Langkawi Intl', city: 'Langkawi', country: 'MY' },
  { code: 'MYY', name: 'Miri', city: 'Miri', country: 'MY' },
  { code: 'PEN', name: 'Penang Intl', city: 'Penang', country: 'MY' },
  { code: 'SDK', name: 'Sandakan', city: 'Sandakan', country: 'MY' },
  { code: 'TWU', name: 'Tawau', city: 'Tawau', country: 'MY' },
  // MZ
  { code: 'MPM', name: 'Maputo Intl', city: 'Maputo', country: 'MZ' },
  { code: 'APL', name: 'Nampula', city: 'Nampula', country: 'MZ' },
  // NA
  { code: 'WDH', name: 'Hosea Kutako Intl', city: 'Windhoek', country: 'NA' },
  // NC
  { code: 'NOU', name: 'La Tontouta Intl', city: 'Noumea', country: 'NC' },
  { code: 'GEA', name: 'Noumea Magenta', city: 'Noumea', country: 'NC' },
  // NE
  { code: 'NIM', name: 'Diori Hamani Intl', city: 'Niamey', country: 'NE' },
  // NI
  { code: 'MGA', name: 'Augusto Cesar Sandino', city: 'Managua', country: 'NI' },
  // NL
  { code: 'EIN', name: 'Eindhoven', city: 'Eindhoven', country: 'NL' },
  { code: 'MST', name: 'Maastricht Aachen', city: 'Maastricht', country: 'NL' },
  // PE
  { code: 'AQP', name: 'Rodriguez Ballon Intl', city: 'Arequipa', country: 'PE' },
  { code: 'CIX', name: 'Chiclayo Intl', city: 'Chiclayo', country: 'PE' },
  { code: 'IQT', name: 'Coronel FAP Francisco', city: 'Iquitos', country: 'PE' },
  { code: 'JUL', name: 'Inca Manco Capac Intl', city: 'Juliaca', country: 'PE' },
  { code: 'PIU', name: 'Piura', city: 'Piura', country: 'PE' },
  { code: 'PEM', name: 'Padre Aldamiz Intl', city: 'Puerto Maldonado', country: 'PE' },
  { code: 'TCQ', name: 'Coronel FAP Carlos Cirian', city: 'Tacna', country: 'PE' },
  { code: 'TRU', name: 'Capitan FAP Carlos Martin', city: 'Trujillo', country: 'PE' },
  // PG
  { code: 'GUR', name: 'Gurney', city: 'Alotau', country: 'PG' },
  { code: 'BUA', name: 'Buka', city: 'Buka Island', country: 'PG' },
  { code: 'GKA', name: 'Goroka', city: 'Goroka', country: 'PG' },
  { code: 'KVG', name: 'Kavieng', city: 'Kavieng', country: 'PG' },
  { code: 'LAE', name: 'Lae Nadzab', city: 'Lae', country: 'PG' },
  { code: 'MAS', name: 'Momote', city: 'Manus Island', country: 'PG' },
  { code: 'HGU', name: 'Mount Hagen', city: 'Mount Hagen', country: 'PG' },
  { code: 'POM', name: 'Jacksons Intl', city: 'Port Moresby', country: 'PG' },
  { code: 'RAB', name: 'Rabaul', city: 'Rabaul', country: 'PG' },
  { code: 'TBG', name: 'Tabubil', city: 'Tabubil', country: 'PG' },
  { code: 'WWK', name: 'Wewak', city: 'Wewak', country: 'PG' },
  // PH
  { code: 'BCD', name: 'Bacolod-Silay Intl', city: 'Bacolod', country: 'PH' },
  { code: 'USU', name: 'Francisco B. Reyes', city: 'Busuanga', country: 'PH' },
  { code: 'BXU', name: 'Bancasi', city: 'Butuan', country: 'PH' },
  { code: 'CGY', name: 'Laguindingan', city: 'Cagayan de Oro', country: 'PH' },
  { code: 'MPH', name: 'Godofredo P. Ramos', city: 'Caticlan', country: 'PH' },
  { code: 'DVO', name: 'Davao Intl', city: 'Davao', country: 'PH' },
  { code: 'IAO', name: 'Siargao', city: 'Del Carmen', country: 'PH' },
  { code: 'DGT', name: 'Sibulan', city: 'Dumaguete', country: 'PH' },
  { code: 'ENI', name: 'El Nido', city: 'El Nido', country: 'PH' },
  { code: 'GES', name: 'General Santos Intl', city: 'General Santos', country: 'PH' },
  { code: 'ILO', name: 'Iloilo Intl', city: 'Iloilo', country: 'PH' },
  { code: 'KLO', name: 'Kalibo Intl', city: 'Kalibo', country: 'PH' },
  { code: 'CRK', name: 'Clark Intl', city: 'Mabalacat', country: 'PH' },
  { code: 'WNP', name: 'Naga', city: 'Naga', country: 'PH' },
  { code: 'PPS', name: 'Puerto Princesa Intl', city: 'Puerto Princesa', country: 'PH' },
  { code: 'SUG', name: 'Surigao', city: 'Surigao City', country: 'PH' },
  { code: 'TAC', name: 'Daniel Z. Romualdez', city: 'Tacloban', country: 'PH' },
  { code: 'TAG', name: 'Tagbilaran', city: 'Tagbilaran', country: 'PH' },
  { code: 'ZAM', name: 'Zamboanga Intl', city: 'Zamboanga City', country: 'PH' },
  // PR
  { code: 'BQN', name: 'Aguadilla Rafael Hernandez', city: 'Aguadilla', country: 'PR' },
  { code: 'PSE', name: 'Mercedita', city: 'Ponce', country: 'PR' },
  // RE
  { code: 'RUN', name: 'Roland Garros', city: 'St Denis', country: 'RE' },
  // RU
  { code: 'IKT', name: 'Irkutsk Intl', city: 'Irkutsk', country: 'RU' },
  { code: 'KGD', name: 'Khrabrovo', city: 'Kaliningrad', country: 'RU' },
  { code: 'KZN', name: 'Kazan Intl', city: 'Kazan', country: 'RU' },
  { code: 'KHV', name: 'Khabarovsk-Novy', city: 'Khabarovsk', country: 'RU' },
  { code: 'KRR', name: 'Krasnodar Intl', city: 'Krasnodar', country: 'RU' },
  { code: 'KJA', name: 'Krasnoyarsk Intl', city: 'Krasnoyarsk', country: 'RU' },
  { code: 'MRV', name: 'Mineralnye Vody', city: 'Mineralnye Vody', country: 'RU' },
  { code: 'GOJ', name: 'Nizhny Novgorod Intl', city: 'Nizhny Novgorod', country: 'RU' },
  { code: 'OVB', name: 'Tolmachevo', city: 'Novosibirsk', country: 'RU' },
  { code: 'PEE', name: 'Perm Intl', city: 'Perm', country: 'RU' },
  { code: 'PKC', name: 'Petropavlovsk-Kamchatsky', city: 'Petropavlovsk-Kamchatsky', country: 'RU' },
  { code: 'ROV', name: 'Rostov-on-Don', city: 'Rostov-on-Don', country: 'RU' },
  { code: 'AER', name: 'Sochi Intl', city: 'Sochi', country: 'RU' },
  { code: 'UFA', name: 'Ufa Intl', city: 'Ufa', country: 'RU' },
  { code: 'UUD', name: 'Baikal Intl', city: 'Ulan-Ude', country: 'RU' },
  { code: 'VVO', name: 'Vladivostok Intl', city: 'Vladivostok', country: 'RU' },
  { code: 'VOG', name: 'Volgograd Intl', city: 'Volgograd', country: 'RU' },
  { code: 'SVX', name: 'Koltsovo', city: 'Yekaterinburg', country: 'RU' },
  // SB
  { code: 'GZO', name: 'Nusatupe', city: 'Gizo', country: 'SB' },
  { code: 'HIR', name: 'Honiara Intl', city: 'Honiara', country: 'SB' },
  { code: 'MUA', name: 'Munda', city: 'Munda', country: 'SB' },
  // SC
  { code: 'SEZ', name: 'Seychelles Intl', city: 'Seychelles', country: 'SC' },
  // SL
  { code: 'FNA', name: 'Lungi Intl', city: 'Freetown', country: 'SL' },
  // SO
  { code: 'MGQ', name: 'Aden Adde Intl', city: 'Mogadishu', country: 'SO' },
  // SR
  { code: 'PBM', name: 'Johan Adolf Pengel Intl', city: 'Paramaribo', country: 'SR' },
  // SY
  { code: 'ALP', name: 'Aleppo Intl', city: 'Aleppo', country: 'SY' },
  { code: 'LTK', name: 'Bassel Al-Assad Intl', city: 'Latakia', country: 'SY' },
  // TD
  { code: 'NDJ', name: 'NDjamena Intl', city: 'NDjamena', country: 'TD' },
  // TG
  { code: 'LFW', name: 'Lome-Tokoin', city: 'Lome', country: 'TG' },
  // TH
  { code: 'CNX', name: 'Chiang Mai Intl', city: 'Chiang Mai', country: 'TH' },
  { code: 'CEI', name: 'Chiang Rai Intl', city: 'Chiang Rai', country: 'TH' },
  { code: 'HDY', name: 'Hat Yai Intl', city: 'Hat Yai', country: 'TH' },
  { code: 'USM', name: 'Samui', city: 'Ko Samui', country: 'TH' },
  { code: 'KBV', name: 'Krabi', city: 'Krabi', country: 'TH' },
  { code: 'HKT', name: 'Phuket Intl', city: 'Phuket', country: 'TH' },
  { code: 'UTP', name: 'U-Tapao Intl', city: 'Rayong', country: 'TH' },
  { code: 'UBP', name: 'Ubon Ratchathani', city: 'Ubon Ratchathani', country: 'TH' },
  { code: 'UTH', name: 'Udon Thani Intl', city: 'Udon Thani', country: 'TH' },
  // TM
  { code: 'ASB', name: 'Ashgabat Intl', city: 'Ashgabat', country: 'TM' },
  // TO
  { code: 'TBU', name: 'Fuaamotu Intl', city: 'Nukualofa', country: 'TO' },
  { code: 'VAV', name: 'Vavau Intl', city: 'Vavau', country: 'TO' },
  // TT
  { code: 'TAB', name: 'Arthur Napoleon Raymond', city: 'Tobago', country: 'TT' },
  // TW
  { code: 'RMQ', name: 'Taichung Intl', city: 'Taichung', country: 'TW' },
  { code: 'TSA', name: 'Taipei Songshan', city: 'Taipei', country: 'TW' },
  // TZ
  { code: 'JRO', name: 'Kilimanjaro Intl', city: 'Kilimanjaro', country: 'TZ' },
  { code: 'ZNZ', name: 'Abeid Amani Karume Intl', city: 'Zanzibar', country: 'TZ' },
  // US
  { code: 'ABQ', name: 'Albuquerque Intl Sunport', city: 'Albuquerque', country: 'US' },
  { code: 'ANC', name: 'Ted Stevens Anchorage', city: 'Anchorage', country: 'US' },
  { code: 'BOI', name: 'Boise', city: 'Boise', country: 'US' },
  { code: 'BUR', name: 'Hollywood Burbank', city: 'Burbank', country: 'US' },
  { code: 'CVG', name: 'Cincinnati Northern KY', city: 'Cincinnati', country: 'US' },
  { code: 'CLE', name: 'Cleveland Hopkins Intl', city: 'Cleveland', country: 'US' },
  { code: 'CMH', name: 'John Glenn Columbus Intl', city: 'Columbus', country: 'US' },
  { code: 'FAI', name: 'Fairbanks Intl', city: 'Fairbanks', country: 'US' },
  { code: 'RSW', name: 'Southwest Florida Intl', city: 'Fort Myers', country: 'US' },
  { code: 'FAT', name: 'Fresno Yosemite Intl', city: 'Fresno', country: 'US' },
  { code: 'IND', name: 'Indianapolis Intl', city: 'Indianapolis', country: 'US' },
  { code: 'JAX', name: 'Jacksonville Intl', city: 'Jacksonville', country: 'US' },
  { code: 'KOA', name: 'Kona Intl', city: 'Kona', country: 'US' },
  { code: 'LIH', name: 'Lihue', city: 'Lihue', country: 'US' },
  { code: 'LGB', name: 'Long Beach', city: 'Long Beach', country: 'US' },
  { code: 'MKE', name: 'General Mitchell Intl', city: 'Milwaukee', country: 'US' },
  { code: 'MRY', name: 'Monterey Regional', city: 'Monterey', country: 'US' },
  { code: 'OMA', name: 'Eppley Airfield', city: 'Omaha', country: 'US' },
  { code: 'ONT', name: 'Ontario Intl', city: 'Ontario', country: 'US' },
  { code: 'PSP', name: 'Palm Springs Intl', city: 'Palm Springs', country: 'US' },
  { code: 'PIT', name: 'Pittsburgh Intl', city: 'Pittsburgh', country: 'US' },
  { code: 'RNO', name: 'Reno Tahoe Intl', city: 'Reno', country: 'US' },
  { code: 'SBA', name: 'Santa Barbara Municipal', city: 'Santa Barbara', country: 'US' },
  { code: 'STS', name: 'Charles M. Schulz Sonoma', city: 'Santa Rosa', country: 'US' },
  { code: 'GEG', name: 'Spokane Intl', city: 'Spokane', country: 'US' },
  { code: 'TUS', name: 'Tucson Intl', city: 'Tucson', country: 'US' },
  { code: 'PBI', name: 'Palm Beach Intl', city: 'West Palm Beach', country: 'US' },
  // UY
  { code: 'PDP', name: 'Punta del Este', city: 'Punta del Este', country: 'UY' },
  // UZ
  { code: 'BHK', name: 'Bukhara Intl', city: 'Bukhara', country: 'UZ' },
  { code: 'SKD', name: 'Samarkand Intl', city: 'Samarkand', country: 'UZ' },
  { code: 'TAS', name: 'Tashkent Intl', city: 'Tashkent', country: 'UZ' },
  // VC
  { code: 'SVD', name: 'Argyle Intl', city: 'St Vincent', country: 'VC' },
  // VE
  { code: 'BLA', name: 'General Jose Antonio', city: 'Barcelona', country: 'VE' },
  { code: 'BRM', name: 'Jacinto Lara Intl', city: 'Barquisimeto', country: 'VE' },
  { code: 'PZO', name: 'Puerto Ordaz Intl', city: 'Bolivar', country: 'VE' },
  { code: 'CUM', name: 'Antonio Jose de Sucre', city: 'Cumana', country: 'VE' },
  { code: 'MAR', name: 'La Chinita Intl', city: 'Maracaibo', country: 'VE' },
  { code: 'MUN', name: 'Maturin Intl', city: 'Maturin', country: 'VE' },
  { code: 'PMV', name: 'Porlamar Intl', city: 'Porlamar', country: 'VE' },
  { code: 'VLN', name: 'Arturo Michelena Intl', city: 'Valencia', country: 'VE' },
  // VG
  { code: 'EIS', name: 'Terrance B. Lettsome Intl', city: 'Tortola', country: 'VG' },
  { code: 'VIJ', name: 'Virgin Gorda', city: 'Virgin Gorda', country: 'VG' },
  // VI
  { code: 'STX', name: 'Henry E. Rohlsen', city: 'St Croix Island', country: 'VI' },
  { code: 'STT', name: 'Cyril E. King', city: 'St Thomas Island', country: 'VI' },
  // VU
  { code: 'SON', name: 'Santo-Pekoa Intl', city: 'Luganville', country: 'VU' },
  { code: 'VLI', name: 'Bauerfield Intl', city: 'Port Vila', country: 'VU' },
  // WS
  { code: 'APW', name: 'Faleolo Intl', city: 'Apia', country: 'WS' },
  // XK
  { code: 'PRN', name: 'Pristina Intl', city: 'Pristina', country: 'XK' },
  // ZA
  { code: 'DUR', name: 'King Shaka Intl', city: 'Durban', country: 'ZA' },
  { code: 'MQP', name: 'Kruger Mpumalanga Intl', city: 'Nelspruit', country: 'ZA' },
  { code: 'PLZ', name: 'Port Elizabeth', city: 'Port Elizabeth', country: 'ZA' },
  // ZM
  { code: 'LUN', name: 'Kenneth Kaunda Intl', city: 'Lusaka', country: 'ZM' },
  // ZW
  { code: 'HRE', name: 'Harare Intl', city: 'Harare', country: 'ZW' },
  { code: 'VFA', name: 'Victoria Falls Intl', city: 'Victoria Falls', country: 'ZW' },
];

interface FlightOffer {
  id: string;
  offerId: string;
  offerRequestId: string;
  airline: {
    name: string;
    iataCode: string;
    logoUrl: string | null;
  };
  flightNumber: string;
  departure: {
    airport: string;
    airportName: string;
    city: string;
    time: string;
    terminal: string | null;
  };
  arrival: {
    airport: string;
    airportName: string;
    city: string;
    time: string;
    terminal: string | null;
  };
  duration: string;
  durationMinutes: number;
  stops: number;
  stopDetails: Array<{
    airport: string;
    city: string;
    duration: string | null;
  }>;
  segments: Array<{
    flightNumber: string;
    aircraft: string | null;
    departure: {
      airport: string;
      airportName: string;
      time: string;
      terminal: string | null;
    };
    arrival: {
      airport: string;
      airportName: string;
      time: string;
      terminal: string | null;
    };
    duration: string | null;
    cabinClass: string;
  }>;
  returnJourney: {
    departure: { airport: string; time: string };
    arrival: { airport: string; time: string };
    duration: string | null;
    stops: number;
  } | null;
  price: {
    amount: number;
    currency: string;
    perPassenger: number;
  };
  baggage: {
    checkedBags: number;
    cabinBags: number;
    checkedBagWeight: number | null;
  };
  cabinClass: string;
  cabinClassName: string;
  expiresAt: string;
  conditions: {
    refundable: boolean;
    changeable: boolean;
  };
  rawOffer: any;
}

interface SearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  passengers: number;
  cabinClass: string;
  journeyType: 'one-way' | 'return' | 'multi-city';
}

export default function FlightTickets() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState<SearchParams>({
    origin: '',
    destination: '',
    departureDate: '',
    returnDate: '',
    passengers: 1,
    cabinClass: 'economy',
    journeyType: 'return',
  });
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [flights, setFlights] = useState<FlightOffer[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  // Booking flow moved to /book/flight/:offerId page

  // Airport autocomplete
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
  const originRef = useRef<HTMLDivElement>(null);
  const destinationRef = useRef<HTMLDivElement>(null);

  // Filters
  const [sortBy, setSortBy] = useState('least-expensive');
  const [maxStops, setMaxStops] = useState('any');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (originRef.current && !originRef.current.contains(event.target as Node)) {
        setShowOriginDropdown(false);
      }
      if (destinationRef.current && !destinationRef.current.contains(event.target as Node)) {
        setShowDestinationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter airports based on search input
  const getFilteredAirports = (query: string) => {
    if (!query) return POPULAR_AIRPORTS.slice(0, 10);
    const lowerQuery = query.toLowerCase();
    return POPULAR_AIRPORTS.filter(
      airport =>
        airport.code.toLowerCase().includes(lowerQuery) ||
        airport.name.toLowerCase().includes(lowerQuery) ||
        airport.city.toLowerCase().includes(lowerQuery) ||
        airport.country.toLowerCase().includes(lowerQuery)
    ).slice(0, 8);
  };

  const handleAirportSelect = (airport: typeof POPULAR_AIRPORTS[0], field: 'origin' | 'destination') => {
    setSearchParams(prev => ({ ...prev, [field]: airport.code }));
    if (field === 'origin') {
      setShowOriginDropdown(false);
    } else {
      setShowDestinationDropdown(false);
    }
  };

  // Load search params from URL or localStorage on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    // Support both 'origin'/'destination' and 'from'/'to' params
    const urlOrigin = urlParams.get('origin') || urlParams.get('from');
    const urlDestination = urlParams.get('destination') || urlParams.get('to');
    const urlDate = urlParams.get('date');
    const urlPassengers = urlParams.get('passengers');
    const urlJourneyType = urlParams.get('journeyType') as 'one-way' | 'return' | 'multi-city' | null;
    const urlReturnDate = urlParams.get('returnDate');

    // If we have origin and destination from URL, pre-fill the form
    if (urlOrigin || urlDestination) {
      setSearchParams(prev => ({
        ...prev,
        origin: urlOrigin || '',
        destination: urlDestination || '',
        departureDate: urlDate || '',
        returnDate: urlReturnDate || '',
        passengers: urlPassengers ? parseInt(urlPassengers) : 1,
        journeyType: urlJourneyType || 'return'
      }));

      // Only auto-search if we have all required fields
      if (urlOrigin && urlDestination && urlDate) {
        const params = {
          origin: urlOrigin,
          destination: urlDestination,
          departureDate: urlDate,
          returnDate: urlReturnDate || '',
          passengers: urlPassengers ? parseInt(urlPassengers) : 1,
          journeyType: urlJourneyType || 'return',
          cabinClass: 'economy'
        };
        setTimeout(() => handleSearchWithParams(params), 100);
      }
      return;
    }

    // Fallback to localStorage
    const savedSearch = localStorage.getItem('flightSearchParams');
    if (savedSearch) {
      try {
        const parsed = JSON.parse(savedSearch);
        if (parsed.timestamp && Date.now() - parsed.timestamp < 3600000) {
          setSearchParams(prev => ({
            ...prev,
            origin: parsed.origin || '',
            destination: parsed.destination || '',
            departureDate: parsed.departureDate || '',
            returnDate: parsed.returnDate || '',
            passengers: parsed.passengers || 1,
            journeyType: parsed.journeyType || 'return'
          }));
        }
      } catch (e) {
        console.error('Error parsing saved search:', e);
      }
    }
  }, []);

  const handleSearchWithParams = async (params: SearchParams) => {
    setIsSearching(true);
    setHasSearched(true);
    setSearchError(null);

    try {
      // Save search to localStorage
      localStorage.setItem('flightSearchParams', JSON.stringify({
        ...params,
        timestamp: Date.now()
      }));

      // Call the search-flights Edge Function
      console.log('Searching flights with params:', {
        origin: params.origin.toUpperCase(),
        destination: params.destination.toUpperCase(),
        departureDate: params.departureDate,
        returnDate: params.journeyType !== 'one-way' ? params.returnDate : undefined,
        passengers: params.passengers,
        cabinClass: params.cabinClass
      });

      const { data, error } = await supabase.functions.invoke('search-flights', {
        body: {
          origin: params.origin.toUpperCase(),
          destination: params.destination.toUpperCase(),
          departureDate: params.departureDate,
          returnDate: params.journeyType !== 'one-way' && params.returnDate ? params.returnDate : undefined,
          passengers: params.passengers,
          cabinClass: params.cabinClass
        }
      });

      console.log('Search response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to search flights');
      }

      if (!data) {
        throw new Error('No response from flight search API');
      }

      if (!data.success) {
        throw new Error(data.error || 'No flights found');
      }

      console.log(`Found ${data.offers?.length || 0} flight offers`);
      setFlights(data.offers || []);

    } catch (err: any) {
      console.error('Flight search error:', err);
      setSearchError(err.message || 'Failed to search flights. Please try again.');
      setFlights([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Check if input is a valid 3-letter IATA code
  const isValidIATACode = (code: string) => {
    return /^[A-Za-z]{3}$/.test(code);
  };

  // Try to find airport code from city name
  const findAirportCode = (input: string): string | null => {
    const lowerInput = input.toLowerCase().trim();
    const airport = POPULAR_AIRPORTS.find(
      a => a.code.toLowerCase() === lowerInput ||
           a.city.toLowerCase() === lowerInput ||
           a.name.toLowerCase() === lowerInput
    );
    return airport?.code || null;
  };

  const handleSearch = async () => {
    if (!searchParams.origin || !searchParams.destination || !searchParams.departureDate) {
      setSearchError('Please enter origin, destination, and departure date');
      return;
    }

    // Try to resolve city names to IATA codes
    let originCode = searchParams.origin.trim();
    let destinationCode = searchParams.destination.trim();

    if (!isValidIATACode(originCode)) {
      const foundCode = findAirportCode(originCode);
      if (foundCode) {
        originCode = foundCode;
        setSearchParams(prev => ({ ...prev, origin: foundCode }));
      } else {
        setSearchError('Please select an origin airport from the dropdown or enter a valid 3-letter airport code (e.g., LHR, JFK)');
        return;
      }
    }

    if (!isValidIATACode(destinationCode)) {
      const foundCode = findAirportCode(destinationCode);
      if (foundCode) {
        destinationCode = foundCode;
        setSearchParams(prev => ({ ...prev, destination: foundCode }));
      } else {
        setSearchError('Please select a destination airport from the dropdown or enter a valid 3-letter airport code (e.g., LHR, JFK)');
        return;
      }
    }

    await handleSearchWithParams({
      ...searchParams,
      origin: originCode.toUpperCase(),
      destination: destinationCode.toUpperCase()
    });
  };

  const handleFlightSelect = (flight: FlightOffer) => {
    // Navigate to full-page booking flow with flight data in state
    navigate(`/book/flight/${flight.offerId}?passengers=${searchParams.passengers}`, {
      state: { flight, searchParams }
    });
  };

  // handleBookingComplete moved to FlightBooking page

  // Apply filters and sorting
  const filteredFlights = React.useMemo(() => {
    let result = [...flights];

    // Filter by stops
    if (maxStops !== 'any') {
      const maxStopsNum = maxStops === 'direct' ? 0 : parseInt(maxStops);
      result = result.filter(f => f.stops <= maxStopsNum);
    }

    // Sort
    switch (sortBy) {
      case 'least-expensive':
        result.sort((a, b) => a.price.amount - b.price.amount);
        break;
      case 'most-expensive':
        result.sort((a, b) => b.price.amount - a.price.amount);
        break;
      case 'shortest':
        result.sort((a, b) => a.durationMinutes - b.durationMinutes);
        break;
      case 'longest':
        result.sort((a, b) => b.durationMinutes - a.durationMinutes);
        break;
    }

    return result;
  }, [flights, sortBy, maxStops]);

  const formatTime = (isoString: string) => {
    if (!isoString) return '--:--';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleGetStarted = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <LandingHeader onGetStarted={handleGetStarted} />

      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
          <h1 className="text-3xl sm:text-4xl font-light text-gray-900 mb-3 tracking-tight">
            Flight Tickets
          </h1>
          <p className="text-gray-500 text-base sm:text-lg mb-8">
            Search and book flights with crypto payments
          </p>

          {/* Journey Type Pills */}
          <div className="flex gap-2 mb-6">
            {[
              { id: 'one-way', label: 'One way' },
              { id: 'return', label: 'Return' },
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => setSearchParams({ ...searchParams, journeyType: type.id as any })}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  searchParams.journeyType === type.id
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl border border-gray-300 shadow-sm hover:shadow-md transition-shadow p-2">
            <div className="flex flex-col sm:flex-row">
              {/* Origin */}
              <div ref={originRef} className="flex-1 px-4 py-3 border-b sm:border-b-0 sm:border-r border-gray-200 relative">
                <label className="block text-xs font-medium text-gray-900 mb-1">From</label>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="City or airport..."
                    value={searchParams.origin}
                    onChange={(e) => {
                      setSearchParams({ ...searchParams, origin: e.target.value });
                      setShowOriginDropdown(true);
                    }}
                    onFocus={() => setShowOriginDropdown(true)}
                    className="w-full text-sm text-gray-600 placeholder-gray-400 bg-transparent outline-none"
                  />
                </div>
                {/* Origin Dropdown */}
                {showOriginDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-50 max-h-64 overflow-y-auto">
                    {getFilteredAirports(searchParams.origin).map((airport) => (
                      <button
                        key={airport.code}
                        onClick={() => handleAirportSelect(airport, 'origin')}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-gray-700">{airport.code}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{airport.name}</p>
                          <p className="text-xs text-gray-500 truncate">{airport.city}, {airport.country}</p>
                        </div>
                      </button>
                    ))}
                    {getFilteredAirports(searchParams.origin).length === 0 && searchParams.origin.length >= 3 && (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        Using code: <span className="font-mono font-bold">{searchParams.origin}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Destination */}
              <div ref={destinationRef} className="flex-1 px-4 py-3 border-b sm:border-b-0 sm:border-r border-gray-200 relative">
                <label className="block text-xs font-medium text-gray-900 mb-1">To</label>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="City or airport..."
                    value={searchParams.destination}
                    onChange={(e) => {
                      setSearchParams({ ...searchParams, destination: e.target.value });
                      setShowDestinationDropdown(true);
                    }}
                    onFocus={() => setShowDestinationDropdown(true)}
                    className="w-full text-sm text-gray-600 placeholder-gray-400 bg-transparent outline-none"
                  />
                </div>
                {/* Destination Dropdown */}
                {showDestinationDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-50 max-h-64 overflow-y-auto">
                    {getFilteredAirports(searchParams.destination).map((airport) => (
                      <button
                        key={airport.code}
                        onClick={() => handleAirportSelect(airport, 'destination')}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-gray-700">{airport.code}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{airport.name}</p>
                          <p className="text-xs text-gray-500 truncate">{airport.city}, {airport.country}</p>
                        </div>
                      </button>
                    ))}
                    {getFilteredAirports(searchParams.destination).length === 0 && searchParams.destination.length >= 3 && (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        Using code: <span className="font-mono font-bold">{searchParams.destination}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Departure Date */}
              <div className="flex-1 px-4 py-3 border-b sm:border-b-0 sm:border-r border-gray-200">
                <label className="block text-xs font-medium text-gray-900 mb-1">Departure</label>
                <input
                  type="date"
                  value={searchParams.departureDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSearchParams({ ...searchParams, departureDate: e.target.value })}
                  className="w-full text-sm text-gray-600 bg-transparent outline-none"
                />
              </div>

              {/* Return Date */}
              {searchParams.journeyType !== 'one-way' && (
                <div className="flex-1 px-4 py-3 border-b sm:border-b-0 sm:border-r border-gray-200">
                  <label className="block text-xs font-medium text-gray-900 mb-1">Return</label>
                  <input
                    type="date"
                    value={searchParams.returnDate}
                    min={searchParams.departureDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setSearchParams({ ...searchParams, returnDate: e.target.value })}
                    className="w-full text-sm text-gray-600 bg-transparent outline-none"
                  />
                </div>
              )}

              {/* Passengers */}
              <div className="flex-1 px-4 py-3 border-b sm:border-b-0 sm:border-r border-gray-200">
                <label className="block text-xs font-medium text-gray-900 mb-1">Passengers</label>
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-gray-400 flex-shrink-0" />
                  <select
                    value={searchParams.passengers}
                    onChange={(e) => setSearchParams({ ...searchParams, passengers: parseInt(e.target.value) })}
                    className="w-full text-sm text-gray-600 bg-transparent outline-none cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <option key={num} value={num}>{num} adult{num > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Search Button */}
              <div className="flex items-center justify-center p-2">
                <button
                  onClick={handleSearch}
                  disabled={!searchParams.origin || !searchParams.destination || !searchParams.departureDate || isSearching}
                  className="w-full sm:w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSearching ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Search size={18} className="text-white" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {searchError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{searchError}</p>
            </div>
          )}
        </div>
      </div>

      {/* Category Pills - Cabin Class */}
      <div className="bg-white border-b border-gray-200 sticky top-[72px] z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { id: 'economy', label: 'Economy' },
              { id: 'premium_economy', label: 'Premium Economy' },
              { id: 'business', label: 'Business' },
              { id: 'first', label: 'First Class' },
            ].map((cabin) => (
              <button
                key={cabin.id}
                onClick={() => setSearchParams({ ...searchParams, cabinClass: cabin.id })}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                  searchParams.cabinClass === cabin.id
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cabin.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        {!hasSearched ? (
          // Initial State
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Plane className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Search for flights</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Enter airport codes (e.g., LHR for London Heathrow, JFK for New York) and travel dates to find available flights
            </p>
          </div>
        ) : (
          <>
          {/* Mobile Filter Button */}
          <div className="lg:hidden mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {flights.length} flight{flights.length !== 1 ? 's' : ''} found
            </p>
            <button
              onClick={() => setShowMobileFilters(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              <SlidersHorizontal size={16} />
              Filters
            </button>
          </div>

          {/* Mobile Filter Overlay */}
          {showMobileFilters && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)} />
              <div className="absolute right-0 top-0 bottom-0 w-80 max-w-full bg-white shadow-xl overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Filters</h3>
                  <button onClick={() => setShowMobileFilters(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X size={20} />
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  {/* Search Summary */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      {searchParams.origin} → {searchParams.destination}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {searchParams.journeyType === 'one-way' ? 'One way' : 'Return'} · {searchParams.passengers} passenger{searchParams.passengers > 1 ? 's' : ''}
                    </p>
                  </div>
                  {/* Sort By */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Sort by</h4>
                    <div className="space-y-2">
                      {[
                        { id: 'least-expensive', label: 'Least expensive' },
                        { id: 'most-expensive', label: 'Most expensive' },
                        { id: 'shortest', label: 'Shortest duration' },
                        { id: 'longest', label: 'Longest duration' },
                      ].map((option) => (
                        <label key={option.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="mobileSortBy"
                            checked={sortBy === option.id}
                            onChange={() => setSortBy(option.id)}
                            className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-500"
                          />
                          <span className="text-sm text-gray-700">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {/* Stops Filter */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Stops</h4>
                    <div className="space-y-2">
                      {[
                        { id: 'direct', label: 'Direct only' },
                        { id: '1', label: '1 stop at most' },
                        { id: '2', label: '2 stops at most' },
                        { id: 'any', label: 'Any number of stops' },
                      ].map((option) => (
                        <label key={option.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="mobileStops"
                            checked={maxStops === option.id}
                            onChange={() => setMaxStops(option.id)}
                            className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-500"
                          />
                          <span className="text-sm text-gray-700">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-6">
            {/* Left Sidebar - Filters */}
            <div className="w-56 flex-shrink-0 hidden lg:block">
              {/* Search Summary */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  {searchParams.origin} → {searchParams.destination}
                </h4>
                <p className="text-xs text-gray-500">
                  {searchParams.journeyType === 'one-way' ? 'One way' : 'Return'} · {searchParams.passengers} passenger{searchParams.passengers > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(searchParams.departureDate)}
                  {searchParams.returnDate && ` - ${formatDate(searchParams.returnDate)}`}
                </p>
              </div>

              {/* Sort By */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Sort by</h4>
                <div className="space-y-2">
                  {[
                    { id: 'least-expensive', label: 'Least expensive' },
                    { id: 'most-expensive', label: 'Most expensive' },
                    { id: 'shortest', label: 'Shortest duration' },
                    { id: 'longest', label: 'Longest duration' },
                  ].map((option) => (
                    <label key={option.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="sortBy"
                        checked={sortBy === option.id}
                        onChange={() => setSortBy(option.id)}
                        className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-500"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Stops Filter */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Stops</h4>
                <div className="space-y-2">
                  {[
                    { id: 'direct', label: 'Direct only' },
                    { id: '1', label: '1 stop at most' },
                    { id: '2', label: '2 stops at most' },
                    { id: 'any', label: 'Any number of stops' },
                  ].map((option) => (
                    <label key={option.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="stops"
                        checked={maxStops === option.id}
                        onChange={() => setMaxStops(option.id)}
                        className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-500"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content - Flight Results */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">
                  {filteredFlights.length} flight{filteredFlights.length !== 1 ? 's' : ''} available
                </p>
                {flights.length > 0 && (
                  <button
                    onClick={handleSearch}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <RefreshCw size={14} />
                    Refresh
                  </button>
                )}
              </div>

              {isSearching ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4">
                    {/* Spinning ring */}
                    <div className="absolute inset-0 border-4 border-gray-200 rounded-full" />
                    <div className="absolute inset-0 border-4 border-transparent border-t-gray-900 rounded-full animate-spin" />
                    {/* Center icon */}
                    <Plane className="w-6 h-6 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Searching flights...</h3>
                  <p className="text-sm text-gray-500">Finding the best options for your trip</p>
                  <div className="flex justify-center gap-1 mt-4">
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              ) : filteredFlights.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-50 rounded-full mb-4">
                    <Plane className="w-8 h-8 text-amber-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No flights found</h3>
                  <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                    {flights.length > 0
                      ? 'Try adjusting your filters to see more results'
                      : 'No flights available for this route and date. Try different dates or airports.'}
                  </p>
                  {flights.length === 0 && (
                    <button
                      onClick={() => navigate(`/dashboard/chat?query=Find me a flight from ${searchParams.origin} to ${searchParams.destination} on ${searchParams.departureDate}&newChat=true`)}
                      className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Search with AI Assistant
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFlights.map((flight) => (
                    <div
                      key={flight.id}
                      onClick={() => handleFlightSelect(flight)}
                      className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 hover:border-gray-400 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        {/* Airline & Times */}
                        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                            {flight.airline.logoUrl ? (
                              <img
                                src={flight.airline.logoUrl}
                                alt={flight.airline.name}
                                className="max-w-full max-h-full object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <Plane className={`w-5 h-5 sm:w-6 sm:h-6 text-gray-400 ${flight.airline.logoUrl ? 'hidden' : ''}`} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-3">
                              <span className="text-sm sm:text-lg font-semibold text-gray-900">
                                {formatTime(flight.departure.time)}
                              </span>
                              <ArrowRight size={14} className="text-gray-400 flex-shrink-0" />
                              <span className="text-sm sm:text-lg font-semibold text-gray-900">
                                {formatTime(flight.arrival.time)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                              {flight.airline.name} · {flight.flightNumber}
                            </p>
                          </div>
                        </div>

                        {/* Duration & Route - Hidden on mobile */}
                        <div className="text-center px-3 sm:px-6 hidden sm:block">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Clock size={14} className="text-gray-400" />
                            <span>{flight.duration}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {flight.departure.airport} – {flight.arrival.airport}
                          </p>
                        </div>

                        {/* Stops - Hidden on mobile/tablet */}
                        <div className="text-center px-4 hidden md:block">
                          <p className={`text-sm font-medium ${flight.stops === 0 ? 'text-green-600' : 'text-gray-700'}`}>
                            {flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                          </p>
                          {flight.stops > 0 && flight.stopDetails[0] && (
                            <p className="text-xs text-gray-500">{flight.stopDetails[0].airport}</p>
                          )}
                        </div>

                        {/* Baggage - Hidden on mobile/tablet/small desktop */}
                        <div className="text-center px-4 hidden lg:block">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Luggage size={14} className="text-gray-400" />
                            <span>{flight.baggage.checkedBags > 0 ? `${flight.baggage.checkedBags} bag` : 'No bags'}</span>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-right pl-2 sm:pl-4 flex-shrink-0">
                          <p className="text-base sm:text-xl font-bold text-gray-900">
                            {flight.price.currency === 'USD' ? '$' : flight.price.currency}{flight.price.perPassenger.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </p>
                          <p className="text-[10px] sm:text-xs text-gray-500">per person</p>
                        </div>
                      </div>

                      {/* Mobile: Extra info row */}
                      <div className="flex items-center gap-3 mt-2 sm:hidden text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {flight.duration}
                        </span>
                        <span>·</span>
                        <span className={flight.stops === 0 ? 'text-green-600' : ''}>
                          {flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                        </span>
                        <span>·</span>
                        <span>{flight.departure.airport} – {flight.arrival.airport}</span>
                      </div>

                      {/* Return journey info */}
                      {flight.returnJourney && (
                        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                          <span className="text-xs font-medium text-gray-400 uppercase">Return</span>
                          <span>{formatTime(flight.returnJourney.departure.time)} - {formatTime(flight.returnJourney.arrival.time)}</span>
                          <span className="text-gray-400 hidden sm:inline">·</span>
                          <span className="hidden sm:inline">{flight.returnJourney.stops === 0 ? 'Non-stop' : `${flight.returnJourney.stops} stop${flight.returnJourney.stops > 1 ? 's' : ''}`}</span>
                        </div>
                      )}

                      {/* Hover indicator - Hidden on mobile (tap instead) */}
                      <div className="mt-3 hidden sm:flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs text-blue-600 font-medium">Select this flight →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          </>
        )}
      </div>

      <Footer />

      {/* Booking flow moved to /book/flight/:offerId page */}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
