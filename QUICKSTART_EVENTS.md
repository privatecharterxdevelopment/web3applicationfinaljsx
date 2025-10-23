# Quick Start: Events & Sports API

Get your Events & Sports page up and running in 3 simple steps!

## Step 1: Get API Keys (5 minutes)

### Ticketmaster API Key
1. Visit: https://developer.ticketmaster.com/
2. Sign up for a free account
3. Create an app and copy your **Consumer Key**

### Eventbrite API Token
1. Visit: https://www.eventbrite.com/account-settings/apps
2. Create a **Private Token**
3. Copy the token immediately (you won't see it again!)

---

## Step 2: Add Keys to .env File

Open the `.env` file in your project root and add your keys:

```env
VITE_TICKETMASTER_CONSUMER_KEY=your_ticketmaster_key_here
VITE_EVENTBRITE_TOKEN=your_eventbrite_token_here
```

**Important:** Don't use quotes around the keys!

---

## Step 3: Restart Server

Stop your dev server (Ctrl+C or Cmd+C) and restart:

```bash
npm run dev
```

That's it! Your Events & Sports page will now show live data from Ticketmaster and Eventbrite.

---

## Testing the Connection

1. Navigate to the **Events & Sports** page in your app
2. Open browser DevTools (F12) → Console tab
3. You should see events loading
4. If you see "Using mock data" - your API keys aren't configured

---

## No API Keys? No Problem!

The app automatically uses **mock data** (6 sample events) if no API keys are found. Perfect for:
- Testing the UI
- Development without API setup
- Demos and presentations

---

## Need More Help?

📖 **Full Setup Guide**: See `EVENTS_API_SETUP.md` for detailed instructions

🔑 **API Limits (Free Tier)**:
- Ticketmaster: 5,000 calls/day
- Eventbrite: 1,000 calls/hour

🚀 **Features**:
- Search events by city and category
- View event details with venue info
- Filter by Music, Sports, Arts & Theatre, Family, Film
- Direct links to buy tickets

---

**Quick Links**:
- [Ticketmaster Developer Portal](https://developer.ticketmaster.com/)
- [Eventbrite API Settings](https://www.eventbrite.com/account-settings/apps)
- [Full Documentation](./EVENTS_API_SETUP.md)
