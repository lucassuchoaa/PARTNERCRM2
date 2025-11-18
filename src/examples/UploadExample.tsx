import { useState } from 'react';
import uploadService from '../services/uploadService';

/**
 * Upload Example Component
 * Demonstrates how to use the upload service
 */

export default function UploadExample() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = uploadService.validateFile(file, {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
    });

    if (!validation.valid) {
      setError(validation.error || 'Arquivo inválido');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setError(null);
    setUploadResult(null);
    setUploadProgress(0);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const result = await uploadService.uploadFile(selectedFile, {
        folder: 'examples',
        onProgress: (progress) => {
          setUploadProgress(progress);
        }
      });

      if (result.success && result.data) {
        setUploadResult(result.data);
        console.log('Upload successful:', result.data);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer upload');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!uploadResult?.path) return;

    try {
      const result = await uploadService.deleteFile(uploadResult.path);

      if (result.success) {
        setUploadResult(null);
        setSelectedFile(null);
        setUploadProgress(0);
        console.log('File deleted successfully');
      } else {
        throw new Error(result.error || 'Delete failed');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar arquivo');
      console.error('Delete error:', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Upload Example - Supabase Storage</h2>

      {/* File Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select File
        </label>
        <input
          type="file"
          onChange={handleFileSelect}
          disabled={uploading}
          className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
        />
        <p className="mt-1 text-sm text-gray-500">
          Max 10MB. Allowed: PDF, Images, Word documents
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Selected File Info */}
      {selectedFile && !uploadResult && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Selected File:</h3>
          <div className="space-y-1 text-sm text-blue-800">
            <p><strong>Name:</strong> {selectedFile.name}</p>
            <p><strong>Size:</strong> {uploadService.formatFileSize(selectedFile.size)}</p>
            <p><strong>Type:</strong> {selectedFile.type}</p>
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload Result */}
      {uploadResult && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-900 mb-2">✅ Upload Successful!</h3>
          <div className="space-y-1 text-sm text-green-800 mb-4">
            <p><strong>File:</strong> {uploadResult.fileName}</p>
            <p><strong>Size:</strong> {uploadService.formatFileSize(uploadResult.size)}</p>
            <p><strong>Type:</strong> {uploadResult.mimeType}</p>
            <p><strong>Path:</strong> {uploadResult.path}</p>
          </div>

          {/* Public URL */}
          <div className="mb-4">
            <p className="text-sm font-semibold text-green-900 mb-1">Public URL:</p>
            <a
              href={uploadResult.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline break-all"
            >
              {uploadResult.url}
            </a>
          </div>

          {/* Preview (if image) */}
          {uploadResult.mimeType.startsWith('image/') && (
            <div className="mb-4">
              <p className="text-sm font-semibold text-green-900 mb-2">Preview:</p>
              <img
                src={uploadResult.url}
                alt={uploadResult.fileName}
                className="max-w-full h-auto rounded border border-gray-300"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Delete File
            </button>
            <button
              onClick={() => {
                setUploadResult(null);
                setSelectedFile(null);
                setUploadProgress(0);
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Upload Another
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">How to Use:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
          <li>Select a file (max 10MB)</li>
          <li>File will be validated automatically</li>
          <li>Click "Upload File" to upload to Supabase Storage</li>
          <li>View the public URL and preview (for images)</li>
          <li>Delete or upload another file</li>
        </ol>

        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Note:</strong> Make sure you have configured Supabase Storage bucket "partner-files"
            and set it as PUBLIC. Check the setup guide in SUPABASE_SETUP_FINAL.md
          </p>
        </div>
      </div>
    </div>
  );
}
