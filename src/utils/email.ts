import { logger } from './logger';
import { supabase } from '../lib/supabase';

interface EmailOptions {
  to: string;
  subject: string;
  body: string;
}

export async function sendEmail(options: EmailOptions) {
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        to: options.to,
        subject: options.subject,
        html: options.body
      }
    });

    if (error) throw error;
    
    logger.info('Email sent successfully', {
      to: options.to,
      subject: options.subject,
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    logger.error('Failed to send email:', error);
    throw new Error('Failed to send email. Please try again.');
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  const subject = 'Welcome to PrivateCharterX';
  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #000; padding: 20px; text-align: center;">
        <h1 style="color: #fff; margin: 0;">PrivateCharterX</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #eee; border-top: none;">
        <h2>Welcome to PrivateCharterX, ${name}!</h2>
        <p>Thank you for joining PrivateCharterX. We're excited to have you on board.</p>
        <p>With your new account, you can:</p>
        <ul>
          <li>Book private jet charters worldwide</li>
          <li>Access exclusive empty leg flights</li>
          <li>Earn rewards with our referral program</li>
          <li>Manage your bookings and preferences</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.VITE_APP_URL}/dashboard" 
             style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Visit Your Dashboard
          </a>
        </div>
        <p>If you have any questions or need assistance, please don't hesitate to contact our support team at <a href="mailto:info@privatecharterx.com">info@privatecharterx.com</a>.</p>
      </div>
      <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        <p>&copy; ${new Date().getFullYear()} PrivateCharterX. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, body });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.VITE_APP_URL}/reset-password?token=${token}`;
  const subject = 'Reset Your Password';
  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #000; padding: 20px; text-align: center;">
        <h1 style="color: #fff; margin: 0;">PrivateCharterX</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #eee; border-top: none;">
        <h2>Reset Your Password</h2>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p>If you did not request a password reset, you can safely ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
        <p>If the button doesn't work, copy and paste this URL into your browser:</p>
        <p style="word-break: break-all;">${resetUrl}</p>
      </div>
      <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        <p>&copy; ${new Date().getFullYear()} PrivateCharterX. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, body });
}

export async function sendBookingConfirmationEmail(email: string, bookingDetails: any) {
  const subject = 'Booking Confirmation';
  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #000; padding: 20px; text-align: center;">
        <h1 style="color: #fff; margin: 0;">PrivateCharterX</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #eee; border-top: none;">
        <h2>Booking Confirmation</h2>
        <p>Thank you for your booking with PrivateCharterX. Here are your booking details:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p><strong>Flight:</strong> ${bookingDetails.origin} → ${bookingDetails.destination}</p>
          <p><strong>Date:</strong> ${new Date(bookingDetails.departure_date).toLocaleDateString()}</p>
          <p><strong>Aircraft:</strong> ${bookingDetails.aircraft_type}</p>
          <p><strong>Passengers:</strong> ${bookingDetails.passengers}</p>
          <p><strong>Status:</strong> ${bookingDetails.status}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.VITE_APP_URL}/dashboard"
             style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            View Booking Details
          </a>
        </div>
        <p>If you have any questions or need to make changes to your booking, please contact our support team at <a href="mailto:info@privatecharterx.com">info@privatecharterx.com</a>.</p>
      </div>
      <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        <p>&copy; ${new Date().getFullYear()} PrivateCharterX. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, body });
}

// Send request notification email (for all service requests)
export async function sendRequestNotificationEmail(type: string, email: string, requestData: any) {
  let subject = '';
  let body = '';

  switch (type) {
    case 'taxi_concierge':
      subject = 'Taxi/Concierge Request Received';
      body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #000; padding: 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0;">PrivateCharterX</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #eee; border-top: none;">
            <h2>🚗 Taxi/Concierge Request Received</h2>
            <p>Thank you for your request. We have received your taxi/concierge booking request with the following details:</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              ${requestData.carImage ? `<div style="text-align: center; margin-bottom: 15px;"><img src="${requestData.carImage}" alt="${requestData.carName}" style="max-width: 200px; height: auto;"/></div>` : ''}
              <p><strong>Vehicle:</strong> ${requestData.carName || 'Not specified'}</p>
              <p><strong>Route:</strong> ${requestData.from} → ${requestData.to}</p>
              <p><strong>Distance:</strong> ${requestData.distance || 'TBD'}</p>
              <p><strong>Pickup Time:</strong> ${requestData.pickupDate === 'Now' ? 'Immediate' : `${requestData.pickupDate} at ${requestData.pickupTime}`}</p>
              <p><strong>Passengers:</strong> ${requestData.passengers || 1}</p>
              <p><strong>Estimated Price:</strong> ${requestData.priceRange || 'TBD'}</p>
              <p><strong>Status:</strong> <span style="color: #f59e0b; font-weight: bold;">Pending Confirmation</span></p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.VITE_APP_URL}/dashboard"
                 style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                View Request Status
              </a>
            </div>
            <p>Our team will review your request and confirm availability within 24 hours. You will receive a confirmation email once your booking is confirmed.</p>
            <p>If you have any questions, please contact us at <a href="mailto:info@privatecharterx.com">info@privatecharterx.com</a>.</p>
          </div>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
            <p>&copy; ${new Date().getFullYear()} PrivateCharterX. All rights reserved.</p>
          </div>
        </div>
      `;
      break;

    case 'private_jet_charter':
    case 'helicopter_charter':
    case 'empty_leg':
      subject = `${type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Request Received`;
      body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #000; padding: 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0;">PrivateCharterX</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #eee; border-top: none;">
            <h2>✈️ Flight Request Received</h2>
            <p>Thank you for your ${type.replace(/_/g, ' ')} request. We have received your request and will process it shortly.</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Request Type:</strong> ${type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
              <p><strong>Status:</strong> <span style="color: #f59e0b; font-weight: bold;">Pending Review</span></p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.VITE_APP_URL}/dashboard"
                 style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                View Request Status
              </a>
            </div>
            <p>Our aviation team will review your request and provide a detailed quote within 24 hours.</p>
            <p>Contact us: <a href="mailto:info@privatecharterx.com">info@privatecharterx.com</a></p>
          </div>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
            <p>&copy; ${new Date().getFullYear()} PrivateCharterX. All rights reserved.</p>
          </div>
        </div>
      `;
      break;

    case 'spv_formation':
      subject = 'SPV Formation Request Received';
      body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #000; padding: 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0;">PrivateCharterX</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #eee; border-top: none;">
            <h2>📄 SPV Formation Request Received</h2>
            <p>Thank you for your SPV formation request. Our legal and structuring team will review your requirements.</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Service:</strong> SPV Formation</p>
              <p><strong>Status:</strong> <span style="color: #f59e0b; font-weight: bold;">Under Review</span></p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.VITE_APP_URL}/dashboard"
                 style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                View Request Status
              </a>
            </div>
            <p>A specialist will contact you within 48 hours to discuss your SPV formation requirements.</p>
            <p>Questions? Email us at <a href="mailto:info@privatecharterx.com">info@privatecharterx.com</a></p>
          </div>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
            <p>&copy; ${new Date().getFullYear()} PrivateCharterX. All rights reserved.</p>
          </div>
        </div>
      `;
      break;

    case 'tokenization':
      subject = 'Asset Tokenization Request Received';
      body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #000; padding: 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0;">PrivateCharterX</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #eee; border-top: none;">
            <h2>🪙 Asset Tokenization Request Received</h2>
            <p>Thank you for your asset tokenization request. Our blockchain team will evaluate your asset.</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Service:</strong> Asset Tokenization</p>
              <p><strong>Status:</strong> <span style="color: #f59e0b; font-weight: bold;">Pending Evaluation</span></p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.VITE_APP_URL}/dashboard"
                 style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                View Request Status
              </a>
            </div>
            <p>Our tokenization specialists will contact you within 48 hours to discuss your requirements.</p>
            <p>Email: <a href="mailto:info@privatecharterx.com">info@privatecharterx.com</a></p>
          </div>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
            <p>&copy; ${new Date().getFullYear()} PrivateCharterX. All rights reserved.</p>
          </div>
        </div>
      `;
      break;

    default:
      subject = 'Service Request Received';
      body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #000; padding: 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0;">PrivateCharterX</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #eee; border-top: none;">
            <h2>Request Received</h2>
            <p>Thank you for your request. We have received it and will process it shortly.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.VITE_APP_URL}/dashboard"
                 style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                View Request Status
              </a>
            </div>
            <p>Our team will contact you soon.</p>
          </div>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
            <p>&copy; ${new Date().getFullYear()} PrivateCharterX. All rights reserved.</p>
          </div>
        </div>
      `;
  }

  return sendEmail({ to: email, subject, body });
}

