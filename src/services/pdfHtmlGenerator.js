/**
 * HTML-based PDF Generator for PrivateCharterX
 * Generates beautiful HTML documents that can be converted to PDF
 *
 * Usage: Generate HTML string, then use html2pdf.js or browser print to PDF
 */

import html2pdf from 'html2pdf.js';

// Company Information
const COMPANY = {
  name: 'PrivateCharterX LLC',
  fullAddress: '1000 Brickell Ave, Ste 715, Miami FL 33131',
  email: 'bookings@privatecharterx.com',
  phone: '+1 (305) 555-0123',
  logoUrl: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/pvcx-icon-black.png',
  fullLogoUrl: 'https://sgfnbormqiqgvhdfwmhz.supabase.co/storage/v1/object/public/logos//PrivatecharterX_logo_vectorized.png'
};

// Format currency
const formatCurrency = (amount, currency = 'USD') => {
  if (!amount && amount !== 0) return '-';
  const symbols = { USD: '$', EUR: '€', CHF: 'CHF ', GBP: '£' };
  const symbol = symbols[currency] || currency + ' ';
  return symbol + Number(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

// Format time
const formatTime = (timeString) => {
  if (!timeString) return '';
  return timeString;
};

// Get service type icon/emoji
const getServiceIcon = (type) => {
  const icons = {
    'jet': '✈️',
    'jets': '✈️',
    'jet_charter': '✈️',
    'private_jet': '✈️',
    'helicopter': '🚁',
    'helicopters': '🚁',
    'helicopter_charter': '🚁',
    'yacht': '🛥️',
    'yachts': '🛥️',
    'yacht_charter': '🛥️',
    'car': '🚗',
    'luxury_cars': '🏎️',
    'car_rental': '🚗',
    'taxi': '🚕',
    'transfer': '🚕',
    'ground_transport': '🚕',
    'airport_transfer': '🚕',
    'empty_legs': '✈️',
    'emptyleg': '✈️',
    'empty_leg': '✈️',
    'wine': '🍷',
    'wines': '🍷',
    'champagne': '🍾',
    'cigars': '🚬',
    'caviar': '🥂',
    'delicatesse': '🍾',
    'delicacies': '🍾',
    'custom_extra': '✨',
    'adventure': '🌟',
    'concierge': '🎩',
    'restaurant': '🍽️',
    'flowers': '💐',
    'tokenization': '🪙'
  };
  return icons[type?.toLowerCase()] || '📋';
};

// Get proper service title from type
const getServiceTitle = (type, itemName) => {
  const titles = {
    'jet': 'Private Jet Charter',
    'jets': 'Private Jet Charter',
    'jet_charter': 'Private Jet Charter',
    'private_jet': 'Private Jet Charter',
    'helicopter': 'Helicopter Charter',
    'helicopters': 'Helicopter Charter',
    'helicopter_charter': 'Helicopter Charter',
    'yacht': 'Yacht Charter',
    'yachts': 'Yacht Charter',
    'yacht_charter': 'Yacht Charter',
    'car': 'Ground Transport',
    'luxury_cars': 'Luxury Car Rental',
    'car_rental': 'Car Rental',
    'taxi': 'Airport Transfer',
    'transfer': 'Airport Transfer',
    'ground_transport': 'Ground Transport',
    'airport_transfer': 'Airport Transfer',
    'empty_legs': 'Empty Leg Flight',
    'emptyleg': 'Empty Leg Flight',
    'empty_leg': 'Empty Leg Flight',
    'wine': 'Premium Wines',
    'wines': 'Premium Wines',
    'champagne': 'Champagne',
    'cigars': 'Premium Cigars',
    'caviar': 'Caviar & Delicacies',
    'delicatesse': 'Delicacies',
    'delicacies': 'Delicacies',
    'custom_extra': 'Custom Extra',
    'adventure': 'Adventure Package',
    'concierge': 'Concierge Service',
    'restaurant': 'Restaurant Reservation',
    'flowers': 'Flowers & Gifts',
    'tokenization': 'Asset Tokenization'
  };
  // Return specific title or fall back to item name or formatted type
  return titles[type?.toLowerCase()] || itemName || type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Service';
};

// Base CSS styles for PDF - scoped to pdf-container (not body)
const getBaseStyles = () => `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  @page {
    size: A4;
    margin: 15mm;
  }

  .pdf-container {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 11px;
    line-height: 1.5;
    color: #1a1a1a;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    max-width: 210mm;
    margin: 0 auto;
    padding: 20px;
  }

  .pdf-container * {
    font-family: inherit;
  }

  /* Header */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 20px;
    border-bottom: 2px solid #000;
    margin-bottom: 25px;
  }

  .logo-section {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .logo {
    width: 50px;
    height: 50px;
    object-fit: contain;
  }

  .company-name {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.5px;
  }

  .company-tagline {
    font-size: 10px;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .document-info {
    text-align: right;
  }

  .document-type {
    font-size: 10px;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 4px;
  }

  .document-number {
    font-size: 18px;
    font-weight: 700;
    color: #000;
  }

  .document-date {
    font-size: 10px;
    color: #888;
    margin-top: 4px;
  }

  /* Info Grid */
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    margin-bottom: 25px;
  }

  .info-block h3 {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #888;
    margin-bottom: 6px;
    font-weight: 600;
  }

  .info-block p {
    font-size: 12px;
    color: #333;
    margin-bottom: 3px;
  }

  .info-block .value {
    font-weight: 600;
    color: #000;
  }

  .status-badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 12px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
  }

  .status-pending {
    background: #FEF3C7;
    color: #92400E;
  }

  .status-confirmed {
    background: #D1FAE5;
    color: #065F46;
  }

  .status-paid {
    background: #DBEAFE;
    color: #1E40AF;
  }

  /* Services Section */
  .services-section {
    margin-bottom: 25px;
  }

  .section-title {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #666;
    margin-bottom: 12px;
    padding-bottom: 6px;
    border-bottom: 1px solid #eee;
    font-weight: 600;
  }

  .service-card {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
  }

  .service-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  }

  .service-icon {
    font-size: 24px;
    margin-right: 10px;
  }

  .service-title {
    font-size: 14px;
    font-weight: 700;
    color: #000;
    margin-bottom: 2px;
  }

  .service-subtitle {
    font-size: 11px;
    color: #666;
  }

  .service-price {
    text-align: right;
  }

  .service-price-value {
    font-size: 16px;
    font-weight: 700;
    color: #000;
  }

  .service-price-label {
    font-size: 9px;
    color: #888;
    text-transform: uppercase;
  }

  .service-details {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    padding-top: 12px;
    border-top: 1px solid #e0e0e0;
  }

  .detail-item {
    font-size: 10px;
  }

  .detail-label {
    color: #888;
    text-transform: uppercase;
    font-size: 8px;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
  }

  .detail-value {
    color: #333;
    font-weight: 600;
    font-size: 11px;
  }

  /* Route display */
  .route-display {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: #fff;
    border-radius: 6px;
    margin-bottom: 12px;
  }

  .route-from, .route-to {
    flex: 1;
  }

  .route-code {
    font-size: 16px;
    font-weight: 700;
    color: #000;
  }

  .route-city {
    font-size: 10px;
    color: #666;
  }

  .route-arrow {
    font-size: 18px;
    color: #ccc;
  }

  /* Pricing Table */
  .pricing-section {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 2px solid #000;
  }

  .pricing-table {
    width: 100%;
    margin-bottom: 15px;
  }

  .pricing-row {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    font-size: 11px;
  }

  .pricing-row.subtotal {
    border-top: 1px solid #e0e0e0;
    padding-top: 10px;
    margin-top: 6px;
  }

  .pricing-row.total {
    border-top: 2px solid #000;
    padding-top: 12px;
    margin-top: 10px;
    font-size: 14px;
    font-weight: 700;
  }

  .pricing-label {
    color: #666;
  }

  .pricing-value {
    font-weight: 600;
    color: #000;
  }

  .pricing-row.total .pricing-label,
  .pricing-row.total .pricing-value {
    color: #000;
    font-size: 14px;
  }

  /* Notes Section */
  .notes-section {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 16px;
    margin-top: 20px;
    font-size: 10px;
  }

  .notes-title {
    font-weight: 700;
    margin-bottom: 8px;
    font-size: 11px;
  }

  .notes-content {
    color: #666;
    line-height: 1.6;
  }

  /* Footer */
  .footer {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #e0e0e0;
    text-align: center;
    font-size: 9px;
    color: #888;
  }

  .footer-company {
    font-weight: 600;
    color: #333;
    margin-bottom: 4px;
  }

  .footer-contact {
    margin-bottom: 8px;
  }

  .footer-legal {
    font-size: 8px;
    color: #aaa;
  }

  /* Thank You Message */
  .thank-you {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    margin-top: 25px;
  }

  .thank-you h3 {
    font-size: 14px;
    font-weight: 700;
    margin-bottom: 6px;
  }

  .thank-you p {
    font-size: 11px;
    color: #666;
  }

  /* Multi-item indicator */
  .item-count-badge {
    background: #000;
    color: #fff;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 9px;
    font-weight: 600;
  }
`;

/**
 * Generate Request Confirmation HTML
 * @param {Object} request - Request data
 * @param {Array} cartItems - Cart items array
 * @param {Object} options - Additional options
 * @returns {string} HTML string
 */
export function generateRequestConfirmationHTML(request, cartItems = [], options = {}) {
  const requestData = request.data || request.details || request;
  const requestNumber = request.id?.substring(0, 8).toUpperCase() || `REQ-${Date.now().toString().slice(-6)}`;
  const clientName = requestData.contact_name || requestData.name || requestData.client_name || options.userName || 'Valued Client';
  const clientEmail = requestData.client_email || requestData.email || options.userEmail || '';
  const currency = requestData.currency || 'USD';
  const createdAt = request.created_at || new Date().toISOString();

  // Use cartItems from request.data if not provided directly
  const items = cartItems.length > 0 ? cartItems : (requestData.cart_items || requestData.items || [requestData]);

  // Calculate totals
  let subtotal = 0;
  items.forEach(item => {
    const price = item.totalWithFee || item.price || item.basePrice || item.price_usd || item.total_price_usd || 0;
    subtotal += Number(price) || 0;
  });

  const vatRate = 0.081;
  const vatAmount = Math.round(subtotal * vatRate);
  const total = subtotal + vatAmount;

  // Generate service cards HTML
  const serviceCardsHTML = items.map((item, index) => {
    const itemType = item.type || item.item_type || 'service';
    const rawItemName = item.name || item.title || item.displayTitle || item.aircraft_type || item.model || item.service_name || '';
    const itemPrice = item.totalWithFee || item.price || item.basePrice || item.price_usd || 0;

    // Get the category/type display name for subtitle
    const categoryName = getServiceTitle(itemType);

    // TITLE should be the EXACT product name, SUBTITLE should be the category
    // If we have a specific product name, use it as title with category as subtitle
    // Otherwise fall back to category as title
    const serviceTitle = rawItemName || categoryName;
    const subtitle = rawItemName ? categoryName : '';

    // Route info
    const fromCity = item.from_city || item.from || item.origin || item.pickup_location || '';
    const toCity = item.to_city || item.to || item.destination || item.dropoff_location || '';
    const fromIata = item.from_iata || '';
    const toIata = item.to_iata || '';

    // Details
    const date = item.date || item.departure_date || item.pickup_date || item.pickupDate || '';
    const time = item.time || item.departure_time || item.pickup_time || item.pickupTime || '';
    const passengers = item.passengers || item.pax || item.guests || 1;
    const duration = item.estimatedDuration || item.duration || item.flight_time || '';
    const aircraft = item.aircraft || item.aircraft_type || item.model || item.vehicleName || item.carName || '';

    const hasRoute = fromCity || toCity;

    // For aircraft/vehicles, show the model as additional info in subtitle
    const fullSubtitle = aircraft && aircraft !== rawItemName ? `${subtitle}${subtitle ? ' • ' : ''}${aircraft}` : subtitle;

    return `
      <div class="service-card">
        <div class="service-header">
          <div style="display: flex; align-items: flex-start;">
            <span class="service-icon">${getServiceIcon(itemType)}</span>
            <div>
              <div class="service-title">${serviceTitle}</div>
              ${fullSubtitle ? `<div class="service-subtitle">${fullSubtitle}</div>` : ''}
            </div>
          </div>
          <div class="service-price">
            <div class="service-price-value">${formatCurrency(itemPrice, currency)}</div>
            <div class="service-price-label">${item.isEstimate ? 'Estimated' : 'Price'}</div>
          </div>
        </div>

        ${hasRoute ? `
        <div class="route-display">
          <div class="route-from">
            ${fromIata ? `<div class="route-code">${fromIata}</div>` : ''}
            <div class="route-city">${fromCity || 'Origin'}</div>
          </div>
          <div class="route-arrow">→</div>
          <div class="route-to">
            ${toIata ? `<div class="route-code">${toIata}</div>` : ''}
            <div class="route-city">${toCity || 'Destination'}</div>
          </div>
        </div>
        ` : ''}

        <div class="service-details">
          ${date ? `
          <div class="detail-item">
            <div class="detail-label">Date</div>
            <div class="detail-value">${formatDate(date)}</div>
          </div>
          ` : ''}
          ${time ? `
          <div class="detail-item">
            <div class="detail-label">Time</div>
            <div class="detail-value">${formatTime(time)}</div>
          </div>
          ` : ''}
          <div class="detail-item">
            <div class="detail-label">Passengers</div>
            <div class="detail-value">${passengers}</div>
          </div>
          ${duration ? `
          <div class="detail-item">
            <div class="detail-label">Duration</div>
            <div class="detail-value">${duration}</div>
          </div>
          ` : ''}
          ${item.quantity && item.quantity > 1 ? `
          <div class="detail-item">
            <div class="detail-label">Quantity</div>
            <div class="detail-value">${item.quantity}</div>
          </div>
          ` : ''}
        </div>

        ${item.notes || item.special_requests ? `
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #ddd; font-size: 10px; color: #666;">
          <strong>Notes:</strong> ${item.notes || item.special_requests}
        </div>
        ` : ''}
      </div>
    `;
  }).join('');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Request Confirmation #${requestNumber}</title>
  <style>${getBaseStyles()}</style>
</head>
<body>
  <div class="pdf-container">
    <!-- Header -->
    <div class="header">
      <div class="logo-section">
        <img src="${COMPANY.fullLogoUrl}" alt="PrivateCharterX" class="logo" onerror="this.style.display='none'">
        <div>
          <div class="company-name">PrivateCharterX</div>
          <div class="company-tagline">Luxury Charter Services</div>
        </div>
      </div>
      <div class="document-info">
        <div class="document-type">Service Request</div>
        <div class="document-number">#${requestNumber}</div>
        <div class="document-date">${formatDate(createdAt)}</div>
      </div>
    </div>

    <!-- Client & Request Info -->
    <div class="info-grid">
      <div class="info-block">
        <h3>Client Information</h3>
        <p class="value">${clientName}</p>
        ${clientEmail ? `<p>${clientEmail}</p>` : ''}
        ${requestData.contact_phone || requestData.phone ? `<p>${requestData.contact_phone || requestData.phone}</p>` : ''}
      </div>
      <div class="info-block" style="text-align: right;">
        <h3>Request Status</h3>
        <p><span class="status-badge status-pending">Pending Review</span></p>
        <p style="margin-top: 8px; font-size: 10px; color: #666;">
          ${items.length} service${items.length > 1 ? 's' : ''} requested
        </p>
      </div>
    </div>

    <!-- Services -->
    <div class="services-section">
      <div class="section-title">Requested Services ${items.length > 1 ? `<span class="item-count-badge">${items.length} items</span>` : ''}</div>
      ${serviceCardsHTML}
    </div>

    <!-- Pricing -->
    <div class="pricing-section">
      <div class="section-title">Price Summary</div>
      <div class="pricing-table">
        ${items.map(item => {
          const itemType = item.type || item.item_type || 'service';
          const rawItemName = item.name || item.title || item.displayTitle || '';
          // Use exact product name in price summary, fall back to category if no name
          const displayName = rawItemName || getServiceTitle(itemType);
          const itemPrice = item.totalWithFee || item.price || item.basePrice || item.price_usd || 0;
          return `
          <div class="pricing-row">
            <span class="pricing-label">${displayName}${item.quantity > 1 ? ` x${item.quantity}` : ''}</span>
            <span class="pricing-value">${formatCurrency(itemPrice, currency)}</span>
          </div>
          `;
        }).join('')}

        <div class="pricing-row subtotal">
          <span class="pricing-label">Subtotal</span>
          <span class="pricing-value">${formatCurrency(subtotal, currency)}</span>
        </div>
        <div class="pricing-row">
          <span class="pricing-label">VAT (8.1%)</span>
          <span class="pricing-value">${formatCurrency(vatAmount, currency)}</span>
        </div>
        <div class="pricing-row total">
          <span class="pricing-label">TOTAL ESTIMATE</span>
          <span class="pricing-value">${formatCurrency(total, currency)}</span>
        </div>
      </div>
    </div>

    <!-- Thank You -->
    <div class="thank-you">
      <h3>Thank you for your request, ${clientName.split(' ')[0]}!</h3>
      <p>Our concierge team will review your request and contact you within 2-4 hours with availability and final pricing.</p>
    </div>

    <!-- Notes -->
    <div class="notes-section">
      <div class="notes-title">Important Information</div>
      <div class="notes-content">
        • This is a request confirmation, not a booking confirmation. Final pricing may vary based on availability.<br>
        • A PrivateCharterX coordinator will contact you shortly to finalize your booking.<br>
        • For urgent requests, please contact us directly at ${COMPANY.email}
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-company">${COMPANY.name}</div>
      <div class="footer-contact">${COMPANY.fullAddress} • ${COMPANY.email}</div>
      <div class="footer-legal">This document was generated automatically. Request ID: ${requestNumber}</div>
    </div>
  </div>
</body>
</html>
  `;

  return html;
}

/**
 * Generate Booking Confirmation HTML (Invoice)
 */
export function generateBookingConfirmationHTML(booking, options = {}) {
  const bookingData = booking.data || booking.service_details || booking;
  const bookingNumber = booking.id?.substring(0, 8).toUpperCase() || `INV-${Date.now().toString().slice(-6)}`;
  const clientName = booking.contact_name || bookingData.name || options.userName || 'Valued Client';
  const clientEmail = booking.contact_email || bookingData.email || options.userEmail || '';
  const currency = booking.currency || 'USD';
  const createdAt = booking.created_at || new Date().toISOString();

  // Get cart items
  const items = bookingData.cart_items || bookingData.items || [bookingData];

  // Calculate totals
  const basePrice = booking.base_price || booking.total_amount || 0;
  const vatAmount = booking.processing_fee || booking.vat_amount || Math.round(basePrice * 0.081);
  const totalAmount = booking.total_amount || basePrice;

  // Generate service cards HTML (same as request but simpler)
  const serviceCardsHTML = items.map((item, index) => {
    const itemType = item.type || item.item_type || 'service';
    const rawItemName = item.name || item.title || item.service_name || '';
    const itemPrice = item.price || item.basePrice || item.totalWithFee || 0;
    const aircraft = item.aircraft || item.aircraft_type || item.model || item.vehicleName || '';

    // Get the category/type display name
    const categoryName = getServiceTitle(itemType);

    // TITLE = exact product name, SUBTITLE = category
    const serviceTitle = rawItemName || categoryName;
    const subtitle = rawItemName ? categoryName : '';
    const fullSubtitle = aircraft && aircraft !== rawItemName ? `${subtitle}${subtitle ? ' • ' : ''}${aircraft}` : subtitle;

    return `
      <div class="service-card">
        <div class="service-header">
          <div style="display: flex; align-items: flex-start;">
            <span class="service-icon">${getServiceIcon(itemType)}</span>
            <div>
              <div class="service-title">${serviceTitle}</div>
              ${fullSubtitle ? `<div class="service-subtitle">${fullSubtitle}</div>` : ''}
            </div>
          </div>
          <div class="service-price">
            <div class="service-price-value">${formatCurrency(itemPrice, currency)}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice #${bookingNumber}</title>
  <style>${getBaseStyles()}</style>
</head>
<body>
  <div class="pdf-container">
    <!-- Header -->
    <div class="header">
      <div class="logo-section">
        <img src="${COMPANY.fullLogoUrl}" alt="PrivateCharterX" class="logo" onerror="this.style.display='none'">
        <div>
          <div class="company-name">PrivateCharterX</div>
          <div class="company-tagline">Luxury Charter Services</div>
        </div>
      </div>
      <div class="document-info">
        <div class="document-type">Invoice</div>
        <div class="document-number">#${bookingNumber}</div>
        <div class="document-date">${formatDate(createdAt)}</div>
      </div>
    </div>

    <!-- Client & Booking Info -->
    <div class="info-grid">
      <div class="info-block">
        <h3>Billed To</h3>
        <p class="value">${clientName}</p>
        ${clientEmail ? `<p>${clientEmail}</p>` : ''}
      </div>
      <div class="info-block" style="text-align: right;">
        <h3>Payment Status</h3>
        <p><span class="status-badge status-paid">${booking.payment_status || 'Confirmed'}</span></p>
      </div>
    </div>

    <!-- Services -->
    <div class="services-section">
      <div class="section-title">Services</div>
      ${serviceCardsHTML}
    </div>

    <!-- Pricing -->
    <div class="pricing-section">
      <div class="section-title">Payment Summary</div>
      <div class="pricing-table">
        <div class="pricing-row">
          <span class="pricing-label">Subtotal</span>
          <span class="pricing-value">${formatCurrency(basePrice - vatAmount, currency)}</span>
        </div>
        <div class="pricing-row">
          <span class="pricing-label">VAT (8.1%)</span>
          <span class="pricing-value">${formatCurrency(vatAmount, currency)}</span>
        </div>
        <div class="pricing-row total">
          <span class="pricing-label">TOTAL PAID</span>
          <span class="pricing-value">${formatCurrency(totalAmount, currency)}</span>
        </div>
      </div>
    </div>

    <!-- Thank You -->
    <div class="thank-you">
      <h3>Thank you for your booking!</h3>
      <p>Your booking is confirmed. Travel documents will be sent separately to your email.</p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-company">${COMPANY.name}</div>
      <div class="footer-contact">${COMPANY.fullAddress} • ${COMPANY.email}</div>
      <div class="footer-legal">Invoice ID: ${bookingNumber} • Generated on ${formatDate(new Date())}</div>
    </div>
  </div>
</body>
</html>
  `;

  return html;
}

/**
 * Open HTML in new window for printing/saving as PDF
 */
export function openHTMLForPrint(html, filename = 'document.pdf') {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();

    // Auto-trigger print dialog
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  }
  return printWindow;
}

/**
 * Download HTML as PDF using html2pdf.js
 * Directly downloads PDF file with beautiful HTML layout
 * DOES NOT open any new windows - silent download only
 */
export async function downloadHTMLAsPDF(html, filename = 'document.pdf') {
  // Extract styles from HTML and inject into document head
  const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  let styleElement = null;

  if (styleMatch) {
    styleElement = document.createElement('style');
    styleElement.id = 'pdf-temp-styles';
    styleElement.textContent = styleMatch[1];
    document.head.appendChild(styleElement);
  }

  // Create a temporary container for the HTML content
  // Position off-screen but VISIBLE (html2canvas needs visible elements)
  const element = document.createElement('div');

  // Extract just the body content if it's a full HTML document
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  element.innerHTML = bodyMatch ? bodyMatch[1] : html;

  element.style.cssText = `
    position: absolute;
    left: -9999px;
    top: 0;
    width: 794px;
    min-height: 1123px;
    background: white;
    visibility: visible;
  `;
  document.body.appendChild(element);

  try {
    // Wait for DOM to render and images to load
    await new Promise(resolve => setTimeout(resolve, 500));

    // Force layout recalculation
    void element.offsetHeight;

    // Find the pdf-container or use element
    const pdfContainer = element.querySelector('.pdf-container') || element;

    // Debug log
    console.log('PDF generation - container found:', !!element.querySelector('.pdf-container'), 'height:', pdfContainer.scrollHeight);

    // Generate and download PDF silently
    await html2pdf()
      .set({
        margin: 10,
        filename: filename,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff',
          scrollX: 0,
          scrollY: 0
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait'
        }
      })
      .from(pdfContainer)
      .save();

    console.log('PDF downloaded successfully:', filename);
    return true;
  } catch (err) {
    console.error('Error generating PDF:', err);
    // Fallback: Open print dialog in a new window
    try {
      const printWindow = window.open('', '_blank', 'width=800,height=1000');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.onload = () => {
          setTimeout(() => printWindow.print(), 300);
        };
      }
    } catch (fallbackErr) {
      console.error('Fallback also failed:', fallbackErr);
    }
    return false;
  } finally {
    // Clean up: remove styles and element after a small delay
    setTimeout(() => {
      if (styleElement && document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
      if (document.body.contains(element)) {
        document.body.removeChild(element);
      }
    }, 500);
  }
}

/**
 * Generate Quote/Invoice HTML for admin-created documents
 * Professional layout with services, pricing, and terms
 */
export function generateQuoteInvoiceHTML(quoteData) {
  const {
    type = 'quote',
    number,
    date,
    validUntil,
    paymentTerms,
    client = {},
    services = [],
    subtotal = 0,
    discount,
    total = 0,
    notes,
    requestId
  } = quoteData;

  const isQuote = type === 'quote';
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  const formattedValidUntil = validUntil ? new Date(validUntil).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  }) : null;

  // Service type labels
  const serviceLabels = {
    private_jet: 'Private Jet Charter',
    helicopter: 'Helicopter Charter',
    empty_leg: 'Empty Leg Flight',
    ground_transport: 'Ground Transport',
    yacht: 'Yacht Charter',
    concierge: 'Concierge Service',
    wine: 'Wine & Spirits',
    custom: 'Custom Service'
  };

  // Generate service rows
  const serviceRows = services.map((service, idx) => {
    const routeInfo = service.from && service.to
      ? `<div class="service-route">${service.from} → ${service.to}</div>`
      : '';
    const dateInfo = service.date
      ? `<div class="service-date">${new Date(service.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>`
      : '';
    const passengersInfo = service.passengers
      ? `<div class="service-pax">${service.passengers} passenger${service.passengers > 1 ? 's' : ''}</div>`
      : '';
    const detailsInfo = service.details
      ? `<div class="service-details">${service.details}</div>`
      : '';

    return `
      <tr class="service-row">
        <td class="service-num">${idx + 1}</td>
        <td class="service-desc">
          <div class="service-type">${serviceLabels[service.type] || service.type}</div>
          <div class="service-name">${service.description || ''}</div>
          ${routeInfo}
          ${dateInfo}
          ${passengersInfo}
          ${detailsInfo}
        </td>
        <td class="service-qty">${service.quantity} ${service.unit}</td>
        <td class="service-price">$${service.unitPrice.toLocaleString()}</td>
        <td class="service-total">$${service.total.toLocaleString()}</td>
      </tr>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${isQuote ? 'Quote' : 'Invoice'} ${number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    @page { size: A4; margin: 15mm; }

    .pdf-container {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 11px;
      line-height: 1.5;
      color: #1a1a1a;
      background: #fff;
      max-width: 210mm;
      margin: 0 auto;
      padding: 30px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 25px;
      border-bottom: 3px solid #000;
      margin-bottom: 30px;
    }

    .logo-section { }

    .logo {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -1px;
      color: #000;
    }

    .logo-sub {
      font-size: 10px;
      color: #666;
      margin-top: 2px;
      letter-spacing: 2px;
      text-transform: uppercase;
    }

    .doc-info {
      text-align: right;
    }

    .doc-type {
      font-size: 32px;
      font-weight: 700;
      color: ${isQuote ? '#2563eb' : '#059669'};
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    .doc-number {
      font-size: 12px;
      color: #666;
      margin-top: 5px;
    }

    .doc-date {
      font-size: 11px;
      color: #333;
      margin-top: 3px;
    }

    /* Client Section */
    .client-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }

    .client-info {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      flex: 1;
      max-width: 300px;
    }

    .client-label {
      font-size: 10px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }

    .client-name {
      font-size: 16px;
      font-weight: 600;
      color: #000;
      margin-bottom: 5px;
    }

    .client-email, .client-phone {
      font-size: 11px;
      color: #555;
    }

    .validity-info {
      text-align: right;
      padding: 20px;
    }

    .validity-label {
      font-size: 10px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .validity-value {
      font-size: 14px;
      font-weight: 600;
      color: ${isQuote ? '#dc2626' : '#059669'};
      margin-top: 5px;
    }

    /* Services Table */
    .services-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }

    .services-table th {
      background: #000;
      color: #fff;
      padding: 12px 15px;
      text-align: left;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .services-table th:first-child {
      border-radius: 6px 0 0 0;
      width: 40px;
      text-align: center;
    }

    .services-table th:last-child {
      border-radius: 0 6px 0 0;
      text-align: right;
    }

    .services-table th:nth-child(3),
    .services-table th:nth-child(4) {
      text-align: center;
      width: 80px;
    }

    .service-row td {
      padding: 15px;
      border-bottom: 1px solid #eee;
      vertical-align: top;
    }

    .service-num {
      text-align: center;
      color: #999;
      font-weight: 500;
    }

    .service-type {
      font-size: 9px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
    }

    .service-name {
      font-size: 13px;
      font-weight: 600;
      color: #000;
      margin-bottom: 5px;
    }

    .service-route {
      font-size: 11px;
      color: #2563eb;
      font-weight: 500;
      margin-bottom: 3px;
    }

    .service-date, .service-pax {
      font-size: 10px;
      color: #666;
      display: inline-block;
      margin-right: 10px;
    }

    .service-details {
      font-size: 10px;
      color: #888;
      margin-top: 5px;
      font-style: italic;
    }

    .service-qty, .service-price {
      text-align: center;
      color: #555;
    }

    .service-total {
      text-align: right;
      font-weight: 600;
      color: #000;
    }

    /* Totals */
    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 30px;
    }

    .totals-box {
      width: 280px;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }

    .totals-row.discount {
      color: #dc2626;
    }

    .totals-row.total {
      border-bottom: none;
      border-top: 2px solid #000;
      padding-top: 12px;
      margin-top: 5px;
    }

    .totals-label {
      color: #666;
    }

    .totals-value {
      font-weight: 500;
    }

    .totals-row.total .totals-label,
    .totals-row.total .totals-value {
      font-size: 16px;
      font-weight: 700;
      color: #000;
    }

    /* Notes */
    .notes-section {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }

    .notes-label {
      font-size: 10px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }

    .notes-content {
      font-size: 11px;
      color: #555;
      white-space: pre-line;
    }

    /* Footer */
    .footer {
      border-top: 1px solid #ddd;
      padding-top: 20px;
      text-align: center;
    }

    .footer-contact {
      font-size: 10px;
      color: #666;
      margin-bottom: 10px;
    }

    .footer-legal {
      font-size: 9px;
      color: #999;
    }

    .ref-id {
      font-size: 9px;
      color: #ccc;
      margin-top: 15px;
    }
  </style>
</head>
<body>
  <div class="pdf-container">
    <!-- Header -->
    <div class="header">
      <div class="logo-section">
        <div class="logo">PrivateCharterX</div>
        <div class="logo-sub">Luxury Travel Concierge</div>
      </div>
      <div class="doc-info">
        <div class="doc-type">${isQuote ? 'Quote' : 'Invoice'}</div>
        <div class="doc-number">${number}</div>
        <div class="doc-date">${formattedDate}</div>
      </div>
    </div>

    <!-- Client & Validity -->
    <div class="client-section">
      <div class="client-info">
        <div class="client-label">Prepared For</div>
        <div class="client-name">${client.name || 'Client'}</div>
        ${client.email ? `<div class="client-email">${client.email}</div>` : ''}
        ${client.phone ? `<div class="client-phone">${client.phone}</div>` : ''}
      </div>
      <div class="validity-info">
        ${isQuote && formattedValidUntil ? `
          <div class="validity-label">Valid Until</div>
          <div class="validity-value">${formattedValidUntil}</div>
        ` : ''}
        ${!isQuote && paymentTerms ? `
          <div class="validity-label">Payment Terms</div>
          <div class="validity-value">${paymentTerms}</div>
        ` : ''}
      </div>
    </div>

    <!-- Services Table -->
    <table class="services-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Service Description</th>
          <th>Qty</th>
          <th>Unit Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${serviceRows}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals-section">
      <div class="totals-box">
        <div class="totals-row">
          <span class="totals-label">Subtotal</span>
          <span class="totals-value">$${subtotal.toLocaleString()}</span>
        </div>
        ${discount && discount.amount > 0 ? `
          <div class="totals-row discount">
            <span class="totals-label">Discount ${discount.type === 'percent' ? `(${discount.value}%)` : ''}</span>
            <span class="totals-value">-$${discount.amount.toLocaleString()}</span>
          </div>
        ` : ''}
        <div class="totals-row total">
          <span class="totals-label">Total</span>
          <span class="totals-value">$${total.toLocaleString()} USD</span>
        </div>
      </div>
    </div>

    <!-- Notes -->
    ${notes ? `
      <div class="notes-section">
        <div class="notes-label">${isQuote ? 'Terms & Conditions' : 'Notes'}</div>
        <div class="notes-content">${notes}</div>
      </div>
    ` : ''}

    <!-- Footer -->
    <div class="footer">
      <div class="footer-contact">
        PrivateCharterX | contact@privatecharterx.com | +41 22 000 0000
      </div>
      <div class="footer-legal">
        ${isQuote
          ? 'This quote is valid for 7 days from the date of issue. Prices are subject to availability and may change.'
          : 'Payment is due according to the terms specified above. Thank you for choosing PrivateCharterX.'
        }
      </div>
      ${requestId ? `<div class="ref-id">Ref: ${requestId}</div>` : ''}
    </div>
  </div>
</body>
</html>
  `;
}

export default {
  generateRequestConfirmationHTML,
  generateBookingConfirmationHTML,
  generateQuoteInvoiceHTML,
  openHTMLForPrint,
  downloadHTMLAsPDF,
  getBaseStyles
};
