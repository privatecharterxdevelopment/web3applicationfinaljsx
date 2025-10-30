# Google Calendar Integration Setup Fix

## Problem

You're seeing a **400 error from Google** with the message:
```
400. That's an error.
The server cannot process the request because it is malformed. It should not be retried.
```

This error occurs because **Google Calendar OAuth credentials are not configured**.

## Root Cause

1. The application is using placeholder values: `YOUR_GOOGLE_CLIENT_ID` and `YOUR_GOOGLE_CLIENT_SECRET`
2. When trying to connect Google Calendar, the OAuth flow fails because Google cannot recognize these invalid credentials
3. The Supabase Edge Function also needs these credentials configured

## Solution: Configure Google Calendar OAuth

### Step 1: Create Google Cloud Project & OAuth Credentials

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/apis/credentials

2. **Create or Select a Project:**
   - If you don't have a project, click "Create Project"
   - Name it something like "PrivateCharterX"

3. **Enable Google Calendar API:**
   - Go to: https://console.cloud.google.com/apis/library
   - Search for "Google Calendar API"
   - Click "Enable"

4. **Configure OAuth Consent Screen:**
   - Go to: https://console.cloud.google.com/apis/credentials/consent
   - Choose "External" user type (or "Internal" if using Google Workspace)
   - Fill in required fields:
     - App name: PrivateCharterX
     - User support email: your email
     - Developer contact: your email
   - Click "Save and Continue"
   - Add scopes:
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/calendar.events`
   - Click "Save and Continue"
   - Add test users (your email) if using External type
   - Click "Save and Continue"

5. **Create OAuth 2.0 Client ID:**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Name: "PrivateCharterX Web Client"
   - Authorized redirect URIs (add both):
     ```
     http://localhost:5173/auth/google/callback
     https://your-production-domain.com/auth/google/callback
     ```
   - Click "Create"
   - **Copy the Client ID and Client Secret** (you'll need these next)

### Step 2: Add Credentials to Frontend (.env)

1. **Create or update `.env` file in project root:**

```bash
# Google Calendar Integration
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=your-client-secret-here
```

2. **Replace the placeholder values with your actual credentials from Step 1**

3. **Restart the development server:**
```bash
npm run dev
```

### Step 3: Add Credentials to Supabase Edge Function

The backend also needs these credentials:

1. **Go to Supabase Dashboard:**
   - Visit: https://app.supabase.com/project/YOUR_PROJECT/settings/functions

2. **Add Edge Function Secrets:**
   - Click on "Edge Functions"
   - Click "Secrets"
   - Add two new secrets:
     ```
     GOOGLE_CLIENT_ID = your-client-id-here.apps.googleusercontent.com
     GOOGLE_CLIENT_SECRET = your-client-secret-here
     ```

3. **Redeploy the Edge Function (if needed):**
```bash
supabase functions deploy google-calendar-auth
```

### Step 4: Test the Connection

1. **Navigate to the Calendar page in your app**
2. **Click "Connect Google Calendar"**
3. **You should now see the proper Google OAuth consent screen** (instead of a 400 error)
4. **Authorize the application**
5. **You'll be redirected back to your app with a successful connection**

## Files Updated

1. **.env.example** - Added Google Calendar environment variables with setup instructions
2. **src/services/googleCalendarService.js** - Added validation to check if credentials are configured before initiating OAuth flow

## Verification

After setup, you should see:
- ✅ No more 400 errors from Google
- ✅ Proper Google OAuth consent screen when connecting
- ✅ Successful calendar connection
- ✅ Events sync between PrivateCharterX and Google Calendar

## Troubleshooting

### Still getting 400 error?
- Make sure you added **both** the Client ID and Client Secret
- Verify the redirect URI in Google Cloud Console matches **exactly**: `http://localhost:5173/auth/google/callback`
- Make sure you **restarted the dev server** after adding .env variables

### "Redirect URI mismatch" error?
- Check that the redirect URI in Google Cloud Console matches the one in the error message
- Add all possible redirect URIs (localhost, production domain, etc.)

### "Access blocked: This app's request is invalid"?
- Make sure you enabled the Google Calendar API in Google Cloud Console
- Verify the OAuth consent screen is properly configured
- Add your email as a test user if using "External" user type

## Additional Notes

- During development, Google may show a warning that the app is not verified. Click "Advanced" → "Go to PrivateCharterX (unsafe)" to proceed
- For production, you should submit your app for Google verification: https://support.google.com/cloud/answer/9110914
- The Supabase Edge Function handles token exchange securely on the backend, so your Client Secret is never exposed to the frontend
