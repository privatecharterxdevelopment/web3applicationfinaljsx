/**
 * CRM admin API — Supabase service role stays on server only.
 */
const { createClient } = require('@supabase/supabase-js');

const ALLOWED_TABLES = new Set([
  'users',
  'user_bookings',
  'user_requests',
  'user_profiles',
  'user_subscriptions',
  'ai_chat_sessions',
  'support_tickets',
  'transactions',
  'chat_messages',
  'chat_requests',
  'EmptyLegs_',
  'wines',
  'premium_cigars',
  'tokenization_drafts',
  'card_applications',
  'pvcx_balance',
  'kyc_applications',
  'notifications',
]);

const SPECIAL_CRM_EMAILS = new Set(['aziz.electricwala20@gmail.com']);

function getEnv() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { url, anonKey, serviceKey };
}

async function verifyAdmin(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;

  const jwt = authHeader.slice(7);
  const { url, anonKey, serviceKey } = getEnv();
  if (!url || !anonKey || !serviceKey) {
    throw new Error('Server missing Supabase configuration');
  }

  const userClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: { user }, error } = await userClient.auth.getUser(jwt);
  if (error || !user) return null;

  const email = (user.email || '').toLowerCase();
  if (SPECIAL_CRM_EMAILS.has(email)) return user;
  if (user.user_metadata?.is_admin === true) return user;

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: row } = await admin
    .from('users')
    .select('is_admin, user_role')
    .eq('id', user.id)
    .maybeSingle();

  if (row?.is_admin || row?.user_role === 'admin' || row?.user_role === 'super_admin') {
    return user;
  }

  return null;
}

function buildTableQuery(admin, payload) {
  const { table, action, select, selectOptions, filters, body, singleMode } = payload;

  if (!ALLOWED_TABLES.has(table)) {
    throw new Error(`Table not allowed: ${table}`);
  }

  let q = admin.from(table);

  if (action === 'select') {
    q = q.select(select ?? '*', selectOptions ?? {});
    for (const f of filters || []) {
      q = q[f.method](...f.args);
    }
    if (singleMode === 'single') q = q.single();
    if (singleMode === 'maybeSingle') q = q.maybeSingle();
    return q;
  }

  if (action === 'update') {
    q = q.update(body);
    for (const f of filters || []) {
      q = q[f.method](...f.args);
    }
    return q;
  }

  if (action === 'insert') {
    return q.insert(body);
  }

  throw new Error(`Unsupported action: ${action}`);
}

async function executePayload(admin, payload) {
  if (payload.authOp === 'listUsers') {
    return admin.auth.admin.listUsers(payload.params || {});
  }
  if (payload.authOp === 'getUserById') {
    const id = payload.params?.id ?? payload.params;
    return admin.auth.admin.getUserById(id);
  }

  return buildTableQuery(admin, payload);
}

async function handleCrmAdmin(req, res) {
  try {
    const user = await verifyAdmin(req);
    if (!user) {
      return res.status(403).json({ error: 'Forbidden', message: 'CRM admin access required' });
    }

    const { url, serviceKey } = getEnv();
    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const payload = req.body;
    if (!payload || (typeof payload !== 'object')) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const result = await executePayload(admin, payload);
    return res.json({ result });
  } catch (err) {
    console.error('[crm-admin]', err);
    return res.status(500).json({
      error: err.message || 'CRM admin request failed',
    });
  }
}

module.exports = { handleCrmAdmin };
