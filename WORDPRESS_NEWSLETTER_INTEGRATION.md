# WordPress Newsletter Integration Guide

This guide shows you how to integrate your WordPress blog (www.privatecharterx.blog) with the PrivateCharterX Newsletter System.

## Overview

The integration allows visitors to your WordPress blog to subscribe to the PrivateCharterX newsletter. Subscriptions from WordPress are tracked separately from web subscriptions in your Admin Dashboard.

---

## Method 1: Simple Form Integration (Recommended)

### 1. Create a Contact Form

Use **Contact Form 7** or **WPForms** to create a newsletter subscription form.

**Form Fields:**
- Email Address (required)

### 2. Add Custom JavaScript

Add this JavaScript to your WordPress theme (Appearance → Customize → Additional CSS or use a plugin like "Header and Footer Scripts"):

```html
<script>
document.addEventListener('DOMContentLoaded', function() {
  // Find your form (adjust selector based on your form plugin)
  const newsletterForm = document.querySelector('#newsletter-form');

  if (newsletterForm) {
    newsletterForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      const email = newsletterForm.querySelector('input[type="email"]').value;

      try {
        const response = await fetch('YOUR_API_URL/newsletter/wordpress-subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: email
          })
        });

        const data = await response.json();

        if (data.success) {
          alert('Successfully subscribed! Check your email.');
          newsletterForm.reset();
        } else {
          alert(data.error || 'Subscription failed. Please try again.');
        }
      } catch (error) {
        alert('Network error. Please try again.');
      }
    });
  }
});
</script>
```

**Replace `YOUR_API_URL`** with your backend URL:
- Local: `http://localhost:3000/api`
- Production: `https://your-backend-domain.com/api`

---

## Method 2: PHP Integration (Advanced)

### 1. Create Custom Function

Add this to your theme's `functions.php`:

```php
<?php
function privatecharterx_newsletter_subscribe($email) {
    $api_url = 'YOUR_API_URL/newsletter/wordpress-subscribe';

    $response = wp_remote_post($api_url, array(
        'headers' => array('Content-Type' => 'application/json'),
        'body' => json_encode(array(
            'email' => $email
        ))
    ));

    if (is_wp_error($response)) {
        return array('success' => false, 'error' => 'Network error');
    }

    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);

    return $data;
}
?>
```

### 2. Hook into Form Submission

For Contact Form 7:

```php
<?php
add_action('wpcf7_before_send_mail', 'handle_newsletter_subscription');

function handle_newsletter_subscription($contact_form) {
    $submission = WPCF7_Submission::get_instance();

    if ($submission) {
        $posted_data = $submission->get_posted_data();

        if (isset($posted_data['your-email'])) {
            $email = sanitize_email($posted_data['your-email']);
            $result = privatecharterx_newsletter_subscribe($email);

            // Log result or handle errors
            if (!$result['success']) {
                error_log('Newsletter subscription failed: ' . $result['error']);
            }
        }
    }
}
?>
```

---

## Method 3: Webhook Integration (Zapier/Make.com)

### Using Zapier:

1. **Trigger**: New Form Submission (WordPress)
2. **Action**: Webhooks by Zapier → POST Request
3. **URL**: `YOUR_API_URL/newsletter/wordpress-subscribe`
4. **Method**: POST
5. **Data**:
   ```json
   {
     "email": "{{email_field}}"
   }
   ```

### Using Make.com (formerly Integromat):

1. **Trigger**: WordPress → Watch New Form Submissions
2. **Action**: HTTP → Make a Request
3. **URL**: `YOUR_API_URL/newsletter/wordpress-subscribe`
4. **Method**: POST
5. **Body**:
   ```json
   {
     "email": "{{email}}"
   }
   ```

---

## Testing the Integration

### 1. Test Locally

```bash
curl -X POST http://localhost:3000/api/newsletter/wordpress-subscribe \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

Expected response:
```json
{
  "success": true,
  "message": "Successfully subscribed! Check your email.",
  "subscription": {
    "email": "test@example.com",
    "status": "active"
  }
}
```

### 2. Test on WordPress

1. Go to your WordPress blog
2. Fill out the newsletter form
3. Submit
4. Check your Admin Dashboard: `/admin/newsletter`
5. Verify the subscriber appears with `source: wordpress`

---

## Verifying Integration

### Admin Dashboard Check:

1. Go to: `https://your-domain.com/admin/newsletter`
2. Click "Dashboard" tab
3. Check "Subscriber Sources" - you should see WordPress count increase
4. Click "Subscribers" tab
5. Filter by source: "wordpress"
6. Verify new subscribers appear

