/**
 * PDF Generator Service for PrivateCharterX
 * Clean, Professional Invoice Design
 */

import jsPDF from 'jspdf';
import { supabase } from '../lib/supabase';

// Company Information
const COMPANY = {
  name: 'PrivateCharterX LLC',
  fullAddress: '1000 Brickell Ave, Ste 715, Miami FL 33131',
  email: 'bookings@privatecharterx.com',
  // Icon logo (small square logo)
  logoUrl: 'https://oubecmstqtzdnevyqavu.supabase.co/storage/v1/object/public/logos/pvcx-icon-black.png'
};

// Colors
const COLORS = {
  black: '#000000',
  darkGray: '#333333',
  gray: '#666666',
  lightGray: '#999999',
  veryLightGray: '#f5f5f5',
  lineGray: '#e0e0e0',
  white: '#ffffff'
};

// Cache for logo
let logoImageCache = null;

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
    console.error('Error loading logo:', error);
    return null;
  }
}

// Format currency
const formatCurrency = (amount, currency = 'USD') => {
  if (!amount && amount !== 0) return '-';
  const symbols = { USD: '$', EUR: '€', CHF: 'CHF ', GBP: '£', THB: '฿' };
  const symbol = symbols[currency] || currency + ' ';
  return symbol + Number(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Helper to draw light gray background box
const drawGrayBox = (doc, x, y, width, height) => {
  doc.setFillColor(245, 245, 245); // Light gray
  doc.roundedRect(x, y, width, height, 2, 2, 'F');
};

/**
 * Generate Request Confirmation PDF
 */
export async function generateRequestConfirmationPDF(request, options = {}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  const rightCol = pageWidth - margin;

  const logoImage = await loadLogoImage();
  const requestData = request.data || request.details || {};
  const requestNumber = request.id?.substring(0, 8).toUpperCase() || 'REQ-001';
  const requestType = request.type || request.service_type || 'Service Request';
  const userId = request.user_id?.substring(0, 8).toUpperCase() || options.userId?.substring(0, 8).toUpperCase() || '-';

  let y = margin;

  // ========== HEADER ==========
  // Logo icon (left) - small square
  if (logoImage) {
    try {
      doc.addImage(logoImage, 'PNG', margin, y, 14, 14);
    } catch (e) {
      // Fallback if logo fails
    }
  }

  // REQUEST label (right side)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray);
  doc.text('REQUEST', rightCol, y + 4, { align: 'right' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.black);
  doc.text(`#${requestNumber}`, rightCol, y + 10, { align: 'right' });

  y += 22;

  // Separator line
  doc.setDrawColor(COLORS.lineGray);
  doc.setLineWidth(0.3);
  doc.line(margin, y, rightCol, y);

  y += 8;

  // ========== CLIENT & REQUEST INFO ==========
  const clientName = request.client_name || requestData.name || options.userName || 'Client';
  const clientEmail = request.client_email || requestData.email || options.userEmail || '';
  const currency = requestData.currency || 'USD';

  // Left column: Request info
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.lightGray);
  doc.text('Date', margin, y);
  doc.text('User ID', margin, y + 5);
  doc.text('Status', margin, y + 10);
  doc.text('Currency', margin, y + 15);

  doc.setFontSize(9);
  doc.setTextColor(COLORS.darkGray);
  doc.text(formatDate(request.created_at || new Date()), margin + 22, y);
  doc.text(userId, margin + 22, y + 5);
  doc.text('Pending Review', margin + 22, y + 10);
  doc.text(currency, margin + 22, y + 15);

  // Right column: Client info
  doc.setFontSize(8);
  doc.setTextColor(COLORS.lightGray);
  doc.text('Client', rightCol, y, { align: 'right' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.black);
  doc.text(clientName, rightCol, y + 5, { align: 'right' });

  if (clientEmail) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.gray);
    doc.text(clientEmail, rightCol, y + 10, { align: 'right' });
  }

  y += 25;

  // ========== SERVICE DETAILS (Gray Box) ==========
  const serviceBoxHeight = 55;
  drawGrayBox(doc, margin, y, contentWidth, serviceBoxHeight);

  y += 6;
  const boxPadding = 5;
  const boxLeft = margin + boxPadding;
  const boxRight = rightCol - boxPadding;

  // Service type header
  const formattedType = requestType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.black);

  if (requestType.includes('ground') || requestType.includes('taxi') || requestType.includes('transfer')) {
    doc.text('Ground Transport', boxLeft, y);

    // Vehicle info
    const vehicleName = requestData.carName || requestData.vehicleName || 'Business Class';
    const vehicleClass = requestData.vehicleClass || 'Business';
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.gray);
    doc.text(`${vehicleName} (${vehicleClass})`, boxLeft, y + 5);

    // Route
    y += 12;
    const from = requestData.from || '-';
    const to = requestData.to || '-';

    doc.setFontSize(8);
    doc.setTextColor(COLORS.lightGray);
    doc.text('From:', boxLeft, y);
    doc.setFontSize(9);
    doc.setTextColor(COLORS.darkGray);
    const fromLines = doc.splitTextToSize(from, 75);
    doc.text(fromLines, boxLeft + 12, y);
    y += fromLines.length * 4 + 2;

    doc.setFontSize(8);
    doc.setTextColor(COLORS.lightGray);
    doc.text('To:', boxLeft, y);
    doc.setFontSize(9);
    doc.setTextColor(COLORS.darkGray);
    const toLines = doc.splitTextToSize(to, 75);
    doc.text(toLines, boxLeft + 12, y);
    y += toLines.length * 4 + 3;

    // Date/Time and Details
    doc.setFontSize(8);
    doc.setTextColor(COLORS.lightGray);
    doc.text('Pickup:', boxLeft, y);
    doc.setFontSize(9);
    doc.setTextColor(COLORS.darkGray);
    doc.text(`${requestData.pickupDate || '-'} at ${requestData.pickupTime || '-'}`, boxLeft + 15, y);

    doc.setTextColor(COLORS.lightGray);
    doc.setFontSize(8);
    doc.text('Passengers:', boxLeft + 70, y);
    doc.setFontSize(9);
    doc.setTextColor(COLORS.darkGray);
    doc.text(`${requestData.passengers || 1}`, boxLeft + 92, y);

    if (requestData.distance) {
      doc.setTextColor(COLORS.lightGray);
      doc.setFontSize(8);
      doc.text('Distance:', boxLeft + 105, y);
      doc.setFontSize(9);
      doc.setTextColor(COLORS.darkGray);
      doc.text(`${requestData.distance} km`, boxLeft + 122, y);
    }

  } else if (requestType.includes('jet') || requestType.includes('helicopter') || requestType.includes('charter') || requestType.includes('empty')) {
    doc.text(formattedType, boxLeft, y);

    const aircraft = requestData.aircraft || requestData.aircraft_type || 'Private Jet';
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.gray);
    doc.text(aircraft, boxLeft, y + 5);

    y += 12;
    const from = requestData.from || requestData.origin || '-';
    const to = requestData.to || requestData.destination || '-';

    doc.setFontSize(8);
    doc.setTextColor(COLORS.lightGray);
    doc.text('Route:', boxLeft, y);
    doc.setFontSize(9);
    doc.setTextColor(COLORS.darkGray);
    doc.text(`${from} → ${to}`, boxLeft + 15, y);

    y += 5;
    doc.setFontSize(8);
    doc.setTextColor(COLORS.lightGray);
    doc.text('Date:', boxLeft, y);
    doc.setFontSize(9);
    doc.setTextColor(COLORS.darkGray);
    doc.text(formatDate(requestData.date || requestData.departure_date), boxLeft + 15, y);

    doc.setTextColor(COLORS.lightGray);
    doc.setFontSize(8);
    doc.text('Passengers:', boxLeft + 50, y);
    doc.setFontSize(9);
    doc.setTextColor(COLORS.darkGray);
    doc.text(`${requestData.passengers || 1}`, boxLeft + 72, y);

  } else {
    doc.text(formattedType, boxLeft, y);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.gray);
    doc.text('Service Request', boxLeft, y + 5);
  }

  // Move past the gray box
  y = margin + 22 + 8 + 25 + serviceBoxHeight + 10;

  // ========== PRICING SECTION ==========
  doc.setDrawColor(COLORS.lineGray);
  doc.line(margin, y, rightCol, y);
  y += 8;

  const priceColLabel = rightCol - 55;
  const priceColValue = rightCol;

  // Get prices
  const basePrice = Number(requestData.priceMin) || Number(requestData.basePrice) || Number(requestData.price) || 0;
  const maxPrice = Number(requestData.priceMax) || Number(requestData.total) || basePrice;
  const vatRate = 0.081;
  const vatAmount = Math.round(basePrice * vatRate);

  // Base Price
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray);
  doc.text('Base Price', priceColLabel, y, { align: 'right' });
  doc.setTextColor(COLORS.darkGray);
  doc.text(basePrice > 0 ? formatCurrency(basePrice, currency) : 'Quote Pending', priceColValue, y, { align: 'right' });

  y += 5;

  // VAT
  doc.setTextColor(COLORS.gray);
  doc.text('VAT (8.1%)', priceColLabel, y, { align: 'right' });
  doc.setTextColor(COLORS.darkGray);
  doc.text(basePrice > 0 ? formatCurrency(vatAmount, currency) : '-', priceColValue, y, { align: 'right' });

  y += 7;
  doc.line(priceColLabel - 15, y, rightCol, y);
  y += 6;

  // Total / Max Price
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.black);
  doc.text('TOTAL (Max)', priceColLabel, y, { align: 'right' });
  doc.setFontSize(11);
  doc.text(maxPrice > 0 ? formatCurrency(maxPrice, currency) : 'Quote Pending', priceColValue, y, { align: 'right' });

  // ========== THANK YOU MESSAGE ==========
  y = pageHeight - 50;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.darkGray);
  doc.text(`Dear ${clientName.split(' ')[0]}, thank you for your request.`, margin, y);
  y += 4;
  doc.setTextColor(COLORS.lightGray);
  doc.text('Our team will review and contact you within 2-4 hours.', margin, y);

  // ========== FOOTER ==========
  y = pageHeight - 12;
  doc.setDrawColor(COLORS.lineGray);
  doc.line(margin, y - 5, rightCol, y - 5);

  doc.setFontSize(7);
  doc.setTextColor(COLORS.lightGray);
  doc.text(`${COMPANY.name}  •  ${COMPANY.fullAddress}  •  ${COMPANY.email}`, pageWidth / 2, y, { align: 'center' });

  const filename = `PrivateCharterX_Request_${requestNumber}_${Date.now()}.pdf`;
  const blob = doc.output('blob');
  const base64 = doc.output('datauristring').split(',')[1];

  return { blob, base64, filename, doc };
}

