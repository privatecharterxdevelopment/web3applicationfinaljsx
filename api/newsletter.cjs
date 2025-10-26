// ============================================================
// Newsletter API Endpoints
// Handles newsletter subscriptions, templates, and sending
// ============================================================

const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

// Lazy initialization to prevent crashes if env vars not set
let supabase;
function getSupabase() {
  if (!supabase) {
    supabase = createClient(
      process.env.SUPABASE_URL || 'https://oubecmstqtzdnevyqavu.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key_for_startup'
    );
  }
  return supabase;
}

let resend;
function getResend() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const FROM_EMAIL = process.env.NEWSLETTER_FROM_EMAIL || 'newsletter@privatecharterx.com';
const FROM_NAME = process.env.NEWSLETTER_FROM_NAME || 'PrivateCharterX';

// ============================================================
// Helper Functions
// ============================================================

/**
 * Replace template variables with actual values
 */
function replaceTemplateVariables(html, variables) {
  let result = html;
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, variables[key] || '');
  });
  return result;
}

/**
 * Send email via Resend
 */
async function sendEmail({ to, subject, html }) {
  try {
    const { data, error } = await getResend().emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject: subject,
      html: html
    });

    if (error) {
      console.error('❌ Resend error:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Log sent email to database
 */
async function logEmailSent({ templateId, recipientEmail, subject, status, errorMessage = null }) {
  try {
    const { error } = await getSupabase()
      .from('newsletter_send_log')
      .insert({
        template_id: templateId,
        recipient_email: recipientEmail,
        subject: subject,
        status: status,
        error_message: errorMessage
      });

    if (error) {
      console.error('❌ Error logging email:', error);
    }
  } catch (error) {
    console.error('❌ Error logging email:', error);
  }
}

// ============================================================
// API Endpoints
// ============================================================

/**
 * POST /api/newsletter/subscribe
 * Subscribe a new email to newsletter
 */
async function subscribe(req, res) {
  try {
    const { email, source = 'web' } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email address'
      });
    }

    // Check if email already exists
    const { data: existing } = await getSupabase()
      .from('newsletter_subscriptions')
      .select('*')
      .eq('email', email)
      .single();

    if (existing) {
      if (existing.status === 'unsubscribed') {
        // Resubscribe
        const { error } = await getSupabase()
          .from('newsletter_subscriptions')
          .update({
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('email', email);

        if (error) throw error;

        return res.json({
          success: true,
          message: 'Welcome back! Your subscription has been reactivated.',
          resubscribed: true
        });
      }

      return res.status(409).json({
        success: false,
        error: 'Email already subscribed'
      });
    }

    // Create new subscription
    const { data: subscription, error: subscriptionError } = await getSupabase()
      .from('newsletter_subscriptions')
      .insert({
        email: email,
        source: source,
        status: 'active',
        verified_at: new Date().toISOString()
      })
      .select()
      .single();

    if (subscriptionError) throw subscriptionError;

    // Get welcome email template
    const { data: template } = await getSupabase()
      .from('newsletter_templates')
      .select('*')
      .eq('category', 'welcome')
      .eq('is_active', true)
      .single();

    if (template) {
      // Prepare template variables
      const variables = {
        email: email,
        preferencesLink: `${FRONTEND_URL}/newsletter/preferences?token=${subscription.unsubscribe_token}`,
        unsubscribeLink: `${FRONTEND_URL}/newsletter/unsubscribe?token=${subscription.unsubscribe_token}`
      };

      // Replace variables in HTML
      const htmlContent = replaceTemplateVariables(template.html_content, variables);

      // Send welcome email
      const emailResult = await sendEmail({
        to: email,
        subject: template.subject,
        html: htmlContent
      });

      // Log email send
      await logEmailSent({
        templateId: template.id,
        recipientEmail: email,
        subject: template.subject,
        status: emailResult.success ? 'sent' : 'failed',
        errorMessage: emailResult.error || null
      });

      // Update last_email_sent_at
      await getSupabase()
        .from('newsletter_subscriptions')
        .update({ last_email_sent_at: new Date().toISOString() })
        .eq('id', subscription.id);
    }

    res.json({
      success: true,
      message: 'Successfully subscribed! Check your email for a welcome message.',
      subscription: {
        email: subscription.email,
        status: subscription.status
      }
    });

  } catch (error) {
    console.error('❌ Subscribe error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to subscribe. Please try again.'
    });
  }
}

/**
 * POST /api/newsletter/unsubscribe
 * Unsubscribe from newsletter
 */
