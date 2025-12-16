/**
 * PDF Generator Service for PrivateCharterX
 * Generates beautiful confirmation PDFs for bookings, requests, and subscriptions
 * Design: Monochromatic black/light grey minimalist luxury aesthetic
 */

import jsPDF from 'jspdf';
import { supabase } from '../lib/supabase';

// Company Information
const COMPANY = {
  name: 'PrivateCharterX LLC',
  shortName: 'PRIVATECHARTERX',
  tagline: 'Luxury Travel Concierge',
  address: '1000 Brickell Ave.',
  city: '33131 Miami, Florida',
  email: 'bookings@privatecharterx.com',
  website: 'www.privatecharterx.com',
  logoUrl: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/PrivatecharterX_Logo_written-removebg-preview.png'
};

// Service-specific thank you messages
const SERVICE_MESSAGES = {
  jets: {
    thankYou: 'Thank you for choosing PrivateCharterX for your private aviation needs. We are committed to delivering an exceptional travel experience tailored to your preferences.',
    carbonNote: 'As part of our commitment to sustainability, you will receive a CO2 offset certificate via PDF or directly to your registered crypto wallet.'
  },
  helicopters: {
    thankYou: 'Thank you for choosing PrivateCharterX for your helicopter charter. Our team is dedicated to ensuring a seamless and luxurious flight experience.',
    carbonNote: 'As part of our commitment to sustainability, you will receive a CO2 offset certificate via PDF or directly to your registered crypto wallet.'
  },
  empty_legs: {
    thankYou: 'Thank you for choosing PrivateCharterX for this exclusive empty leg opportunity. Enjoy premium private aviation at exceptional value.',
    carbonNote: 'As part of our commitment to sustainability, you will receive a CO2 offset certificate via PDF or directly to your registered crypto wallet.'
  },
  yachts: {
    thankYou: 'Thank you for choosing PrivateCharterX for your yacht charter. We look forward to creating an unforgettable maritime experience for you.',
    carbonNote: null
  },
  cars: {
    thankYou: 'Thank you for choosing PrivateCharterX for your luxury car rental. Experience the finest in automotive excellence.',
    carbonNote: null
  },
  default: {
    thankYou: 'Thank you for choosing PrivateCharterX. We are dedicated to exceeding your expectations with personalized luxury services.',
    carbonNote: null
  }
};

// Cache for logo image data
let logoImageCache = null;

/**
 * Load and cache logo image as base64 for PDF embedding
 */
async function loadLogoImage() {
  if (logoImageCache) return logoImageCache;

  try {
    const response = await fetch(COMPANY.logoUrl);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        logoImageCache = reader.result;
        resolve(logoImageCache);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error loading logo image:', error);
    return null;
  }
}

// Monochromatic colors - Black and Light Grey only
const COLORS = {
  black: '#000000',
  darkGray: '#1a1a1a',
  mediumGray: '#4b5563',
  gray: '#6b7280',
  lightGray: '#9ca3af',
  veryLightGray: '#e5e7eb',
  almostWhite: '#f3f4f6',
  white: '#ffffff'
};

