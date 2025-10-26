# Vercel Deployment Guide

This guide explains how to deploy PrivateCharterX (Frontend + Backend) to Vercel with automatic deployments from GitHub.

---

## Overview

The project is configured for **monorepo deployment**:
- **Frontend**: Vite React app (deployed as static site)
- **Backend**: Express.js API (deployed as Vercel Serverless Functions)

---

## 1. Initial Setup

### Prerequisites
- GitHub repository connected to Vercel
- Vercel account with project created
- All required API keys ready

### Files Already Configured
✅ `vercel.json` - Deployment configuration
✅ `api-vercel/index.cjs` - Serverless function entry point
✅ `server.cjs` - Express app
✅ `package.json` - Build scripts

---

## 2. Environment Variables Setup

Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

Add these variables for **Production, Preview, and Development** environments:

### Frontend Variables

```env
# Supabase
VITE_SUPABASE_URL=https://oubecmstqtzdnevyqavu.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here

# Auth0 (if used)
VITE_AUTH0_DOMAIN=your_auth0_domain
VITE_AUTH0_CLIENT_ID=your_auth0_client_id

# Mapbox (if used)
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token

# API URL (automatically set by Vercel, but can override)
VITE_API_URL=https://your-project.vercel.app
```

### Backend Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://your-project.vercel.app

# Supabase
SUPABASE_URL=https://oubecmstqtzdnevyqavu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91YmVjbXN0cXR6ZG5ldnlxYXZ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTA5NzQxMiwiZXhwIjoyMDY2NjczNDEyfQ.35V_vACN8pmSKku3yOvtijmwUpdnPHR2-UqPm7rfMIA

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here

# Resend (Newsletter)
RESEND_API_KEY=re_E1Q1wpLP_3nVyxbdFxwJSzthupY9xtnbw
NEWSLETTER_FROM_EMAIL=newsletter@privatecharterx.com
NEWSLETTER_FROM_NAME=PrivateCharterX

# OpenAI (if used)
OPENAI_API_KEY=your_openai_api_key

# Hume AI (if used)
HUME_API_KEY=your_hume_api_key
HUME_SECRET_KEY=your_hume_secret_key

# Anthropic Claude (if used)
ANTHROPIC_API_KEY=your_anthropic_api_key

# AWS Rekognition (if used)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
```

---

## 3. Deployment Steps

### Auto-Deployment (Recommended)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Configure Vercel deployment"
   git push
   ```

2. **Vercel automatically:**
   - Detects the push
   - Builds the frontend (`npm run build`)
   - Deploys serverless functions (`api-vercel/index.cjs`)
   - Deploys to production

### Manual Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

---

## 4. Verify Deployment

### Frontend Check
1. Open your Vercel project URL: `https://your-project.vercel.app`
2. Verify the homepage loads
3. Check browser console for errors

### Backend API Check
1. Test health endpoint: `https://your-project.vercel.app/health`

   Expected response:
   ```json
   {
     "status": "ok",
     "timestamp": "2025-01-26T...",
     "uptime": 123.45,
     "environment": "production",
     "stripeMode": "live"
   }
   ```

2. Test API routes:
   - `https://your-project.vercel.app/api/partners/health`
   - `https://your-project.vercel.app/api/newsletter/stats`

---

## 5. Configure Custom Domain (Optional)

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Domains**
2. Add your custom domain: `privatecharterx.com`
3. Update DNS records (Vercel provides instructions)
4. Wait for DNS propagation (can take up to 48 hours)

5. **Update environment variables:**
   ```env
   FRONTEND_URL=https://privatecharterx.com
   VITE_API_URL=https://privatecharterx.com
   ```

---

## 6. WordPress Integration

After deployment, update your WordPress plugin with the production API URL:

```php
define('PRIVATECHARTERX_API_URL', 'https://your-project.vercel.app/api');
```

Or with custom domain:
```php
define('PRIVATECHARTERX_API_URL', 'https://privatecharterx.com/api');
```

