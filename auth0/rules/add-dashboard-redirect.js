// Add dashboard redirect for authenticated users
function addDashboardRedirect(user, context, callback) {
  // Only run for our application
  if (context.clientID !== configuration.APP_CLIENT_ID) {
    return callback(null, user, context);
  }

  // Check if this is a first-time login
  const isFirstLogin = !user.app_metadata || !user.app_metadata.last_login;

  // Add dashboard redirect
  if (context.protocol === 'redirect-callback') {
    context.redirect = {
      url: isFirstLogin ? '/dashboard?setup=true' : '/dashboard'
    };
  }

  // Update last login
  user.app_metadata = user.app_metadata || {};
  user.app_metadata.last_login = new Date().toISOString();

  auth0.users.updateAppMetadata(user.user_id, user.app_metadata)
    .then(() => {
      callback(null, user, context);
    })
    .catch((err) => {
      callback(err);
    });
}