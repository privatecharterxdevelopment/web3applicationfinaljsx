/**
 * Browser-safe CRM admin client — calls /api/crm-admin (service role on server only).
 */
import { supabase } from './supabase';

function getCrmAdminUrl() {
  const base = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  if (!base) return '/api/crm-admin';
  if (base.endsWith('/api')) return `${base}/crm-admin`;
  return `${base}/api/crm-admin`;
}

async function getAccessToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function postCrmAdmin(payload) {
  const token = await getAccessToken();
  if (!token) {
    return { data: null, error: { message: 'Not authenticated' }, count: null };
  }

  const url = getCrmAdminUrl();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  let json;
  try {
    json = await res.json();
  } catch {
    json = { error: { message: res.statusText } };
  }

  if (!res.ok) {
    const message = json?.message || json?.error?.message || json?.error || res.statusText;
    return { data: null, error: { message }, count: null };
  }

  if (json.result !== undefined) {
    return json.result;
  }

  return { data: null, error: { message: 'Empty CRM admin response' }, count: null };
}

class AdminQueryBuilder {
  constructor(table) {
    this.table = table;
    this.action = 'select';
    this._select = '*';
    this._selectOptions = {};
    this._filters = [];
    this._body = null;
    this._singleMode = null;
  }

  select(columns = '*', options = {}) {
    this.action = 'select';
    this._select = columns;
    this._selectOptions = options || {};
    return this;
  }

  update(body) {
    this.action = 'update';
    this._body = body;
    return this;
  }

  insert(body) {
    this.action = 'insert';
    this._body = body;
    return this;
  }

  eq(column, value) {
    this._filters.push({ method: 'eq', args: [column, value] });
    return this;
  }

  neq(column, value) {
    this._filters.push({ method: 'neq', args: [column, value] });
    return this;
  }

  or(expression) {
    this._filters.push({ method: 'or', args: [expression] });
    return this;
  }

  not(column, operator, value) {
    this._filters.push({ method: 'not', args: [column, operator, value] });
    return this;
  }

  gte(column, value) {
    this._filters.push({ method: 'gte', args: [column, value] });
    return this;
  }

  lte(column, value) {
    this._filters.push({ method: 'lte', args: [column, value] });
    return this;
  }

  gt(column, value) {
    this._filters.push({ method: 'gt', args: [column, value] });
    return this;
  }

  lt(column, value) {
    this._filters.push({ method: 'lt', args: [column, value] });
    return this;
  }

  in(column, values) {
    this._filters.push({ method: 'in', args: [column, values] });
    return this;
  }

  order(column, options = {}) {
    this._filters.push({ method: 'order', args: [column, options] });
    return this;
  }

  limit(count) {
    this._filters.push({ method: 'limit', args: [count] });
    return this;
  }

  single() {
    this._singleMode = 'single';
    return this;
  }

  maybeSingle() {
    this._singleMode = 'maybeSingle';
    return this;
  }

  _payload() {
    return {
      table: this.table,
      action: this.action,
      select: this._select,
      selectOptions: this._selectOptions,
      filters: this._filters,
      body: this._body,
      singleMode: this._singleMode,
    };
  }

  then(onFulfilled, onRejected) {
    return postCrmAdmin(this._payload()).then(onFulfilled, onRejected);
  }
}

export const supabaseAdmin = {
  from(table) {
    return new AdminQueryBuilder(table);
  },
  auth: {
    admin: {
      listUsers: (params) => postCrmAdmin({ authOp: 'listUsers', params: params || {} }),
      getUserById: (id) => postCrmAdmin({ authOp: 'getUserById', params: { id } }),
    },
  },
};

export default supabaseAdmin;
