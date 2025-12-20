import React, { useState, useEffect } from 'react';
import { Car, Plane, FileText, Clock, Check, X, ChevronRight, Search, Filter, AlertTriangle, Download, Loader2 } from 'lucide-react';
import { getUserRequests } from '../services/requests';
import { formatDistanceToNow } from 'date-fns';
import ReviewDisputeModal from './modals/ReviewDisputeModal';
import { generateRequestConfirmationPDF, downloadPDF, savePDFToStorage } from '../services/pdfGeneratorService';
import { generateRequestConfirmationHTML, downloadHTMLAsPDF } from '../services/pdfHtmlGenerator';

// Helper component to render price breakdown
const PriceBreakdown = ({ data, colorClass = 'from-gray-800 to-black', textClass = 'text-gray-300' }) => {
  // Get base price from various possible fields
  const basePrice = Number(data.base_price) || Number(data.price) || 0;
  const platformFee = Number(data.platform_fee) || 0;
  const platformFeePercent = data.platform_fee_percent || 2.5;
  const vatAmount = Number(data.vat_amount) || 0;
  const vatPercent = data.vat_percent || 8.1;
  const totalPrice = Number(data.total_price) || Number(data.total) || 0;
  const currency = data.currency || 'USD';

  // Check if all values are invalid/NaN
  const hasValidPrice = !isNaN(basePrice) && basePrice > 0;
  const hasValidTotal = !isNaN(totalPrice) && totalPrice > 0;

  // If no breakdown available, show simple price or "Quote Pending"
  if (!hasValidPrice && !hasValidTotal) {
    const simplePrice = data.price || data.priceRange || data.estimated_total;
    // If priceRange is a string like "$NaN", "$NaNNaNNaN", or invalid, don't show it
    const isValidPrice = simplePrice && (
      (typeof simplePrice === 'number' && !isNaN(simplePrice) && simplePrice > 0) ||
      (typeof simplePrice === 'string' &&
       !simplePrice.includes('NaN') &&
       !simplePrice.includes('undefined') &&
       !simplePrice.includes('null') &&
       simplePrice !== '$0' &&
       simplePrice !== '$' &&
       !/^\$0(\.0+)?$/.test(simplePrice))
    );

    if (!isValidPrice) {
      // Show "Quote Pending" for requests without prices
      return (
        <div className={`p-3 bg-gradient-to-r ${colorClass} rounded-lg mb-3`}>
          <div className="flex items-center justify-between">
            <p className={`text-xs ${textClass}`}>Price</p>
            <p className="text-base font-medium text-white/80">Quote Pending</p>
          </div>
        </div>
      );
    }
    return (
      <div className={`p-3 bg-gradient-to-r ${colorClass} rounded-lg mb-3`}>
        <div className="flex items-center justify-between">
          <p className={`text-xs ${textClass}`}>Price</p>
          <p className="text-base font-bold text-white">
            {typeof simplePrice === 'number' ? `$${simplePrice.toLocaleString()}` : simplePrice}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-3 bg-gradient-to-r ${colorClass} rounded-lg mb-3`}>
      {/* Base Price */}
      {hasValidPrice && (
        <div className="flex items-center justify-between mb-1">
          <p className={`text-xs ${textClass}`}>Base Price</p>
          <p className="text-sm text-white">${basePrice.toLocaleString()}</p>
        </div>
      )}
      {/* Platform Fee */}
      {platformFee > 0 && !isNaN(platformFee) && (
        <div className="flex items-center justify-between mb-1">
          <p className={`text-xs ${textClass}`}>Platform Fee ({platformFeePercent}%)</p>
          <p className="text-sm text-white">+${platformFee.toLocaleString()}</p>
        </div>
      )}
      {/* VAT */}
      {vatAmount > 0 && !isNaN(vatAmount) && (
        <div className="flex items-center justify-between mb-1">
          <p className={`text-xs ${textClass}`}>VAT ({vatPercent}% CH)</p>
          <p className="text-sm text-white">+${vatAmount.toLocaleString()}</p>
        </div>
      )}
      {/* Total */}
      {hasValidTotal && (
        <div className="flex items-center justify-between pt-2 border-t border-white/20">
          <p className="text-xs font-medium text-white">Total</p>
          <p className="text-base font-bold text-white">${totalPrice.toLocaleString()}</p>
        </div>
      )}
    </div>
  );
};

const MyRequestsView = ({ user }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [generatingPDF, setGeneratingPDF] = useState(null);

  // Handle PDF download for a request
  const handleDownloadPDF = async (request, e) => {
    if (e) e.stopPropagation();
    setGeneratingPDF(request.id);
    try {
      // Parse data if needed
      let data = request.data;
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (e) { data = {}; }
      }
      data = data || {};

      // Format request data for PDF generator
      const pdfRequest = {
        id: request.id,
        type: request.type,
        service_type: request.type,
        created_at: request.created_at,
        client_email: user?.email,
        client_name: user?.user_metadata?.full_name || user?.user_metadata?.name || '',
        client_phone: user?.user_metadata?.phone || user?.phone || '',
        data: {
          ...data,
          name: data.name || data.title || data.items?.[0]?.name || user?.user_metadata?.full_name || user?.user_metadata?.name || '',
          email: data.email || user?.email,
          phone: data.phone || user?.user_metadata?.phone || user?.phone || '',
          from: data.from_city || data.from || data.origin || data.items?.[0]?.from,
          to: data.to_city || data.to || data.destination || data.items?.[0]?.to,
          date: data.departure_date || data.date || data.items?.[0]?.date,
          passengers: data.passengers || data.pax || data.items?.[0]?.passengers,
          total: data.total || data.price || data.total_price || data.items?.[0]?.price,
          cart_items: data.items || data.cart_items
        }
      };

      // Create detailed cart items for HTML PDF
      const detailedCartItems = (data.items || data.cart_items || []).map(item => ({
        type: item.type || request.type,
        name: item.name || item.rawItemName || item.title,
        rawItemName: item.rawItemName || item.name || item.title,
        category: item.category || request.type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        details: {
          from: item.from || data.from_city || data.from,
          to: item.to || data.to_city || data.to,
          date: item.date || data.departure_date || data.date,
          passengers: item.passengers || data.passengers
        },
        price: item.price || item.total || 0,
        currency: item.currency || data.currency || 'USD',
        quantity: item.quantity || 1
      }));

      // If no cart items, create a single item from the request data
      if (detailedCartItems.length === 0) {
        detailedCartItems.push({
          type: request.type,
          name: data.aircraft_model || data.car_name || data.helicopter_name || data.name || 'Service Request',
          rawItemName: data.aircraft_model || data.car_name || data.helicopter_name || data.name || 'Service Request',
          category: request.type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          details: {
            from: data.from_city || data.from || data.origin,
            to: data.to_city || data.to || data.destination,
            date: data.departure_date || data.date,
            passengers: data.passengers
          },
          price: data.total || data.price || data.total_price || 0,
          currency: data.currency || 'USD',
          quantity: 1
        });
      }

      // Generate beautiful HTML-based PDF (user-facing)
      const htmlContent = generateRequestConfirmationHTML(pdfRequest, detailedCartItems, {
        userName: user?.user_metadata?.full_name || user?.user_metadata?.name || 'Valued Client',
        userEmail: user?.email
      });
      await downloadHTMLAsPDF(htmlContent, `PrivateCharterX_Request_${request.id.substring(0, 8).toUpperCase()}.pdf`);

      // Also save jsPDF version to storage for admin CRM access
      try {
        const { blob, filename } = await generateRequestConfirmationPDF(pdfRequest);
        await savePDFToStorage(blob, filename, request.type || 'request', request.id);
        console.log('PDF saved to storage for admin access');
      } catch (storageErr) {
        console.warn('Could not save PDF to storage:', storageErr);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setGeneratingPDF(null);
    }
  };

  useEffect(() => {
    if (user) {
      loadRequests();
    }
  }, [user]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const { requests: data, error } = await getUserRequests(user.id);
      if (!error && data) {
        console.log('📥 Loaded requests:', data);
        console.log('📊 Request types:', data.map(r => ({ id: r.id.slice(0,8), type: r.type, dataType: typeof r.data })));
        setRequests(data);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-green-100 text-green-800 border-green-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status) => {
    if (status === 'pending') return <Clock size={16} />;
    if (status === 'confirmed' || status === 'completed') return <Check size={16} />;
    if (status === 'rejected' || status === 'cancelled') return <X size={16} />;
    return <Clock size={16} />;
  };

  const getTypeIcon = (type) => {
    if (type === 'taxi_concierge') return <Car size={24} />;
    if (type.includes('jet') || type.includes('helicopter')) return <Plane size={24} />;
    return <FileText size={24} />;
  };

  const getTypeLabel = (type) => {
    const labels = {
      taxi_concierge: 'Airport Transfer',
      ground_transport: 'Airport Transfer',
      private_jet_charter: 'Private Jet Charter',
      helicopter_charter: 'Helicopter Charter',
      empty_leg: 'Empty Leg',
      luxury_car_rental: 'Luxury Car Rental',
      luxury_car: 'Luxury Car',
      adventure_package: 'Adventure Package',
      co2_certificate: 'CO2 Certificate',
      fixed_offer: 'Fixed Offer',
      // hotel_booking: 'Hotel Booking', // DISABLED - LiteAPI hotels temporarily removed
      yacht_charter: 'Yacht Charter',
      booking: 'Multi-Service Booking',
      ai_chat_bulk: 'AI Concierge Request',
      spv_formation: 'SPV Formation',
      tokenization: 'Asset Tokenization'
    };
    return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const filteredRequests = requests.filter(req => {
    const matchesFilter = filter === 'all' || req.status === filter;
    const matchesSearch = searchQuery === '' ||
      getTypeLabel(req.type).toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(req.data).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const renderTaxiRequest = (request) => {
    let data = request.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) { data = {}; }
    }
    data = data || {};

    // Handle AI Chat cart submissions - extract taxi/transfer item from items array
    const taxiItem = data.items?.find(i =>
      i.type === 'taxi_cars' || i.type === 'taxi' || i.type === 'transfer' || i.type === 'ground_transport'
    ) || data.items?.[0] || {};

    // Merge data from different sources (direct fields vs items array)
    const carName = data.carName || taxiItem.carName || taxiItem.name || taxiItem.title || 'Ground Transport';
    const carSeats = data.carSeats || taxiItem.carSeats || taxiItem.seats || taxiItem.capacity;
    const carImage = data.carImage || taxiItem.carImage || taxiItem.image || taxiItem.image_url || taxiItem.primaryImage;
    const from = data.from || taxiItem.from || taxiItem.pickup_location || taxiItem.pickupLocation || taxiItem.pickup || taxiItem.from_city;
    const to = data.to || taxiItem.to || taxiItem.dropoff_location || taxiItem.dropoffLocation || taxiItem.dropoff || taxiItem.to_city;
    const serviceType = data.service_type || taxiItem.service_type || taxiItem.category || data.category;
    const distance = data.distance || taxiItem.distance;
    const eta = data.eta || taxiItem.eta || taxiItem.duration;
    const pickupDate = data.pickupDate || taxiItem.pickupDate || taxiItem.date;
    const pickupTime = data.pickupTime || taxiItem.pickupTime || taxiItem.time;
    const passengers = data.passengers || taxiItem.passengers || taxiItem.pax;
    const currency = data.currency || taxiItem.currency || 'USD';
    const detectedCountry = data.detectedCountry || taxiItem.detectedCountry || taxiItem.country;
    const extraNotes = data.extraNotes || taxiItem.extraNotes || taxiItem.notes;
    const isSwissBooking = data.isSwissBooking || taxiItem.isSwissBooking;
    const priceRange = data.priceRange || taxiItem.priceRange || (taxiItem.price ? `$${taxiItem.price}` : (data.total ? `$${data.total}` : null));

    return (
      <div className="bg-white/35 border border-gray-300/50 rounded-xl p-4 sm:p-5 hover:bg-white/40 transition-all" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
          {/* Car Image */}
          {carImage && (
            <div className="flex-shrink-0">
              <img src={carImage} alt={carName} className="w-full sm:w-24 h-32 sm:h-16 object-contain rounded-lg bg-white p-2" />
            </div>
          )}

          {/* Request Details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Car size={18} className="text-gray-700 flex-shrink-0" />
                  <h3 className="text-base font-semibold text-gray-800 truncate">{carName}</h3>
                </div>
                {carSeats && <p className="text-xs text-gray-600">{carSeats} seats</p>}
                {serviceType && <p className="text-xs text-gray-500">{serviceType} category</p>}
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border self-start whitespace-nowrap ${getStatusColor(request.status)}`}>
                {getStatusIcon(request.status)}
                <span className="capitalize">{request.status}</span>
              </div>
            </div>

            {/* Route Info */}
            {(from || to) && (
              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                {from && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-black"></div>
                    <span className="text-sm text-gray-800 font-medium">{from}</span>
                  </div>
                )}
                {to && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm text-gray-800 font-medium">{to}</span>
                  </div>
                )}
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3 mb-3">
              {distance && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Distance</p>
                  <p className="text-sm font-semibold text-gray-800">{distance} km</p>
                </div>
              )}
              {eta && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">ETA</p>
                  <p className="text-sm font-semibold text-gray-800">{eta} min</p>
                </div>
              )}
              {(pickupDate || pickupTime) && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Pickup Time</p>
                  <p className="text-sm font-semibold text-gray-800">{pickupDate === 'Now' ? 'Now' : `${pickupDate || ''} ${pickupTime || ''}`.trim()}</p>
                </div>
              )}
              {passengers && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Passengers</p>
                  <p className="text-sm font-semibold text-gray-800">{passengers}</p>
                </div>
              )}
              {currency && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Currency</p>
                  <p className="text-sm font-semibold text-gray-800">{currency}</p>
                </div>
              )}
              {detectedCountry && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Region</p>
                  <p className="text-sm font-semibold text-gray-800">{detectedCountry}</p>
                </div>
              )}
            </div>

            {/* Extra Notes */}
            {extraNotes && (
              <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs font-medium text-blue-900 mb-1">Notes:</p>
                <p className="text-xs text-blue-800">{extraNotes}</p>
              </div>
            )}

            {/* Swiss Booking Badge */}
            {isSwissBooking && (
              <div className="mb-3">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  <Check size={12} />
                  Instant Booking (Switzerland)
                </span>
              </div>
            )}

            {/* Price Breakdown */}
            <PriceBreakdown data={data} colorClass="from-gray-800 to-black" textClass="text-gray-300" />

            {/* Timestamp */}
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
              </p>
              {request.admin_notes && (
                <p className="text-xs text-blue-600 font-medium">Admin notes available</p>
              )}
            </div>

            {/* Download PDF Button */}
            <button
              onClick={(e) => handleDownloadPDF(request, e)}
              disabled={generatingPDF === request.id}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {generatingPDF === request.id ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              {generatingPDF === request.id ? 'Generating PDF...' : 'Download PDF'}
            </button>

            {/* Dispute Button - Only show for completed rides */}
            {request.status === 'completed' && (
              <div className="mt-3">
                {!request.disputed ? (
                  <button
                    onClick={() => {
                      setSelectedBooking(request);
                      setShowDisputeModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    <AlertTriangle size={16} />
                    Dispute Payment
                  </button>
                ) : (
                  <div className="text-center py-2 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-xs text-orange-700 font-medium">⚠ Dispute Submitted - Admin will contact you</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderEmptyLegRequest = (request) => {
    // Parse data if it's a string
    let data = request.data;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        data = {};
      }
    }
    data = data || {};

    // Handle AI Chat cart submissions - extract empty leg item from items array
    const emptyLegItem = data.items?.find(i => i.type === 'empty_legs' || i.type === 'emptyleg') || data.items?.[0] || {};

    // Merge data from different sources (direct fields vs items array)
    const fromCity = data.from_city || emptyLegItem.from_city || emptyLegItem.from;
    const toCity = data.to_city || emptyLegItem.to_city || emptyLegItem.to;
    const fromIata = data.from_iata || emptyLegItem.from_iata;
    const toIata = data.to_iata || emptyLegItem.to_iata;
    const flightRoute = data.flight_route || (fromCity && toCity ? `${fromCity} → ${toCity}` : null) || emptyLegItem.title;
    const aircraftType = data.aircraft_type || emptyLegItem.aircraft_type || emptyLegItem.model || emptyLegItem.category;
    const departureDate = data.departure_date || emptyLegItem.departure_date || emptyLegItem.date;
    const departureTime = data.departure_time || emptyLegItem.departure_time;
    const passengers = data.passengers || emptyLegItem.passengers;
    const capacity = data.capacity || emptyLegItem.capacity || emptyLegItem.available_seats;
    // Price field: check original_price (from glassmorphic), price, price_usd, etc.
    const price = data.original_price || data.price || data.total || emptyLegItem.price || emptyLegItem.price_usd || emptyLegItem.estimated_price;
    const originalPriceGbp = data.original_price_gbp;
    const currency = data.currency || emptyLegItem.currency || 'USD';
    const legImage = emptyLegItem.primaryImage || emptyLegItem.image_url || emptyLegItem.image || data.image_url;
    const luggage = data.luggage || emptyLegItem.luggage;
    const hasPet = data.has_pet || emptyLegItem.has_pet;
    const walletAddress = data.wallet_address;
    const emptyLegId = data.empty_leg_id || emptyLegItem.id;

    return (
      <div className="bg-white/35 border border-gray-300/50 rounded-xl p-4 sm:p-5 hover:bg-white/40 transition-all" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
        {/* Mobile: Stack vertically, Desktop: Side by side */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
          {/* Empty Leg Image or Icon */}
          {legImage ? (
            <div className="flex-shrink-0">
              <img src={legImage} alt={aircraftType || 'Empty Leg'} className="w-full sm:w-24 h-32 sm:h-16 object-cover rounded-lg" />
            </div>
          ) : (
            <div className="w-12 h-12 bg-gradient-to-br from-pink-600 to-pink-800 rounded-xl flex items-center justify-center text-white flex-shrink-0">
              <Plane size={24} />
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* Header with title and status */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-gray-800 mb-1">Empty Leg Flight</h3>
                <p className="text-sm text-gray-700 font-medium truncate">{flightRoute || 'Route TBD'}</p>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border self-start whitespace-nowrap ${getStatusColor(request.status)}`}>
                {getStatusIcon(request.status)}
                <span className="capitalize">{request.status}</span>
              </div>
            </div>

            {/* Route Info */}
            {(fromCity || toCity) && (
              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                {fromCity && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-black"></div>
                    <span className="text-sm text-gray-800 font-medium">{fromCity}</span>
                    {fromIata && <span className="text-xs text-gray-500">({fromIata})</span>}
                  </div>
                )}
                {toCity && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                    <span className="text-sm text-gray-800 font-medium">{toCity}</span>
                    {toIata && <span className="text-xs text-gray-500">({toIata})</span>}
                  </div>
                )}
              </div>
            )}

            {/* Details Grid - ALL saved fields */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
              {aircraftType && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Aircraft</p>
                  <p className="text-sm font-semibold text-gray-800">{aircraftType}</p>
                </div>
              )}
              {departureDate && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Departure Date</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {new Date(departureDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              {departureTime && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Departure Time</p>
                  <p className="text-sm font-semibold text-gray-800">{departureTime}</p>
                </div>
              )}
              {capacity && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Capacity</p>
                  <p className="text-sm font-semibold text-gray-800">{capacity} pax</p>
                </div>
              )}
              {passengers && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Passengers</p>
                  <p className="text-sm font-semibold text-gray-800">{passengers}</p>
                </div>
              )}
              {luggage !== undefined && luggage !== null && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Luggage</p>
                  <p className="text-sm font-semibold text-gray-800">{luggage} bags</p>
                </div>
              )}
              {hasPet && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Pet</p>
                  <p className="text-sm font-semibold text-gray-800">🐕 Yes</p>
                </div>
              )}
            </div>

            {/* Wallet Address */}
            {walletAddress && (
              <div className="mb-3 p-2 bg-gray-100 rounded-lg">
                <p className="text-xs text-gray-600">Wallet: <span className="font-mono">{walletAddress.slice(0,6)}...{walletAddress.slice(-4)}</span></p>
              </div>
            )}

            {/* Price Breakdown */}
            <PriceBreakdown data={data} colorClass="from-pink-600 to-pink-800" textClass="text-pink-100" />

            {/* Timestamp */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
              </p>
              {request.admin_notes && (
                <p className="text-xs text-blue-600 font-medium">Admin notes available</p>
              )}
            </div>

            {request.admin_notes && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs font-medium text-blue-900 mb-1">Admin Notes:</p>
                <p className="text-xs text-blue-800">{request.admin_notes}</p>
              </div>
            )}

            {/* Download PDF Button */}
            <button
              onClick={(e) => handleDownloadPDF(request, e)}
              disabled={generatingPDF === request.id}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {generatingPDF === request.id ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              {generatingPDF === request.id ? 'Generating PDF...' : 'Download PDF'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAdventureRequest = (request) => {
    let data = request.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) { data = {}; }
    }
    data = data || {};

    // Handle AI Chat cart submissions - extract adventure item from items array
    const adventureItem = data.items?.find(i => i.type === 'adventures' || i.type === 'adventure' || i.type === 'fixed_offer') || data.items?.[0] || {};

    // Merge data from different sources (AdventureDetail saves with adventure_title, offer_title)
    const adventureName = data.adventure_title || data.offer_title || data.adventure_name || adventureItem.name || adventureItem.title || 'Adventure Package';
    const destination = data.destination || data.destination_city || adventureItem.destination || adventureItem.location;
    const origin = data.origin || data.origin_city || adventureItem.origin;
    const duration = data.duration || adventureItem.duration;
    const guests = data.participants || data.passengers || data.guests || adventureItem.guests || adventureItem.passengers;
    const startDate = data.preferred_date || data.departure_date || data.start_date || adventureItem.date || adventureItem.departure_date;
    // Price: check discounted_price first (what user actually pays), then original_price
    const price = data.discounted_price || data.converted_price || data.original_price || data.price || data.total || adventureItem.price || adventureItem.estimated_price || adventureItem.price_eur;
    const originalPrice = data.original_price;
    const discountedPrice = data.discounted_price;
    const adventureImage = adventureItem.primaryImage || adventureItem.image_url || adventureItem.image || data.image_url;
    const activities = data.activities || adventureItem.activities;
    const inclusions = data.inclusions || adventureItem.inclusions;
    const packageType = data.package_type || adventureItem.package_type;
    const isFree = data.is_free;
    const hasNFT = data.has_nft;
    const nftDiscount = data.nft_discount;
    const currency = data.currency || data.selected_currency || 'EUR';
    const walletAddress = data.wallet_address;
    const adventureId = data.adventure_id || adventureItem.id;
    // CO2 data
    const co2Emissions = data.co2_emissions;
    const co2OffsetCost = data.co2_offset_cost;
    // Inclusions flags
    const includesHelicopter = data.includes_helicopter;
    const includesYacht = data.includes_yacht;
    const includesSafari = data.includes_safari;
    const includesGroundTransport = data.includes_ground_transport;
    const includesAccommodation = data.includes_accommodation;
    const guideIncluded = data.guide_included;
    const equipmentProvided = data.equipment_provided;
    const insuranceIncluded = data.insurance_included;

    return (
      <div className="bg-white/35 border border-gray-300/50 rounded-xl p-4 sm:p-5 hover:bg-white/40 transition-all" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
          {/* Adventure Image or Icon */}
          {adventureImage ? (
            <div className="flex-shrink-0">
              <img src={adventureImage} alt={adventureName} className="w-full sm:w-24 h-32 sm:h-16 object-cover rounded-lg" />
            </div>
          ) : (
            <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-800 rounded-xl flex items-center justify-center text-white flex-shrink-0">
              <Plane size={24} />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-gray-800 mb-1 truncate">{adventureName}</h3>
                <p className="text-xs text-gray-600">Package ID: {data.adventure_id || request.id.slice(0, 8)}</p>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border self-start whitespace-nowrap ${getStatusColor(request.status)}`}>
                {getStatusIcon(request.status)}
                <span className="capitalize">{request.status}</span>
              </div>
            </div>

            {/* Route Info */}
            {(origin || destination) && (
              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                {origin && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-black"></div>
                    <span className="text-sm text-gray-800 font-medium">{origin}</span>
                  </div>
                )}
                {destination && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="text-sm text-gray-800 font-medium">{destination}</span>
                  </div>
                )}
              </div>
            )}

            {/* Details Grid - ALL saved fields */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
              {packageType && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Package Type</p>
                  <p className="text-sm font-semibold text-gray-800">{packageType}</p>
                </div>
              )}
              {duration && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Duration</p>
                  <p className="text-sm font-semibold text-gray-800">{duration}</p>
                </div>
              )}
              {guests && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Guests</p>
                  <p className="text-sm font-semibold text-gray-800">{guests}</p>
                </div>
              )}
              {startDate && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Start Date</p>
                  <p className="text-sm font-semibold text-gray-800">{new Date(startDate).toLocaleDateString()}</p>
                </div>
              )}
              {data.end_date && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">End Date</p>
                  <p className="text-sm font-semibold text-gray-800">{new Date(data.end_date).toLocaleDateString()}</p>
                </div>
              )}
              {currency && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Currency</p>
                  <p className="text-sm font-semibold text-gray-800">{currency}</p>
                </div>
              )}
              {data.payment_method === 'crypto' && data.crypto_currency && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Payment Method</p>
                  <p className="text-sm font-semibold text-gray-800">💰 {data.crypto_currency}</p>
                </div>
              )}
            </div>

            {/* Included Services */}
            {(includesHelicopter || includesYacht || includesSafari || includesGroundTransport || includesAccommodation || guideIncluded || equipmentProvided || insuranceIncluded) && (
              <div className="mb-3 p-3 bg-green-50 rounded-lg">
                <p className="text-xs font-medium text-green-900 mb-2">Included:</p>
                <div className="flex flex-wrap gap-1">
                  {includesHelicopter && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">🚁 Helicopter</span>}
                  {includesYacht && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">🛥️ Yacht</span>}
                  {includesSafari && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">🦁 Safari</span>}
                  {includesGroundTransport && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">🚗 Ground Transport</span>}
                  {includesAccommodation && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">🏨 Accommodation</span>}
                  {guideIncluded && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">👨‍✈️ Guide</span>}
                  {equipmentProvided && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">⛳ Equipment</span>}
                  {insuranceIncluded && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">🛡️ Insurance</span>}
                </div>
              </div>
            )}

            {/* NFT/Free Badge */}
            {(hasNFT || isFree) && (
              <div className="mb-3">
                {isFree ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    <Check size={12} />
                    NFT Free Flight Benefit
                  </span>
                ) : hasNFT ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                    🎫 NFT Member{nftDiscount ? ` - ${nftDiscount}% Discount` : ''}
                  </span>
                ) : null}
              </div>
            )}

            {/* CO2 Certificate Info */}
            {co2Emissions && (
              <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-xs font-medium text-emerald-900 mb-1">🌱 CO₂ Certificate Included</p>
                <p className="text-xs text-emerald-800">{co2Emissions} tons offset{co2OffsetCost ? ` (€${co2OffsetCost} value)` : ''}</p>
              </div>
            )}

            {/* Wallet Address */}
            {walletAddress && (
              <div className="mb-3 p-2 bg-gray-100 rounded-lg">
                <p className="text-xs text-gray-600">Wallet: <span className="font-mono">{walletAddress.slice(0,6)}...{walletAddress.slice(-4)}</span></p>
              </div>
            )}

            {/* Activities */}
            {activities && Array.isArray(activities) && activities.length > 0 && (
              <div className="mb-3 p-3 bg-amber-50 rounded-lg">
                <p className="text-xs font-medium text-amber-900 mb-2">Activities:</p>
                <div className="flex flex-wrap gap-1">
                  {activities.map((activity, idx) => (
                    <span key={idx} className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                      {activity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Inclusions List */}
            {inclusions && Array.isArray(inclusions) && inclusions.length > 0 && (
              <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs font-medium text-blue-900 mb-2">Package Inclusions:</p>
                <div className="flex flex-wrap gap-1">
                  {inclusions.map((item, idx) => (
                    <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Price Breakdown */}
            {isFree ? (
              <div className="p-3 bg-gradient-to-r from-green-600 to-green-800 rounded-lg mb-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-green-100">NFT Benefit</p>
                  <p className="text-base font-bold text-white">FREE</p>
                </div>
              </div>
            ) : (
              <PriceBreakdown data={data} colorClass="from-amber-600 to-amber-800" textClass="text-amber-100" />
            )}

            {/* Download PDF Button */}
            <button
              onClick={(e) => handleDownloadPDF(request, e)}
              disabled={generatingPDF === request.id}
              className="w-full mb-3 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {generatingPDF === request.id ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              {generatingPDF === request.id ? 'Generating PDF...' : 'Download PDF'}
            </button>

            {/* Timestamp */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
              </p>
              {request.admin_notes && (
                <p className="text-xs text-blue-600 font-medium">Admin notes available</p>
              )}
            </div>

            {request.admin_notes && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs font-medium text-blue-900 mb-1">Admin Notes:</p>
                <p className="text-xs text-blue-800">{request.admin_notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderLuxuryCarRequest = (request) => {
    let data = request.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) { data = {}; }
    }
    data = data || {};

    // Handle AI Chat cart submissions - extract car item from items array
    const carItem = data.items?.find(i => i.type === 'luxury_cars' || i.type === 'cars') || data.items?.[0] || {};

    // Merge data from different sources
    const carName = data.car_name || carItem.name || carItem.title || (carItem.brand && carItem.model ? `${carItem.brand} ${carItem.model}` : null) || (data.brand && data.model ? `${data.brand} ${data.model}` : 'Luxury Car');
    const brand = data.brand || carItem.brand;
    const model = data.model || carItem.model;
    const category = data.category || data.type || carItem.category || carItem.type || 'Luxury Car Rental';
    const year = data.year || carItem.year;
    const location = data.location || carItem.location;
    const rentalDays = data.rental_days || carItem.rental_days || carItem.rentalDays;
    const pickupDate = data.pickup_date || carItem.date || carItem.departure_date;
    const price = data.total_price || data.estimated_price || data.total || carItem.price || carItem.estimated_price || carItem.price_per_day;
    const pricePerDay = data.price_per_day || carItem.price_per_day;
    const pricePerHour = data.price_per_hour || carItem.price_per_hour;
    const pricePerWeek = data.price_per_week || carItem.price_per_week;
    const carImage = carItem.primaryImage || carItem.image_url || carItem.image || data.image_url;
    const transmission = data.transmission || carItem.transmission;
    const fuelType = data.fuel_type || carItem.fuel_type;
    const seats = data.seats || carItem.seats;
    const description = data.description || carItem.description;
    const currency = data.currency || carItem.currency || 'USD';
    const carId = data.car_id || carItem.id;

    return (
      <div className="bg-white/35 border border-gray-300/50 rounded-xl p-4 sm:p-5 hover:bg-white/40 transition-all" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
          {/* Car Image or Icon */}
          {carImage ? (
            <div className="flex-shrink-0">
              <img src={carImage} alt={carName} className="w-full sm:w-24 h-32 sm:h-16 object-cover rounded-lg" />
            </div>
          ) : (
            <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center text-white flex-shrink-0">
              <Car size={24} />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-gray-800 mb-1 truncate">{carName}</h3>
                <p className="text-xs text-gray-600">{category}</p>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border self-start whitespace-nowrap ${getStatusColor(request.status)}`}>
                {getStatusIcon(request.status)}
                <span className="capitalize">{request.status}</span>
              </div>
            </div>

            {/* Details Grid - ALL saved fields */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
              {year && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Year</p>
                  <p className="text-sm font-semibold text-gray-800">{year}</p>
                </div>
              )}
              {seats && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Seats</p>
                  <p className="text-sm font-semibold text-gray-800">{seats}</p>
                </div>
              )}
              {transmission && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Transmission</p>
                  <p className="text-sm font-semibold text-gray-800">{transmission}</p>
                </div>
              )}
              {fuelType && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Fuel Type</p>
                  <p className="text-sm font-semibold text-gray-800">{fuelType}</p>
                </div>
              )}
              {(rentalDays || data.rental_duration_type) && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Rental Duration</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {rentalDays ? `${rentalDays} days` : `${data.rental_duration_count} ${data.rental_duration_type}`}
                  </p>
                </div>
              )}
              {(pickupDate || data.pickup_date) && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Pickup</p>
                  <p className="text-sm font-semibold text-gray-800">{new Date(pickupDate || data.pickup_date).toLocaleDateString()} {data.pickup_time || ''}</p>
                </div>
              )}
              {data.dropoff_date && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Dropoff</p>
                  <p className="text-sm font-semibold text-gray-800">{new Date(data.dropoff_date).toLocaleDateString()} {data.dropoff_time || ''}</p>
                </div>
              )}
              {location && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Location</p>
                  <p className="text-sm font-semibold text-gray-800">{location}</p>
                </div>
              )}
            </div>

            {/* Pricing Details */}
            {(pricePerDay || pricePerHour || pricePerWeek) && (
              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-900 mb-2">Rental Rates:</p>
                <div className="flex flex-wrap gap-3">
                  {pricePerHour && <span className="text-xs text-gray-700">${pricePerHour}/hour</span>}
                  {pricePerDay && <span className="text-xs text-gray-700">${pricePerDay}/day</span>}
                  {pricePerWeek && <span className="text-xs text-gray-700">${pricePerWeek}/week</span>}
                </div>
              </div>
            )}

            {/* Location Info */}
            {(data.pickup_location || data.dropoff_location) && (
              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                {data.pickup_location && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-black"></div>
                    <span className="text-sm text-gray-800 font-medium">{data.pickup_location}</span>
                  </div>
                )}
                {data.dropoff_location && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm text-gray-800 font-medium">{data.dropoff_location}</span>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {description && (
              <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs font-medium text-blue-900 mb-1">Description:</p>
                <p className="text-xs text-blue-800 line-clamp-2">{description}</p>
              </div>
            )}

            {/* Price Breakdown */}
            <PriceBreakdown data={data} colorClass="from-gray-700 to-gray-900" textClass="text-gray-300" />

            {/* Download PDF Button */}
            <button
              onClick={(e) => handleDownloadPDF(request, e)}
              disabled={generatingPDF === request.id}
              className="w-full mb-3 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {generatingPDF === request.id ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              {generatingPDF === request.id ? 'Generating PDF...' : 'Download PDF'}
            </button>

            {/* Timestamp */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
              </p>
              {request.admin_notes && (
                <p className="text-xs text-blue-600 font-medium">Admin notes available</p>
              )}
            </div>

            {request.admin_notes && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs font-medium text-blue-900 mb-1">Admin Notes:</p>
                <p className="text-xs text-blue-800">{request.admin_notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderPrivateJetRequest = (request) => {
    let data = request.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) { data = {}; }
    }
    data = data || {};

    // Handle AI Chat cart submissions - extract first jet item
    const jetItem = data.items?.find(i => i.type === 'jets' || i.type === 'aircraft') || data.items?.[0] || {};

    // Merge data from different sources (JetDetail saves aircraft_model, passenger_capacity, category, range)
    const aircraft = data.aircraft_model || data.aircraft || jetItem?.aircraft_model || jetItem?.model || jetItem?.name;
    const manufacturer = data.manufacturer || jetItem?.manufacturer;
    const passengers = data.passenger_capacity || data.capacity || data.passengers || jetItem?.max_passengers || jetItem?.passenger_capacity;
    const route = data.route || jetItem?.route || (data.from && data.to ? `${data.from} → ${data.to}` : null) || (jetItem?.from && jetItem?.to ? `${jetItem.from} → ${jetItem.to}` : null);
    const price = data.price || data.total || data.estimatedPrice || jetItem?.estimatedPrice || jetItem?.price;
    const flightDuration = data.estimatedDuration || jetItem?.estimatedDuration;
    const hourlyRate = data.hourly_rate_eur || jetItem?.hourly_rate_eur;
    const category = data.category || jetItem?.category || data.aircraft_category;
    const range = data.range || jetItem?.range;
    const jetImage = jetItem?.primaryImage || jetItem?.image_url || data.image_url;
    const hasNFT = data.has_nft;
    const nftDiscount = data.nft_discount;
    const requestDate = data.request_date;
    const jetId = data.jet_id || jetItem?.id;
    const walletAddress = data.wallet_address;

    return (
      <div className="bg-white/35 border border-gray-300/50 rounded-xl p-4 sm:p-5 hover:bg-white/40 transition-all" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
          {/* Jet Image or Icon */}
          {jetImage ? (
            <div className="flex-shrink-0">
              <img src={jetImage} alt={aircraft} className="w-full sm:w-24 h-32 sm:h-16 object-cover rounded-lg" />
            </div>
          ) : (
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center text-white flex-shrink-0">
              <Plane size={24} />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-gray-800 mb-1">Private Jet Charter</h3>
                <p className="text-sm text-gray-700 font-medium truncate">{aircraft || 'Aircraft TBD'}</p>
                {manufacturer && <p className="text-xs text-gray-500">by {manufacturer}</p>}
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border self-start whitespace-nowrap ${getStatusColor(request.status)}`}>
                {getStatusIcon(request.status)}
                <span className="capitalize">{request.status}</span>
              </div>
            </div>

            {/* Route Info */}
            {route && (
              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-gray-800 font-medium">{route}</span>
                </div>
              </div>
            )}

            {/* Details Grid - ALL saved fields */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
              {category && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Category</p>
                  <p className="text-sm font-semibold text-gray-800">{category}</p>
                </div>
              )}
              {passengers && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Capacity</p>
                  <p className="text-sm font-semibold text-gray-800">{passengers} pax</p>
                </div>
              )}
              {range && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Range</p>
                  <p className="text-sm font-semibold text-gray-800">{range}</p>
                </div>
              )}
              {flightDuration && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Flight Duration</p>
                  <p className="text-sm font-semibold text-gray-800">{flightDuration}</p>
                </div>
              )}
              {hourlyRate && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Hourly Rate</p>
                  <p className="text-sm font-semibold text-gray-800">${typeof hourlyRate === 'number' ? hourlyRate.toLocaleString() : hourlyRate}/hr</p>
                </div>
              )}
              {requestDate && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Request Date</p>
                  <p className="text-sm font-semibold text-gray-800">{new Date(requestDate).toLocaleDateString()}</p>
                </div>
              )}
              {data.payment_method && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Payment</p>
                  <p className="text-sm font-semibold text-gray-800 capitalize">{data.payment_method}</p>
                </div>
              )}
            </div>

            {/* NFT Discount */}
            {hasNFT && (
              <div className="mb-3">
                <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
                  <span className="text-sm text-purple-800">🎫 NFT Member{nftDiscount ? ` - ${nftDiscount}% Discount` : ''}</span>
                </div>
              </div>
            )}

            {/* Wallet Address */}
            {walletAddress && (
              <div className="mb-3 p-2 bg-gray-100 rounded-lg">
                <p className="text-xs text-gray-600">Wallet: <span className="font-mono">{walletAddress.slice(0,6)}...{walletAddress.slice(-4)}</span></p>
              </div>
            )}

            {/* Price Breakdown */}
            <PriceBreakdown data={data} colorClass="from-blue-600 to-blue-800" textClass="text-blue-100" />

            {/* Download PDF Button */}
            <button
              onClick={(e) => handleDownloadPDF(request, e)}
              disabled={generatingPDF === request.id}
              className="w-full mb-3 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {generatingPDF === request.id ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              {generatingPDF === request.id ? 'Generating PDF...' : 'Download PDF'}
            </button>

            {/* Timestamp */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
              </p>
              {request.admin_notes && (
                <p className="text-xs text-blue-600 font-medium">Admin notes available</p>
              )}
            </div>

            {request.admin_notes && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs font-medium text-blue-900 mb-1">Admin Notes:</p>
                <p className="text-xs text-blue-800">{request.admin_notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderHelicopterRequest = (request) => {
    let data = request.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) { data = {}; }
    }
    data = data || {};

    // Handle AI Chat cart submissions - extract helicopter item
    const heliItem = data.items?.find(i => i.type === 'helicopters') || data.items?.[0] || {};
    // Extract search_criteria for HelicopterDetail bookings
    const searchCriteria = data.search_criteria || {};

    // Merge data from different sources (HelicopterDetail saves in search_criteria)
    const helicopter = data.helicopter_name || data.name || heliItem?.name || heliItem?.helicopter_name || data.helicopter_type;
    const helicopterType = data.helicopter_type || heliItem?.helicopter_type || heliItem?.type;
    const manufacturer = data.manufacturer || heliItem?.manufacturer;
    const passengers = data.passengers || searchCriteria.passengers || data.max_passengers || heliItem?.max_passengers || heliItem?.passengers;
    const capacity = data.capacity || heliItem?.capacity;
    // Route: check search_criteria first (HelicopterDetail), then other sources
    const departure = searchCriteria.departure || data.departure || data.from || heliItem?.from;
    const arrival = searchCriteria.arrival || data.arrival || data.to || heliItem?.to;
    const route = data.route || heliItem?.route || (departure && arrival ? `${departure} → ${arrival}` : null);
    const price = data.price || data.discounted_price || data.total_price || data.total || data.estimatedPrice || heliItem?.estimatedPrice || heliItem?.price;
    const totalPrice = data.total_price;
    const discountedPrice = data.discounted_price;
    const flightDuration = data.flight_duration || searchCriteria.duration || data.estimatedDuration || heliItem?.estimatedDuration;
    const hourlyRate = data.hourly_rate || data.hourly_rate_eur || heliItem?.hourly_rate_eur;
    const heliImage = heliItem?.primaryImage || heliItem?.image_url || data.image_url;
    const flightDate = searchCriteria.date || data.flight_date || data.date;
    const flightTime = searchCriteria.time || data.flight_time || data.time;
    const location = data.location || heliItem?.location;
    const hasNFT = data.has_nft;
    const nftDiscount = data.nft_discount;
    const currency = data.currency || 'USD';
    const requestDate = data.request_date;
    const walletAddress = data.wallet_address;
    const helicopterId = data.helicopter_id;

    return (
      <div className="bg-white/35 border border-gray-300/50 rounded-xl p-4 sm:p-5 hover:bg-white/40 transition-all" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
          {/* Helicopter Image or Icon */}
          {heliImage ? (
            <div className="flex-shrink-0">
              <img src={heliImage} alt={helicopter} className="w-full sm:w-24 h-32 sm:h-16 object-cover rounded-lg" />
            </div>
          ) : (
            <div className="w-12 h-12 bg-gradient-to-br from-teal-600 to-teal-800 rounded-xl flex items-center justify-center text-white flex-shrink-0">
              <Plane size={24} />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-gray-800 mb-1">Helicopter Charter</h3>
                <p className="text-sm text-gray-700 font-medium truncate">{helicopter || 'Helicopter TBD'}</p>
                {manufacturer && <p className="text-xs text-gray-500">by {manufacturer}</p>}
                {helicopterType && !helicopter?.includes(helicopterType) && <p className="text-xs text-gray-500">{helicopterType}</p>}
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border self-start whitespace-nowrap ${getStatusColor(request.status)}`}>
                {getStatusIcon(request.status)}
                <span className="capitalize">{request.status}</span>
              </div>
            </div>

            {/* Route Info */}
            {route && (
              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-teal-500"></div>
                  <span className="text-sm text-gray-800 font-medium">{route}</span>
                </div>
              </div>
            )}

            {/* Details Grid - ALL saved fields */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
              {capacity && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Capacity</p>
                  <p className="text-sm font-semibold text-gray-800">{capacity} pax</p>
                </div>
              )}
              {passengers && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Passengers</p>
                  <p className="text-sm font-semibold text-gray-800">{passengers}</p>
                </div>
              )}
              {flightDuration && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Duration</p>
                  <p className="text-sm font-semibold text-gray-800">{typeof flightDuration === 'number' ? `${flightDuration} hours` : flightDuration}</p>
                </div>
              )}
              {flightDate && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Flight Date</p>
                  <p className="text-sm font-semibold text-gray-800">{new Date(flightDate).toLocaleDateString()}</p>
                </div>
              )}
              {flightTime && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Flight Time</p>
                  <p className="text-sm font-semibold text-gray-800">{flightTime}</p>
                </div>
              )}
              {location && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Base Location</p>
                  <p className="text-sm font-semibold text-gray-800">{location}</p>
                </div>
              )}
              {hourlyRate && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Hourly Rate</p>
                  <p className="text-sm font-semibold text-gray-800">${typeof hourlyRate === 'number' ? hourlyRate.toLocaleString() : hourlyRate}/hr</p>
                </div>
              )}
              {currency && currency !== 'USD' && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Currency</p>
                  <p className="text-sm font-semibold text-gray-800">{currency}</p>
                </div>
              )}
              {data.payment_method && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Payment</p>
                  <p className="text-sm font-semibold text-gray-800 capitalize">{data.payment_method}</p>
                </div>
              )}
            </div>

            {/* Special Requests */}
            {data.special_requests && (
              <div className="mb-3 p-3 bg-teal-50 rounded-lg">
                <p className="text-xs font-medium text-teal-900 mb-1">Special Requests:</p>
                <p className="text-xs text-teal-800">{data.special_requests}</p>
              </div>
            )}

            {/* NFT Discount */}
            {hasNFT && (
              <div className="mb-3">
                <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
                  <span className="text-sm text-purple-800">🎫 NFT Member{nftDiscount ? ` - ${nftDiscount}% Discount` : ''}</span>
                </div>
              </div>
            )}

            {/* Wallet Address */}
            {walletAddress && (
              <div className="mb-3 p-2 bg-gray-100 rounded-lg">
                <p className="text-xs text-gray-600">Wallet: <span className="font-mono">{walletAddress.slice(0,6)}...{walletAddress.slice(-4)}</span></p>
              </div>
            )}

            {/* Price Breakdown */}
            <PriceBreakdown data={data} colorClass="from-teal-600 to-teal-800" textClass="text-teal-100" />

            {/* Download PDF Button */}
            <button
              onClick={(e) => handleDownloadPDF(request, e)}
              disabled={generatingPDF === request.id}
              className="w-full mb-3 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {generatingPDF === request.id ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              {generatingPDF === request.id ? 'Generating PDF...' : 'Download PDF'}
            </button>

            {/* Timestamp */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
              </p>
              {request.admin_notes && (
                <p className="text-xs text-blue-600 font-medium">Admin notes available</p>
              )}
            </div>

            {request.admin_notes && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs font-medium text-blue-900 mb-1">Admin Notes:</p>
                <p className="text-xs text-blue-800">{request.admin_notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCO2CertificateRequest = (request) => {
    let data = request.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) { data = {}; }
    }
    data = data || {};
    return (
      <div className="bg-white/35 border border-gray-300/50 rounded-xl p-5 hover:bg-white/40 transition-all" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-800 rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <FileText size={24} />
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-1">CO2 Offset Certificate</h3>
                <p className="text-sm text-gray-700 font-medium">{data.project_name}</p>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                {getStatusIcon(request.status)}
                <span className="capitalize">{request.status}</span>
              </div>
            </div>

            {/* Project Info */}
            <div className="mb-3 p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-green-900 mb-1">
                <span className="font-medium">Provider:</span> {data.ngo_provider}
              </p>
              <p className="text-xs text-green-900">
                <span className="font-medium">Location:</span> {data.location}, {data.country}
              </p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              {data.quantity_tons && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Quantity</p>
                  <p className="text-sm font-semibold text-gray-800">{data.quantity_tons} tons CO2</p>
                </div>
              )}
              {data.certification_standard && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Standard</p>
                  <p className="text-sm font-semibold text-gray-800">{data.certification_standard}</p>
                </div>
              )}
              {data.category && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Category</p>
                  <p className="text-sm font-semibold text-gray-800">{data.category}</p>
                </div>
              )}
              {data.payment_method && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Payment</p>
                  <p className="text-sm font-semibold text-gray-800">{data.payment_method}</p>
                </div>
              )}
            </div>

            {/* Price */}
            {data.total_price && (
              <div className="p-3 bg-gradient-to-r from-green-600 to-green-800 rounded-lg mb-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-green-100">Total Price</p>
                  <p className="text-base font-bold text-white">${data.total_price.toLocaleString()} {data.currency}</p>
                </div>
                {data.price_per_ton && (
                  <p className="text-xs text-green-100 mt-1">${data.price_per_ton}/ton</p>
                )}
              </div>
            )}

            {/* Download PDF Button */}
            <button
              onClick={(e) => handleDownloadPDF(request, e)}
              disabled={generatingPDF === request.id}
              className="w-full mb-3 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {generatingPDF === request.id ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              {generatingPDF === request.id ? 'Generating PDF...' : 'Download PDF'}
            </button>

            {/* Timestamp */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
              </p>
              {request.admin_notes && (
                <p className="text-xs text-blue-600 font-medium">Admin notes available</p>
              )}
            </div>

            {request.admin_notes && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs font-medium text-blue-900 mb-1">Admin Notes:</p>
                <p className="text-xs text-blue-800">{request.admin_notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderFixedOfferRequest = (request) => {
    let data = request.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) { data = {}; }
    }
    data = data || {};
    return (
      <div className="bg-white/35 border border-gray-300/50 rounded-xl p-5 hover:bg-white/40 transition-all" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-600 to-cyan-800 rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <Plane size={24} />
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-1">{data.offer_title}</h3>
                <p className="text-xs text-gray-600">Fixed Offer</p>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                {getStatusIcon(request.status)}
                <span className="capitalize">{request.status}</span>
              </div>
            </div>

            {/* Route Info */}
            {(data.origin || data.offer_origin) && (data.destination || data.offer_destination) && (
              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-black"></div>
                  <span className="text-sm text-gray-800 font-medium">{data.origin || data.offer_origin}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                  <span className="text-sm text-gray-800 font-medium">{data.destination || data.offer_destination}</span>
                </div>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              {(data.offer_aircraft_type || data.aircraft_type) && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Aircraft</p>
                  <p className="text-sm font-semibold text-gray-800">{data.offer_aircraft_type || data.aircraft_type}</p>
                </div>
              )}
              {(data.departure_date || data.departure_date_formatted) && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Departure</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {data.departure_date_formatted || new Date(data.departure_date).toLocaleDateString()}
                  </p>
                </div>
              )}
              {(data.offer_passengers || data.passengers) && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Passengers</p>
                  <p className="text-sm font-semibold text-gray-800">{data.offer_passengers || data.passengers}</p>
                </div>
              )}
            </div>

            {/* Description */}
            {data.offer_description && (
              <div className="mb-3 p-3 bg-cyan-50 rounded-lg">
                <p className="text-xs text-cyan-900">{data.offer_description}</p>
              </div>
            )}

            {/* Message */}
            {data.message && (
              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-900 mb-1">Your Message:</p>
                <p className="text-xs text-gray-800">{data.message}</p>
              </div>
            )}

            {/* Price */}
            {(data.offer_price || data.price) && (
              <div className="p-3 bg-gradient-to-r from-cyan-600 to-cyan-800 rounded-lg mb-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-cyan-100">Price</p>
                  <p className="text-base font-bold text-white">
                    {typeof (data.offer_price || data.price) === 'number'
                      ? `${(data.offer_price || data.price).toLocaleString()} ${data.offer_currency || data.currency || 'USD'}`
                      : (data.offer_price || data.price)}
                  </p>
                </div>
              </div>
            )}

            {/* Download PDF Button */}
            <button
              onClick={(e) => handleDownloadPDF(request, e)}
              disabled={generatingPDF === request.id}
              className="w-full mb-3 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {generatingPDF === request.id ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              {generatingPDF === request.id ? 'Generating PDF...' : 'Download PDF'}
            </button>

            {/* Timestamp */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
              </p>
              {request.admin_notes && (
                <p className="text-xs text-blue-600 font-medium">Admin notes available</p>
              )}
            </div>

            {request.admin_notes && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs font-medium text-blue-900 mb-1">Admin Notes:</p>
                <p className="text-xs text-blue-800">{request.admin_notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderHotelRequest = (request) => {
    let data = request.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) { data = {}; }
    }
    data = data || {};

    const hotelItem = data.items?.find(i => i.type === 'hotels' || i.type === 'hotel') || data.items?.[0];
    const hotelName = data.hotel_name || hotelItem?.name || hotelItem?.hotel_name || 'Hotel';
    const location = data.location || hotelItem?.location || hotelItem?.city;
    const checkIn = data.check_in || hotelItem?.check_in;
    const checkOut = data.check_out || hotelItem?.check_out;
    const guests = data.guests || hotelItem?.guests;
    const price = data.total || data.price || hotelItem?.price;
    const hotelImage = hotelItem?.primaryImage || hotelItem?.image_url || data.image_url;

    return (
      <div className="bg-white/35 border border-gray-300/50 rounded-xl p-5 hover:bg-white/40 transition-all" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
        <div className="flex items-start gap-4">
          {hotelImage ? (
            <div className="flex-shrink-0">
              <img src={hotelImage} alt={hotelName} className="w-24 h-16 object-cover rounded-lg" />
            </div>
          ) : (
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl flex items-center justify-center text-white flex-shrink-0">
              <FileText size={24} />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-1">Hotel Booking</h3>
                <p className="text-sm text-gray-700 font-medium">{hotelName}</p>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                {getStatusIcon(request.status)}
                <span className="capitalize">{request.status}</span>
              </div>
            </div>
            {location && (
              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-800 font-medium">{location}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 mb-3">
              {checkIn && <div><p className="text-xs text-gray-600 mb-1">Check-in</p><p className="text-sm font-semibold text-gray-800">{checkIn}</p></div>}
              {checkOut && <div><p className="text-xs text-gray-600 mb-1">Check-out</p><p className="text-sm font-semibold text-gray-800">{checkOut}</p></div>}
              {guests && <div><p className="text-xs text-gray-600 mb-1">Guests</p><p className="text-sm font-semibold text-gray-800">{guests}</p></div>}
            </div>
            {price && (
              <div className="p-3 bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-lg mb-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-indigo-100">Total Price</p>
                  <p className="text-base font-bold text-white">{typeof price === 'number' ? `$${price.toLocaleString()}` : price}</p>
                </div>
              </div>
            )}
            {/* Download PDF Button */}
            <button
              onClick={(e) => handleDownloadPDF(request, e)}
              disabled={generatingPDF === request.id}
              className="w-full mb-3 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {generatingPDF === request.id ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              {generatingPDF === request.id ? 'Generating PDF...' : 'Download PDF'}
            </button>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">{formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderYachtRequest = (request) => {
    let data = request.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) { data = {}; }
    }
    data = data || {};

    const yachtItem = data.items?.find(i => i.type === 'yachts' || i.type === 'yacht') || data.items?.[0];
    const yachtName = data.yacht_name || yachtItem?.name || yachtItem?.yacht_name || 'Yacht';
    const location = data.location || yachtItem?.location;
    const duration = data.duration || yachtItem?.duration;
    const guests = data.guests || yachtItem?.guests || yachtItem?.max_guests;
    const price = data.total || data.price || yachtItem?.price;
    const yachtImage = yachtItem?.primaryImage || yachtItem?.image_url || data.image_url;

    return (
      <div className="bg-white/35 border border-gray-300/50 rounded-xl p-4 sm:p-5 hover:bg-white/40 transition-all" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
          {yachtImage ? (
            <div className="flex-shrink-0">
              <img src={yachtImage} alt={yachtName} className="w-full sm:w-24 h-32 sm:h-16 object-cover rounded-lg" />
            </div>
          ) : (
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-600 to-cyan-800 rounded-xl flex items-center justify-center text-white flex-shrink-0">
              <FileText size={24} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-gray-800 mb-1">Yacht Charter</h3>
                <p className="text-sm text-gray-700 font-medium truncate">{yachtName}</p>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border self-start whitespace-nowrap ${getStatusColor(request.status)}`}>
                {getStatusIcon(request.status)}
                <span className="capitalize">{request.status}</span>
              </div>
            </div>
            {location && (
              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-800 font-medium">{location}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 mb-3">
              {duration && <div><p className="text-xs text-gray-600 mb-1">Duration</p><p className="text-sm font-semibold text-gray-800">{duration}</p></div>}
              {guests && <div><p className="text-xs text-gray-600 mb-1">Guests</p><p className="text-sm font-semibold text-gray-800">{guests}</p></div>}
            </div>
            {price && (
              <div className="p-3 bg-gradient-to-r from-cyan-600 to-cyan-800 rounded-lg mb-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-cyan-100">Total Price</p>
                  <p className="text-base font-bold text-white">{typeof price === 'number' ? `$${price.toLocaleString()}` : price}</p>
                </div>
              </div>
            )}
            {/* Download PDF Button */}
            <button
              onClick={(e) => handleDownloadPDF(request, e)}
              disabled={generatingPDF === request.id}
              className="w-full mb-3 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {generatingPDF === request.id ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              {generatingPDF === request.id ? 'Generating PDF...' : 'Download PDF'}
            </button>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">{formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBookingRequest = (request) => {
    let data = request.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) { data = {}; }
    }
    data = data || {};

    const items = data.items || [];
    const total = data.total;
    const paymentMethod = data.payment_method;

    return (
      <div className="bg-white/35 border border-gray-300/50 rounded-xl p-5 hover:bg-white/40 transition-all" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <FileText size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-1">Multi-Service Booking</h3>
                <p className="text-xs text-gray-600">{items.length} item{items.length !== 1 ? 's' : ''} in request</p>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                {getStatusIcon(request.status)}
                <span className="capitalize">{request.status}</span>
              </div>
            </div>

            {/* List all items */}
            <div className="space-y-2 mb-3">
              {items.map((item, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg flex items-center gap-3">
                  {item.primaryImage && <img src={item.primaryImage} alt={item.name} className="w-12 h-8 object-cover rounded" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{item.name || item.title || 'Item'}</p>
                    <p className="text-xs text-gray-500 capitalize">{item.type?.replace(/_/g, ' ')}</p>
                  </div>
                  {(item.estimatedPrice || item.price) && (
                    <p className="text-sm font-semibold text-gray-800">${(item.estimatedPrice || item.price).toLocaleString()}</p>
                  )}
                </div>
              ))}
            </div>

            {paymentMethod && (
              <div className="mb-3">
                <p className="text-xs text-gray-600">Payment: <span className="font-medium capitalize">{paymentMethod}</span></p>
              </div>
            )}

            {total && (
              <div className="p-3 bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg mb-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-purple-100">Total</p>
                  <p className="text-base font-bold text-white">${total.toLocaleString()}</p>
                </div>
              </div>
            )}

            {/* Download PDF Button */}
            <button
              onClick={(e) => handleDownloadPDF(request, e)}
              disabled={generatingPDF === request.id}
              className="w-full mb-3 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {generatingPDF === request.id ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              {generatingPDF === request.id ? 'Generating PDF...' : 'Download PDF'}
            </button>

            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">{formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}</p>
              {request.admin_notes && <p className="text-xs text-blue-600 font-medium">Admin notes available</p>}
            </div>

            {request.admin_notes && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs font-medium text-blue-900 mb-1">Admin Notes:</p>
                <p className="text-xs text-blue-800">{request.admin_notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Comprehensive AI Chat Request Renderer - shows full details for each item
  const renderAIChatRequest = (request) => {
    let data = request.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) { data = {}; }
    }
    data = data || {};

    const items = data.items || [];
    const summary = data.summary || {};
    const grandTotal = summary.grand_total || data.total || items.reduce((sum, item) => sum + (item.estimated_price || item.price || item.estimatedPrice || 0), 0);
    const paymentMethod = data.payment_method;
    const isFromAI = data.source === 'ai_chat' || data.created_via === 'sphera_ai_assistant';

    // Helper to get item type icon color
    const getItemTypeColor = (type) => {
      const colors = {
        jets: 'from-blue-600 to-blue-800',
        aircraft: 'from-blue-600 to-blue-800',
        helicopters: 'from-teal-600 to-teal-800',
        empty_legs: 'from-amber-600 to-amber-800',
        emptyleg: 'from-amber-600 to-amber-800',
        yachts: 'from-cyan-600 to-cyan-800',
        luxury_cars: 'from-purple-600 to-purple-800',
        adventures: 'from-emerald-600 to-emerald-800',
        fixed_offer: 'from-rose-600 to-rose-800',
        ground_transport: 'from-gray-600 to-gray-800',
        custom_extra: 'from-orange-500 to-orange-700'
      };
      return colors[type] || 'from-gray-600 to-gray-800';
    };

    return (
      <div className="bg-white/35 border border-gray-300/50 rounded-xl p-5 hover:bg-white/40 transition-all" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <FileText size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-1">
                  {isFromAI ? 'AI Concierge Request' : 'Multi-Service Booking'}
                </h3>
                <p className="text-xs text-gray-600">
                  {items.length} item{items.length !== 1 ? 's' : ''} • Request #{data.request_id?.replace('AI-', '') || request.id.slice(0, 8)}
                </p>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                {getStatusIcon(request.status)}
                <span className="capitalize">{request.status}</span>
              </div>
            </div>

            {/* Detailed Items List */}
            <div className="space-y-3 mb-4">
              {items.map((item, idx) => {
                const itemName = item.name || item.title || item.aircraft_model || item.model || 'Service';
                const itemType = item.type?.replace(/_/g, ' ');
                const route = item.route || (item.from && item.to ? `${item.from} → ${item.to}` : null) || (item.origin && item.destination ? `${item.origin} → ${item.destination}` : null);
                const itemPrice = item.estimated_price || item.price || item.estimatedPrice || item.totalWithFee || 0;
                const itemImage = item.image || item.primaryImage || item.image_url;

                return (
                  <div key={idx} className="p-3 bg-gray-50/80 rounded-xl border border-gray-200/50">
                    <div className="flex items-start gap-3">
                      {/* Item Image or Icon */}
                      {itemImage ? (
                        <img src={itemImage} alt={itemName} className="w-16 h-12 object-cover rounded-lg flex-shrink-0" />
                      ) : (
                        <div className={`w-10 h-10 bg-gradient-to-br ${getItemTypeColor(item.type)} rounded-lg flex items-center justify-center text-white flex-shrink-0`}>
                          {item.type?.includes('jet') || item.type === 'aircraft' ? <Plane size={18} /> :
                           item.type?.includes('helicopter') ? <Plane size={18} /> :
                           item.type?.includes('car') ? <Car size={18} /> :
                           <FileText size={18} />}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-800 truncate">{itemName}</p>
                            <p className="text-[11px] text-gray-500 capitalize">{itemType}</p>
                          </div>
                          {itemPrice > 0 && (
                            <p className="text-sm font-bold text-gray-900 whitespace-nowrap">
                              ${itemPrice.toLocaleString()}
                            </p>
                          )}
                        </div>

                        {/* Route */}
                        {route && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-xs text-gray-700">{route}</span>
                          </div>
                        )}

                        {/* Details Grid */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px]">
                          {/* Date */}
                          {(item.date || item.departure_date) && (
                            <span className="text-gray-600">
                              <span className="text-gray-400">Date:</span> {item.date || item.departure_date}
                            </span>
                          )}
                          {/* Time */}
                          {(item.time || item.departure_time) && (
                            <span className="text-gray-600">
                              <span className="text-gray-400">Time:</span> {item.time || item.departure_time}
                            </span>
                          )}
                          {/* Passengers */}
                          {(item.passengers || item.pax) && (
                            <span className="text-gray-600">
                              <span className="text-gray-400">Pax:</span> {item.passengers || item.pax}
                            </span>
                          )}
                          {/* Duration/Flight Time */}
                          {(item.duration || item.estimated_flight_time || item.flightTime) && (
                            <span className="text-gray-600">
                              <span className="text-gray-400">Duration:</span> {item.duration || item.estimated_flight_time || item.flightTime}
                            </span>
                          )}
                          {/* Distance */}
                          {(item.distance_km || item.distanceKm) && (
                            <span className="text-gray-600">
                              <span className="text-gray-400">Distance:</span> {item.distance_km || item.distanceKm} km
                            </span>
                          )}
                          {/* Category */}
                          {item.category && (
                            <span className="text-gray-600">
                              <span className="text-gray-400">Category:</span> {item.category}
                            </span>
                          )}
                          {/* Rental Days */}
                          {item.rental_days && (
                            <span className="text-gray-600">
                              <span className="text-gray-400">Days:</span> {item.rental_days}
                            </span>
                          )}
                          {/* Location */}
                          {item.location && !route && (
                            <span className="text-gray-600">
                              <span className="text-gray-400">Location:</span> {item.location}
                            </span>
                          )}
                        </div>

                        {/* Special badges */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {item.isEstimate && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium">ESTIMATE</span>
                          )}
                          {item.isCustomRequest && (
                            <span className="text-[9px] bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded font-medium">CUSTOM REQUEST</span>
                          )}
                          {item.cateringOption && item.cateringOption !== 'standard' && (
                            <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-medium">
                              {item.cateringOption.toUpperCase()} CATERING
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            {summary.services_subtotal > 0 && (
              <div className="space-y-1 mb-3 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Services ({summary.services_count || items.length})</span>
                  <span>${(summary.services_subtotal || 0).toLocaleString()}</span>
                </div>
                {summary.extras_subtotal > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Custom extras ({summary.extras_count})</span>
                    <span>${summary.extras_subtotal.toLocaleString()}</span>
                  </div>
                )}
                {summary.catering_total > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Catering upgrades</span>
                    <span>${summary.catering_total.toLocaleString()}</span>
                  </div>
                )}
                {summary.vat_amount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>VAT (8.1%)</span>
                    <span>${summary.vat_amount.toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}

            {/* Payment Method */}
            {paymentMethod && (
              <div className="mb-3">
                <p className="text-xs text-gray-600">Payment: <span className="font-medium capitalize">{paymentMethod.replace(/_/g, ' ')}</span></p>
              </div>
            )}

            {/* Total */}
            {grandTotal > 0 && (
              <div className="p-3 bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg mb-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-purple-100">{summary.has_estimates ? 'Est. Total' : 'Total'}</p>
                  <p className="text-base font-bold text-white">
                    {summary.has_estimates ? '~' : ''}${grandTotal.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {/* Timestamp & Source */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
              </p>
              {isFromAI && (
                <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                  via Sphera AI
                </span>
              )}
            </div>

            {/* Admin Notes */}
            {request.admin_notes && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs font-medium text-blue-900 mb-1">Admin Notes:</p>
                <p className="text-xs text-blue-800">{request.admin_notes}</p>
              </div>
            )}

            {/* Download PDF Button */}
            <button
              onClick={(e) => handleDownloadPDF(request, e)}
              disabled={generatingPDF === request.id}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {generatingPDF === request.id ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              {generatingPDF === request.id ? 'Generating PDF...' : 'Download PDF'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderGenericRequest = (request) => {
    let data = request.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (e) { data = {}; }
    }
    data = data || {};

    // Try to extract meaningful info from items array or direct fields
    const item = data.items?.[0] || {};
    const name = data.name || item.name || item.title || data.title;
    const price = data.total || data.price || item.price || item.estimated_price;
    const image = item.primaryImage || item.image_url || item.image || data.image_url;
    const route = data.route || item.route || (item.from && item.to ? `${item.from} → ${item.to}` : null);
    const date = data.date || item.date || data.departure_date || item.departure_date;
    const passengers = data.passengers || item.passengers || item.pax;

    return (
      <div className="bg-white/35 border border-gray-300/50 rounded-xl p-4 sm:p-5 hover:bg-white/40 transition-all" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
          {/* Image or Icon */}
          {image ? (
            <div className="flex-shrink-0">
              <img src={image} alt={name || 'Request'} className="w-full sm:w-24 h-32 sm:h-16 object-cover rounded-lg" />
            </div>
          ) : (
            <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-black rounded-xl flex items-center justify-center text-white flex-shrink-0">
              {getTypeIcon(request.type)}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-gray-800 mb-1">{getTypeLabel(request.type)}</h3>
                {name && <p className="text-sm text-gray-700 font-medium truncate">{name}</p>}
                <p className="text-xs text-gray-600">Request ID: {request.id.slice(0, 8)}</p>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border self-start whitespace-nowrap ${getStatusColor(request.status)}`}>
                {getStatusIcon(request.status)}
                <span className="capitalize">{request.status}</span>
              </div>
            </div>

            {/* Route Info */}
            {route && (
              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                  <span className="text-sm text-gray-800 font-medium">{route}</span>
                </div>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              {date && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Date</p>
                  <p className="text-sm font-semibold text-gray-800">{new Date(date).toLocaleDateString()}</p>
                </div>
              )}
              {passengers && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Passengers</p>
                  <p className="text-sm font-semibold text-gray-800">{passengers}</p>
                </div>
              )}
            </div>

            {/* Price */}
            {price && (
              <div className="p-3 bg-gradient-to-r from-gray-700 to-gray-900 rounded-lg mb-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-300">Total</p>
                  <p className="text-base font-bold text-white">
                    {typeof price === 'number' ? `$${price.toLocaleString()}` : price}
                  </p>
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500 mb-3">
              {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
            </div>

            {request.admin_notes && (
              <div className="p-3 bg-blue-50 rounded-lg mb-3">
                <p className="text-xs font-medium text-blue-900 mb-1">Admin Notes:</p>
                <p className="text-xs text-blue-800">{request.admin_notes}</p>
              </div>
            )}

            {/* Download PDF Button */}
            <button
              onClick={(e) => handleDownloadPDF(request, e)}
              disabled={generatingPDF === request.id}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {generatingPDF === request.id ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              {generatingPDF === request.id ? 'Generating PDF...' : 'Download PDF'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full px-4 sm:px-6 pt-3 pb-6 overflow-y-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search requests..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/35 border border-gray-300/50 rounded-xl text-sm text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-gray-400/50 focus:border-transparent transition-all"
              style={{ backdropFilter: 'blur(20px) saturate(180%)' }}
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-white/35 border border-gray-300/50 rounded-xl p-1 overflow-x-auto" style={{ backdropFilter: 'blur(20px) saturate(180%)' }}>
          {['all', 'pending', 'confirmed', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                filter === status
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-sm text-gray-600">Loading requests...</div>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-12">
          <FileText size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-sm text-gray-600">No requests found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => {
            // Route to specific render function based on request type
            switch (request.type) {
              case 'taxi_concierge':
              case 'ground_transport':
                return <div key={request.id}>{renderTaxiRequest(request)}</div>;
              case 'empty_leg':
                return <div key={request.id}>{renderEmptyLegRequest(request)}</div>;
              case 'adventure_package':
                return <div key={request.id}>{renderAdventureRequest(request)}</div>;
              case 'luxury_car':
              case 'luxury_car_rental':
                return <div key={request.id}>{renderLuxuryCarRequest(request)}</div>;
              case 'private_jet_charter':
                return <div key={request.id}>{renderPrivateJetRequest(request)}</div>;
              case 'helicopter_charter':
                return <div key={request.id}>{renderHelicopterRequest(request)}</div>;
              case 'co2_certificate':
                return <div key={request.id}>{renderCO2CertificateRequest(request)}</div>;
              case 'fixed_offer':
                return <div key={request.id}>{renderFixedOfferRequest(request)}</div>;
              // HOTEL DISABLED - LiteAPI hotels temporarily removed
              // case 'hotel_booking':
              //   return <div key={request.id}>{renderHotelRequest(request)}</div>;
              case 'yacht_charter':
                return <div key={request.id}>{renderYachtRequest(request)}</div>;
              case 'booking':
              case 'ai_chat_bulk':
                return <div key={request.id}>{renderAIChatRequest(request)}</div>;
              default:
                return <div key={request.id}>{renderGenericRequest(request)}</div>;
            }
          })}
        </div>
      )}

      {/* Dispute Modal */}
      {showDisputeModal && selectedBooking && (
        <ReviewDisputeModal
          booking={selectedBooking}
          mode="dispute"
          onClose={() => {
            setShowDisputeModal(false);
            setSelectedBooking(null);
            loadRequests(); // Reload to show updated dispute status
          }}
        />
      )}
    </div>
  );
};

export default MyRequestsView;