// Format currency
const formatCurrency = (amount, currency = 'USD') => {
  if (!amount && amount !== 0) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Format short date
const formatShortDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Get service message based on service type
 */
function getServiceMessage(serviceType) {
  const type = (serviceType || '').toLowerCase();
  if (type.includes('jet') || type.includes('private-jet') || type.includes('charter')) {
    return SERVICE_MESSAGES.jets;
  }
  if (type.includes('helicopter') || type.includes('heli')) {
    return SERVICE_MESSAGES.helicopters;
  }
  if (type.includes('empty') || type.includes('leg')) {
    return SERVICE_MESSAGES.empty_legs;
  }
  if (type.includes('yacht') || type.includes('boat')) {
    return SERVICE_MESSAGES.yachts;
  }
  if (type.includes('car') || type.includes('luxury_car')) {
    return SERVICE_MESSAGES.cars;
  }
  return SERVICE_MESSAGES.default;
}

/**
 * Create base PDF document with common helper functions
 * @param {Object} userInfo - Optional user info {name, email, phone, paymentPreference}
 */
function createBasePDF(userInfo = {}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const centerX = pageWidth / 2;

  // Helper function to add text - using lighter font weight for elegance
  const addText = (text, x, y, options = {}) => {
    const { fontSize = 10, fontStyle = 'normal', color = COLORS.darkGray, align = 'left' } = options;
    doc.setFontSize(fontSize);
    // Use lighter font weight for titles (normal instead of bold for elegance)
    doc.setFont('helvetica', fontStyle);
    doc.setTextColor(color);
    doc.text(String(text || ''), x, y, { align });
  };

  // Helper for elegant thin titles
  const addElegantTitle = (text, x, y, options = {}) => {
    const { fontSize = 10, color = COLORS.gray, align = 'left' } = options;
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'normal'); // Thin/normal weight for elegance
    doc.setTextColor(color);
    doc.text(String(text || ''), x, y, { align });
  };

  // Helper to draw a line
  const drawLine = (y, color = COLORS.veryLightGray) => {
    doc.setDrawColor(color);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
  };

  // Helper to draw a rounded rectangle
  const drawRoundedRect = (x, y, w, h, r, fillColor) => {
    doc.setFillColor(fillColor);
    doc.roundedRect(x, y, w, h, r, r, 'F');
  };

  // Draw header with logo and full company info
  const drawHeader = (confirmNumber, type = 'Confirmation', logoImage = null) => {
    let yPos = margin;

    // Light gray header background - taller to fit company info
    drawRoundedRect(margin, yPos, pageWidth - (margin * 2), 52, 3, COLORS.almostWhite);

    yPos += 8;

    // Add logo image if available, otherwise fallback to text
    if (logoImage) {
      try {
        doc.addImage(logoImage, 'PNG', margin + 8, yPos, 50, 12);
        yPos += 14;
      } catch (error) {
        console.error('Error adding logo to PDF:', error);
        addText(COMPANY.name, margin + 10, yPos + 4, { fontSize: 18, fontStyle: 'normal', color: COLORS.black });
        yPos += 10;
      }
    } else {
      addText(COMPANY.name, margin + 10, yPos + 4, { fontSize: 18, fontStyle: 'normal', color: COLORS.black });
      yPos += 10;
    }

    // Company address and contact - elegant thin font
    addText(COMPANY.address, margin + 10, yPos, { fontSize: 8, color: COLORS.gray });
    yPos += 4;
    addText(COMPANY.city, margin + 10, yPos, { fontSize: 8, color: COLORS.gray });
    yPos += 6;
    addText(COMPANY.email, margin + 10, yPos, { fontSize: 8, color: COLORS.mediumGray });
    yPos += 4;
    addText(COMPANY.website, margin + 10, yPos, { fontSize: 8, color: COLORS.mediumGray });

    // Confirmation number on right side
    const rightYBase = margin + 20;
    addText(`${type} #`, pageWidth - margin - 10, rightYBase, { fontSize: 8, color: COLORS.gray, align: 'right' });
    addText(confirmNumber, pageWidth - margin - 10, rightYBase + 6, { fontSize: 12, fontStyle: 'bold', color: COLORS.black, align: 'right' });

    return yPos + 16;
  };

  // Draw user info section with payment preference
  const drawUserInfo = (yPos) => {
    const userName = userInfo.name || userInfo.username || '';
    const userEmail = userInfo.email || '';
    const userPhone = userInfo.phone || '';
    const paymentPref = userInfo.paymentPreference || userInfo.payment_preference || '';

    if (!userName && !userEmail && !userPhone && !paymentPref) return yPos;

    drawLine(yPos);
    yPos += 10;

    addElegantTitle('CLIENT INFORMATION', margin, yPos, { fontSize: 9, color: COLORS.gray });
    yPos += 8;

    if (userName) {
      addText('Name', margin, yPos, { fontSize: 8, color: COLORS.gray });
      addText(userName, margin + 30, yPos, { fontSize: 10, color: COLORS.darkGray });
      yPos += 7;
    }

    if (userEmail) {
      addText('Email', margin, yPos, { fontSize: 8, color: COLORS.gray });
      addText(userEmail, margin + 30, yPos, { fontSize: 10, color: COLORS.darkGray });
      yPos += 7;
    }

    if (userPhone) {
      addText('Phone', margin, yPos, { fontSize: 8, color: COLORS.gray });
      addText(userPhone, margin + 30, yPos, { fontSize: 10, color: COLORS.darkGray });
      yPos += 7;
    }

    if (paymentPref) {
      addText('Payment', margin, yPos, { fontSize: 8, color: COLORS.gray });
      const paymentLabel = paymentPref.toLowerCase() === 'crypto' ? 'Cryptocurrency' :
                          paymentPref.toLowerCase() === 'bank' ? 'Bank Transfer' : paymentPref;
      addText(paymentLabel, margin + 30, yPos, { fontSize: 10, color: COLORS.darkGray });
      yPos += 7;
    }

    return yPos + 5;
  };

  // Draw thank you message and carbon note based on service type
  const drawServiceMessage = (yPos, serviceType) => {
    const message = getServiceMessage(serviceType);

    drawLine(yPos);
    yPos += 10;

    // Thank you message
    addElegantTitle('THANK YOU', margin, yPos, { fontSize: 9, color: COLORS.gray });
    yPos += 7;

    // Split long text into multiple lines
    const thankYouLines = doc.splitTextToSize(message.thankYou, pageWidth - (margin * 2));
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(COLORS.mediumGray);
    doc.text(thankYouLines, margin, yPos);
    yPos += thankYouLines.length * 4 + 5;

    // Carbon certificate note for aviation services
    if (message.carbonNote) {
      yPos += 3;
      drawRoundedRect(margin, yPos, pageWidth - (margin * 2), 16, 2, COLORS.almostWhite);
      yPos += 6;
      addText('🌿 Carbon Offset', margin + 5, yPos, { fontSize: 8, fontStyle: 'bold', color: COLORS.mediumGray });
      yPos += 5;
      const carbonLines = doc.splitTextToSize(message.carbonNote, pageWidth - (margin * 2) - 10);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(COLORS.gray);
      doc.text(carbonLines, margin + 5, yPos);
      yPos += carbonLines.length * 3 + 8;
    }

    return yPos;
  };

  // Draw "What's Next" section - separate from footer
  const drawWhatsNext = (yPos) => {
    drawLine(yPos);
    yPos += 10;

    addElegantTitle('WHAT HAPPENS NEXT', margin, yPos, { fontSize: 9, color: COLORS.gray });
    yPos += 10;

    const steps = [
      '1. Our team reviews your request within 2-4 hours',
      '2. You receive a detailed quote via email',
      '3. Once confirmed, we arrange all logistics',
      '4. Final confirmation and travel documents follow'
    ];

    steps.forEach(step => {
      addText(step, margin, yPos, { fontSize: 9, color: COLORS.darkGray });
      yPos += 6;
    });

    return yPos + 5;
  };

  // Draw footer with company info - centered and clean
  const drawFooter = () => {
    let yPos = pageHeight - 30;
    drawLine(yPos);
    yPos += 8;

    // Centered company info
    addText(COMPANY.name, centerX, yPos, { fontSize: 8, fontStyle: 'normal', color: COLORS.mediumGray, align: 'center' });
    yPos += 4;
    addText(COMPANY.address, centerX, yPos, { fontSize: 7, color: COLORS.lightGray, align: 'center' });
    yPos += 3;
    addText(COMPANY.city, centerX, yPos, { fontSize: 7, color: COLORS.lightGray, align: 'center' });
    yPos += 5;
    addText(`${COMPANY.email}  |  ${COMPANY.website}`, centerX, yPos, { fontSize: 7, color: COLORS.gray, align: 'center' });
    yPos += 5;
    addText(`Generated: ${formatShortDate(new Date())}`, centerX, yPos, { fontSize: 6, color: COLORS.lightGray, align: 'center' });
  };

  return { doc, pageWidth, pageHeight, margin, addText, addElegantTitle, drawLine, drawRoundedRect, drawHeader, drawFooter, drawUserInfo, drawWhatsNext, drawServiceMessage };
}

