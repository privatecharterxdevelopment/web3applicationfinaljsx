# Resend Email Service Setup

This guide walks you through setting up Resend for the PrivateCharterX Newsletter System.

## Why Resend?

- **Free Tier**: 3,000 emails/month (perfect for starting out)
- **Modern API**: Simple, developer-friendly
- **Great Deliverability**: High inbox rates
- **No Credit Card Required** for free tier

## Setup Steps

### 1. Create Resend Account

1. Go to [https://resend.com/signup](https://resend.com/signup)
2. Sign up with your email
3. Verify your email address

### 2. Get Your API Key

1. After login, go to [https://resend.com/api-keys](https://resend.com/api-keys)
2. Click "Create API Key"
3. Name it: `PrivateCharterX Production`
4. Permission: Select "Sending access"
5. Click "Add"
6. **IMPORTANT**: Copy the API key immediately (you won't be able to see it again)
   - It will look like: `re_123abc456def789ghi`

### 3. Add Domain (Optional but Recommended)

**For Production:**
1. Go to [https://resend.com/domains](https://resend.com/domains)
2. Click "Add Domain"
3. Enter your domain: `privatecharterx.com`
4. Follow the DNS setup instructions:
   - Add the provided DNS records to your domain registrar
   - Wait for verification (usually 5-15 minutes)

**For Testing:**
- You can use Resend's test domain initially
- Emails will be sent from `onboarding@resend.dev`

### 4. Configure Environment Variables

Add to your `.env.backend` file:

```env
# Resend Email Service
RESEND_API_KEY=re_YOUR_API_KEY_HERE

# Email Configuration
NEWSLETTER_FROM_EMAIL=newsletter@privatecharterx.com
NEWSLETTER_FROM_NAME=PrivateCharterX
FRONTEND_URL=https://privatecharterx.com
```

**For Local Development:**
```env
RESEND_API_KEY=re_YOUR_API_KEY_HERE
NEWSLETTER_FROM_EMAIL=onboarding@resend.dev
NEWSLETTER_FROM_NAME=PrivateCharterX
FRONTEND_URL=http://localhost:5173
```

### 5. Install Resend Package

```bash
cd "/Users/x/Downloads/Tokenization-main 2"
npm install resend
```

### 6. Test Email Sending

You can test email sending using the API:

```bash
curl -X POST http://localhost:3000/api/newsletter/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com"}'
```

Check your inbox for the welcome email!

## Free Tier Limits

- **3,000 emails/month** (100/day)
- If you need more, upgrade to Pro:
  - **$20/month** → 50,000 emails/month
  - **$80/month** → 1,000,000 emails/month

## Email Best Practices

### 1. Warm Up Your Domain

When you first start sending emails:
- Start with small batches (50-100/day)
- Gradually increase over 2-4 weeks
- This improves deliverability

### 2. Monitor Metrics

Resend provides:
- Delivery rates
- Bounce rates
- Spam complaints

Check these regularly at: https://resend.com/emails

### 3. Avoid Spam Triggers

- Don't use ALL CAPS in subject lines
- Include unsubscribe link (already done in templates)
- Don't send too frequently (max 1/day recommended)
- Personalize emails when possible

## Troubleshooting

### Emails Not Sending

1. **Check API Key**: Make sure `RESEND_API_KEY` is set correctly
2. **Check Logs**: Look at your server console for error messages
3. **Verify Domain**: If using custom domain, ensure DNS records are verified
4. **Check Limits**: Ensure you haven't exceeded free tier limits (3,000/month)

### Emails Going to Spam

1. **Verify Domain**: Use SPF, DKIM, and DMARC records (Resend provides these)
2. **Check Content**: Avoid spam trigger words
3. **Include Unsubscribe**: Always present (already in templates)
4. **Warm Up**: Send gradually at first

### Rate Limiting

If you hit rate limits:
- Free tier: 100 emails/day
- Add delays between sends (already implemented: 100ms)
- Consider upgrading to Pro tier

## Support

- **Resend Docs**: https://resend.com/docs
- **Resend Status**: https://status.resend.com
- **Support**: support@resend.com

## Alternative: SendGrid

If you prefer SendGrid instead:

1. Sign up at https://sendgrid.com
2. Get API key
3. Replace `resend` package with `@sendgrid/mail`
4. Update `api/newsletter.js` to use SendGrid SDK

## Next Steps

After setup:
1. ✅ Test welcome email
2. ✅ Create your first newsletter template in Admin Panel
3. ✅ Send test newsletter
4. ✅ Monitor delivery rates

---

**🎉 You're all set! Your newsletter system is ready to send emails.**
