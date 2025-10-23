# Booking Email Notifications Edge Function

This Edge Function automatically sends email notifications when a new booking request is created in the `booking_requests` table.

## Features

- **User Confirmation Email**: Professional confirmation email sent to the customer with booking details
- **Admin Notification Email**: Urgent notification sent to admin team with all booking details and customer contact info
- **Rich HTML Templates**: Branded email templates with booking details, pricing, and next steps
- **Error Handling**: Graceful error handling and logging for debugging

## Emails Sent

### Customer Confirmation Email
- **To**: Customer's email address from booking form
- **From**: `PrivateCharterX <noreply@privatecharterx.com>`
- **Subject**: `Booking Confirmation - Flight [ORIGIN] → [DESTINATION]`
- **Content**: Booking details, reference number, next steps, contact info

### Admin Notification Email
- **To**: `bookings@privatecharterx.com` (configurable via `ADMIN_EMAIL` env var)
- **From**: `PrivateCharterX Bookings <noreply@privatecharterx.com>`
- **Subject**: `🚁 URGENT: New Charter Request [ROUTE] - [PRICE]`
- **Content**: Complete booking details, customer contact info, action items

## Environment Variables Required

```bash
# AWS SES Configuration (Required)
AWS_ACCESS_KEY_ID=AKIA...          # AWS Access Key ID for SES
AWS_SECRET_ACCESS_KEY=xxx...       # AWS Secret Access Key for SES
AWS_REGION=eu-north-1              # AWS region where SES is configured

# Email Configuration (Optional with defaults)
ADMIN_EMAIL=bookings@privatecharterx.com   # Admin email for notifications
FROM_EMAIL=noreply@www.privatecharterx.com # Sender email address (must be verified in AWS SES)
ENVIRONMENT=production                     # Set to 'development' for detailed error messages
```

## Setup Instructions

1. **Deploy the Function**:
   ```bash
   supabase functions deploy booking-email-notifications
   ```

2. **Set Environment Variables**:
   ```bash
   supabase secrets set AWS_ACCESS_KEY_ID=AKIA...
   supabase secrets set AWS_SECRET_ACCESS_KEY=xxx...
   supabase secrets set AWS_REGION=eu-north-1
   supabase secrets set ADMIN_EMAIL=bookings@privatecharterx.com
   supabase secrets set FROM_EMAIL=noreply@www.privatecharterx.com
   supabase secrets set ENVIRONMENT=production
   ```

3. **Create Database Webhook** (via Supabase Dashboard):
   - Go to **Database → Webhooks → Create new**
   - **Name**: `booking-email-notifications`
   - **Table**: `booking_requests`
   - **Events**: Check `Insert`
   - **Type**: `HTTP Request`
   - **Method**: `POST`
   - **URL**: `https://your-project-ref.functions.supabase.co/functions/v1/booking-email-notifications`
   - **HTTP Headers**: Leave default (Supabase automatically includes authorization)
   - **HTTP Parameters**: Leave empty (the record data is automatically sent in the request body)

4. **Configure AWS SES**:
   - Verify your sender email address in AWS SES console
   - If using a custom domain, verify the domain in AWS SES
   - Ensure your AWS SES is out of sandbox mode for production use
   - Update `FROM_EMAIL` environment variable to use your verified email/domain

## Webhook Flow

1. User completes booking flow in `UnifiedBookingFlow.tsx`
2. `bookingService.createBookingRequest()` inserts record into `booking_requests` table
3. Database webhook `booking-email-notifications` fires automatically on INSERT
4. Webhook calls Edge Function with `{ "record": { ...booking_data } }` in request body
5. Edge Function extracts booking ID from `body.record.id`
6. Edge Function fetches complete booking data from database using service role key
7. Edge Function sends both user and admin emails
8. Function returns status of email sending attempts

## Testing

To test the function manually:

```bash
curl -X POST https://your-project-ref.functions.supabase.co/functions/v1/booking-email-notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -d '{
    "record": {
      "id": "fe6399a2-d52b-47a5-81b1-a3d37c0f3d5e"
    }
  }'
```

The function will automatically fetch the complete booking data from the `booking_requests` table using the provided ID.

## Email Templates

The function includes two HTML email templates:

- **User Template**: Clean, minimal design matching PrivateCharterX branding with booking confirmation details
- **Admin Template**: Urgent/action-oriented design with complete booking information and customer contact details