-- ============================================================
-- Newsletter System Tables
-- ============================================================

-- Newsletter Subscriptions Table
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'pending')),
  source TEXT DEFAULT 'web' CHECK (source IN ('web', 'wordpress')),
  preferences JSONB DEFAULT '{"emptyLegs": true, "luxuryCars": true, "adventures": true, "generalUpdates": true}'::jsonb,
  unsubscribe_token TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  verified_at TIMESTAMP,
  last_email_sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Newsletter Templates Table (Editable in Admin Panel)
CREATE TABLE IF NOT EXISTS newsletter_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('welcome', 'emptyLegs', 'luxuryCars', 'adventures', 'generalUpdates')),
  html_content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb, -- Available template variables like {{name}}, {{email}}, {{unsubscribeLink}}
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Newsletter Send Log (Track all sent newsletters)
CREATE TABLE IF NOT EXISTS newsletter_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES newsletter_templates(id),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced')),
  error_message TEXT,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  sent_at TIMESTAMP DEFAULT NOW()
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON newsletter_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_source ON newsletter_subscriptions(source);
CREATE INDEX IF NOT EXISTS idx_newsletter_created ON newsletter_subscriptions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_templates_category ON newsletter_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_active ON newsletter_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_send_log_recipient ON newsletter_send_log(recipient_email);
CREATE INDEX IF NOT EXISTS idx_send_log_sent_at ON newsletter_send_log(sent_at DESC);

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_newsletter_subscriptions_updated_at ON newsletter_subscriptions;
CREATE TRIGGER update_newsletter_subscriptions_updated_at
  BEFORE UPDATE ON newsletter_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_newsletter_templates_updated_at ON newsletter_templates;
CREATE TRIGGER update_newsletter_templates_updated_at
  BEFORE UPDATE ON newsletter_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_send_log ENABLE ROW LEVEL SECURITY;

-- Policies for newsletter_subscriptions
-- Users can only view/update their own subscription
CREATE POLICY "Users can view own subscription"
  ON newsletter_subscriptions FOR SELECT
  USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "Users can update own subscription"
  ON newsletter_subscriptions FOR UPDATE
  USING (auth.jwt() ->> 'email' = email);

-- Public can insert (for subscription forms)
CREATE POLICY "Anyone can subscribe"
  ON newsletter_subscriptions FOR INSERT
  WITH CHECK (true);

-- Admins can view all
CREATE POLICY "Admins can view all subscriptions"
  ON newsletter_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role = 'admin'
    )
  );

-- Policies for newsletter_templates
-- Only admins can manage templates
CREATE POLICY "Admins can view all templates"
  ON newsletter_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert templates"
  ON newsletter_templates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update templates"
  ON newsletter_templates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete templates"
  ON newsletter_templates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role = 'admin'
    )
  );

-- Policies for newsletter_send_log
CREATE POLICY "Admins can view send log"
  ON newsletter_send_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.email = auth.jwt() ->> 'email'
      AND users.role = 'admin'
    )
  );

CREATE POLICY "System can insert send log"
  ON newsletter_send_log FOR INSERT
  WITH CHECK (true);

-- Insert Default Newsletter Templates
INSERT INTO newsletter_templates (name, subject, category, html_content, variables) VALUES
(
  'Welcome Email',
  'Welcome to PrivateCharterX - The Future of Luxury Travel',
  'welcome',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to PrivateCharterX</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #111827 0%, #374151 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 300;">Welcome to PrivateCharterX</h1>
              <p style="margin: 10px 0 0; color: #d1d5db; font-size: 14px;">The Future of Luxury Travel & Blockchain Innovation</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Dear Valued Member,
              </p>
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Thank you for subscribing to PrivateCharterX! You''re now part of an exclusive community revolutionizing luxury travel through Web3 and blockchain technology.
              </p>

              <div style="background-color: #f9fafb; border-left: 4px solid #111827; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 15px; color: #111827; font-size: 18px;">What to Expect:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                  <li style="margin-bottom: 10px;">🛩️ Exclusive empty leg flight deals</li>
                  <li style="margin-bottom: 10px;">🚗 Premium luxury car offers</li>
                  <li style="margin-bottom: 10px;">🌍 Exotic adventure packages</li>
                  <li style="margin-bottom: 10px;">💎 Early access to tokenized assets</li>
                  <li>📰 Platform updates and Web3 innovations</li>
                </ul>
              </div>

              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                You can customize your email preferences at any time to receive only the content that matters to you.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="{{preferencesLink}}" style="display: inline-block; background-color: #111827; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 500;">
                      Manage Preferences
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                PrivateCharterX - Blockchain-Powered Luxury Travel
              </p>
              <p style="margin: 0 0 15px; color: #9ca3af; font-size: 12px;">
                {{email}}
              </p>
              <p style="margin: 0; font-size: 12px;">
                <a href="{{unsubscribeLink}}" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  '["email", "preferencesLink", "unsubscribeLink"]'::jsonb
),
(
  'Empty Legs Newsletter',
  'Exclusive Empty Leg Deals - Save Up to 75%',
  'emptyLegs',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Empty Legs Newsletter</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">✈️ Exclusive Empty Leg Deals</h1>
              <p style="margin: 10px 0 0; color: #dbeafe; font-size: 14px;">Save up to 75% on Private Jet Flights</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 30px; color: #374151; font-size: 16px;">
                This week''s best empty leg opportunities - Book now before they''re gone!
              </p>

              <!-- Placeholder for dynamic content -->
              <div style="border: 2px dashed #e5e7eb; border-radius: 8px; padding: 30px; text-align: center; margin: 20px 0;">
                <p style="margin: 0; color: #6b7280; font-size: 14px;">
                  📝 Empty leg listings will be inserted here dynamically
                </p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="https://privatecharterx.com/glas" style="display: inline-block; background-color: #1e40af; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-size: 16px;">
                      View All Empty Legs
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 12px;">
                <a href="{{preferencesLink}}" style="color: #6b7280;">Manage Preferences</a> |
                <a href="{{unsubscribeLink}}" style="color: #6b7280;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  '["preferencesLink", "unsubscribeLink"]'::jsonb
),
(
  'Luxury Cars Newsletter',
  'Premium Luxury Car Collection - Exclusive Offers',
  'luxuryCars',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #78350f 0%, #92400e 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">🚗 Premium Luxury Cars</h1>
              <p style="margin: 10px 0 0; color: #fef3c7; font-size: 14px;">Exclusive Ground Transportation Offers</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 30px; color: #374151; font-size: 16px;">
                Experience luxury on the ground with our premium car collection.
              </p>

              <div style="border: 2px dashed #e5e7eb; border-radius: 8px; padding: 30px; text-align: center;">
                <p style="margin: 0; color: #6b7280; font-size: 14px;">
                  🚗 Luxury car offers will be inserted here
                </p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="https://privatecharterx.com/glas" style="display: inline-block; background-color: #92400e; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px;">
                      Browse Luxury Cars
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center;">
              <p style="margin: 0; font-size: 12px;">
                <a href="{{preferencesLink}}" style="color: #6b7280;">Preferences</a> |
                <a href="{{unsubscribeLink}}" style="color: #6b7280;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  '["preferencesLink", "unsubscribeLink"]'::jsonb
);

-- Success Message
DO $$
BEGIN
  RAISE NOTICE '✅ Newsletter system tables created successfully!';
  RAISE NOTICE '✅ Default email templates inserted!';
  RAISE NOTICE '✅ RLS policies configured!';
END $$;
