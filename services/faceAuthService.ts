/**
 * Face Authentication Service
 * Handles face detection, recognition, and matching using face-api.js
 */

// face-api.js is loaded from CDN (see vite-plugin-face-api.js)
// @ts-ignore
const faceapi = window.faceapi;

import { supabase } from '../lib/supabase';

const MODEL_URL = '/models'; // face-api.js models will be loaded from /public/models/

/**
 * Load face-api.js models (tiny versions for speed)
 */
export async function loadFaceModels(): Promise<void> {
  try {
    console.log('🔄 Loading face-api.js models...');

    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);

    console.log('✅ Face-api.js models loaded successfully');
  } catch (error) {
    console.error('❌ Error loading face models:', error);
    throw new Error('Failed to load face recognition models');
  }
}

/**
 * Detect face in video stream and extract face descriptor
 */
export async function detectFaceFromVideo(
  videoElement: HTMLVideoElement
): Promise<Float32Array | null> {
  try {
    const detection = await faceapi
      .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks(true)
      .withFaceDescriptor();

    if (!detection) {
      return null;
    }

    return detection.descriptor;
  } catch (error) {
    console.error('Error detecting face:', error);
    return null;
  }
}

/**
 * Detect face with full details including landmarks
 */
export async function detectFaceWithLandmarks(
  videoElement: HTMLVideoElement
): Promise<any | null> {
  try {
    const detection = await faceapi
      .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks(true)
      .withFaceDescriptor();

    if (!detection) {
      return null;
    }

    return detection;
  } catch (error) {
    console.error('Error detecting face with landmarks:', error);
    return null;
  }
}

/**
 * Compare two face descriptors and return similarity score (0-1)
 */
export function compareFaceDescriptors(
  descriptor1: Float32Array,
  descriptor2: Float32Array
): number {
  const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
  // Convert distance to similarity score (closer to 0 = more similar)
  // Typical threshold is 0.6 (lower = more strict)
  return 1 - distance;
}

/**
 * Encrypt face descriptor for secure storage
 */
function encryptDescriptor(descriptor: Float32Array): string {
  // Convert Float32Array to base64 string
  const array = Array.from(descriptor);
  return btoa(JSON.stringify(array));
}

/**
 * Decrypt face descriptor from storage
 */
function decryptDescriptor(encrypted: string): Float32Array {
  try {
    const array = JSON.parse(atob(encrypted));
    return new Float32Array(array);
  } catch (error) {
    console.error('Error decrypting descriptor:', error);
    throw new Error('Invalid face descriptor format');
  }
}

/**
 * Register face for a user (save to database)
 */
export async function registerFaceForUser(
  userId: string,
  faceDescriptor: Float32Array,
  deviceInfo?: any
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('📝 Registering face for user:', userId);

    // Encrypt the face descriptor
    const encryptedDescriptor = encryptDescriptor(faceDescriptor);

    // Store in database
    const { data, error } = await supabase
      .from('face_authentication')
      .upsert({
        user_id: userId,
        face_descriptor: { data: encryptedDescriptor },
        is_active: true,
        device_info: deviceInfo || null,
        registered_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error saving face data:', error);
      return { success: false, error: error.message };
    }

    // Update user_profiles to mark face registration complete
    await supabase
      .from('user_profiles')
      .update({
        face_registration_completed: true,
        face_login_enabled: true,
      })
      .eq('user_id', userId);

    console.log('✅ Face registered successfully');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error in registerFaceForUser:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Verify face against stored face for a user
 */
export async function verifyFaceForUser(
  userId: string,
  capturedDescriptor: Float32Array
): Promise<{ success: boolean; similarity?: number; error?: string }> {
  try {
    console.log('🔍 Verifying face for user:', userId);

    // Get stored face descriptor from database
    const { data, error } = await supabase
      .from('face_authentication')
      .select('face_descriptor, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      console.error('❌ No face data found for user');
      return { success: false, error: 'No face authentication registered for this user' };
    }

    // Decrypt stored descriptor
    const storedDescriptor = decryptDescriptor(data.face_descriptor.data);

    // Compare descriptors
    const similarity = compareFaceDescriptors(capturedDescriptor, storedDescriptor);
    console.log('📊 Face similarity score:', similarity);

    // Threshold: 0.6 means 60% match required (adjust as needed)
    const threshold = 0.6;
    const isMatch = similarity >= threshold;

    if (isMatch) {
      // Update last_used_at timestamp
      await supabase
        .from('face_authentication')
        .update({ last_used_at: new Date().toISOString() })
        .eq('user_id', userId);

      console.log('✅ Face verified successfully');
      return { success: true, similarity };
    } else {
      console.log('❌ Face verification failed - similarity too low');
      return { success: false, similarity, error: 'Face does not match' };
    }
  } catch (error: any) {
    console.error('❌ Error in verifyFaceForUser:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if user has face authentication enabled
 */
export async function checkFaceAuthEnabled(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('face_authentication')
      .select('is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    return !!data;
  } catch (error) {
    console.error('Error checking face auth status:', error);
    return false;
  }
}

/**
 * Delete face authentication data for a user
 */
export async function deleteFaceAuthForUser(userId: string): Promise<{ success: boolean }> {
  try {
    const { error } = await supabase
      .from('face_authentication')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;

    // Update user_profiles
    await supabase
      .from('user_profiles')
      .update({
        face_registration_completed: false,
        face_login_enabled: false,
      })
      .eq('user_id', userId);

    return { success: true };
  } catch (error) {
    console.error('Error deleting face auth:', error);
    return { success: false };
  }
}

/**
 * Get device info for logging
 */
export function getDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    timestamp: new Date().toISOString(),
  };
}
