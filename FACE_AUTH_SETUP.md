# Face Authentication Setup Guide

## Overview

Face authentication has been successfully integrated into your PrivateCharterX application. This feature allows users to:
- Register their face during account creation
- Login using face verification
- Enhanced security with biometric authentication

## Architecture

### Components Created

1. **FaceCaptureCamera.tsx** - Live camera feed with face detection overlay
2. **FaceRegisterModal.tsx** - Registration flow with camera on right side (60%)
3. **FaceLoginModal.tsx** - Login verification with success/failure states
4. **SocialLoginButtons.tsx** - Google & Apple OAuth integration
5. **OrDivider.tsx** - Visual separator component

### Services

- **faceAuthService.ts** - Core face authentication logic
  - Face detection using face-api.js
  - Face descriptor encryption/decryption
  - Face comparison with 0.6 similarity threshold
  - Database operations for face data

### Database Schema

- **face_authentication** table - Stores encrypted face descriptors
- **user_profiles** additions - `face_login_enabled`, `face_registration_completed`

## Setup Instructions

### 1. Install Dependencies

```bash
npm install face-api.js
```

### 2. Download Face-API.js Models

Download the following model files to `/public/models/`:

- `tiny_face_detector_model-weights_manifest.json`
- `tiny_face_detector_model-shard1`
- `face_landmark_68_tiny_model-weights_manifest.json`
- `face_landmark_68_tiny_model-shard1`
- `face_recognition_model-weights_manifest.json`
- `face_recognition_model-shard1`
- `face_recognition_model-shard2`

Download from: https://github.com/justadudewhohacks/face-api.js/tree/master/weights

**Quick download command:**
```bash
cd public
mkdir -p models
cd models

# Download tiny face detector
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1

# Download face landmarks
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_tiny_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_tiny_model-shard1

# Download face recognition
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard2
```

### 3. Run Database Migration

Execute the SQL migration in Supabase SQL Editor:

```bash
# Open the file and copy contents to Supabase SQL Editor
cat database/face_authentication_migration.sql
```

Or run directly if you have Supabase CLI:
```bash
supabase db push
```

### 4. Configure OAuth Providers (Optional)

In Supabase Dashboard → Authentication → Providers:

**Google OAuth:**
1. Enable Google provider
2. Add your Google Client ID and Secret
3. Set redirect URL: `https://yourdomain.com/auth/callback`

**Apple OAuth:**
1. Enable Apple provider
2. Add your Apple Client ID and Team ID
3. Configure Service ID and Key ID

### 5. Add Hero Images

Add the following images to `/public/images/`:
- `auth-hero-login.jpg` (1080x1440px, portrait)
- `auth-hero-register.jpg` (1080x1440px, portrait)

Recommended specs:
- Resolution: 1080x1440px (3:4 ratio)
- Format: JPEG
- File size: < 500KB
- Style: High-quality, professional imagery

## User Flow

### Registration Flow

1. User fills in email/password (Step 1)
2. User adds phone number + reCAPTCHA verification (Step 2)
3. **Success modal shows** (2 seconds)
4. **NEW: "Enable Face Login?" choice modal appears**
   - Benefits listed (quick access, security, encryption)
   - Two options: "Enable Face Login" or "Skip for now"
5. If user clicks "Enable Face Login":
   - **FaceRegisterModal shows** with camera on right side (60%)
   - Instructions on left side (40%)
   - Camera automatically detects face
   - Face descriptor saved encrypted to database
   - Success screen shows (green checkmark)
6. User redirected to dashboard

### Login Flow

1. User enters email
2. User can choose:
   - **Traditional:** Enter password + click "Sign In"
   - **Face Login:** Click "Verify with Face ID" button (purple gradient)
3. If Face Login selected:
   - System checks if user has Face ID registered
   - Shows **FaceLoginModal** with camera on right side (60%)
   - Camera verifies face against stored descriptor
   - **Success:** Shows profile with black OK checkmark badge
   - **Failure:** Shows error with retry option
4. User redirected to dashboard

## Technical Details

### Face Detection
- Uses **face-api.js** (TensorFlow.js based)
- Detects face landmarks (68 points)
- Extracts 128-dimension face descriptor
- Real-time detection (checks every 500ms)

### Face Matching
- Compares descriptors using Euclidean distance
- Threshold: **0.6** (60% similarity required)
- Lower values = stricter matching
- Adjustable in `faceAuthService.ts`

### Security
- Face descriptors encrypted before storage
- Stored as JSONB in Supabase
- Row Level Security (RLS) enabled
- Users can only access their own face data
- No raw images stored

### Browser Compatibility
- Requires WebRTC support (getUserMedia API)
- Works on modern browsers:
  - Chrome/Edge (recommended)
  - Firefox
  - Safari (may require HTTPS)
- Requires camera permission

## Testing

### Test Registration with Face ID
1. Create new account
2. When "Enable Face Login?" appears, click "Enable Face Login"
3. Allow camera permission
4. Position face in frame
5. Wait for auto-capture and success screen

### Test Face Login
1. Go to login page
2. Enter your email
3. Click "Verify with Face ID"
4. Allow camera permission
5. Position face in frame
6. Should show success with your profile + black OK badge

### Troubleshooting

**Camera not working:**
- Check browser permissions
- Ensure HTTPS (required for production)
- Try different browser

**Face not detected:**
- Improve lighting
- Remove glasses/hat
- Face camera directly
- Ensure models are loaded (check console)

**Models not loading:**
- Verify files in `/public/models/`
- Check file names match exactly
- Check browser console for errors

**Verification fails:**
- Try re-registering face
- Ensure same lighting conditions
- Adjust threshold in `faceAuthService.ts` if needed

## Files Modified

### Components
- `src/components/LoginModal.tsx` - Added Face ID button
- `src/components/RegisterModal.tsx` - Added Face ID registration flow
- `src/components/auth/AuthModal.tsx` - Updated to split-screen layout

### New Files Created
- `src/components/auth/FaceCaptureCamera.tsx`
- `src/components/auth/FaceRegisterModal.tsx`
- `src/components/auth/FaceLoginModal.tsx`
- `src/components/auth/SocialLoginButtons.tsx`
- `src/components/auth/OrDivider.tsx`
- `src/services/faceAuthService.ts`
- `database/face_authentication_migration.sql`

## Important Notes

⚠️ **Existing Authentication Logic Unchanged**
- Email/password login logic remains EXACTLY the same
- Face login is an OPTIONAL additional method
- All existing AuthContext functions preserved
- No breaking changes to existing authentication

✅ **Production Considerations**
- Always use HTTPS in production (required for camera access)
- Consider adding rate limiting for face verification attempts
- Monitor face authentication success rates
- Provide clear opt-out option for users
- Add admin panel to manage face auth settings

## Next Steps

1. Install face-api.js: `npm install face-api.js`
2. Download model files to `/public/models/`
3. Run database migration in Supabase
4. Add hero images to `/public/images/`
5. Test registration flow
6. Test login flow
7. (Optional) Configure OAuth providers
8. Deploy to production with HTTPS

## Support

For issues or questions:
- Check browser console for errors
- Verify all model files are present
- Ensure database migration ran successfully
- Test camera permissions in browser settings

---

**Implementation Date:** January 2025
**Version:** 1.0.0
**Status:** ✅ Ready for Testing