---

## 7. Stripe Webhook Configuration

1. Go to **Stripe Dashboard** → **Developers** → **Webhooks**
2. Add new endpoint: `https://your-project.vercel.app/webhooks/stripe-connect`
3. Select events:
   - `account.updated`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `transfer.created`
4. Copy the **Signing Secret**
5. Add to Vercel environment variables as `STRIPE_WEBHOOK_SECRET`

---

## 8. Monitoring & Logs

### View Logs
- **Vercel Dashboard** → Your Project → **Deployments** → Select deployment → **Functions** tab
- Click on any function to see logs

### Error Monitoring
- Check **Runtime Logs** in Vercel Dashboard
- Monitor API errors in real-time

### Performance
- Vercel provides analytics for:
  - Page load times
  - Function execution times
  - Bandwidth usage

---

## 9. Troubleshooting

### Build Fails

**Error: "Module not found"**
- Check `package.json` dependencies
- Ensure all imports use correct paths
- Verify `node_modules` is not in `.gitignore`

**Error: "Type error in build"**
- Run `npm run build` locally first
- Fix TypeScript errors
- Push again

### API Returns 500

**Check:**
1. Environment variables are set correctly in Vercel
2. Supabase connection is working
3. Stripe keys are valid
4. Function logs for specific errors

**Solution:**
- View function logs in Vercel Dashboard
- Test endpoints locally first: `npm run dev:backend`

### CORS Errors

**Error: "Access-Control-Allow-Origin"**

**Solution:**
Update `server.cjs`:
```javascript
app.use(cors({
  origin: [
    'https://your-project.vercel.app',
    'https://privatecharterx.com',
    'https://www.privatecharterx.blog'
  ],
  credentials: true
}));
```

Or in environment variable:
```env
FRONTEND_URL=https://your-project.vercel.app,https://privatecharterx.com
```

---

## 10. Rollback Deployment

If something breaks:

1. Go to **Vercel Dashboard** → Your Project → **Deployments**
2. Find the last working deployment
3. Click **...** menu → **Promote to Production**

---

## 11. Advanced Configuration

### Custom Build Command
In `vercel.json`:
```json
{
  "buildCommand": "npm run build && echo 'Build complete!'"
}
```

### Function Timeout
Default: 10 seconds (Hobby), 30 seconds (configured)

Increase in `vercel.json`:
```json
{
  "functions": {
    "api-vercel/index.cjs": {
      "maxDuration": 60,
      "memory": 3008
    }
  }
}
```

### Edge Functions (Optional)
For even faster API responses, consider Edge Functions:
- Lower latency
- Run at edge locations worldwide

---

## 12. Cost Optimization

### Free Tier Limits
- **Bandwidth:** 100 GB/month
- **Functions:** 100 GB-hours/month
- **Build time:** 6,000 minutes/month

### Tips to Stay Free
1. Optimize images (use WebP, compress)
2. Enable caching headers
3. Minimize API calls
4. Use Vercel's image optimization

---

## 13. Security Best Practices

1. **Never commit secrets:**
   - Add `.env.backend` to `.gitignore`
   - Use Vercel environment variables

2. **Use HTTPS only:**
   - Vercel provides SSL by default

3. **Rate limiting:**
   - Already implemented in newsletter API
   - Consider adding to other endpoints

4. **API key rotation:**
   - Regularly rotate Stripe, Supabase, and other API keys

---

## 14. GitHub Actions (Optional)

Create `.github/workflows/deploy.yml` for custom deploy logic:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## Support

**Vercel Documentation:** https://vercel.com/docs
**Vercel CLI:** `vercel --help`
**Status Page:** https://www.vercel-status.com

---

🎉 **Your PrivateCharterX application is now deployed on Vercel with automatic GitHub deployments!**

### Next Steps:
1. Test all features on production
2. Update WordPress with production API URL
3. Configure Stripe webhooks
4. Monitor logs for any errors
5. Share the live URL!