/**
 * Generate a booking confirmation PDF
 */
export async function generateBookingConfirmationPDF(booking, options = {}) {
  // Extract user info from booking or options
  const userInfo = {
    name: options.userName || booking.contact_name || booking.user_name || '',
    email: options.userEmail || booking.contact_email || booking.user_email || '',
    phone: options.userPhone || booking.contact_phone || booking.user_phone || '',
    paymentPreference: options.paymentPreference || booking.payment_preference || booking.payment_method || ''
  };

  const { doc, pageWidth, pageHeight, margin, addText, addElegantTitle, drawLine, drawRoundedRect, drawHeader, drawFooter, drawUserInfo, drawServiceMessage } = createBasePDF(userInfo);

  // Load logo image
  const logoImage = await loadLogoImage();

  const confirmationNumber = booking.id?.substring(0, 8).toUpperCase() || 'N/A';
  let yPos = drawHeader(confirmationNumber, 'Booking', logoImage);

  // ============ STATUS BADGE ============
  const status = booking.booking_status || booking.payment_status || booking.status || 'confirmed';
  const statusText = status.charAt(0).toUpperCase() + status.slice(1);

  // Black badge for confirmed, gray for pending
  const badgeColor = (status === 'confirmed' || status === 'paid' || status === 'completed') ? COLORS.black : COLORS.mediumGray;
  drawRoundedRect(margin, yPos, 75, 8, 2, badgeColor);
  doc.setTextColor(COLORS.white);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`BOOKING ${statusText.toUpperCase()}`, margin + 37.5, yPos + 5.5, { align: 'center' });

  yPos += 15;

  // ============ BOOKING TITLE ============
  const serviceTitle = booking.service_title || booking.service_type || 'Service Booking';
  addText(serviceTitle, margin, yPos, { fontSize: 16, fontStyle: 'bold', color: COLORS.black });

  yPos += 8;
  addText(`Booked on ${formatDate(booking.created_at)}`, margin, yPos, { fontSize: 9, color: COLORS.gray });

  yPos += 12;
  drawLine(yPos);
  yPos += 10;

  // ============ SERVICE DETAILS ============
  addText('SERVICE DETAILS', margin, yPos, { fontSize: 10, fontStyle: 'bold', color: COLORS.gray });
  yPos += 8;

  const serviceDetails = booking.service_details || {};
  const serviceType = booking.service_type || booking.booking_type || '';

  drawRoundedRect(margin, yPos, pageWidth - (margin * 2), 45, 3, COLORS.almostWhite);
  yPos += 8;

  const col1X = margin + 8;
  const col2X = pageWidth / 2 + 10;

  // Left column details based on service type
  if (serviceType.includes('jet') || serviceType.includes('helicopter') || serviceType.includes('flight') || serviceType.includes('empty_leg')) {
    addText('Route', col1X, yPos, { fontSize: 8, color: COLORS.gray });
    yPos += 5;
    const route = `${booking.departure_location || booking.origin || serviceDetails.from || '-'} → ${booking.arrival_location || booking.destination || serviceDetails.to || '-'}`;
    addText(route, col1X, yPos, { fontSize: 11, fontStyle: 'bold', color: COLORS.black });

    yPos += 10;
    addText('Travel Date', col1X, yPos, { fontSize: 8, color: COLORS.gray });
    yPos += 5;
    addText(formatShortDate(booking.departure_date || serviceDetails.date), col1X, yPos, { fontSize: 10, color: COLORS.darkGray });

  } else if (serviceType === 'cart_checkout') {
    addText('Order Type', col1X, yPos, { fontSize: 8, color: COLORS.gray });
    yPos += 5;
    addText('Direct Checkout', col1X, yPos, { fontSize: 11, fontStyle: 'bold', color: COLORS.black });

    yPos += 10;
    addText('Items', col1X, yPos, { fontSize: 8, color: COLORS.gray });
    yPos += 5;
    const itemCount = serviceDetails.item_count || serviceDetails.cart_items?.length || 1;
    addText(`${itemCount} item${itemCount > 1 ? 's' : ''}`, col1X, yPos, { fontSize: 10, color: COLORS.darkGray });

  } else {
    addText('Service', col1X, yPos, { fontSize: 8, color: COLORS.gray });
    yPos += 5;
    addText(booking.service_title || '-', col1X, yPos, { fontSize: 11, fontStyle: 'bold', color: COLORS.black });

    yPos += 10;
    addText('Date', col1X, yPos, { fontSize: 8, color: COLORS.gray });
    yPos += 5;
    addText(formatShortDate(booking.departure_date || booking.created_at), col1X, yPos, { fontSize: 10, color: COLORS.darkGray });
  }

  // Reset for right column
  yPos -= 28;

  addText('Passengers', col2X, yPos, { fontSize: 8, color: COLORS.gray });
  yPos += 5;
  addText(`${booking.passengers || serviceDetails.passengers || 1}`, col2X, yPos, { fontSize: 11, fontStyle: 'bold', color: COLORS.black });

  yPos += 10;
  addText('Reference', col2X, yPos, { fontSize: 8, color: COLORS.gray });
  yPos += 5;
  addText(booking.id?.substring(0, 12).toUpperCase() || '-', col2X, yPos, { fontSize: 10, color: COLORS.darkGray });

  yPos += 20;

  // ============ CART ITEMS (if applicable) ============
  if (serviceType === 'cart_checkout' && serviceDetails.cart_items?.length > 0) {
    yPos += 5;
    addText('ORDER ITEMS', margin, yPos, { fontSize: 10, fontStyle: 'bold', color: COLORS.gray });
    yPos += 8;

    serviceDetails.cart_items.forEach((item, index) => {
      if (yPos > pageHeight - 80) {
        doc.addPage();
        yPos = margin;
      }

      drawRoundedRect(margin, yPos, pageWidth - (margin * 2), 18, 2, index % 2 === 0 ? COLORS.almostWhite : COLORS.white);
      yPos += 6;

      addText(item.name || item.title || 'Item', margin + 5, yPos, { fontSize: 10, fontStyle: 'bold', color: COLORS.black });
      addText(formatCurrency(item.price || item.basePrice, 'USD'), pageWidth - margin - 5, yPos, { fontSize: 10, fontStyle: 'bold', color: COLORS.black, align: 'right' });

      yPos += 5;
      addText(item.type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || '', margin + 5, yPos, { fontSize: 8, color: COLORS.gray });

      yPos += 10;
    });
    yPos += 5;
  }

  // ============ PAYMENT DETAILS ============
  yPos += 5;
  drawLine(yPos);
  yPos += 10;

  addText('PAYMENT DETAILS', margin, yPos, { fontSize: 10, fontStyle: 'bold', color: COLORS.gray });
  yPos += 10;

  const basePrice = booking.base_price || booking.total_amount || 0;
  const vatAmount = booking.processing_fee || booking.vat_amount || 0;
  const totalAmount = booking.total_amount || basePrice;
  const priceRowX = pageWidth - margin - 5;

  // Price breakdown
  addText('Subtotal', margin, yPos, { fontSize: 10, color: COLORS.darkGray });
  addText(formatCurrency(basePrice - vatAmount, booking.currency || 'USD'), priceRowX, yPos, { fontSize: 10, color: COLORS.darkGray, align: 'right' });

  yPos += 7;
  addText('VAT (8.1%)', margin, yPos, { fontSize: 10, color: COLORS.gray });
  addText(formatCurrency(vatAmount, booking.currency || 'USD'), priceRowX, yPos, { fontSize: 10, color: COLORS.gray, align: 'right' });

  yPos += 8;
  drawLine(yPos);
  yPos += 8;

  addText('TOTAL PAID', margin, yPos, { fontSize: 12, fontStyle: 'bold', color: COLORS.black });
  addText(formatCurrency(totalAmount, booking.currency || 'USD'), priceRowX, yPos, { fontSize: 14, fontStyle: 'bold', color: COLORS.black, align: 'right' });

  // Payment method
  yPos += 10;
  const paymentMethod = booking.payment_method || 'crypto';
  const cryptoCurrency = booking.crypto_currency || booking.metadata?.crypto_currency || '';

  if (paymentMethod === 'crypto' || paymentMethod === 'cryptocurrency') {
    addText('Payment Method:', margin, yPos, { fontSize: 9, color: COLORS.gray });
    const cryptoText = cryptoCurrency ? `Cryptocurrency (${cryptoCurrency.toUpperCase()})` : 'Cryptocurrency';
    addText(cryptoText, margin + 35, yPos, { fontSize: 9, fontStyle: 'bold', color: COLORS.darkGray });
  } else {
    addText('Payment Method:', margin, yPos, { fontSize: 9, color: COLORS.gray });
    addText(paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1), margin + 35, yPos, { fontSize: 9, fontStyle: 'bold', color: COLORS.darkGray });
  }

  // Transaction hash if available
  if (booking.transaction_hash) {
    yPos += 6;
    addText('Transaction:', margin, yPos, { fontSize: 8, color: COLORS.gray });
    addText(booking.transaction_hash.substring(0, 20) + '...', margin + 25, yPos, { fontSize: 8, color: COLORS.lightGray });
  }

  // ============ GUEST INFORMATION ============
  yPos += 15;
  drawLine(yPos);
  yPos += 10;

  addText('GUEST INFORMATION', margin, yPos, { fontSize: 10, fontStyle: 'bold', color: COLORS.gray });
  yPos += 8;

  addText('Name', margin, yPos, { fontSize: 8, color: COLORS.gray });
  addText(booking.contact_name || '-', margin + 25, yPos, { fontSize: 10, color: COLORS.darkGray });

  yPos += 7;
  addText('Email', margin, yPos, { fontSize: 8, color: COLORS.gray });
  addText(booking.contact_email || '-', margin + 25, yPos, { fontSize: 10, color: COLORS.darkGray });

  if (booking.contact_phone) {
    yPos += 7;
    addText('Phone', margin, yPos, { fontSize: 8, color: COLORS.gray });
    addText(booking.contact_phone, margin + 25, yPos, { fontSize: 10, color: COLORS.darkGray });
  }

  // Draw footer
  drawFooter();

  const filename = `PrivateCharterX_Booking_${confirmationNumber}_${Date.now()}.pdf`;
  const blob = doc.output('blob');
  const base64 = doc.output('datauristring').split(',')[1];

  return { blob, base64, filename, doc };
}

