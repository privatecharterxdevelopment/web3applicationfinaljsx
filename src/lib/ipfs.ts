/**
 * IPFS Integration with Client-Side Encryption
 * Uses Web3.Storage for free IPFS pinning
 * AES-256-GCM encryption for private contracts
 */

import CryptoJS from 'crypto-js';

// Web3.Storage configuration
const WEB3_STORAGE_TOKEN = import.meta.env.VITE_WEB3_STORAGE_TOKEN;
const WEB3_STORAGE_API = 'https://api.web3.storage';

export interface EncryptedUploadResult {
  cid: string;                  // IPFS CID
  encryptionKey: string;        // AES key (to be encrypted per wallet)
  fileSize: number;             // Original file size
  encryptedSize: number;        // Encrypted file size
  uploadedAt: Date;
}

export interface DownloadResult {
  blob: Blob;
  filename: string;
  mimeType: string;
}

/**
 * Generate random AES-256 encryption key
 * @returns Random hex string (256 bits)
 */
export function generateAESKey(): string {
  return CryptoJS.lib.WordArray.random(32).toString(); // 256 bits
}

/**
 * Encrypt file with AES-256-GCM
 * @param file File to encrypt
 * @param key AES encryption key (hex string)
 * @returns Encrypted file as Blob
 */
export async function encryptFile(file: File, key: string): Promise<Blob> {
  try {
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Convert to WordArray for CryptoJS
    const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer as any);

    // Encrypt with AES
    const encrypted = CryptoJS.AES.encrypt(wordArray, key, {
      mode: CryptoJS.mode.GCM,
      padding: CryptoJS.pad.Pkcs7
    });

    // Convert to string
    const encryptedString = encrypted.toString();

    // Create blob with encrypted data
    const blob = new Blob([encryptedString], {
      type: 'application/octet-stream'
    });

    return blob;
  } catch (error) {
    console.error('File encryption failed:', error);
    throw new Error('Failed to encrypt file');
  }
}

/**
 * Decrypt file with AES-256-GCM
 * @param encryptedBlob Encrypted blob
 * @param key AES decryption key (hex string)
 * @param originalMimeType Original file MIME type
 * @returns Decrypted file as Blob
 */
export async function decryptFile(
  encryptedBlob: Blob,
  key: string,
  originalMimeType: string = 'application/pdf'
): Promise<Blob> {
  try {
    // Read encrypted data as text
    const encryptedText = await encryptedBlob.text();

    // Decrypt with AES
    const decrypted = CryptoJS.AES.decrypt(encryptedText, key, {
      mode: CryptoJS.mode.GCM,
      padding: CryptoJS.pad.Pkcs7
    });

    // Convert back to array buffer
    const arrayBuffer = wordArrayToArrayBuffer(decrypted);

    // Create blob with original MIME type
    return new Blob([arrayBuffer], { type: originalMimeType });
  } catch (error) {
    console.error('File decryption failed:', error);
    throw new Error('Failed to decrypt file - invalid key or corrupted data');
  }
}

/**
 * Upload encrypted file to IPFS via Web3.Storage
 * @param file File to upload (will be encrypted first)
 * @param filename Original filename
 * @returns Upload result with CID and encryption key
 */
