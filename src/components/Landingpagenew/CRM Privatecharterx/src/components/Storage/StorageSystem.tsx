import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Folder, 
  File, 
  Download, 
  Trash2, 
  Share2, 
  Eye, 
  X, 
  Upload,
  FolderPlus,
  FileText,
  Image as ImageIcon,
  FilePlus,
  MoreVertical,
  Check,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

interface StorageFile {
  id: string;
  name: string;
  type: string;
  size: number;
  path: string;
  folder: string;
  storage_path: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  creator?: {
    name: string;
  };
}

interface StorageFolder {
  id: string;
  name: string;
  path: string;
  parent_folder: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  creator?: {
    name: string;
  };
}

export const StorageSystem: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [folders, setFolders] = useState<StorageFolder[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<StorageFile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPath, setCurrentPath] = useState('/');
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<StorageFile | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<StorageFolder | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchFolders();
    fetchFiles();
  }, [currentPath]);

  useEffect(() => {
    filterFiles();
  }, [files, searchTerm, typeFilter]);

  const fetchFolders = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('storage_folders')
        .select(`
          *,
          creator:system_users!created_by (name)
        `)
        .eq('parent_folder', currentPath)
        .order('name', { ascending: true });

      if (error) throw error;
      setFolders(data || []);
    } catch (err: any) {
      console.error('Error fetching folders:', err);
      showError('Error', 'Failed to load folders');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('storage_files')
        .select(`
          *,
          creator:system_users!created_by (name)
        `)
        .eq('folder', currentPath)
        .order('name', { ascending: true });

      if (error) throw error;
      setFiles(data || []);
    } catch (err: any) {
      console.error('Error fetching files:', err);
      showError('Error', 'Failed to load files');
    } finally {
      setIsLoading(false);
    }
  };

  const filterFiles = () => {
    let filtered = files;

    if (searchTerm) {
      filtered = filtered.filter(file => 
        file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.creator?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(file => {
        if (typeFilter === 'image') return file.type.startsWith('image/');
        if (typeFilter === 'document') return file.type.includes('pdf') || file.type.includes('word') || file.type.includes('excel') || file.type.includes('text');
        if (typeFilter === 'other') return !file.type.startsWith('image/') && !file.type.includes('pdf') && !file.type.includes('word') && !file.type.includes('excel') && !file.type.includes('text');
        return true;
      });
    }

    setFilteredFiles(filtered);
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) {
      showError('Error', 'Folder name cannot be empty');
      return;
    }

    try {
      // Get current user from system_users
      const { data: systemUser } = await supabase
        .from('system_users')
        .select('id')
        .eq('email', user?.email)
        .single();

      if (!systemUser) {
        throw new Error('User not found in system');
      }

      const folderPath = currentPath === '/' 
        ? `/${newFolderName}` 
        : `${currentPath}/${newFolderName}`;

      const { error } = await supabase
        .from('storage_folders')
        .insert([{
          name: newFolderName,
          path: folderPath,
          parent_folder: currentPath,
          created_by: systemUser.id
        }]);

      if (error) throw error;

      showSuccess('Success', 'Folder created successfully');
      setNewFolderName('');
      setShowNewFolderModal(false);
      fetchFolders();
    } catch (err: any) {
      console.error('Error creating folder:', err);
      showError('Error', err.message || 'Failed to create folder');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    await uploadFiles(Array.from(files));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadFiles(Array.from(e.dataTransfer.files));
    }
  };

  const uploadFiles = async (filesToUpload: File[]) => {
    if (!user?.email) {
      showError('Error', 'You must be logged in to upload files');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Get current user from system_users
      const { data: systemUser } = await supabase
        .from('system_users')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!systemUser) {
        throw new Error('User not found in system');
      }

      // Process each file
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const fileName = file.name;
        const fileType = file.type;
        const fileSize = file.size;
        
        // Create a unique storage path
        const timestamp = Date.now();
        const storagePath = `${systemUser.id}/${timestamp}_${fileName}`;
        
        // Upload to Supabase Storage
        const { data: storageData, error: storageError } = await supabase.storage
          .from('files')
          .upload(storagePath, file);

        if (storageError) {
          showError('Error uploading file:', `${fileName}\n\n${storageError.message}`);
          continue;
        }

        // Add file metadata to database
        const filePath = currentPath === '/' 
          ? `/${fileName}` 
          : `${currentPath}/${fileName}`;

        const { error: dbError } = await supabase
          .from('storage_files')
          .insert([{
            name: fileName,
            type: fileType,
            size: fileSize,
            path: filePath,
            folder: currentPath,
            storage_path: storagePath,
            created_by: systemUser.id,
            is_public: false
          }]);

        if (dbError) {
          showError('Error saving file metadata:', `${fileName}\n\n${dbError.message}`);
          // Try to clean up the uploaded file
          await supabase.storage.from('files').remove([storagePath]);
          continue;
        }

        // Update progress
        setUploadProgress(Math.round(((i + 1) / filesToUpload.length) * 100));
      }

      showSuccess('Success', `${filesToUpload.length} file(s) uploaded successfully`);
      setShowUploadModal(false);
      fetchFiles();
    } catch (err: any) {
      console.error('Error uploading files:', err);
      showError('Error', err.message || 'Failed to upload files');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const deleteFile = async () => {
    if (!selectedFile) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('files')
        .remove([selectedFile.storage_path]);

      if (storageError) throw storageError;

      // Delete metadata from database
      const { error: dbError } = await supabase
        .from('storage_files')
        .delete()
        .eq('id', selectedFile.id);

      if (dbError) throw dbError;

      showSuccess('Success', 'File deleted successfully');
      setShowDeleteConfirm(false);
      setSelectedFile(null);
      fetchFiles();
    } catch (err: any) {
      console.error('Error deleting file:', err);
      showError('Error', err.message || 'Failed to delete file');
    }
  };

  const deleteFolder = async () => {
    if (!selectedFolder) return;

    try {
      // First, check if folder is empty
      const { data: folderFiles, error: filesError } = await supabase
        .from('storage_files')
        .select('id')
        .eq('folder', selectedFolder.path);

      if (filesError) throw filesError;

      const { data: subFolders, error: foldersError } = await supabase
        .from('storage_folders')
        .select('id')
        .eq('parent_folder', selectedFolder.path);

      if (foldersError) throw foldersError;

      if ((folderFiles && folderFiles.length > 0) || (subFolders && subFolders.length > 0)) {
        showError('Error', 'Cannot delete non-empty folder. Please delete all files and subfolders first.');
        return;
      }

      // Delete folder from database
      const { error: deleteError } = await supabase
        .from('storage_folders')
        .delete()
        .eq('id', selectedFolder.id);

      if (deleteError) throw deleteError;

      showSuccess('Success', 'Folder deleted successfully');
      setShowDeleteConfirm(false);
      setSelectedFolder(null);
      fetchFolders();
    } catch (err: any) {
      console.error('Error deleting folder:', err);
      showError('Error', err.message || 'Failed to delete folder');
    }
  };

  const toggleFilePublic = async (file: StorageFile) => {
    try {
      const { error } = await supabase
        .from('storage_files')
        .update({ is_public: !file.is_public })
        .eq('id', file.id);

      if (error) throw error;

      showSuccess('Success', `File is now ${file.is_public ? 'private' : 'public'}`);
      fetchFiles();
    } catch (err: any) {
      console.error('Error updating file visibility:', err);
      showError('Error', err.message || 'Failed to update file visibility');
    }
  };

  const getFileUrl = async (file: StorageFile) => {
    try {
      const { data } = supabase.storage
        .from('files')
        .getPublicUrl(file.storage_path);

      return data.publicUrl;
    } catch (err: any) {
      console.error('Error getting file URL:', err);
      return null;
    }
  };

  const downloadFile = async (file: StorageFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('files')
        .download(file.storage_path);

      if (error) throw error;

      // Create a download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Error downloading file:', err);
      showError('Error', err.message || 'Failed to download file');
    }
  };

  const navigateToFolder = (folder: StorageFolder) => {
    setCurrentPath(folder.path);
  };

  const navigateUp = () => {
    if (currentPath === '/') return;
    
    const pathParts = currentPath.split('/');
    pathParts.pop();
    const parentPath = pathParts.join('/') || '/';
    setCurrentPath(parentPath);
  };

  const getBreadcrumbs = () => {
    if (currentPath === '/') {
      return [{ name: 'Home', path: '/' }];
    }

    const pathParts = currentPath.split('/').filter(Boolean);
    let currentBuildPath = '';
    
    return [
      { name: 'Home', path: '/' },
      ...pathParts.map(part => {
        currentBuildPath += `/${part}`;
        return {
          name: part,
          path: currentBuildPath
        };
      })
    ];
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="w-5 h-5 text-blue-500" />;
    } else if (fileType.includes('pdf')) {
      return <FileText className="w-5 h-5 text-red-500" />;
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return <FileText className="w-5 h-5 text-blue-600" />;
    } else if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
      return <FileText className="w-5 h-5 text-green-600" />;
    } else if (fileType.includes('text')) {
      return <FileText className="w-5 h-5 text-gray-600" />;
    } else {
      return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-black mb-2">Storage System</h1>
            <p className="text-gray-600">Manage your files and folders</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => setShowNewFolderModal(true)}
              className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <FolderPlus className="w-4 h-4" />
              <span>New Folder</span>
            </button>
            <button 
              onClick={() => setShowUploadModal(true)}
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Files</span>
            </button>
          </div>
        </div>

        {/* Breadcrumbs */}
        <div className="flex items-center space-x-2 mb-4 overflow-x-auto whitespace-nowrap pb-2">
          {getBreadcrumbs().map((crumb, index, array) => (
            <React.Fragment key={crumb.path}>
              <button
                onClick={() => setCurrentPath(crumb.path)}
                className={`text-sm ${
                  index === array.length - 1 
                    ? 'font-medium text-black' 
                    : 'text-gray-500 hover:text-black'
                }`}
              >
                {crumb.name}
              </button>
              {index < array.length - 1 && (
                <span className="text-gray-400">/</span>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search files by name, type, or creator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="image">Images</option>
                <option value="document">Documents</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* File Explorer */}
      <div 
        className={`bg-white rounded-lg border-2 ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200'} shadow-sm min-h-[500px]`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {dragActive && (
          <div className="absolute inset-0 bg-blue-50 bg-opacity-80 flex items-center justify-center z-10 pointer-events-none">
            <div className="text-center">
              <Upload className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-blue-700">Drop files here to upload</p>
            </div>
          </div>
        )}

        {/* Folders Section */}
        {folders.length > 0 && (
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-black mb-4">Folders</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {currentPath !== '/' && (
                <div 
                  onClick={navigateUp}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer flex items-center space-x-3"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Folder className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-black truncate">..</p>
                    <p className="text-xs text-gray-500">Parent Directory</p>
                  </div>
                </div>
              )}
              
              {folders.map((folder) => (
                <div 
                  key={folder.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer flex items-center space-x-3"
                >
                  <div 
                    className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center"
                    onClick={() => navigateToFolder(folder)}
                  >
                    <Folder className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div 
                    className="flex-1 min-w-0"
                    onClick={() => navigateToFolder(folder)}
                  >
                    <p className="font-medium text-black truncate">{folder.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(folder.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFolder(folder);
                        setShowDeleteConfirm(true);
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Files Section */}
        <div className="p-6">
          <h2 className="text-lg font-semibold text-black mb-4">Files</h2>
          {filteredFiles.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-700">Name</th>
                    <th className="text-left p-4 font-medium text-gray-700">Type</th>
                    <th className="text-left p-4 font-medium text-gray-700">Size</th>
                    <th className="text-left p-4 font-medium text-gray-700">Created By</th>
                    <th className="text-left p-4 font-medium text-gray-700">Date</th>
                    <th className="text-left p-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map((file) => (
                    <tr key={file.id} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            {getFileIcon(file.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-black truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{file.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-gray-600">
                          {file.type.split('/')[1]?.toUpperCase() || file.type}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-gray-600">{formatFileSize(file.size)}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-gray-600">{file.creator?.name || 'Unknown'}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-gray-600">
                          {new Date(file.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          {file.type.startsWith('image/') && (
                            <button 
                              onClick={() => {
                                setSelectedFile(file);
                                setShowFilePreview(true);
                              }}
                              className="p-2 text-gray-400 hover:text-black transition-colors"
                              title="Preview"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => downloadFile(file)}
                            className="p-2 text-gray-400 hover:text-black transition-colors"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => toggleFilePublic(file)}
                            className={`p-2 ${file.is_public ? 'text-green-500' : 'text-gray-400'} hover:text-black transition-colors`}
                            title={file.is_public ? 'Public' : 'Make Public'}
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedFile(file);
                              setShowDeleteConfirm(true);
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <File className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No files found</h3>
              <p className="text-gray-500">
                {searchTerm || typeFilter !== 'all'
                  ? 'Try adjusting your search criteria'
                  : 'Upload files to get started'
                }
              </p>
              {!searchTerm && typeFilter === 'all' && (
                <button 
                  onClick={() => setShowUploadModal(true)}
                  className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Upload Files
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">Upload Files</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 text-gray-400 hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div 
                className={`border-2 border-dashed ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'} rounded-lg p-8 text-center mb-4`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Drag and drop files here</p>
                <p className="text-gray-500 text-sm mb-4">or</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  multiple
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Browse Files'}
                </button>
              </div>
              
              {isUploading && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Uploading...</span>
                    <span className="text-sm font-medium text-black">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Info className="w-5 h-5 text-blue-500 mr-3 mt-0.5" />
                  <div>
                    <p className="text-blue-700 font-medium">File Upload Information</p>
                    <ul className="text-blue-600 mt-1 text-sm list-disc list-inside">
                      <li>Maximum file size: 100MB</li>
                      <li>Supported formats: Images, PDFs, Office documents, etc.</li>
                      <li>Files will be uploaded to the current folder: {currentPath}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isUploading}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">Create New Folder</h2>
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="p-2 text-gray-400 hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Folder Name
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Enter folder name"
                />
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  The folder will be created in: <span className="font-medium">{currentPath}</span>
                </p>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createFolder}
                disabled={!newFolderName.trim()}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {showFilePreview && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-black truncate max-w-lg">{selectedFile.name}</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => downloadFile(selectedFile)}
                  className="p-2 text-gray-400 hover:text-black transition-colors"
                  title="Download"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowFilePreview(false)}
                  className="p-2 text-gray-400 hover:text-black transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4">
              {selectedFile.type.startsWith('image/') ? (
                <img
                  src={`${supabase.storage.from('files').getPublicUrl(selectedFile.storage_path).data.publicUrl}`}
                  alt={selectedFile.name}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-center">
                  <FileText className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Preview not available for this file type</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div>
                  <span className="font-medium">Size:</span> {formatFileSize(selectedFile.size)}
                </div>
                <div>
                  <span className="font-medium">Type:</span> {selectedFile.type}
                </div>
                <div>
                  <span className="font-medium">Created:</span> {new Date(selectedFile.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (selectedFile || selectedFolder) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">Confirm Deletion</h2>
            </div>
            
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
                  <div>
                    <p className="text-red-700 font-medium">
                      Are you sure you want to delete this {selectedFile ? 'file' : 'folder'}?
                    </p>
                    <p className="text-red-600 mt-1 text-sm">This action cannot be undone.</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium text-black">
                  {selectedFile ? selectedFile.name : selectedFolder?.name}
                </p>
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-1">
                    {formatFileSize(selectedFile.size)} • {selectedFile.type}
                  </p>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedFile(null);
                  setSelectedFolder(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={selectedFile ? deleteFile : deleteFolder}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete {selectedFile ? 'File' : 'Folder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};