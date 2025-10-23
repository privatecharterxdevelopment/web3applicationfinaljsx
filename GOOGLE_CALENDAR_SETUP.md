# Google Calendar Integration Setup Guide

This guide will help you set up real Google Calendar integration for PrivateCharterX, allowing users to:
- Connect their personal Google Calendar accounts
- Automatically sync events from your app to their Google Calendar
- Send calendar invitations to attendees via Google Calendar
- Receive real-time updates bidirectionally

## Prerequisites
- Google Cloud Console account
- Supabase project set up
- Node.js and npm installed

---

## Step 1: Create Google Cloud Project & OAuth Credentials

### 1.1 Create a New Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "NEW PROJECT"
3. Name it "PrivateCharterX Calendar" and click "CREATE"

### 1.2 Enable Google Calendar API
1. In the left sidebar, go to **APIs & Services** → **Library**
2. Search for "Google Calendar API"
3. Click on it and click **ENABLE**

### 1.3 Create OAuth 2.0 Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - **User Type**: External
   - **App name**: PrivateCharterX
   - **User support email**: Your email
   - **Developer contact**: Your email
   - Click **SAVE AND CONTINUE**
   - **Scopes**: Click "ADD OR REMOVE SCOPES" and add:
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/calendar.events`
   - Click **SAVE AND CONTINUE**
   - **Test users**: Add your test email addresses
   - Click **SAVE AND CONTINUE**

4. Back in Credentials, click **+ CREATE CREDENTIALS** → **OAuth client ID**
5. **Application type**: Web application
6. **Name**: PrivateCharterX Web Client
7. **Authorized JavaScript origins**:
   - `http://localhost:5173` (for development)
   - `https://yourdomain.com` (for production)
8. **Authorized redirect URIs**:
   - `http://localhost:5173/auth/google/callback` (for development)
   - `https://yourdomain.com/auth/google/callback` (for production)
9. Click **CREATE**
10. **Save the Client ID and Client Secret** - you'll need these!

---

## Step 2: Configure Environment Variables

### 2.1 Create `.env` file
Create a `.env` file in the project root (copy from `.env.example`):

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Google Calendar OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=your-client-secret-here

# OpenAI (if needed)
VITE_OPENAI_API_KEY=your-openai-key-here
```

### 2.2 Set Supabase Environment Variables
You also need to add these to your Supabase project:

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to **Settings** → **Edge Functions** → **Manage Secrets**
4. Add these secrets:
   - `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID
   - `GOOGLE_CLIENT_SECRET`: Your Google OAuth Client Secret

---

## Step 3: Deploy Supabase Edge Function

### 3.1 Install Supabase CLI
```bash
npm install -g supabase
```

### 3.2 Login to Supabase
```bash
supabase login
```

### 3.3 Link Your Project
```bash
supabase link --project-ref your-project-ref
```

### 3.4 Deploy the Edge Function
```bash
supabase functions deploy google-calendar-auth
```

### 3.5 Create Token Refresh Function
Create another Edge Function for token refresh:

```bash
# File: supabase/functions/google-calendar-refresh/index.ts
# (Similar to google-calendar-auth but for refresh tokens)
```

Deploy it:
```bash
supabase functions deploy google-calendar-refresh
```

---

## Step 4: Run Database Migration

The calendar system database schema has already been created in:
`supabase/migrations/create_calendar_system.sql`

Make sure it's applied to your Supabase database:

1. Go to Supabase Dashboard → **SQL Editor**
2. Open the migration file and run it, or use CLI:

```bash
supabase db push
```

---

## Step 5: Add OAuth Callback Route

### 5.1 Update Your Router
In your main routing file (e.g., `App.jsx` or router config), add the callback route:

```jsx
import GoogleCalendarCallback from './components/GoogleCalendarCallback';

// In your routes:
<Route path="/auth/google/callback" element={<GoogleCalendarCallback />} />
```

Or if you're not using React Router, add conditional rendering in your main component.

---

## Step 6: Test the Integration

### 6.1 Start Development Server
```bash
npm run dev
```

### 6.2 Test Flow
1. Navigate to the Calendar page in your app (only visible in RWS mode)
2. Click **"Connect Google Calendar"**
3. You'll be redirected to Google's OAuth consent screen
4. Sign in with your Google account
5. Grant calendar permissions
6. You'll be redirected back to your app
7. The button should now show **"Google Calendar Connected"**

### 6.3 Create a Test Event
1. Click **"New Event"** in the calendar
2. Fill in event details
3. Add attendees (must be registered PrivateCharterX users)
4. Click **"Create Event"**
5. Check your Google Calendar - the event should appear there!
6. Attendees will receive Google Calendar invitations at their registered email addresses

---

## How It Works

### Event Creation Flow:
```
User creates event in PrivateCharterX
    ↓
Event saved to Supabase database
    ↓
Check if user has Google Calendar connected
    ↓
If yes: Sync event to Google Calendar via API
    ↓
Google Calendar sends invitations to attendees
    ↓
Attendees can accept/decline in Google Calendar
```

### OAuth Flow:
```
User clicks "Connect Google Calendar"
    ↓
Redirect to Google OAuth consent screen
    ↓
User grants permissions
    ↓
Google redirects back with authorization code
    ↓
Edge Function exchanges code for access/refresh tokens
    ↓
Tokens saved securely in Supabase
    ↓
Connection established!
```

### Token Management:
- **Access tokens** expire after 1 hour
- **Refresh tokens** are used to get new access tokens automatically
- Token refresh happens transparently when needed
- No user intervention required after initial connection

---

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Make sure the redirect URI in Google Cloud Console exactly matches your app's URL
- Include the full path: `http://localhost:5173/auth/google/callback`

### Error: "Google OAuth credentials not configured"
- Check that environment variables are set in both `.env` and Supabase Edge Functions
- Restart your development server after adding `.env` variables

### Events not syncing to Google Calendar
- Check browser console for errors
- Verify the user has connected their Google Calendar (green button)
- Check Supabase logs for Edge Function errors
- Verify Google Calendar API is enabled in Google Cloud Console

### Token expired errors
- The refresh token mechanism should handle this automatically
- If issues persist, disconnect and reconnect Google Calendar

---

## Production Deployment

### Before Going Live:

1. **Update OAuth Consent Screen**:
   - Change from "Testing" to "Production" mode
   - Complete verification process (if needed)

2. **Add Production Redirect URIs**:
   - Add your production domain to Google Cloud Console
   - Update environment variables with production URLs

3. **Secure Environment Variables**:
   - Never commit `.env` files to git
   - Use proper secrets management in production

4. **Enable HTTPS**:
   - Google OAuth requires HTTPS in production
   - Use proper SSL certificates

5. **Monitor API Quotas**:
   - Google Calendar API has usage limits
   - Monitor quota in Google Cloud Console

---

## Features Implemented

✅ OAuth 2.0 authentication with Google
✅ Secure token storage in Supabase
✅ Automatic token refresh
✅ Event creation with Google Calendar sync
✅ Attendee invitations via Google Calendar
✅ Event updates sync to Google Calendar
✅ Event deletion syncs to Google Calendar
✅ Real-time connection status display
✅ Error handling and user feedback

---

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check Supabase Edge Function logs
3. Verify all environment variables are set correctly
4. Ensure Google Calendar API is enabled
5. Check OAuth redirect URIs match exactly

For more help, refer to:
- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)
- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