// Send notification to bookings@privatecharterx.com for all service requests
export async function sendBookingsNotification(type: string, requestData: any, userEmail: string) {
  const BOOKINGS_EMAIL = 'bookings@privatecharterx.com';

  let subject = '';
  let body = '';

  switch (type) {
    case 'empty_leg':
      subject = `New Empty Leg Request - ${requestData.from || requestData.from_iata} → ${requestData.to || requestData.to_iata}`;
      body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #000; padding: 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0;">PrivateCharterX - New Booking Request</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #eee; border-top: none;">
            <h2>✈️ Empty Leg Request</h2>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Customer Email:</strong> ${userEmail}</p>
              <p><strong>Route:</strong> ${requestData.from || requestData.from_iata} → ${requestData.to || requestData.to_iata}</p>
              <p><strong>Departure:</strong> ${requestData.departure_date || 'TBD'} ${requestData.departure_time || ''}</p>
              <p><strong>Aircraft:</strong> ${requestData.aircraft_type || 'Not specified'}</p>
              <p><strong>Passengers:</strong> ${requestData.capacity || requestData.passengers || 'Not specified'}</p>
              <p><strong>Price:</strong> ${requestData.price ? `€${requestData.price}` : 'TBD'}</p>
              ${requestData.hasNFT ? '<p><strong>NFT Member:</strong> <span style="color: #10b981;">Yes - Free Flight!</span></p>' : ''}
            </div>
            <p style="color: #666; font-size: 12px;">Request received at ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `;
      break;

    case 'adventure':
      subject = `New Adventure Request - ${requestData.name || 'Adventure Package'}`;
      body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #000; padding: 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0;">PrivateCharterX - New Booking Request</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #eee; border-top: none;">
            <h2>🏔️ Adventure Package Request</h2>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Customer Email:</strong> ${userEmail}</p>
              <p><strong>Package:</strong> ${requestData.name || 'Not specified'}</p>
              <p><strong>Location:</strong> ${requestData.location || 'Not specified'}</p>
              <p><strong>Price:</strong> ${requestData.price ? `€${requestData.price}` : 'TBD'}</p>
              <p><strong>Duration:</strong> ${requestData.duration || 'Not specified'}</p>
            </div>
            <p style="color: #666; font-size: 12px;">Request received at ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `;
      break;

    case 'luxury_car':
      subject = `New Luxury Car Request - ${requestData.name || requestData.carName || 'Luxury Car'}`;
      body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #000; padding: 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0;">PrivateCharterX - New Booking Request</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #eee; border-top: none;">
            <h2>🚗 Luxury Car Request</h2>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Customer Email:</strong> ${userEmail}</p>
              <p><strong>Vehicle:</strong> ${requestData.name || requestData.carName || 'Not specified'}</p>
              <p><strong>Pickup Location:</strong> ${requestData.pickupLocation || requestData.from || 'Not specified'}</p>
              <p><strong>Dropoff Location:</strong> ${requestData.dropoffLocation || requestData.to || 'Not specified'}</p>
              <p><strong>Date:</strong> ${requestData.date || requestData.pickupDate || 'Not specified'}</p>
              <p><strong>Time:</strong> ${requestData.time || requestData.pickupTime || 'Not specified'}</p>
              <p><strong>Price:</strong> ${requestData.price || requestData.priceRange || 'TBD'}</p>
            </div>
            <p style="color: #666; font-size: 12px;">Request received at ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `;
      break;

    case 'private_jet':
    case 'private_jet_charter':
      subject = `New Private Jet Request - ${requestData.from || requestData.origin} → ${requestData.to || requestData.destination}`;
      body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #000; padding: 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0;">PrivateCharterX - New Booking Request</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #eee; border-top: none;">
            <h2>✈️ Private Jet Charter Request</h2>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Customer Email:</strong> ${userEmail}</p>
              <p><strong>Route:</strong> ${requestData.from || requestData.origin} → ${requestData.to || requestData.destination}</p>
              <p><strong>Departure:</strong> ${requestData.departure_date || requestData.departureDate || 'TBD'}</p>
              <p><strong>Aircraft Type:</strong> ${requestData.aircraft_type || requestData.aircraftType || 'Not specified'}</p>
              <p><strong>Passengers:</strong> ${requestData.passengers || 'Not specified'}</p>
            </div>
            <p style="color: #666; font-size: 12px;">Request received at ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `;
      break;

    case 'helicopter':
    case 'helicopter_charter':
      subject = `New Helicopter Request - ${requestData.from || requestData.origin} → ${requestData.to || requestData.destination}`;
      body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #000; padding: 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0;">PrivateCharterX - New Booking Request</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #eee; border-top: none;">
            <h2>🚁 Helicopter Charter Request</h2>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Customer Email:</strong> ${userEmail}</p>
              <p><strong>Route:</strong> ${requestData.from || requestData.origin} → ${requestData.to || requestData.destination}</p>
              <p><strong>Date:</strong> ${requestData.date || requestData.departureDate || 'TBD'}</p>
              <p><strong>Passengers:</strong> ${requestData.passengers || 'Not specified'}</p>
            </div>
            <p style="color: #666; font-size: 12px;">Request received at ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `;
      break;

    case 'yacht':
      subject = `New Yacht Request - ${requestData.name || 'Yacht Charter'}`;
      body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #000; padding: 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0;">PrivateCharterX - New Booking Request</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #eee; border-top: none;">
            <h2>🛥️ Yacht Charter Request</h2>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Customer Email:</strong> ${userEmail}</p>
              <p><strong>Yacht:</strong> ${requestData.name || 'Not specified'}</p>
              <p><strong>Location:</strong> ${requestData.location || 'Not specified'}</p>
              <p><strong>Check-in:</strong> ${requestData.checkIn || 'TBD'}</p>
              <p><strong>Check-out:</strong> ${requestData.checkOut || 'TBD'}</p>
              <p><strong>Guests:</strong> ${requestData.guests || 'Not specified'}</p>
            </div>
            <p style="color: #666; font-size: 12px;">Request received at ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `;
      break;

    case 'taxi_concierge':
      subject = `New Taxi/Concierge Request - ${requestData.from} → ${requestData.to}`;
      body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #000; padding: 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0;">PrivateCharterX - New Booking Request</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #eee; border-top: none;">
            <h2>🚗 Taxi/Concierge Request</h2>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Customer Email:</strong> ${userEmail}</p>
              <p><strong>Vehicle:</strong> ${requestData.carName || 'Not specified'}</p>
              <p><strong>Route:</strong> ${requestData.from} → ${requestData.to}</p>
              <p><strong>Distance:</strong> ${requestData.distance || 'TBD'}</p>
              <p><strong>Pickup Time:</strong> ${requestData.pickupDate === 'Now' ? 'Immediate' : `${requestData.pickupDate} at ${requestData.pickupTime}`}</p>
              <p><strong>Passengers:</strong> ${requestData.passengers || 1}</p>
              <p><strong>Price:</strong> ${requestData.priceRange || 'TBD'}</p>
            </div>
            <p style="color: #666; font-size: 12px;">Request received at ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `;
      break;

    case 'spv_formation':
      subject = `New SPV Formation Request`;
      body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #000; padding: 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0;">PrivateCharterX - New Service Request</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #eee; border-top: none;">
            <h2>📄 SPV Formation Request</h2>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Customer Email:</strong> ${userEmail}</p>
              <p><strong>Service:</strong> SPV Formation</p>
              ${requestData.company_name ? `<p><strong>Company Name:</strong> ${requestData.company_name}</p>` : ''}
              ${requestData.jurisdiction ? `<p><strong>Jurisdiction:</strong> ${requestData.jurisdiction}</p>` : ''}
            </div>
            <p style="color: #666; font-size: 12px;">Request received at ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `;
      break;

    case 'event':
      subject = `New Event Booking Request - ${requestData.name || requestData.event_name || 'Event'}`;
      body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #000; padding: 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0;">PrivateCharterX - New Booking Request</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #eee; border-top: none;">
            <h2>🎫 Event Booking Request</h2>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Customer Email:</strong> ${userEmail}</p>
              <p><strong>Event:</strong> ${requestData.name || requestData.event_name || 'Not specified'}</p>
              <p><strong>Date:</strong> ${requestData.date || requestData.event_date || 'TBD'}</p>
              <p><strong>Location:</strong> ${requestData.location || 'Not specified'}</p>
              <p><strong>Tickets:</strong> ${requestData.tickets || requestData.quantity || 'Not specified'}</p>
            </div>
            <p style="color: #666; font-size: 12px;">Request received at ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `;
      break;

    default:
      subject = `New Service Request - ${type}`;
      body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #000; padding: 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0;">PrivateCharterX - New Service Request</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #eee; border-top: none;">
            <h2>New Request Received</h2>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Customer Email:</strong> ${userEmail}</p>
              <p><strong>Service Type:</strong> ${type}</p>
              <p><strong>Request Data:</strong></p>
              <pre style="background: #fff; padding: 10px; border-radius: 4px; font-size: 12px; overflow-x: auto;">${JSON.stringify(requestData, null, 2)}</pre>
            </div>
            <p style="color: #666; font-size: 12px;">Request received at ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `;
  }

  try {
    await sendEmail({ to: BOOKINGS_EMAIL, subject, body });
    console.log(`Booking notification sent to ${BOOKINGS_EMAIL} for ${type}`);
  } catch (error) {
    console.error('Failed to send booking notification:', error);
    // Don't throw error - this shouldn't block the user's request
  }
}