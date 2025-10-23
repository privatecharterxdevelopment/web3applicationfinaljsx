# Face Login Edge Function

## Purpose
Creates an authenticated Supabase session for users who have successfully verified their identity via Face ID.

## How It Works

1. **Input**: Receives `userId` from client after face verification
2. **Verification**:
   - Checks user exists in database
   - Verifies face authentication is active for this user
3. **Session Creation**:
   - Generates a magic link using Supabase Admin API
   - Extracts access and refresh tokens
   - Returns tokens to client
4. **Client**: Sets session using tokens

## Deployment

```bash
# Deploy to Supabase
supabase functions deploy face-login

# Or from Supabase dashboard:
# Functions → face-login → Deploy
```

## Environment Variables

Required in Supabase:
- `SUPABASE_URL` - Auto-provided by Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Auto-provided by Supabase

## Usage

Called from `LoginModal.tsx` after successful face verification:

```typescript
const { data } = await supabase.functions.invoke('face-login', {
  body: { userId: 'user-uuid' }
});

// Set session with returned tokens
await supabase.auth.setSession({
  access_token: data.session.access_token,
  refresh_token: data.session.refresh_token
});
```

## Security

- ✅ Requires active face_authentication record
- ✅ Uses service role key (admin access)
- ✅ Validates user exists
- ✅ Only creates session after face verification
- ✅ CORS headers configured

## Response Format

**Success:**
```json
{
  "success": true,
  "session": {
    "access_token": "eyJhbGc...",
    "refresh_token": "abc123...",
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    }
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message"
}
```

## Testing

```bash
# Test locally (requires Supabase CLI)
supabase functions serve face-login

# Test request
curl -X POST http://localhost:54321/functions/v1/face-login \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-uuid-here"}'
```

## Notes

- Only works for users with `face_authentication.is_active = true`
- Creates passwordless session (secure since face was verified)
- Session tokens are standard Supabase auth tokens
- AuthContext automatically picks up the session