/**
 * Generate Booking Confirmation PDF (Invoice)
 */
export async function generateBookingConfirmationPDF(booking, options = {}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  const rightCol = pageWidth - margin;

  const logoImage = await loadLogoImage();
  const bookingNumber = booking.id?.substring(0, 8).toUpperCase() || 'INV-001';
  const serviceDetails = booking.service_details || {};
  const userId = booking.user_id?.substring(0, 8).toUpperCase() || options.userId?.substring(0, 8).toUpperCase() || '-';

  let y = margin;

  // ========== HEADER ==========
  if (logoImage) {
    try {
      doc.addImage(logoImage, 'PNG', margin, y, 14, 14);
    } catch (e) {}
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray);
  doc.text('INVOICE', rightCol, y + 4, { align: 'right' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.black);
  doc.text(`#${bookingNumber}`, rightCol, y + 10, { align: 'right' });

  y += 22;
  doc.setDrawColor(COLORS.lineGray);
  doc.line(margin, y, rightCol, y);
  y += 8;

  // ========== INFO COLUMNS ==========
  const clientName = booking.contact_name || options.userName || 'Client';
  const currency = booking.currency || 'USD';

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.lightGray);
  doc.text('Date', margin, y);
  doc.text('User ID', margin, y + 5);
  doc.text('Status', margin, y + 10);
  doc.text('Currency', margin, y + 15);

  doc.setFontSize(9);
  doc.setTextColor(COLORS.darkGray);
  doc.text(formatDate(booking.created_at || new Date()), margin + 22, y);
  doc.text(userId, margin + 22, y + 5);
  const status = booking.payment_status || booking.status || 'confirmed';
  doc.text(status.charAt(0).toUpperCase() + status.slice(1), margin + 22, y + 10);
  doc.text(currency, margin + 22, y + 15);

  doc.setFontSize(8);
  doc.setTextColor(COLORS.lightGray);
  doc.text('Client', rightCol, y, { align: 'right' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.black);
  doc.text(clientName, rightCol, y + 5, { align: 'right' });

  if (booking.contact_email) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.gray);
    doc.text(booking.contact_email, rightCol, y + 10, { align: 'right' });
  }

  y += 25;

  // ========== SERVICE DETAILS (Gray Box) ==========
  const serviceBoxHeight = 35;
  drawGrayBox(doc, margin, y, contentWidth, serviceBoxHeight);

  y += 6;
  const boxPadding = 5;
  const boxLeft = margin + boxPadding;

  const serviceTitle = booking.service_title || booking.service_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Service';
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.black);
  doc.text(serviceTitle, boxLeft, y);

  // Build route from available fields - prefer named locations over IATA codes
  const fromLocation = booking.departure_location || booking.origin || serviceDetails.from || '';
  const toLocation = booking.arrival_location || booking.destination || serviceDetails.to || '';
  // Clean up any strange characters from location strings
  const cleanLocation = (loc) => loc ? loc.replace(/[!']/g, '').trim() : '';
  const route = `${cleanLocation(fromLocation)} → ${cleanLocation(toLocation)}`.trim();
  if (route && route !== ' → ') {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.gray);
    doc.text(route, boxLeft, y + 5);
  }

  y += 12;
  if (booking.departure_date) {
    doc.setFontSize(8);
    doc.setTextColor(COLORS.lightGray);
    doc.text('Date:', boxLeft, y);
    doc.setFontSize(9);
    doc.setTextColor(COLORS.darkGray);
    doc.text(formatDate(booking.departure_date), boxLeft + 12, y);
  }

  doc.setFontSize(8);
  doc.setTextColor(COLORS.lightGray);
  doc.text('Passengers:', boxLeft + 50, y);
  doc.setFontSize(9);
  doc.setTextColor(COLORS.darkGray);
  doc.text(`${booking.passengers || 1}`, boxLeft + 72, y);

  // Move past the gray box
  y = margin + 22 + 8 + 25 + serviceBoxHeight + 10;

  // ========== PRICING ==========
  doc.setDrawColor(COLORS.lineGray);
  doc.line(margin, y, rightCol, y);
  y += 8;

  const priceColLabel = rightCol - 55;
  const priceColValue = rightCol;

  const basePrice = booking.base_price || booking.total_amount || 0;
  const vatAmount = booking.processing_fee || booking.vat_amount || Math.round(basePrice * 0.081);
  const totalAmount = booking.total_amount || basePrice;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray);
  doc.text('Subtotal', priceColLabel, y, { align: 'right' });
  doc.setTextColor(COLORS.darkGray);
  doc.text(formatCurrency(basePrice - vatAmount, currency), priceColValue, y, { align: 'right' });

  y += 5;
  doc.setTextColor(COLORS.gray);
  doc.text('VAT (8.1%)', priceColLabel, y, { align: 'right' });
  doc.setTextColor(COLORS.darkGray);
  doc.text(formatCurrency(vatAmount, currency), priceColValue, y, { align: 'right' });

  y += 7;
  doc.line(priceColLabel - 15, y, rightCol, y);
  y += 6;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.black);
  doc.text('TOTAL PAID', priceColLabel, y, { align: 'right' });
  doc.setFontSize(11);
  doc.text(formatCurrency(totalAmount, currency), priceColValue, y, { align: 'right' });

  // ========== THANK YOU ==========
  y = pageHeight - 50;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.darkGray);
  doc.text(`Dear ${clientName.split(' ')[0]}, thank you for your booking.`, margin, y);
  y += 4;
  doc.setTextColor(COLORS.lightGray);
  doc.text('Your booking is confirmed. Travel documents will be sent separately.', margin, y);

  // ========== FOOTER ==========
  y = pageHeight - 12;
  doc.setDrawColor(COLORS.lineGray);
  doc.line(margin, y - 5, rightCol, y - 5);

  doc.setFontSize(7);
  doc.setTextColor(COLORS.lightGray);
  doc.text(`${COMPANY.name}  •  ${COMPANY.fullAddress}  •  ${COMPANY.email}`, pageWidth / 2, y, { align: 'center' });

  const filename = `PrivateCharterX_Invoice_${bookingNumber}_${Date.now()}.pdf`;
  const blob = doc.output('blob');
  const base64 = doc.output('datauristring').split(',')[1];

  return { blob, base64, filename, doc };
}