async function unsubscribe(req, res) {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Unsubscribe token is required'
      });
    }

    const { data: subscription, error } = await getSupabase()
      .from('newsletter_subscriptions')
      .update({
        status: 'unsubscribed',
        updated_at: new Date().toISOString()
      })
      .eq('unsubscribe_token', token)
      .select()
      .single();

    if (error || !subscription) {
      return res.status(404).json({
        success: false,
        error: 'Invalid unsubscribe token'
      });
    }

    res.json({
      success: true,
      message: 'Successfully unsubscribed from newsletter.',
      email: subscription.email
    });

  } catch (error) {
    console.error('❌ Unsubscribe error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unsubscribe. Please try again.'
    });
  }
}

/**
 * PATCH /api/newsletter/preferences
 * Update newsletter preferences
 */
async function updatePreferences(req, res) {
  try {
    const { token, preferences } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required'
      });
    }

    const { data: subscription, error } = await getSupabase()
      .from('newsletter_subscriptions')
      .update({
        preferences: preferences,
        updated_at: new Date().toISOString()
      })
      .eq('unsubscribe_token', token)
      .select()
      .single();

    if (error || !subscription) {
      return res.status(404).json({
        success: false,
        error: 'Invalid token'
      });
    }

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: subscription.preferences
    });

  } catch (error) {
    console.error('❌ Update preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update preferences'
    });
  }
}

/**
 * GET /api/newsletter/preferences
 * Get newsletter preferences for a token
 */
async function getPreferences(req, res) {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required'
      });
    }

    const { data: subscription, error } = await getSupabase()
      .from('newsletter_subscriptions')
      .select('email, preferences, status')
      .eq('unsubscribe_token', token)
      .single();

    if (error || !subscription) {
      return res.status(404).json({
        success: false,
        error: 'Invalid token'
      });
    }

    res.json({
      success: true,
      email: subscription.email,
      preferences: subscription.preferences,
      status: subscription.status
    });

  } catch (error) {
    console.error('❌ Get preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get preferences'
    });
  }
}

/**
 * GET /api/newsletter/subscribers
 * Get all subscribers (Admin only)
 */
async function getSubscribers(req, res) {
  try {
    const { status, source, limit = 100, offset = 0 } = req.query;

    let query = supabase
      .from('newsletter_subscriptions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (source) {
      query = query.eq('source', source);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      subscribers: data,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('❌ Get subscribers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscribers'
    });
  }
}

/**
 * GET /api/newsletter/stats
 * Get newsletter statistics (Admin only)
 */
