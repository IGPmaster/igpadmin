// src/components/ImageUpload.jsx
import React, { useState } from 'react';
import { Upload, Loader2, ImagePlus, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';

function ImageUpload({ 
  onUpload, 
  onRemove,  // New prop for removal
  imageType,
  currentImageUrl = null,
  maxSize = 2048000,
acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
  allowRemove = false // Only enable for non-essential images
}) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl);
  const [error, setError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation
    if (!acceptedTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, WebP or SVG)');
      return;
    }

    if (file.size > maxSize) {
      setError(`File size should be less than ${maxSize / 1000000}MB`);
      return;
    }

    try {
      setError(null);
      setUploading(true);
      setUploadSuccess(false);

      // Create preview
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Upload to Cloudflare
      await onUpload(file);

      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err) {
      setError('Failed to upload image. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      await onRemove();
      setPreviewUrl(null);
    } catch (err) {
      setError('Failed to remove image');
      console.error('Remove error:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Preview Area */}
      <div className="relative rounded-lg border-2 border-dashed border-gray-300 p-4">
        {previewUrl ? (
          <div className="relative group">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="max-h-48 rounded-lg mx-auto"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
              <label className="cursor-pointer p-2 bg-white rounded-full hover:bg-gray-100 group/button">
                <ImagePlus className="w-5 h-5 text-gray-700" />
                <span className="sr-only">Replace Image</span>
                {/* Tooltip */}
                <span className="invisible group-hover/button:visible absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap">
                  Replace Image
                </span>
                <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp,image/svg+xml"
                    onChange={handleFileSelect}
                    disabled={uploading}
                />
              </label>
              {allowRemove && (
                <button
                  onClick={handleRemove}
                  className="p-2 bg-white rounded-full hover:bg-gray-100 group/button"
                  disabled={uploading}
                >
                  <Trash2 className="w-5 h-5 text-red-600" />
                  <span className="sr-only">Remove Image</span>
                  {/* Tooltip */}
                  <span className="invisible group-hover/button:visible absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap">
                    Remove Image
                  </span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center cursor-pointer p-6">
            <Upload className="w-8 h-8 text-gray-400" />
            <span className="mt-2 text-sm text-gray-500">
              Click to upload {imageType}
            </span>
            <input
              type="file"
              className="hidden"
              accept={acceptedTypes.join(',')}
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </label>
        )}
      </div>

      {/* Status Area */}
      {uploading && (
        <div className="flex items-center justify-center space-x-2 text-blue-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Uploading...</span>
        </div>
      )}

      {uploadSuccess && (
        <div className="flex items-center justify-center space-x-2 text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm">Upload successful!</span>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center space-x-2 text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  );
}

export default ImageUpload;