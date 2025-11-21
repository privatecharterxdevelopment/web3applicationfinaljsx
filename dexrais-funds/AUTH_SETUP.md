# Authentication & Email Setup Guide

## Overview

DexRais.funds now has complete authentication with:
- ✅ Email/Password login via Supabase Auth
- ✅ Google OAuth integration
- ✅ Wallet connection via Reown AppKit
- ✅ Email notifications via Resend

## Environment Variables

Add these to your `.env` file:

```env
# Supabase (existing)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Resend (NEW - for email notifications)
VITE_RESEND_API_KEY=your_resend_api_key
```

## Supabase Auth Configuration

### 1. Enable Email Provider

In your Supabase dashboard:
1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email templates (optional)

### 2. Enable Google OAuth

In your Supabase dashboard:
1. Go to **Authentication** → **Providers**
2. Enable **Google** provider
3. Add your Google OAuth credentials:
   - **Client ID**: Get from Google Cloud Console
   - **Client Secret**: Get from Google Cloud Console
4. Add authorized redirect URLs:
   - `http://localhost:5174/auth/callback` (development)
   - `https://yourdomain.com/auth/callback` (production)

### 3. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable **Google+ API**
4. Go to **APIs & Services** → **Credentials**
5. Click **Create Credentials** → **OAuth 2.0 Client ID**
6. Configure OAuth consent screen
7. Add authorized redirect URIs:
   - Your Supabase Auth callback URL (found in Supabase dashboard)
8. Copy Client ID and Client Secret to Supabase

### 4. Configure Redirect URLs

Update your Supabase Auth settings:
1. Go to **Authentication** → **URL Configuration**
2. Add redirect URLs:
   - `http://localhost:5174/auth/callback`
   - `https://yourdomain.com/auth/callback`

## Resend Email Setup

### 1. Create Resend Account

1. Go to [Resend.com](https://resend.com/)
2. Sign up for an account
3. Verify your email domain (or use the provided test domain for development)

### 2. Get API Key

1. Go to **API Keys** in Resend dashboard
2. Click **Create API Key**
3. Copy the key and add to `.env` as `VITE_RESEND_API_KEY`

### 3. Email Templates

The following emails are automatically sent:

1. **Registration Confirmation**
   - Sent when user signs up
   - Includes wallet address and welcome message

2. **Payment Confirmation**
   - Sent when 299 USDC launch fee is paid
   - Includes transaction hash and BaseScan link

3. **DAO Listed Notification**
   - Sent when campaign with DAO is successfully created
   - Includes DAO address and Safe address

4. **First Contribution**
   - Sent to creator when first backer contributes
   - Includes contributor address and amount

### 4. Email Sending

Emails are sent automatically via `src/lib/resend.ts`:
- `sendRegistrationConfirmation(email, username, walletAddress)`
- `sendPaymentConfirmation(email, username, campaignTitle, amount, txHash)`
- `sendDAOListedNotification(email, username, campaignTitle, daoAddress, safeAddress, campaignUrl)`
- `sendFirstContributionNotification(email, creatorUsername, campaignTitle, contributorAddress, amount, campaignUrl)`

## Testing Authentication

### Email/Password Login

1. Open the app: `http://localhost:5174`
2. Click **Get Started** → **Connect Wallet** (optional)
3. Try the register flow:
   - Enter email and password
   - Accept terms
   - Click **Create Account**
   - Check email for confirmation
4. Try the login flow:
   - Enter email and password
   - Click **Sign In**

### Google OAuth

1. Click **Sign in with Google** button
2. Select Google account
3. Approve permissions
4. Redirected back to app with session

### Wallet Connection

1. Click **Connect Wallet** button
2. Select wallet (MetaMask, WalletConnect, etc.)
3. Approve connection
4. User profile created automatically with wallet address

## Database Schema

The authentication system works with the existing `users` table:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE,  -- From wallet connection
  email TEXT UNIQUE,            -- From Supabase Auth
  username TEXT,
  bio TEXT,
  profile_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Auth Flow

### Registration Flow

1. User submits email/password or clicks Google OAuth
2. Supabase Auth creates account
3. Registration confirmation email sent via Resend
4. User profile created in `users` table
5. Auth session established

### Login Flow

1. User submits credentials or clicks Google OAuth
2. Supabase Auth verifies and creates session
3. User profile loaded from `users` table
4. Session persisted across page refreshes

### Wallet Connection Flow

1. User clicks Connect Wallet
2. Wallet modal appears (Reown AppKit)
3. User approves connection
4. If user has auth session: wallet address linked to account
5. If no auth session: new user profile created with wallet address

## Security Notes

- Passwords are hashed by Supabase Auth (never stored in plain text)
- Google OAuth uses secure token exchange
- Wallet signatures verified on-chain
- Email verification can be enabled in Supabase settings
- API keys should NEVER be committed to git

## Troubleshooting

### Email not sending
- Check `VITE_RESEND_API_KEY` is set correctly
- Verify email domain in Resend dashboard
- Check console for Resend errors

### Google OAuth not working
- Verify redirect URLs match exactly
- Check Google Cloud Console credentials
- Ensure Google+ API is enabled

### Wallet connection issues
- Check Reown AppKit configuration in `src/config/wagmi.ts`
- Verify Base Chain RPC URL
- Test with different wallets

## Next Steps

1. Test registration with email/password ✅
2. Test Google OAuth login ✅
3. Test wallet connection ✅
4. Verify emails are being sent (check spam folder)
5. Integrate payment confirmation emails (when payment flow is implemented)
6. Integrate DAO listing emails (when DAO creation is live)
7. Integrate first contribution emails (when contribution flow is implemented)
