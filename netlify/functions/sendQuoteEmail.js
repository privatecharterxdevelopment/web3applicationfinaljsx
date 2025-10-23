const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  const body = JSON.parse(event.body);

  const transporter = nodemailer.createTransport({
    host: 'mail.privateemail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const internalMail = {
    from: `"PCX Concierge AI" <${process.env.SMTP_USER}>`,
    to: 'bookings@privatecharterx.com',
    subject: `✈️ New Charter Request from ${body.name || body.email}`,
    html: `
      <h2>📩 New Client Request</h2>
      <p><strong>Request Type:</strong> ${body.request_type || 'Not specified'}</p>
      <p><strong>From:</strong> ${body.departure}</p>
      <p><strong>To:</strong> ${body.destination}</p>
      <p><strong>Date:</strong> ${body.date}</p>
      <p><strong>Passengers:</strong> ${body.passenger_count}</p>
      <hr/>
      <p><strong>Client Name:</strong> ${body.name}</p>
      <p><strong>Email:</strong> ${body.email}</p>
      <p><strong>Phone:</strong> ${body.phone}</p>
      <p><strong>Internal Note:</strong> ${body.notes}</p>
      ${body.chat_history ? `<hr/><h3>🗨️ Chat History</h3><pre style="font-size:13px;background:#f9f9f9;border:1px solid #eee;padding:10px;border-radius:6px">${body.chat_history}</pre>` : ''}
    `
  };

  const clientMail = {
    from: `"PrivateCharterX" <${process.env.SMTP_USER}>`,
    to: body.email,
    subject: `🛫 We've received your request – PrivateCharterX`,
    html: `
      <div style="font-family:sans-serif; color:#333;">
        <img src="https://sgfnbormqiqgvhdfwmhz.supabase.co/storage/v1/object/public/logos//PrivatecharterX_logo_vectorized.png" alt="PrivateCharterX" style="width:180px; margin-bottom:20px;" />
        <h2>Thank you, ${body.name || 'Client'}!</h2>
        <p>We've received your request and our concierge team is already reviewing it.</p>
        <p><strong>Route:</strong> ${body.departure} → ${body.destination}</p>
        <p><strong>Date:</strong> ${body.date}</p>
        <p><strong>Passengers:</strong> ${body.passenger_count}</p>
        <p style="margin-top: 20px;">We'll be in touch shortly with details and next steps.</p>
        <hr style="margin:30px 0;" />
        <div style="font-size: 13px; color: #444;">
          <p><strong>Privatecharterx AG – Swiss Branch</strong><br>Bahnhofstrasse 37/10, 8001 Zurich, Switzerland</p>
          <p><strong>Privatecharterx Ltd. – Headquarters</strong><br>71-75 Shelton Street, WC2H 9JQ, Covent Garden, London, UK</p>
          <p><strong>Privatecharterx LLC</strong><br>1000 Brickell Ave. 715, 33131 Miami, Florida, USA</p>
          <p style="margin-top: 12px;">Tel: +41 44 797 88 53<br>Email: info@privatecharterx.com</p>
          <p style="font-size: 12px; color: #999; margin-top: 20px;">
            This message was generated automatically by the PrivateCharterX AI Concierge. All availability is subject to final confirmation.
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(internalMail);
    await transporter.sendMail(clientMail);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (err) {
    console.error('EMAIL ERROR:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send email.' })
    };
  }
};