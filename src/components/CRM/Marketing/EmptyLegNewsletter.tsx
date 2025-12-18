import React from 'react';

export const EmptyLegNewsletterTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{subject}}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f9f9f9;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background-color: #000;
      color: #fff;
      padding: 20px;
      text-align: center;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
    }
    .content {
      padding: 30px;
      background-color: #fff;
    }
    .footer {
      background-color: #f5f5f5;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    .button {
      display: inline-block;
      background-color: #000;
      color: #fff;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 4px;
      margin: 20px 0;
      font-weight: bold;
    }
    .unsubscribe {
      color: #999;
      font-size: 12px;
      margin-top: 20px;
    }
    .social-links {
      margin-top: 15px;
    }
    .social-links a {
      display: inline-block;
      margin: 0 5px;
      color: #666;
      text-decoration: none;
    }
    .flight-card {
      border: 1px solid #eaeaea;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 20px;
      background-color: #f9f9f9;
    }
    .flight-route {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .flight-details {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .flight-date, .flight-price {
      font-size: 14px;
    }
    .flight-price {
      color: #2c7a2c;
      font-weight: bold;
    }
    .flight-cta {
      text-align: center;
    }
    h2 {
      color: #333;
      margin-top: 0;
    }
    .intro {
      margin-bottom: 25px;
    }
    .highlight {
      background-color: #ffffcc;
      padding: 2px 4px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">PrivatecharterX</div>
    </div>
    <div class="content">
      <h2>{{title}}</h2>
      
      <div class="intro">
        {{content}}
      </div>
      
      <div class="flight-card">
        <div class="flight-route">New York (KJFK) → Miami (KMIA)</div>
        <div class="flight-details">
          <div class="flight-date">June 15, 2025 • 10:00 AM</div>
          <div class="flight-price">$12,500</div>
        </div>
        <div class="flight-details">
          <div>Gulfstream G550 • 14 passengers</div>
        </div>
        <div class="flight-cta">
          <a href="https://privatecharterx.com/emptylegs/1" class="button">Book Now</a>
        </div>
      </div>
      
      <div class="flight-card">
        <div class="flight-route">London (EGLL) → Paris (LFPG)</div>
        <div class="flight-details">
          <div class="flight-date">June 18, 2025 • 2:30 PM</div>
          <div class="flight-price">$8,900</div>
        </div>
        <div class="flight-details">
          <div>Citation X • 8 passengers</div>
        </div>
        <div class="flight-cta">
          <a href="https://privatecharterx.com/emptylegs/2" class="button">Book Now</a>
        </div>
      </div>
      
      <div class="flight-card">
        <div class="flight-route">Los Angeles (KLAX) → Las Vegas (KLAS)</div>
        <div class="flight-details">
          <div class="flight-date">June 20, 2025 • 4:15 PM</div>
          <div class="flight-price">$5,750</div>
        </div>
        <div class="flight-details">
          <div>Phenom 300 • 6 passengers</div>
        </div>
        <div class="flight-cta">
          <a href="https://privatecharterx.com/emptylegs/3" class="button">Book Now</a>
        </div>
      </div>
      
      <p>Don't see what you're looking for? <a href="https://privatecharterx.com/contact">Contact us</a> for personalized options.</p>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="https://privatecharterx.com/emptylegs" class="button">View All Empty Leg Flights</a>
      </div>
    </div>
    <div class="footer">
      <p>© 2025 PrivatecharterX. All rights reserved.</p>
      <p class="unsubscribe">If you no longer wish to receive these emails, you can <a href="{{unsubscribe_url}}">unsubscribe here</a>.</p>
      <div class="social-links">
        <a href="#">Facebook</a> | <a href="#">Twitter</a> | <a href="#">Instagram</a>
      </div>
    </div>
  </div>
</body>
</html>
`;

export const PrivateJetNewsletterTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{subject}}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f9f9f9;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background-color: #000;
      color: #fff;
      padding: 20px;
      text-align: center;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
    }
    .content {
      padding: 30px;
      background-color: #fff;
    }
    .footer {
      background-color: #f5f5f5;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    .button {
      display: inline-block;
      background-color: #000;
      color: #fff;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 4px;
      margin: 20px 0;
      font-weight: bold;
    }
    .unsubscribe {
      color: #999;
      font-size: 12px;
      margin-top: 20px;
    }
    .social-links {
      margin-top: 15px;
    }
    .social-links a {
      display: inline-block;
      margin: 0 5px;
      color: #666;
      text-decoration: none;
    }
    .jet-card {
      border: 1px solid #eaeaea;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 20px;
      background-color: #f9f9f9;
    }
    .jet-name {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .jet-details {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .jet-specs, .jet-price {
      font-size: 14px;
    }
    .jet-price {
      color: #2c7a2c;
      font-weight: bold;
    }
    .jet-cta {
      text-align: center;
    }
    h2 {
      color: #333;
      margin-top: 0;
    }
    .intro {
      margin-bottom: 25px;
    }
    .highlight {
      background-color: #ffffcc;
      padding: 2px 4px;
      font-weight: bold;
    }
    .featured-image {
      width: 100%;
      height: auto;
      border-radius: 8px;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">PrivatecharterX</div>
    </div>
    <div class="content">
      <h2>{{title}}</h2>
      
      <div class="intro">
        {{content}}
      </div>
      
      <img src="https://images.pexels.com/photos/358220/pexels-photo-358220.jpeg" alt="Luxury Private Jet" class="featured-image">
      
      <div class="jet-card">
        <div class="jet-name">Gulfstream G650</div>
        <div class="jet-details">
          <div class="jet-specs">Range: 7,000 nm • 14 passengers</div>
          <div class="jet-price">From $12,500/hour</div>
        </div>
        <div class="jet-details">
          <div>Ultra Long Range • Stand-up Cabin</div>
        </div>
        <div class="jet-cta">
          <a href="https://privatecharterx.com/jets/g650" class="button">Request Quote</a>
        </div>
      </div>
      
      <div class="jet-card">
        <div class="jet-name">Bombardier Global 7500</div>
        <div class="jet-details">
          <div class="jet-specs">Range: 7,700 nm • 16 passengers</div>
          <div class="jet-price">From $13,900/hour</div>
        </div>
        <div class="jet-details">
          <div>Ultra Long Range • 4 Living Spaces</div>
        </div>
        <div class="jet-cta">
          <a href="https://privatecharterx.com/jets/global7500" class="button">Request Quote</a>
        </div>
      </div>
      
      <div class="jet-card">
        <div class="jet-name">Cessna Citation X</div>
        <div class="jet-details">
          <div class="jet-specs">Range: 3,460 nm • 8 passengers</div>
          <div class="jet-price">From $6,500/hour</div>
        </div>
        <div class="jet-details">
          <div>Super Midsize • Fastest Civilian Jet</div>
        </div>
        <div class="jet-cta">
          <a href="https://privatecharterx.com/jets/citationx" class="button">Request Quote</a>
        </div>
      </div>
      
      <p>Looking for something specific? Our fleet includes over 50 different aircraft models to suit your needs.</p>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="https://privatecharterx.com/jets" class="button">View Our Full Fleet</a>
      </div>
    </div>
    <div class="footer">
      <p>© 2025 PrivatecharterX. All rights reserved.</p>
      <p class="unsubscribe">If you no longer wish to receive these emails, you can <a href="{{unsubscribe_url}}">unsubscribe here</a>.</p>
      <div class="social-links">
        <a href="#">Facebook</a> | <a href="#">Twitter</a> | <a href="#">Instagram</a>
      </div>
    </div>
  </div>
</body>
</html>
`;