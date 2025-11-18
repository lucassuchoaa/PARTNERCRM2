/**
 * Upload Service - Supabase Storage Integration
 * Handles file uploads to Supabase Storage via API
 */

export interface UploadResponse {
  success: boolean;
  data?: {
    fileName: string;
    originalName: string;
    path: string;
    url: string;
    size: number;
    mimeType: string;
  };
  error?: string;
}

export interface UploadOptions {
  folder?: string;
  onProgress?: (progress: number) => void;
}

class UploadService {
  private apiUrl = '/api/upload';

  /**
   * Upload a file to Supabase Storage
   * @param file - File object to upload
   * @param options - Upload options (folder, progress callback)
   * @returns Upload response with file URL
   */
  async uploadFile(
    file: File,
    options: UploadOptions = {}
  ): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      if (options.folder) {
        formData.append('folder', options.folder);
      }

      const xhr = new XMLHttpRequest();

      return new Promise((resolve, reject) => {
        // Track upload progress
        if (options.onProgress) {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              options.onProgress?.(progress);
            }
          });
        }

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (error) {
              reject({
                success: false,
                error: 'Erro ao fazer parse da resposta do servidor'
              });
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              reject(errorResponse);
            } catch {
              reject({
                success: false,
                error: `Erro HTTP ${xhr.status}: ${xhr.statusText}`
              });
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject({
            success: false,
            error: 'Erro de rede ao fazer upload'
          });
        });

        xhr.addEventListener('abort', () => {
          reject({
            success: false,
            error: 'Upload cancelado'
          });
        });

        xhr.open('POST', this.apiUrl);
        xhr.send(formData);
      });
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro ao fazer upload do arquivo'
      };
    }
  }

  /**
   * Upload multiple files
   * @param files - Array of files to upload
   * @param options - Upload options
   * @returns Array of upload responses
   */
  async uploadMultiple(
    files: File[],
    options: UploadOptions = {}
  ): Promise<UploadResponse[]> {
    const promises = files.map(file => this.uploadFile(file, options));
    return Promise.all(promises);
  }

  /**
   * Delete a file from Supabase Storage
   * @param path - File path in storage (e.g., 'materials/123-file.pdf')
   * @returns Success response
   */
  async deleteFile(path: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}?path=${encodeURIComponent(path)}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao deletar arquivo');
      }

      return data;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro ao deletar arquivo'
      };
    }
  }

  /**
   * Validate file before upload
   * @param file - File to validate
   * @param options - Validation options
   * @returns Validation result
   */
  validateFile(
    file: File,
    options: {
      maxSize?: number; // in bytes
      allowedTypes?: string[]; // MIME types
    } = {}
  ): { valid: boolean; error?: string } {
    const maxSize = options.maxSize || 50 * 1024 * 1024; // 50MB default
    const allowedTypes = options.allowedTypes || [];

    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / 1024 / 1024).toFixed(2);
      return {
        valid: false,
        error: `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`
      };
    }

    // Check file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(', ')}`
      };
    }

    return { valid: true };
  }

  /**
   * Format file size for display
   * @param bytes - File size in bytes
   * @returns Formatted size string
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Get file extension from filename
   * @param filename - File name
   * @returns File extension
   */
  getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  /**
   * Get file icon based on type
   * @param mimeType - File MIME type
   * @returns Icon name (for Heroicons)
   */
  getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'PhotoIcon';
    if (mimeType.startsWith('video/')) return 'VideoCameraIcon';
    if (mimeType.startsWith('audio/')) return 'MusicalNoteIcon';
    if (mimeType === 'application/pdf') return 'DocumentTextIcon';
    if (
      mimeType.includes('spreadsheet') ||
      mimeType.includes('excel') ||
      mimeType.includes('csv')
    ) {
      return 'TableCellsIcon';
    }
    if (
      mimeType.includes('presentation') ||
      mimeType.includes('powerpoint')
    ) {
      return 'PresentationChartBarIcon';
    }
    return 'DocumentIcon';
  }
}

// Export singleton instance
export const uploadService = new UploadService();
export default uploadService;