/**
 * Generate a request confirmation PDF
 */
export async function generateRequestConfirmationPDF(request, options = {}) {
  // Extract user info from request or options
  const requestData = request.data || request.details || {};
  const userInfo = {
    name: options.userName || request.client_name || requestData.name || requestData.contact_name || '',
    email: options.userEmail || request.client_email || requestData.email || requestData.contact_email || '',
    phone: options.userPhone || request.client_phone || requestData.phone || requestData.contact_phone || '',
    paymentPreference: options.paymentPreference || request.payment_preference || requestData.payment_preference || requestData.paymentMethod || ''
  };

  const { doc, pageWidth, pageHeight, margin, addText, addElegantTitle, drawLine, drawRoundedRect, drawHeader, drawFooter, drawUserInfo, drawWhatsNext, drawServiceMessage } = createBasePDF(userInfo);

  // Load logo image
  const logoImage = await loadLogoImage();

  const requestNumber = request.id?.substring(0, 8).toUpperCase() || 'N/A';
  let yPos = drawHeader(requestNumber, 'Request', logoImage);

  // ============ STATUS BADGE ============
  drawRoundedRect(margin, yPos, 85, 8, 2, COLORS.mediumGray);
  doc.setTextColor(COLORS.white);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('REQUEST SUBMITTED', margin + 42.5, yPos + 5.5, { align: 'center' });

  yPos += 15;

  // ============ REQUEST TITLE ============
  const requestType = request.type || request.service_type || 'Service Request';
  const formattedType = requestType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  addText(`${formattedType} Request`, margin, yPos, { fontSize: 16, fontStyle: 'bold', color: COLORS.black });

  yPos += 8;
  addText(`Submitted on ${formatDate(request.created_at)}`, margin, yPos, { fontSize: 9, color: COLORS.gray });

  yPos += 12;
  drawLine(yPos);
  yPos += 10;

  // ============ REQUEST DETAILS ============
  addText('REQUEST DETAILS', margin, yPos, { fontSize: 10, fontStyle: 'bold', color: COLORS.gray });
  yPos += 10;

  // requestData already defined at top of function

  if (requestType.includes('jet') || requestType.includes('helicopter') || requestType.includes('charter')) {
    drawRoundedRect(margin, yPos, pageWidth - (margin * 2), 45, 3, COLORS.almostWhite);
    yPos += 8;

    addText('Route', margin + 8, yPos, { fontSize: 8, color: COLORS.gray });
    yPos += 5;
    const from = requestData.from || requestData.origin || '-';
    const to = requestData.to || requestData.destination || '-';
    addText(`${from} → ${to}`, margin + 8, yPos, { fontSize: 11, fontStyle: 'bold', color: COLORS.black });

    yPos += 10;
    addText('Travel Date', margin + 8, yPos, { fontSize: 8, color: COLORS.gray });
    yPos += 5;
    addText(formatShortDate(requestData.date || requestData.departure_date), margin + 8, yPos, { fontSize: 10, color: COLORS.darkGray });

    yPos += 10;
    addText('Passengers', margin + 8, yPos, { fontSize: 8, color: COLORS.gray });
    yPos += 5;
    addText(`${requestData.passengers || requestData.pax || 1}`, margin + 8, yPos, { fontSize: 10, color: COLORS.darkGray });

    yPos += 15;

  } else if (requestType.includes('ground') || requestType.includes('taxi') || requestType.includes('transfer')) {
    // Ground Transport / Taxi request
    drawRoundedRect(margin, yPos, pageWidth - (margin * 2), 55, 3, COLORS.almostWhite);
    yPos += 8;

    addText('Pickup', margin + 8, yPos, { fontSize: 8, color: COLORS.gray });
    yPos += 5;
    const from = requestData.from || requestData.pickup_location || requestData.from_city || '-';
    addText(from, margin + 8, yPos, { fontSize: 10, fontStyle: 'bold', color: COLORS.black });

    yPos += 10;
    addText('Drop-off', margin + 8, yPos, { fontSize: 8, color: COLORS.gray });
    yPos += 5;
    const to = requestData.to || requestData.dropoff_location || requestData.to_city || '-';
    addText(to, margin + 8, yPos, { fontSize: 10, fontStyle: 'bold', color: COLORS.black });

    yPos += 10;
    addText('Date & Time', margin + 8, yPos, { fontSize: 8, color: COLORS.gray });
    yPos += 5;
    const dateTime = `${formatShortDate(requestData.pickupDate || requestData.date || requestData.departure_date)} ${requestData.pickupTime || requestData.time || ''}`.trim();
    addText(dateTime || '-', margin + 8, yPos, { fontSize: 10, color: COLORS.darkGray });

    yPos += 10;
    addText('Passengers', margin + 8, yPos, { fontSize: 8, color: COLORS.gray });
    yPos += 5;
    addText(`${requestData.passengers || requestData.pax || 1}`, margin + 8, yPos, { fontSize: 10, color: COLORS.darkGray });

    yPos += 15;

  } else if (requestType === 'cart_checkout' || requestType.includes('cart') || requestType === 'ai_chat_bulk') {
    const cartItems = requestData.cart_items || requestData.items || [];

    if (cartItems.length > 0) {
      addText('REQUESTED ITEMS', margin, yPos, { fontSize: 10, fontStyle: 'bold', color: COLORS.gray });
      yPos += 8;

      cartItems.forEach((item, index) => {
        if (yPos > pageHeight - 80) {
          doc.addPage();
          yPos = margin;
        }

        drawRoundedRect(margin, yPos, pageWidth - (margin * 2), 20, 2, index % 2 === 0 ? COLORS.almostWhite : COLORS.white);
        yPos += 7;

        addText(item.name || item.title || 'Item', margin + 5, yPos, { fontSize: 10, fontStyle: 'bold', color: COLORS.black });
        if (item.price || item.basePrice) {
          addText(formatCurrency(item.price || item.basePrice, 'USD'), pageWidth - margin - 5, yPos, { fontSize: 10, color: COLORS.darkGray, align: 'right' });
        }

        yPos += 6;
        addText(item.type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || '', margin + 5, yPos, { fontSize: 8, color: COLORS.gray });

        yPos += 10;
      });
    }

  } else {
    drawRoundedRect(margin, yPos, pageWidth - (margin * 2), 30, 3, COLORS.almostWhite);
    yPos += 8;

    addText('Request Type', margin + 8, yPos, { fontSize: 8, color: COLORS.gray });
    yPos += 5;
    addText(formattedType, margin + 8, yPos, { fontSize: 11, fontStyle: 'bold', color: COLORS.black });

    yPos += 10;
    addText('Status', margin + 8, yPos, { fontSize: 8, color: COLORS.gray });
    yPos += 5;
    addText('Pending Review', margin + 8, yPos, { fontSize: 10, color: COLORS.darkGray });

    yPos += 10;
  }

  // ============ ESTIMATED PRICING ============
  const total = Number(requestData.estimated_total) || Number(requestData.total_amount) || Number(requestData.total) || Number(requestData.total_price) || Number(requestData.price) || 0;
  const hasValidTotal = !isNaN(total) && total > 0;

  yPos += 5;
  drawLine(yPos);
  yPos += 10;

  addText('PRICING', margin, yPos, { fontSize: 10, fontStyle: 'bold', color: COLORS.gray });
  yPos += 10;

  if (hasValidTotal) {
    addText('Estimated Total', margin, yPos, { fontSize: 10, color: COLORS.darkGray });
    addText(formatCurrency(total, 'USD'), pageWidth - margin, yPos, { fontSize: 12, fontStyle: 'bold', color: COLORS.black, align: 'right' });
    yPos += 6;
    addText('Final pricing confirmed by our team within 2-4 hours', margin, yPos, { fontSize: 8, color: COLORS.lightGray });
  } else {
    addText('Quote Pending', margin, yPos, { fontSize: 12, fontStyle: 'bold', color: COLORS.mediumGray });
    yPos += 6;
    addText('Our team will provide pricing within 2-4 hours', margin, yPos, { fontSize: 8, color: COLORS.lightGray });
  }

  // ============ CLIENT INFORMATION ============
  yPos += 10;
  yPos = drawUserInfo(yPos);

  // ============ THANK YOU & SERVICE MESSAGE ============
  yPos = drawServiceMessage(yPos, requestType);

  // ============ NEXT STEPS ============
  yPos = drawWhatsNext(yPos);

  // Draw footer (separate from What's Next)
  drawFooter();

  const filename = `PrivateCharterX_Request_${requestNumber}_${Date.now()}.pdf`;
  const blob = doc.output('blob');
  const base64 = doc.output('datauristring').split(',')[1];

  return { blob, base64, filename, doc };
}

