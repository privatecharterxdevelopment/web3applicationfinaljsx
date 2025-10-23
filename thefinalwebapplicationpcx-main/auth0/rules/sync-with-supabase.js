// Sync user data with Supabase
function syncWithSupabase(user, context, callback) {
  // Only run for our application
  if (context.clientID !== configuration.APP_CLIENT_ID) {
    return callback(null, user, context);
  }

  const request = require('request');
  const SUPABASE_URL = configuration.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = configuration.SUPABASE_SERVICE_KEY;

  // Get registration data from session if available
  let registrationData = {};
  if (context.protocol === 'redirect-callback' && context.request.query.registration_data) {
    try {
      registrationData = JSON.parse(decodeURIComponent(context.request.query.registration_data));
    } catch (e) {
      console.log('Error parsing registration data:', e);
    }
  }

  request.post({
    url: `${SUPABASE_URL}/rest/v1/users`,
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify({
      id: user.user_id,
      email: user.email,
      name: registrationData.username || user.name || user.email,
      email_verified: user.email_verified,
      is_admin: user.app_metadata && user.app_metadata.is_admin === true,
      last_login: new Date().toISOString()
    })
  }, function(error, response, body) {
    if (error) {
      console.log('Error syncing user:', error);
      return callback(error);
    }

    // Create user profile if registration data exists
    if (registrationData.phone) {
      request.post({
        url: `${SUPABASE_URL}/rest/v1/user_profiles`,
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          user_id: user.user_id,
          phone: registrationData.phone
        })
      }, function(profileError) {
        if (profileError) {
          console.log('Error creating user profile:', profileError);
        }
      });
    }

    callback(null, user, context);
  });
}