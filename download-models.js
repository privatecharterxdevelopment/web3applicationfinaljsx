#!/usr/bin/env node

/**
 * Face-API.js Models Downloader
 * Downloads required model files for face authentication
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODELS_DIR = path.join(__dirname, 'public', 'models');
const BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';

const MODEL_FILES = [
  // Tiny Face Detector
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',

  // Face Landmarks 68 Tiny
  'face_landmark_68_tiny_model-weights_manifest.json',
  'face_landmark_68_tiny_model-shard1',

  // Face Recognition
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2'
];

// Ensure models directory exists
if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
  console.log('✓ Created models directory');
}

console.log('🎭 Downloading Face-API.js models...\n');

let downloadedCount = 0;
let failedCount = 0;

function downloadFile(filename) {
  return new Promise((resolve, reject) => {
    const url = BASE_URL + filename;
    const filepath = path.join(MODELS_DIR, filename);

    // Check if file already exists
    if (fs.existsSync(filepath)) {
      console.log(`⏭️  Skipping ${filename} (already exists)`);
      resolve();
      return;
    }

    const file = fs.createWriteStream(filepath);

    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${filename}: ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        const size = fs.statSync(filepath).size;
        const sizeKB = (size / 1024).toFixed(2);
        console.log(`✓ Downloaded ${filename} (${sizeKB} KB)`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}); // Delete partial file
      reject(err);
    });
  });
}

async function downloadAll() {
  for (const filename of MODEL_FILES) {
    try {
      await downloadFile(filename);
      downloadedCount++;
    } catch (error) {
      console.error(`✗ Failed to download ${filename}:`, error.message);
      failedCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Summary:`);
  console.log(`   Downloaded: ${downloadedCount}/${MODEL_FILES.length}`);
  console.log(`   Failed: ${failedCount}`);
  console.log(`   Location: ${MODELS_DIR}`);
  console.log('='.repeat(50));

  if (failedCount === 0) {
    console.log('\n🎉 All model files downloaded successfully!');
    console.log('\nNext steps:');
    console.log('1. Run: npm install');
    console.log('2. Run database migration in Supabase');
    console.log('3. Add hero images to /public/images/');
    console.log('4. Start dev server: npm run dev');
  } else {
    console.log('\n⚠️  Some files failed to download. Please try again or download manually.');
    process.exit(1);
  }
}

downloadAll().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