/**
 * Generate Subscription Confirmation PDF
 */
export async function generateSubscriptionConfirmationPDF(subscription, options = {}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  const rightCol = pageWidth - margin;

  const logoImage = await loadLogoImage();
  const subscriptionId = subscription.id?.substring(0, 8).toUpperCase() || 'SUB-001';
  const userId = subscription.user_id?.substring(0, 8).toUpperCase() || options.userId?.substring(0, 8).toUpperCase() || '-';

  let y = margin;

  // Header
  if (logoImage) {
    try {
      doc.addImage(logoImage, 'PNG', margin, y, 14, 14);
    } catch (e) {}
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray);
  doc.text('SUBSCRIPTION', rightCol, y + 4, { align: 'right' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.black);
  doc.text(`#${subscriptionId}`, rightCol, y + 10, { align: 'right' });

  y += 22;
  doc.setDrawColor(COLORS.lineGray);
  doc.line(margin, y, rightCol, y);
  y += 8;

  // Info
  const memberName = subscription.user_name || subscription.name || 'Member';
  const currency = subscription.currency || 'USD';

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.lightGray);
  doc.text('Start Date', margin, y);
  doc.text('User ID', margin, y + 5);
  doc.text('Status', margin, y + 10);

  doc.setFontSize(9);
  doc.setTextColor(COLORS.darkGray);
  doc.text(formatDate(subscription.created_at || subscription.start_date), margin + 22, y);
  doc.text(userId, margin + 22, y + 5);
  const isActive = subscription.status === 'active' || subscription.status === 'paid';
  doc.text(isActive ? 'Active' : 'Pending', margin + 22, y + 10);

  doc.setFontSize(8);
  doc.setTextColor(COLORS.lightGray);
  doc.text('Member', rightCol, y, { align: 'right' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.black);
  doc.text(memberName, rightCol, y + 5, { align: 'right' });

  if (subscription.user_email || subscription.email) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.gray);
    doc.text(subscription.user_email || subscription.email, rightCol, y + 10, { align: 'right' });
  }

  y += 22;

  // Service Box
  const serviceBoxHeight = 25;
  drawGrayBox(doc, margin, y, contentWidth, serviceBoxHeight);

  y += 6;
  const boxLeft = margin + 5;

  const tierName = subscription.tier_name || subscription.tier || subscription.plan_name || 'Premium';
  const period = subscription.billing_period || subscription.period || 'Annual';

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.black);
  doc.text(`${tierName} Membership`, boxLeft, y);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray);
  doc.text(`${period} billing`, boxLeft, y + 5);

  // Move past box
  y = margin + 22 + 8 + 22 + serviceBoxHeight + 10;

  // Pricing
  doc.setDrawColor(COLORS.lineGray);
  doc.line(margin, y, rightCol, y);
  y += 8;

  const priceColLabel = rightCol - 55;
  const priceColValue = rightCol;
  const amount = subscription.amount || subscription.price || 0;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.gray);
  doc.text('Subtotal', priceColLabel, y, { align: 'right' });
  doc.setTextColor(COLORS.darkGray);
  doc.text(formatCurrency(amount, currency), priceColValue, y, { align: 'right' });

  y += 5;
  doc.setTextColor(COLORS.gray);
  doc.text('VAT (8.1%)', priceColLabel, y, { align: 'right' });
  doc.setTextColor(COLORS.darkGray);
  doc.text(formatCurrency(Math.round(amount * 0.081), currency), priceColValue, y, { align: 'right' });

  y += 7;
  doc.line(priceColLabel - 15, y, rightCol, y);
  y += 6;

  const totalPaid = subscription.total_paid || subscription.total_amount || amount;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.black);
  doc.text('TOTAL', priceColLabel, y, { align: 'right' });
  doc.setFontSize(11);
  doc.text(formatCurrency(totalPaid, currency), priceColValue, y, { align: 'right' });

  // Thank you
  y = pageHeight - 50;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.darkGray);
  doc.text(`Dear ${memberName.split(' ')[0]}, welcome to PrivateCharterX.`, margin, y);
  y += 4;
  doc.setTextColor(COLORS.lightGray);
  doc.text('Your membership benefits are now active.', margin, y);

  // Footer
  y = pageHeight - 12;
  doc.setDrawColor(COLORS.lineGray);
  doc.line(margin, y - 5, rightCol, y - 5);

  doc.setFontSize(7);
  doc.setTextColor(COLORS.lightGray);
  doc.text(`${COMPANY.name}  •  ${COMPANY.fullAddress}  •  ${COMPANY.email}`, pageWidth / 2, y, { align: 'center' });

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

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(`confirmations/${recordType}s/${filename}`);

    const publicUrl = urlData?.publicUrl;

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
    console.error('Error saving PDF:', error);
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

export async function createBookingConfirmation(booking) {
  const { blob, base64, filename } = await generateBookingConfirmationPDF(booking);
  const url = await savePDFToStorage(blob, filename, 'booking', booking.id);
  return { blob, url, filename, base64 };
}

export async function createRequestConfirmation(request) {
  const { blob, base64, filename } = await generateRequestConfirmationPDF(request);
  const url = await savePDFToStorage(blob, filename, 'request', request.id);
  return { blob, url, filename, base64 };
}

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