---

## Customization

### Custom Welcome Email for WordPress Subscribers

You can create a separate welcome email template specifically for WordPress subscribers:

1. Go to `/admin/newsletter`
2. Click "Templates" tab
3. Create new template: "Welcome Email - WordPress"
4. Customize the content to mention the blog

Then modify the backend to send different templates based on source.

---

## Troubleshooting

### Emails Not Arriving

**Check:**
1. Spam folder
2. Resend account email limit (3,000/month free)
3. Backend server logs
4. Admin Dashboard → Newsletter → Dashboard (check stats)

### CORS Errors

If you get CORS errors when calling from WordPress:

**Backend Fix (.env.backend):**
```env
FRONTEND_URL=https://privatecharterx.blog,https://privatecharterx.com
```

**Or in server.js:**
```javascript
app.use(cors({
  origin: [
    'https://privatecharterx.com',
    'https://privatecharterx.blog',
    'http://localhost:5173'
  ],
  credentials: true
}));
```

### WordPress Form Not Submitting

**Debug Steps:**
1. Open Browser Console (F12)
2. Check for JavaScript errors
3. Verify API URL is correct
4. Test API endpoint with curl
5. Check network tab for failed requests

---

## Security Considerations

### Rate Limiting

The API automatically limits:
- Max 5 subscriptions per IP per hour
- Prevents spam and abuse

### Email Validation

- Server-side validation
- Regex check for valid email format
- Duplicate prevention

### HTTPS Required

Always use HTTPS in production:
- ✅ `https://api.privatecharterx.com/newsletter/wordpress-subscribe`
- ❌ `http://api.privatecharterx.com/newsletter/wordpress-subscribe`

---

## Example: Complete WordPress Plugin

Create file: `wp-content/plugins/privatecharterx-newsletter/privatecharterx-newsletter.php`

```php
<?php
/**
 * Plugin Name: PrivateCharterX Newsletter
 * Description: Integrates WordPress with PrivateCharterX Newsletter System
 * Version: 1.0
 * Author: PrivateCharterX
 */

define('PRIVATECHARTERX_API_URL', 'YOUR_API_URL_HERE');

// Add shortcode: [privatecharterx_newsletter]
add_shortcode('privatecharterx_newsletter', 'privatecharterx_newsletter_form');

function privatecharterx_newsletter_form() {
    ob_start();
    ?>
    <form id="pcx-newsletter-form" class="pcx-newsletter">
        <div class="pcx-form-group">
            <input type="email" name="email" placeholder="Enter your email" required>
            <button type="submit">Subscribe</button>
        </div>
        <div class="pcx-message"></div>
    </form>

    <script>
    document.getElementById('pcx-newsletter-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = this.querySelector('input[name="email"]').value;
        const messageDiv = this.querySelector('.pcx-message');

        try {
            const response = await fetch('<?php echo PRIVATECHARTERX_API_URL; ?>/newsletter/wordpress-subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email })
            });

            const data = await response.json();

            if (data.success) {
                messageDiv.innerHTML = '<p class="success">✅ Successfully subscribed!</p>';
                this.reset();
            } else {
                messageDiv.innerHTML = '<p class="error">❌ ' + (data.error || 'Subscription failed') + '</p>';
            }
        } catch (error) {
            messageDiv.innerHTML = '<p class="error">❌ Network error. Please try again.</p>';
        }
    });
    </script>

    <style>
    .pcx-newsletter input[type="email"] {
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        width: 300px;
    }
    .pcx-newsletter button {
        padding: 10px 20px;
        background: #111827;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }
    .pcx-newsletter button:hover {
        background: #000;
    }
    .pcx-message { margin-top: 10px; }
    .pcx-message .success { color: green; }
    .pcx-message .error { color: red; }
    </style>
    <?php
    return ob_get_clean();
}
?>
```

**Usage:**
1. Upload to WordPress
2. Activate plugin
3. Add shortcode `[privatecharterx_newsletter]` to any page/post
4. Done!

---

## Support

For issues or questions:
- Check Admin Dashboard stats
- Review backend logs
- Test API endpoint directly
- Verify CORS settings

---

**🎉 Your WordPress blog is now integrated with PrivateCharterX Newsletter System!**
