import { supabase } from '../lib/supabase';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface FileUploadOptions {
  bucket: string;
  folder?: string;
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  onProgress?: (progress: UploadProgress) => void;
}

export interface UploadedFile {
  fileName: string;
  fileSize: number;
  fileType: string;
  filePath: string;
  publicUrl: string;
  uploadedAt: string;
}

export interface FileMetadata {
  original_name: string;
  upload_timestamp: string;
  user_agent: string;
  file_extension?: string;
  [key: string]: any;
}

export class FileUploadService {
  private static readonly DEFAULT_MAX_SIZE = 300 * 1024 * 1024; // 300MB
  private static readonly DEFAULT_ALLOWED_TYPES = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/tiff',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  /**
   * Validate file before upload
   */
  static validateFile(file: File, options: FileUploadOptions): string | null {
    const maxSize = options.maxSize || this.DEFAULT_MAX_SIZE;
    const allowedTypes = options.allowedTypes || this.DEFAULT_ALLOWED_TYPES;

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return `Invalid file type. Allowed types: ${allowedTypes.map(type => {
        if (type.startsWith('image/')) return type.split('/')[1].toUpperCase();
        if (type === 'application/pdf') return 'PDF';
        if (type === 'application/msword') return 'DOC';
        if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'DOCX';
        return type;
      }).join(', ')}`;
    }

    // Check file size
    if (file.size > maxSize) {
      return `File size too large. Maximum size: ${this.formatFileSize(maxSize)}`;
    }

    // Check minimum size
    const minSize = 1024; // 1KB
    if (file.size < minSize) {
      return 'File is too small. Please upload a valid document.';
    }

    return null;
  }

  /**
   * Validate image file signature for security
   */
  static async validateImageSignature(file: File): Promise<string | null> {
    if (!file.type.startsWith('image/')) {
      return null; // Not an image, skip validation
    }

    try {
      const buffer = await file.slice(0, 8).arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const signatures = {
        jpeg: [0xFF, 0xD8, 0xFF],
        png: [0x89, 0x50, 0x4E, 0x47],
        webp: [0x52, 0x49, 0x46, 0x46],
        tiff1: [0x49, 0x49, 0x2A, 0x00],
        tiff2: [0x4D, 0x4D, 0x00, 0x2A]
      };

      let validSignature = false;
      for (const [format, signature] of Object.entries(signatures)) {
        if (signature.every((byte, index) => bytes[index] === byte)) {
          validSignature = true;
          break;
        }
      }

      if (!validSignature) {
        return 'Invalid image file. The file may be corrupted or not a valid image.';
      }

      return null;
    } catch (error) {
      console.error('Error validating image signature:', error);
      return 'Error validating file. Please try again.';
    }
  }

  /**
   * Upload file to Supabase storage
   */
  static async uploadFile(
    file: File, 
    userId: string, 
    options: FileUploadOptions
  ): Promise<UploadedFile> {
    // Validate file
    const validationError = this.validateFile(file, options);
    if (validationError) {
      throw new Error(validationError);
    }

    // Validate image signature if it's an image
    const signatureError = await this.validateImageSignature(file);
    if (signatureError) {
      throw new Error(signatureError);
    }

    // Generate file path
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const timestamp = Date.now();
    const fileName = `${userId}_${timestamp}.${fileExt}`;
    const folder = options.folder || 'uploads';
    const filePath = `${folder}/${fileName}`;

    // Simulate progress if callback provided
    if (options.onProgress) {
      options.onProgress({
        loaded: 0,
        total: file.size,
        percentage: 0
      });

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        options.onProgress!({
          loaded: Math.min(file.size * 0.9, file.size),
          total: file.size,
          percentage: Math.min(90, 100)
        });
      }, 100);

      // Clear interval after upload
      setTimeout(() => clearInterval(progressInterval), 1000);
    }

    try {
      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from(options.bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Storage upload error:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      if (!data) {
        throw new Error('Upload failed: No data returned');
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(options.bucket)
        .getPublicUrl(filePath);

      if (!publicUrl) {
        throw new Error('Failed to get public URL');
      }

      // Complete progress
      if (options.onProgress) {
        options.onProgress({
          loaded: file.size,
          total: file.size,
          percentage: 100
        });
      }

      return {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        filePath,
        publicUrl,
        uploadedAt: new Date().toISOString()
      };

    } catch (error: any) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  /**
   * Save file metadata to database
   */
  static async saveFileMetadata(
    uploadedFile: UploadedFile,
    userId: string,
    uploadType: string,
    additionalMetadata?: Record<string, any>
  ): Promise<void> {
    const metadata: FileMetadata = {
      original_name: uploadedFile.fileName,
      upload_timestamp: uploadedFile.uploadedAt,
      user_agent: navigator.userAgent,
      file_extension: uploadedFile.fileName.split('.').pop()?.toLowerCase(),
      ...additionalMetadata
    };

    const { error } = await supabase
      .from('file_uploads')
      .insert([{
        user_id: userId,
        file_name: uploadedFile.fileName,
        file_size: uploadedFile.fileSize,
        file_type: uploadedFile.fileType,
        file_path: uploadedFile.filePath,
        public_url: uploadedFile.publicUrl,
        upload_type: uploadType,
        status: 'uploaded',
        metadata
      }]);

    if (error) {
      console.error('Error saving file metadata:', error);
      // Don't throw error, as the file upload succeeded
    }
  }

  /**
   * Delete file from storage and update database
   */
  static async deleteFile(
    filePath: string,
    bucket: string,
    userId: string,
    publicUrl?: string
  ): Promise<void> {
    try {
      // Remove from storage
      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (storageError) {
        console.error('Error removing file from storage:', storageError);
      }

      // Update database record
      if (publicUrl) {
        await supabase
          .from('file_uploads')
          .update({
            status: 'deleted',
            updated_at: new Date().toISOString()
          })
          .eq('public_url', publicUrl)
          .eq('user_id', userId);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get file icon based on file type
   */
  static getFileIcon(fileType: string): string {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType === 'application/pdf') return '📄';
    if (fileType === 'application/msword' || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return '📝';
    return '📁';
  }
}