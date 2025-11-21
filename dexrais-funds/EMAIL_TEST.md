# Email Testing Guide

## Test API Key Configured

Your `.env` file now contains the test Resend API key:
```
VITE_RESEND_API_KEY=re_bY4MQ2RD_NQoMPjbvqBWy89cpn7VpiNLt
```

## How to Test Emails

### 1. Test Registration Email

1. Open your app at `http://localhost:5174`
2. Click **Get Started** → Select any option
3. Click **Register** (or switch to register in Login modal)
4. Fill out the form:
   - Email: `your-email@example.com`
   - Password: `testpassword123`
   - Confirm Password: `testpassword123`
   - ✅ Accept Terms
5. Click **Create Account**
6. **Check your email inbox** for the registration confirmation

The email will contain:
- Welcome message
- Your wallet address (if connected)
- Link to dashboard

### 2. Test Google OAuth (No Email Sent Yet)

Google OAuth registration currently doesn't send an email automatically. We can add that if needed.

### 3. Test Payment Confirmation Email

**Not yet integrated** - This will be sent when:
- User pays the 299 USDC launch fee
- Transaction is confirmed on-chain

To integrate: Call `sendPaymentConfirmation()` in the payment success handler.

### 4. Test DAO Listed Email

**Not yet integrated** - This will be sent when:
- Campaign with DAO is successfully created
- DAO address and Safe address are available

To integrate: Call `sendDAOListedNotification()` after DAO creation in [CreateCampaign.tsx:220](src/pages/CreateCampaign.tsx:220).

### 5. Test First Contribution Email

**Not yet integrated** - This will be sent when:
- First backer contributes to a campaign
- Campaign creator receives notification

To integrate: Call `sendFirstContributionNotification()` in the contribution handler.

## Testing with Browser Console

Open the browser console and try:

```javascript
// Import the email service
import { sendRegistrationConfirmation } from './lib/resend';

// Send test email
await sendRegistrationConfirmation(
  'your-email@example.com',
  'TestUser',
  '0x1234567890abcdef1234567890abcdef12345678'
);
```

## Email Template Preview

### Registration Email
- **Subject**: Welcome to DexRais.funds!
- **From**: DexRais.funds <noreply@dexrais.funds>
- **Content**:
  - Welcome header with gradient background
  - User's wallet address
  - Feature list (launch campaigns, create DAOs, back projects)
  - "Go to Dashboard" button
  - Footer with platform info

### Payment Confirmation Email
- **Subject**: Payment Confirmed - [Campaign Title]
- **Content**:
  - Green success header
  - Amount paid (e.g., "299 USDC")
  - Campaign title
  - Transaction hash
  - "View on BaseScan" button
  - Campaign live notification

### DAO Listed Email
- **Subject**: DAO Successfully Created - [Campaign Title]
- **Content**:
  - Purple gradient header
  - DAO address and Safe address
  - Aragon DAO and Gnosis Safe badges
  - "View Campaign" button
  - What's next section

### First Contribution Email
- **Subject**: First Contribution Received - [Campaign Title]
- **Content**:
  - Blue gradient header
  - Contribution amount
  - Contributor wallet address
  - "View Campaign Dashboard" button
  - Tips for maintaining momentum

## Troubleshooting

### Email Not Received?

1. **Check spam folder** - Resend test emails might go to spam
2. **Check browser console** - Look for `[Email]` logs
3. **Verify API key** - Make sure `.env` has correct `VITE_RESEND_API_KEY`
4. **Check Resend dashboard** - View email logs at https://resend.com/emails

### Common Issues

**Error: "VITE_RESEND_API_KEY is not set"**
- Restart dev server after adding `.env` variable
- Check `.env` file syntax (no spaces around `=`)

**Email sending but not delivering**
- Resend test domain has limitations
- For production, verify your own domain

**No console logs**
- Email service logs with `[Email]` prefix
- Check if email is being called in the code

## Next Steps

1. ✅ Test registration email
2. Add email notification to payment flow
3. Add email notification to DAO creation
4. Add email notification to first contribution
5. Set up custom domain for production emails
6. Design additional email templates (campaign updates, milestones, etc.)

## Production Setup

Before going live:

1. **Get Production API Key**:
   - Go to https://resend.com/api-keys
   - Create a production API key
   - Update `.env` with production key

2. **Verify Email Domain**:
   - Add your domain to Resend
   - Add DNS records
   - Verify domain ownership
   - Update `FROM_EMAIL` in `src/lib/resend.ts`

3. **Email Compliance**:
   - Add unsubscribe link
   - Include physical address
   - Follow CAN-SPAM Act guidelines

## Email Service Architecture

All email functions are in [src/lib/resend.ts](src/lib/resend.ts:1):

```typescript
sendRegistrationConfirmation(email, username, walletAddress)
sendPaymentConfirmation(email, username, campaignTitle, amount, txHash)
sendDAOListedNotification(email, username, campaignTitle, daoAddress, safeAddress, campaignUrl)
sendFirstContributionNotification(email, creatorUsername, campaignTitle, contributorAddress, amount, campaignUrl)
```

Each function:
- Checks if Resend is configured
- Gracefully fails if API key is missing
- Logs success/failure to console
- Returns email ID or null