export async function uploadEncryptedToIPFS(
  file: File,
  filename: string = file.name
): Promise<EncryptedUploadResult> {
  if (!WEB3_STORAGE_TOKEN) {
    throw new Error('Web3.Storage token not configured. Set VITE_WEB3_STORAGE_TOKEN in .env');
  }

  try {
    // Generate encryption key
    const encryptionKey = generateAESKey();

    // Encrypt file
    const encryptedBlob = await encryptFile(file, encryptionKey);

    // Create FormData for upload
    const formData = new FormData();
    const encryptedFile = new File(
      [encryptedBlob],
      `${filename}.encrypted`,
      { type: 'application/octet-stream' }
    );
    formData.append('file', encryptedFile);

    // Upload to Web3.Storage
    const response = await fetch(`${WEB3_STORAGE_API}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WEB3_STORAGE_TOKEN}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      cid: data.cid,
      encryptionKey,
      fileSize: file.size,
      encryptedSize: encryptedBlob.size,
      uploadedAt: new Date()
    };
  } catch (error) {
    console.error('IPFS upload failed:', error);
    throw new Error('Failed to upload file to IPFS');
  }
}

/**
 * Download and decrypt file from IPFS
 * @param cid IPFS CID
 * @param encryptionKey AES decryption key
 * @param originalFilename Original filename
 * @param originalMimeType Original MIME type
 * @returns Decrypted file blob
 */
export async function downloadDecryptFromIPFS(
  cid: string,
  encryptionKey: string,
  originalFilename: string = 'contract.pdf',
  originalMimeType: string = 'application/pdf'
): Promise<DownloadResult> {
  try {
    // Download from IPFS gateway
    const gatewayUrl = `https://${cid}.ipfs.w3s.link/`;
    const response = await fetch(gatewayUrl);

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    // Get encrypted blob
    const encryptedBlob = await response.blob();

    // Decrypt
    const decryptedBlob = await decryptFile(
      encryptedBlob,
      encryptionKey,
      originalMimeType
    );

    return {
      blob: decryptedBlob,
      filename: originalFilename,
      mimeType: originalMimeType
    };
  } catch (error) {
    console.error('IPFS download failed:', error);
    throw new Error('Failed to download or decrypt file from IPFS');
  }
}

/**
 * Encrypt AES key for specific wallet (using wallet signature)
 * This allows only the wallet owner to decrypt the AES key
 *
 * @param aesKey AES encryption key
 * @param walletAddress Wallet address
 * @param signMessage Function to sign message with wallet
 * @returns Encrypted AES key
 */
export async function encryptKeyForWallet(
  aesKey: string,
  walletAddress: string,
  signMessage: (message: string) => Promise<string>
): Promise<string> {
  try {
    // Create message to sign (deterministic)
    const message = `Encrypt escrow key for ${walletAddress}`;

    // Get wallet signature (this acts as wallet-specific encryption key)
    const signature = await signMessage(message);

    // Use signature as encryption key for AES key
    const encryptedKey = CryptoJS.AES.encrypt(aesKey, signature).toString();

    return encryptedKey;
  } catch (error) {
    console.error('Key encryption failed:', error);
    throw new Error('Failed to encrypt key for wallet');
  }
}

/**
 * Decrypt AES key using wallet signature
 * @param encryptedKey Encrypted AES key
 * @param walletAddress Wallet address
 * @param signMessage Function to sign message with wallet
 * @returns Decrypted AES key
 */
export async function decryptKeyWithWallet(
  encryptedKey: string,
  walletAddress: string,
  signMessage: (message: string) => Promise<string>
): Promise<string> {
  try {
    // Recreate same message (deterministic)
    const message = `Encrypt escrow key for ${walletAddress}`;

    // Get wallet signature (same as encryption)
    const signature = await signMessage(message);

    // Decrypt AES key using signature
    const decrypted = CryptoJS.AES.decrypt(encryptedKey, signature);
    const aesKey = decrypted.toString(CryptoJS.enc.Utf8);

    if (!aesKey) {
      throw new Error('Decryption failed - invalid signature');
    }

    return aesKey;
  } catch (error) {
    console.error('Key decryption failed:', error);
    throw new Error('Failed to decrypt key with wallet');
  }
}

/**
 * Generate preview URL for IPFS file (encrypted - will show garbled data)
 * @param cid IPFS CID
 * @returns Gateway URL
 */
export function getIPFSGatewayUrl(cid: string): string {
  return `https://${cid}.ipfs.w3s.link/`;
}

/**
 * Check if Web3.Storage is configured
 * @returns True if token is set
 */
export function isIPFSConfigured(): boolean {
  return !!WEB3_STORAGE_TOKEN;
}

/**
 * Estimate storage cost (Web3.Storage is FREE up to 1TB!)
 * @param fileSizeBytes File size in bytes
 * @returns Cost info
 */
export function estimateStorageCost(fileSizeBytes: number): {
  size: string;
  cost: string;
  tier: string;
} {
  const sizeKB = fileSizeBytes / 1024;
  const sizeMB = sizeKB / 1024;

  if (sizeMB < 1024 * 1024) { // < 1TB
    return {
      size: `${sizeMB.toFixed(2)} MB`,
      cost: '$0 (FREE)',
      tier: 'Free Tier'
    };
  } else {
    return {
      size: `${(sizeMB / 1024).toFixed(2)} GB`,
      cost: 'Contact for pricing',
      tier: 'Enterprise'
    };
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Convert WordArray to ArrayBuffer
 * @param wordArray CryptoJS WordArray
 * @returns ArrayBuffer
 */
function wordArrayToArrayBuffer(wordArray: CryptoJS.lib.WordArray): ArrayBuffer {
  const words = wordArray.words;
  const sigBytes = wordArray.sigBytes;

  const u8 = new Uint8Array(sigBytes);
  for (let i = 0; i < sigBytes; i++) {
    u8[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
  }

  return u8.buffer;
}

/**
 * Validate IPFS CID format
 * @param cid IPFS CID string
 * @returns True if valid CID format
 */
export function isValidCID(cid: string): boolean {
  // Basic validation (CIDv0 starts with Qm, CIDv1 starts with b)
  return /^(Qm[1-9A-HJ-NP-Za-km-z]{44,}|b[A-Za-z2-7]{58,})$/.test(cid);
}

/**
 * Format file size for display
 * @param bytes File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Get file extension from filename
 * @param filename Filename with extension
 * @returns Extension (e.g., "pdf")
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Get MIME type from file extension
 * @param extension File extension
 * @returns MIME type
 */
export function getMimeTypeFromExtension(extension: string): string {
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif'
  };

  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}

/**
 * Download blob as file (trigger browser download)
 * @param blob Blob to download
 * @param filename Filename for download
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
