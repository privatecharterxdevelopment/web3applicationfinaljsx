# Events API Setup Guide

This guide will help you set up API keys for Ticketmaster and Eventbrite to enable live event data in the application.

## Prerequisites

- A Ticketmaster Developer account
- An Eventbrite account with API access

---

## 1. Ticketmaster API Setup

### Step 1: Create a Ticketmaster Developer Account

1. Go to [Ticketmaster Developer Portal](https://developer.ticketmaster.com/)
2. Click **"Sign Up"** in the top right corner
3. Fill in your details and create an account
4. Verify your email address

### Step 2: Get Your API Key

1. Log in to your [Ticketmaster Developer Dashboard](https://developer-acct.ticketmaster.com/user/login)
2. Go to **"My Apps"** section
3. Click **"Create New App"** or use an existing app
4. Fill in the application details:
   - **App Name**: Your app name (e.g., "My Events Platform")
   - **Description**: Brief description of your app
   - **App URL**: Your website URL (can be localhost for development)
5. After creating the app, you'll see your **Consumer Key** (API Key)
6. Copy the **Consumer Key**

### Step 3: Add to Environment File

1. Open the `.env` file in your project root
2. Add your Ticketmaster API key:
   ```
   VITE_TICKETMASTER_CONSUMER_KEY=your_actual_api_key_here
   ```

### API Limits (Free Tier)
- **Rate Limit**: 5,000 API calls per day
- **Quota Reset**: Daily at midnight UTC
- **Throttle**: 5 requests per second

---

## 2. Eventbrite API Setup

### Step 1: Create an Eventbrite Account

1. Go to [Eventbrite](https://www.eventbrite.com/)
2. Sign up or log in to your account

### Step 2: Access API Settings

1. Go to [Eventbrite App Management](https://www.eventbrite.com/account-settings/apps)
2. Or navigate: Account Settings → Developer Links → API Keys

### Step 3: Create a Private Token

1. Click **"Create Private Token"** or **"Create New Token"**
2. Fill in the token details:
   - **Token Name**: Name for identification (e.g., "Events App Token")
   - **Token Description**: Brief description
3. Click **"Create Token"**
4. Copy the generated **Private Token** (you won't be able to see it again!)

### Step 4: Add to Environment File

1. Open the `.env` file in your project root
2. Add your Eventbrite token:
   ```
   VITE_EVENTBRITE_TOKEN=your_actual_token_here
   ```

### API Limits (Free Tier)
- **Rate Limit**: 1,000 requests per hour per organization
- **Quota Reset**: Hourly
- **Access**: Public event data only

---

## 3. Complete .env File Example

Your `.env` file should look like this:

```env
# Ticketmaster API Configuration
VITE_TICKETMASTER_CONSUMER_KEY=7elxis8cAshTKozDPQDh92jDPkAShRhP

# Eventbrite API Configuration
VITE_EVENTBRITE_TOKEN=ABCDEFGHIJKLMNOP1234567890
```

**Important Notes:**
- Never commit your `.env` file to version control (it's already in `.gitignore`)
- The `.env.example` file is safe to commit (it contains no real keys)
- Keys are sensitive - treat them like passwords

---

## 4. Restart Development Server

After adding your API keys:

1. Stop your development server (Ctrl+C or Cmd+C)
2. Restart it:
   ```bash
   npm run dev
   ```

The application will now load live events from both APIs!

---

## 5. Verify API Connection

### Check the Console

1. Open your browser's Developer Tools (F12)
2. Go to the **Console** tab
3. Navigate to the Events & Sports page
4. You should see event data loading
5. If you see errors, check:
   - API keys are correctly copied (no extra spaces)
   - Development server was restarted after adding keys
   - API keys are valid and active

### Expected Behavior

**With API Keys:**
- Live events from Ticketmaster and Eventbrite
- Real event data with images, dates, venues, and pricing
- Ability to filter by category and city
- Direct links to buy tickets

**Without API Keys (Mock Mode):**
- 6 sample events (fallback data)
- Basic event information
- All UI features work, but with placeholder data

---

## 6. API Features Breakdown

### Ticketmaster Features
- ✅ Event search by city and category
- ✅ Event details (name, date, venue, price range)
- ✅ High-quality event images
- ✅ Venue information with addresses
- ✅ Direct links to Ticketmaster for purchase
- ❌ Direct checkout (redirects to Ticketmaster)

### Eventbrite Features
- ✅ Event search by location
- ✅ Event details with descriptions
- ✅ Ticket pricing and availability
- ✅ Venue information
- ✅ Direct links to Eventbrite for purchase
- ❌ Embedded checkout (redirects to Eventbrite)

---

## 7. Troubleshooting

### "API Key Invalid" Error
- Double-check your API key is correctly copied
- Ensure there are no spaces before/after the key
- Verify the key is active in your developer dashboard

### "Rate Limit Exceeded" Error
- You've hit the daily/hourly limit
- Wait for the quota to reset
- Consider upgrading to a paid tier for higher limits

### "CORS Error"
- This is expected in some cases
- APIs should work from localhost and production domains
- Some features may require backend proxy (not implemented yet)

### No Events Showing
- Check browser console for errors
- Verify API keys are set correctly
- Ensure development server was restarted
- Check if you're searching for events in cities with available data

---

## 8. Upgrading to Paid Plans

If you need more API calls or advanced features:

### Ticketmaster
- [Pricing Information](https://developer.ticketmaster.com/products-and-docs/pricing/)
- Contact Ticketmaster for enterprise plans

### Eventbrite
- [Pricing Plans](https://www.eventbrite.com/platform/pricing)
- Free for public events
- Paid plans for private events and higher limits

---

## 9. Alternative: Use Mock Data

If you don't want to set up API keys, the application will automatically use mock data with 6 sample events. This is perfect for:
- Development and testing
- Demoing the UI/UX
- Learning the codebase

To use mock data: Simply leave the API keys empty in `.env`

---

## Need Help?

- **Ticketmaster Documentation**: https://developer.ticketmaster.com/products-and-docs/apis/getting-started/
- **Eventbrite Documentation**: https://www.eventbrite.com/platform/api
- **Project Issues**: Check the project repository for known issues

---

**Last Updated**: January 2025