/**
 * Generate a subscription confirmation PDF
 */
export async function generateSubscriptionConfirmationPDF(subscription, options = {}) {
  // Extract user info from subscription or options
  const userInfo = {
    name: options.userName || subscription.user_name || subscription.name || '',
    email: options.userEmail || subscription.user_email || subscription.email || '',
    phone: options.userPhone || subscription.user_phone || subscription.phone || ''
  };

  const { doc, pageWidth, pageHeight, margin, addText, drawLine, drawRoundedRect, drawHeader, drawFooter } = createBasePDF(userInfo);

  // Load logo image
  const logoImage = await loadLogoImage();

  const subscriptionId = subscription.id?.substring(0, 8).toUpperCase() || 'N/A';
  let yPos = drawHeader(subscriptionId, 'Subscription', logoImage);

  // ============ STATUS BADGE ============
  const isActive = subscription.status === 'active' || subscription.status === 'paid';
  drawRoundedRect(margin, yPos, 90, 8, 2, isActive ? COLORS.black : COLORS.mediumGray);
  doc.setTextColor(COLORS.white);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(isActive ? 'SUBSCRIPTION ACTIVE' : 'SUBSCRIPTION PENDING', margin + 45, yPos + 5.5, { align: 'center' });

  yPos += 15;

  // ============ SUBSCRIPTION TITLE ============
  const tierName = subscription.tier_name || subscription.tier || subscription.plan_name || 'Premium';
  addText(`${tierName} Membership`, margin, yPos, { fontSize: 18, fontStyle: 'bold', color: COLORS.black });

  yPos += 8;
  addText(`Activated on ${formatDate(subscription.created_at || subscription.start_date)}`, margin, yPos, { fontSize: 9, color: COLORS.gray });

  yPos += 15;
  drawLine(yPos);
  yPos += 10;

  // ============ SUBSCRIPTION DETAILS ============
  addText('MEMBERSHIP DETAILS', margin, yPos, { fontSize: 10, fontStyle: 'bold', color: COLORS.gray });
  yPos += 10;

  drawRoundedRect(margin, yPos, pageWidth - (margin * 2), 55, 3, COLORS.almostWhite);
  yPos += 10;

  const col1X = margin + 10;
  const col2X = pageWidth / 2 + 10;

  addText('Plan', col1X, yPos, { fontSize: 8, color: COLORS.gray });
  yPos += 5;
  addText(tierName, col1X, yPos, { fontSize: 12, fontStyle: 'bold', color: COLORS.black });

  yPos += 12;
  addText('Billing Period', col1X, yPos, { fontSize: 8, color: COLORS.gray });
  yPos += 5;
  const period = subscription.billing_period || subscription.period || 'Annual';
  addText(period.charAt(0).toUpperCase() + period.slice(1), col1X, yPos, { fontSize: 10, color: COLORS.darkGray });

  // Right column
  yPos -= 24;
  addText('Valid Until', col2X, yPos, { fontSize: 8, color: COLORS.gray });
  yPos += 5;
  const endDate = subscription.end_date || subscription.expires_at || subscription.valid_until;
  addText(endDate ? formatShortDate(endDate) : 'Ongoing', col2X, yPos, { fontSize: 12, fontStyle: 'bold', color: COLORS.black });

  yPos += 12;
  addText('Member Since', col2X, yPos, { fontSize: 8, color: COLORS.gray });
  yPos += 5;
  addText(formatShortDate(subscription.created_at || subscription.start_date), col2X, yPos, { fontSize: 10, color: COLORS.darkGray });

  yPos += 20;

  // ============ PAYMENT DETAILS ============
  yPos += 5;
  drawLine(yPos);
  yPos += 10;

  addText('PAYMENT DETAILS', margin, yPos, { fontSize: 10, fontStyle: 'bold', color: COLORS.gray });
  yPos += 10;

  const amount = subscription.amount || subscription.price || subscription.total_amount || 0;
  const priceRowX = pageWidth - margin - 5;

  addText('Subscription Fee', margin, yPos, { fontSize: 10, color: COLORS.darkGray });
  addText(formatCurrency(amount, subscription.currency || 'USD'), priceRowX, yPos, { fontSize: 10, color: COLORS.darkGray, align: 'right' });

  if (subscription.vat_amount || subscription.tax) {
    yPos += 7;
    addText('VAT (8.1%)', margin, yPos, { fontSize: 10, color: COLORS.gray });
    addText(formatCurrency(subscription.vat_amount || subscription.tax, subscription.currency || 'USD'), priceRowX, yPos, { fontSize: 10, color: COLORS.gray, align: 'right' });
  }

  yPos += 8;
  drawLine(yPos);
  yPos += 8;

  const totalPaid = subscription.total_paid || subscription.total_amount || amount;
  addText('TOTAL PAID', margin, yPos, { fontSize: 12, fontStyle: 'bold', color: COLORS.black });
  addText(formatCurrency(totalPaid, subscription.currency || 'USD'), priceRowX, yPos, { fontSize: 14, fontStyle: 'bold', color: COLORS.black, align: 'right' });

  // Payment method
  yPos += 10;
  const paymentMethod = subscription.payment_method || 'crypto';
  const cryptoCurrency = subscription.crypto_currency || '';

  addText('Payment Method:', margin, yPos, { fontSize: 9, color: COLORS.gray });
  if (paymentMethod === 'crypto' || paymentMethod === 'cryptocurrency') {
    const cryptoText = cryptoCurrency ? `Cryptocurrency (${cryptoCurrency.toUpperCase()})` : 'Cryptocurrency';
    addText(cryptoText, margin + 35, yPos, { fontSize: 9, fontStyle: 'bold', color: COLORS.darkGray });
  } else if (paymentMethod === 'card' || paymentMethod === 'stripe') {
    addText('Credit/Debit Card', margin + 35, yPos, { fontSize: 9, fontStyle: 'bold', color: COLORS.darkGray });
  } else {
    addText(paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1), margin + 35, yPos, { fontSize: 9, fontStyle: 'bold', color: COLORS.darkGray });
  }

  // Transaction reference
  if (subscription.transaction_id || subscription.payment_id || subscription.coingate_order_id) {
    yPos += 6;
    addText('Transaction ID:', margin, yPos, { fontSize: 8, color: COLORS.gray });
    const txId = subscription.transaction_id || subscription.payment_id || subscription.coingate_order_id;
    addText(txId.substring(0, 24) + (txId.length > 24 ? '...' : ''), margin + 30, yPos, { fontSize: 8, color: COLORS.lightGray });
  }

  // ============ MEMBER BENEFITS ============
  yPos += 15;
  drawLine(yPos);
  yPos += 10;

  addText('YOUR MEMBERSHIP BENEFITS', margin, yPos, { fontSize: 10, fontStyle: 'bold', color: COLORS.gray });
  yPos += 10;

  const benefits = subscription.benefits || [
    'Priority booking for all services',
    'Dedicated concierge support',
    'Exclusive member pricing',
    'Early access to new features',
    'Complimentary upgrades when available'
  ];

  benefits.forEach(benefit => {
    addText(`• ${benefit}`, margin, yPos, { fontSize: 9, color: COLORS.darkGray });
    yPos += 6;
  });

  // ============ ACCOUNT HOLDER ============
  yPos += 10;
  drawLine(yPos);
  yPos += 10;

  addText('ACCOUNT HOLDER', margin, yPos, { fontSize: 10, fontStyle: 'bold', color: COLORS.gray });
  yPos += 8;

  addText('Name', margin, yPos, { fontSize: 8, color: COLORS.gray });
  addText(subscription.user_name || subscription.name || '-', margin + 25, yPos, { fontSize: 10, color: COLORS.darkGray });

  yPos += 7;
  addText('Email', margin, yPos, { fontSize: 8, color: COLORS.gray });
  addText(subscription.user_email || subscription.email || '-', margin + 25, yPos, { fontSize: 10, color: COLORS.darkGray });

  // Draw footer
  drawFooter();

  const filename = `PrivateCharterX_Subscription_${subscriptionId}_${Date.now()}.pdf`;
  const blob = doc.output('blob');
  const base64 = doc.output('datauristring').split(',')[1];

  return { blob, base64, filename, doc };
}

