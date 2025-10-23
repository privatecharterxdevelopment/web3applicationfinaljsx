-- Create password reset tokens table
create table password_reset_tokens (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references users(id) on delete cascade not null,
    token text not null unique,
    expires_at timestamp with time zone not null,
    used boolean default false not null,
    created_at timestamp with time zone default now() not null,
    used_at timestamp with time zone default null
);

-- Add indexes for performance
create index idx_password_reset_tokens_token on password_reset_tokens(token);
create index idx_password_reset_tokens_user_id on password_reset_tokens(user_id);
create index idx_password_reset_tokens_expires_at on password_reset_tokens(expires_at);

-- Add RLS policies
alter table password_reset_tokens enable row level security;

-- Users can only see their own reset tokens
create policy "Users can view own reset tokens" on password_reset_tokens
    for select using (auth.uid() = user_id);

-- Only allow inserts for authenticated users (via functions)
create policy "Allow insert for authenticated users" on password_reset_tokens
    for insert with check (true);

-- Allow updates to mark tokens as used
create policy "Allow update to mark as used" on password_reset_tokens
    for update using (true);

-- Auto-cleanup expired tokens
create or replace function cleanup_expired_reset_tokens()
returns void
language plpgsql
security definer
as $$
begin
    delete from password_reset_tokens 
    where expires_at < now() - interval '24 hours';
end;
$$;

-- Create a scheduled job to cleanup expired tokens daily
select cron.schedule('cleanup-expired-reset-tokens', '0 2 * * *', 'select cleanup_expired_reset_tokens();');

-- Function to verify a reset token
CREATE OR REPLACE FUNCTION verify_reset_token(token_value TEXT)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    expires_at TIMESTAMPTZ,
    is_valid BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        prt.id,
        prt.user_id,
        prt.expires_at,
        (prt.expires_at > NOW() AND prt.used_at IS NULL) as is_valid
    FROM password_reset_tokens prt
    WHERE prt.token = token_value;
END;
$$;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION verify_reset_token(TEXT) TO anon;