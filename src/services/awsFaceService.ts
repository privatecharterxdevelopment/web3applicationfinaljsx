/**
 * AWS Rekognition Face Service
 * Handles face registration and recognition using AWS Rekognition
 */

import {
  RekognitionClient,
  CreateCollectionCommand,
  IndexFacesCommand,
  SearchFacesByImageCommand,
  DeleteFacesCommand,
  ListCollectionsCommand
} from '@aws-sdk/client-rekognition';

// AWS Configuration
const rekognitionClient = new RekognitionClient({
  region: import.meta.env.VITE_AWS_REGION,
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY
  }
});

const COLLECTION_ID = import.meta.env.VITE_AWS_REKOGNITION_COLLECTION_ID || 'privatecharterx-faces';

/**
 * Initialize face collection (run once)
 */
export async function initializeFaceCollection(): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if collection exists
    const listCommand = new ListCollectionsCommand({});
    const listResponse = await rekognitionClient.send(listCommand);

    if (listResponse.CollectionIds?.includes(COLLECTION_ID)) {
      console.log('✅ Face collection already exists');
      return { success: true };
    }

    // Create collection
    const createCommand = new CreateCollectionCommand({
      CollectionId: COLLECTION_ID
    });

    await rekognitionClient.send(createCommand);
    console.log('✅ Face collection created successfully');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error initializing face collection:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Convert video frame to base64 image
 */
function captureFrameFromVideo(videoElement: HTMLVideoElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  ctx.drawImage(videoElement, 0, 0);

  // Convert to base64
  return canvas.toDataURL('image/jpeg', 0.95).split(',')[1];
}

/**
 * Convert base64 to Uint8Array for AWS
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Register face for a user
 */
export async function registerFaceWithAWS(
  userId: string,
  videoElement: HTMLVideoElement
): Promise<{ success: boolean; faceId?: string; error?: string }> {
  try {
    console.log('📸 Capturing face image for user:', userId);

    // Capture frame from video
    const base64Image = captureFrameFromVideo(videoElement);
    const imageBytes = base64ToUint8Array(base64Image);

    // Index face in AWS Rekognition
    const command = new IndexFacesCommand({
      CollectionId: COLLECTION_ID,
      Image: { Bytes: imageBytes },
      ExternalImageId: userId,
      DetectionAttributes: ['ALL'],
      MaxFaces: 1,
      QualityFilter: 'AUTO'
    });

    const response = await rekognitionClient.send(command);

    if (!response.FaceRecords || response.FaceRecords.length === 0) {
      return { success: false, error: 'No face detected. Please ensure your face is clearly visible.' };
    }

    const faceId = response.FaceRecords[0].Face?.FaceId;
    if (!faceId) {
      return { success: false, error: 'Failed to register face' };
    }

    console.log('✅ Face registered successfully:', faceId);
    return { success: true, faceId };
  } catch (error: any) {
    console.error('❌ Error registering face:', error);

    if (error.name === 'InvalidParameterException') {
      return { success: false, error: 'No face detected. Please look directly at the camera.' };
    }

    return { success: false, error: error.message || 'Failed to register face' };
  }
}

/**
 * Verify face for login
 */
export async function verifyFaceWithAWS(
  videoElement: HTMLVideoElement
): Promise<{ success: boolean; userId?: string; confidence?: number; error?: string }> {
  try {
    console.log('🔍 Searching for face match...');

    // Capture frame from video
    const base64Image = captureFrameFromVideo(videoElement);
    const imageBytes = base64ToUint8Array(base64Image);

    // Search for matching face
    const command = new SearchFacesByImageCommand({
      CollectionId: COLLECTION_ID,
      Image: { Bytes: imageBytes },
      MaxFaces: 1,
      FaceMatchThreshold: 90 // 90% confidence threshold
    });

    const response = await rekognitionClient.send(command);

    if (!response.FaceMatches || response.FaceMatches.length === 0) {
      return { success: false, error: 'No matching face found. Please register first.' };
    }

    const match = response.FaceMatches[0];
    const userId = match.Face?.ExternalImageId;
    const confidence = match.Similarity;

    if (!userId) {
      return { success: false, error: 'Face matched but user ID not found' };
    }

    console.log('✅ Face match found:', userId, 'Confidence:', confidence);
    return { success: true, userId, confidence };
  } catch (error: any) {
    console.error('❌ Error verifying face:', error);

    if (error.name === 'InvalidParameterException') {
      return { success: false, error: 'No face detected. Please look directly at the camera.' };
    }

    return { success: false, error: error.message || 'Failed to verify face' };
  }
}

/**
 * Delete face for a user
 */
export async function deleteFaceFromAWS(faceId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const command = new DeleteFacesCommand({
      CollectionId: COLLECTION_ID,
      FaceIds: [faceId]
    });

    await rekognitionClient.send(command);
    console.log('✅ Face deleted successfully');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error deleting face:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get device info for logging
 */
export function getDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    timestamp: new Date().toISOString()
  };
}