/**
 * Save PDF to Supabase storage
 */
export async function savePDFToStorage(blob, filename, recordType, recordId) {
  try {
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(`confirmations/${recordType}s/${filename}`, blob, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading PDF:', uploadError);
      throw uploadError;
    }

    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(`confirmations/${recordType}s/${filename}`);

    const publicUrl = urlData?.publicUrl;

    // Update the record with PDF URL
    const tableName = recordType === 'booking' ? 'user_bookings' :
                      recordType === 'request' ? 'user_requests' :
                      recordType === 'subscription' ? 'user_subscriptions' : null;

    if (tableName) {
      await supabase
        .from(tableName)
        .update({ confirmation_pdf_url: publicUrl })
        .eq('id', recordId);
    }

    return publicUrl;
  } catch (error) {
    console.error('Error saving PDF to storage:', error);
    throw error;
  }
}

/**
 * Download PDF in browser
 */
export function downloadPDF(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Create and save booking confirmation
 */
export async function createBookingConfirmation(booking) {
  const { blob, base64, filename } = await generateBookingConfirmationPDF(booking);
  const url = await savePDFToStorage(blob, filename, 'booking', booking.id);
  return { blob, url, filename, base64 };
}

/**
 * Create and save request confirmation
 */
export async function createRequestConfirmation(request) {
  const { blob, base64, filename } = await generateRequestConfirmationPDF(request);
  const url = await savePDFToStorage(blob, filename, 'request', request.id);
  return { blob, url, filename, base64 };
}

/**
 * Create and save subscription confirmation
 */
export async function createSubscriptionConfirmation(subscription) {
  const { blob, base64, filename } = await generateSubscriptionConfirmationPDF(subscription);
  const url = await savePDFToStorage(blob, filename, 'subscription', subscription.id);
  return { blob, url, filename, base64 };
}

export default {
  generateBookingConfirmationPDF,
  generateRequestConfirmationPDF,
  generateSubscriptionConfirmationPDF,
  savePDFToStorage,
  createBookingConfirmation,
  createRequestConfirmation,
  createSubscriptionConfirmation,
  downloadPDF
};