async function getStats(req, res) {
  try {
    // Get total subscribers
    const { count: totalSubscribers } = await getSupabase()
      .from('newsletter_subscriptions')
      .select('*', { count: 'exact', head: true });

    // Get active subscribers
    const { count: activeSubscribers } = await getSupabase()
      .from('newsletter_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Get unsubscribed count
    const { count: unsubscribed } = await getSupabase()
      .from('newsletter_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'unsubscribed');

    // Get web vs wordpress split
    const { count: webSubscribers } = await getSupabase()
      .from('newsletter_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'web');

    const { count: wordpressSubscribers } = await getSupabase()
      .from('newsletter_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'wordpress');

    // Get total emails sent
    const { count: totalEmailsSent } = await getSupabase()
      .from('newsletter_send_log')
      .select('*', { count: 'exact', head: true });

    // Get recent subscribers (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: recentSubscribers } = await getSupabase()
      .from('newsletter_subscriptions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());

    res.json({
      success: true,
      stats: {
        totalSubscribers: totalSubscribers || 0,
        activeSubscribers: activeSubscribers || 0,
        unsubscribed: unsubscribed || 0,
        webSubscribers: webSubscribers || 0,
        wordpressSubscribers: wordpressSubscribers || 0,
        totalEmailsSent: totalEmailsSent || 0,
        recentSubscribers: recentSubscribers || 0
      }
    });

  } catch (error) {
    console.error('❌ Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
}

/**
 * POST /api/newsletter/send
 * Send newsletter to subscribers (Admin only)
 */
async function sendNewsletter(req, res) {
  try {
    const { templateId, category, testEmail } = req.body;

    // Get template
    const { data: template, error: templateError } = await getSupabase()
      .from('newsletter_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    // If test email, send only to test address
    if (testEmail) {
      const variables = {
        email: testEmail,
        preferencesLink: `${FRONTEND_URL}/newsletter/preferences?token=test-token`,
        unsubscribeLink: `${FRONTEND_URL}/newsletter/unsubscribe?token=test-token`
      };

      const htmlContent = replaceTemplateVariables(template.html_content, variables);

      const result = await sendEmail({
        to: testEmail,
        subject: `[TEST] ${template.subject}`,
        html: htmlContent
      });

      return res.json({
        success: result.success,
        message: result.success ? 'Test email sent successfully' : 'Failed to send test email',
        error: result.error
      });
    }

    // Get subscribers based on category preference
    let query = supabase
      .from('newsletter_subscriptions')
      .select('email, unsubscribe_token, preferences')
      .eq('status', 'active');

    // Filter by preference if not a welcome email
    if (category !== 'welcome' && category !== 'generalUpdates') {
      // Only send to subscribers who have this preference enabled
      query = query.filter('preferences', 'cs', `{"${category}": true}`);
    }

    const { data: subscribers, error: subscribersError } = await query;

    if (subscribersError) throw subscribersError;

    if (!subscribers || subscribers.length === 0) {
      return res.json({
        success: true,
        message: 'No subscribers match the criteria',
        sent: 0
      });
    }

    // Send to all subscribers
    let successCount = 0;
    let failCount = 0;

    for (const subscriber of subscribers) {
      const variables = {
        email: subscriber.email,
        preferencesLink: `${FRONTEND_URL}/newsletter/preferences?token=${subscriber.unsubscribe_token}`,
        unsubscribeLink: `${FRONTEND_URL}/newsletter/unsubscribe?token=${subscriber.unsubscribe_token}`
      };

      const htmlContent = replaceTemplateVariables(template.html_content, variables);

      const result = await sendEmail({
        to: subscriber.email,
        subject: template.subject,
        html: htmlContent
      });

      // Log result
      await logEmailSent({
        templateId: template.id,
        recipientEmail: subscriber.email,
        subject: template.subject,
        status: result.success ? 'sent' : 'failed',
        errorMessage: result.error || null
      });

      if (result.success) {
        successCount++;
        // Update last_email_sent_at
        await getSupabase()
          .from('newsletter_subscriptions')
          .update({ last_email_sent_at: new Date().toISOString() })
          .eq('email', subscriber.email);
      } else {
        failCount++;
      }

      // Rate limiting: Wait 100ms between emails to avoid hitting Resend limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Update template last_used_at
    await getSupabase()
      .from('newsletter_templates')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', templateId);

    res.json({
      success: true,
      message: `Newsletter sent to ${successCount} subscribers`,
      sent: successCount,
      failed: failCount,
      total: subscribers.length
    });

  } catch (error) {
    console.error('❌ Send newsletter error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send newsletter'
    });
  }
}

/**
 * GET /api/newsletter/templates
 * Get all newsletter templates (Admin only)
 */
async function getTemplates(req, res) {
  try {
    const { data: templates, error } = await getSupabase()
      .from('newsletter_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      templates: templates || []
    });

  } catch (error) {
    console.error('❌ Get templates error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch templates'
    });
  }
}

/**
 * POST /api/newsletter/templates
 * Create new newsletter template (Admin only)
 */
async function createTemplate(req, res) {
  try {
    const { name, subject, category, html_content, variables } = req.body;

    const { data: template, error } = await getSupabase()
      .from('newsletter_templates')
      .insert({
        name,
        subject,
        category,
        html_content,
        variables: variables || []
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Template created successfully',
      template
    });

  } catch (error) {
    console.error('❌ Create template error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create template'
    });
  }
}

/**
 * PATCH /api/newsletter/templates/:id
 * Update newsletter template (Admin only)
 */
async function updateTemplate(req, res) {
  try {
    const { id } = req.params;
    const { name, subject, category, html_content, variables, is_active } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (subject !== undefined) updateData.subject = subject;
    if (category !== undefined) updateData.category = category;
    if (html_content !== undefined) updateData.html_content = html_content;
    if (variables !== undefined) updateData.variables = variables;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: template, error } = await getSupabase()
      .from('newsletter_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    res.json({
      success: true,
      message: 'Template updated successfully',
      template
    });

  } catch (error) {
    console.error('❌ Update template error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update template'
    });
  }
}

/**
 * DELETE /api/newsletter/templates/:id
 * Delete newsletter template (Admin only)
 */
async function deleteTemplate(req, res) {
  try {
    const { id } = req.params;

    const { error } = await getSupabase()
      .from('newsletter_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete template error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete template'
    });
  }
}

/**
 * POST /api/newsletter/wordpress-subscribe
 * WordPress integration endpoint
 */
async function wordpressSubscribe(req, res) {
  try {
    const { email } = req.body;

    // Reuse the subscribe function with source = 'wordpress'
    req.body.source = 'wordpress';
    return subscribe(req, res);

  } catch (error) {
    console.error('❌ WordPress subscribe error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to subscribe from WordPress'
    });
  }
}

// Export all functions
module.exports = {
  subscribe,
  unsubscribe,
  updatePreferences,
  getPreferences,
  getSubscribers,
  getStats,
  sendNewsletter,
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  wordpressSubscribe
};
