/**
 * useFileUpload Hook - File Upload & Processing
 *
 * Handles:
 * - Break The Price PDF upload
 * - Quote file processing
 * - Image uploads
 * - Document handling
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '../../../../lib/supabase';
import { getTierLimits } from '../utils/constants';

export const useFileUpload = ({
  user,
  setToast,
  setChatHistory,
  activeChat
}) => {
  // Break The Price states
  const [showBreakThePrice, setShowBreakThePrice] = useState(false);
  const [breakThePriceFile, setBreakThePriceFile] = useState(null);
  const [isUploadingQuote, setIsUploadingQuote] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // General file upload states
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // Refs
  const fileInputRef = useRef(null);
  const breakThePriceInputRef = useRef(null);

  // Allowed file types
  const ALLOWED_FILE_TYPES = {
    quote: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
    document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  };

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  // Validate file
  const validateFile = useCallback((file, type = 'quote') => {
    if (!file) return { valid: false, error: 'No file selected' };

    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: 'File size exceeds 10MB limit' };
    }

    const allowedTypes = ALLOWED_FILE_TYPES[type] || ALLOWED_FILE_TYPES.quote;
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}` };
    }

    return { valid: true };
  }, []);

  // Handle Break The Price file selection
  const handleBreakThePriceFileSelect = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file, 'quote');
    if (!validation.valid) {
      setToast({ message: validation.error, type: 'error' });
      return;
    }

    setBreakThePriceFile(file);
  }, [validateFile, setToast]);

  // Upload Break The Price quote
  const uploadBreakThePriceQuote = useCallback(async (additionalInfo = {}) => {
    if (!breakThePriceFile || !user?.id) {
      setToast({ message: 'Please select a file first', type: 'error' });
      return null;
    }

    setIsUploadingQuote(true);
    setUploadProgress(0);

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const ext = breakThePriceFile.name.split('.').pop();
      const fileName = `break-the-price/${user.id}/${timestamp}.${ext}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('quotes')
        .upload(fileName, breakThePriceFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      setUploadProgress(50);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('quotes')
        .getPublicUrl(fileName);

      // Create Break The Price request in database
      const requestData = {
        user_id: user.id,
        request_type: 'break_the_price',
        status: 'pending_review',
        request_data: {
          file_url: urlData.publicUrl,
          file_name: breakThePriceFile.name,
          file_size: breakThePriceFile.size,
          file_type: breakThePriceFile.type,
          additional_info: additionalInfo,
          timestamp: new Date().toISOString(),
          user_email: user.email
        }
      };

      const { data: request, error: requestError } = await supabase
        .from('user_requests')
        .insert(requestData)
        .select()
        .single();

      if (requestError) throw requestError;

      setUploadProgress(100);

      // Add confirmation message to chat
      const confirmMsg = {
        role: 'assistant',
        content: `✅ **Quote Uploaded for Review!**\n\n📄 File: ${breakThePriceFile.name}\n\nOur pricing team will analyze your competitor's quote and get back to you with our best offer within 24 hours.\n\nWe're committed to beating any legitimate quote for comparable services.\n\nRequest ID: #${request.id?.slice(0, 8) || timestamp}`,
        isBreakThePriceConfirmation: true,
        requestId: request.id
      };

      setChatHistory(prev => prev.map(c =>
        c.id === activeChat
          ? { ...c, messages: [...c.messages, confirmMsg] }
          : c
      ));

      setToast({ message: 'Quote uploaded successfully!', type: 'success' });
      setShowBreakThePrice(false);
      setBreakThePriceFile(null);

      return request;
    } catch (error) {
      console.error('Break The Price upload failed:', error);
      setToast({ message: 'Failed to upload quote. Please try again.', type: 'error' });
      return null;
    } finally {
      setIsUploadingQuote(false);
      setUploadProgress(0);
    }
  }, [breakThePriceFile, user, activeChat, setChatHistory, setToast]);

  // Upload general file
  const uploadFile = useCallback(async (file, bucket = 'documents', folder = 'uploads') => {
    if (!file || !user?.id) {
      setToast({ message: 'Please select a file first', type: 'error' });
      return null;
    }

    const validation = validateFile(file, 'document');
    if (!validation.valid) {
      setToast({ message: validation.error, type: 'error' });
      return null;
    }

    setIsUploading(true);

    try {
      const timestamp = Date.now();
      const ext = file.name.split('.').pop();
      const fileName = `${folder}/${user.id}/${timestamp}.${ext}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      const uploadedFile = {
        id: timestamp,
        name: file.name,
        size: file.size,
        type: file.type,
        url: urlData.publicUrl,
        uploadedAt: new Date().toISOString()
      };

      setUploadedFiles(prev => [...prev, uploadedFile]);
      setToast({ message: 'File uploaded successfully!', type: 'success' });

      return uploadedFile;
    } catch (error) {
      console.error('File upload failed:', error);
      setToast({ message: 'Failed to upload file', type: 'error' });
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [user, validateFile, setToast]);

  // Upload image
  const uploadImage = useCallback(async (file) => {
    const validation = validateFile(file, 'image');
    if (!validation.valid) {
      setToast({ message: validation.error, type: 'error' });
      return null;
    }

    return uploadFile(file, 'images', 'chat-uploads');
  }, [validateFile, uploadFile, setToast]);

  // Remove uploaded file
  const removeUploadedFile = useCallback((fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  // Clear all uploaded files
  const clearUploadedFiles = useCallback(() => {
    setUploadedFiles([]);
    setBreakThePriceFile(null);
  }, []);

  // Trigger file input click
  const triggerFileInput = useCallback((type = 'general') => {
    if (type === 'breakThePrice') {
      breakThePriceInputRef.current?.click();
    } else {
      fileInputRef.current?.click();
    }
  }, []);

  // Check if user can use Break The Price (subscription feature)
  const canUseBreakThePrice = useCallback((userProfile) => {
    if (!userProfile?.subscription_tier) return false;
    // Use centralized tier config for breakThePrice access
    const tierConfig = getTierLimits(userProfile.subscription_tier);
    return tierConfig.breakThePrice === true;
  }, []);

  return {
    // Break The Price
    showBreakThePrice,
    setShowBreakThePrice,
    breakThePriceFile,
    setBreakThePriceFile,
    isUploadingQuote,
    uploadProgress,
    handleBreakThePriceFileSelect,
    uploadBreakThePriceQuote,
    canUseBreakThePrice,

    // General uploads
    uploadedFiles,
    isUploading,
    uploadFile,
    uploadImage,
    removeUploadedFile,
    clearUploadedFiles,
    triggerFileInput,
    validateFile,

    // Refs
    fileInputRef,
    breakThePriceInputRef
  };
};

export default useFileUpload;
