// Sync user metadata with application
function syncUserMetadata(user, context, callback) {
  // Only run for our application
  if (context.clientID !== configuration.APP_CLIENT_ID) {
    return callback(null, user, context);
  }

  // Get user metadata
  const namespace = 'https://privatecharterx.com';
  const metadata = context.idToken || {};

  // Add admin status to tokens
  const isAdmin = user.app_metadata && user.app_metadata.is_admin === true;
  metadata[`${namespace}/is_admin`] = isAdmin;

  // Add user roles if they exist
  if (context.authorization && context.authorization.roles) {
    metadata[`${namespace}/roles`] = context.authorization.roles;
  }

  // Add user profile data
  metadata[`${namespace}/name`] = user.name || user.email;
  metadata[`${namespace}/email_verified`] = user.email_verified;

  // Update the tokens
  context.idToken = metadata;
  context.accessToken[`${namespace}/is_admin`] = isAdmin;

  callback(null, user, context);
}