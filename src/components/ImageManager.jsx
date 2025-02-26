import { useState } from 'react';
import { PhotoIcon, TrashIcon } from '@heroicons/react/24/outline';
import ImageLibraryModal from './ImageLibraryModal';

/**
 * A reusable component for managing images with upload, library selection, and deletion
 * 
 * @param {Object} props
 * @param {string} props.imageUrl - Current image URL
 * @param {string} props.imageAlt - Current image alt text
 * @param {string} props.type - Type of image (e.g., 'Desktop', 'Mobile', 'Featured')
 * @param {string} props.lang - Current language code
 * @param {Function} props.onReplace - Function to call when replacing image
 * @param {Function} props.onDelete - Function to call when deleting image
 * @param {Function} props.onAltChange - Function to call when alt text changes
 * @param {boolean} props.isLoading - Whether the component is in a loading state
 */
export default function ImageManager({ 
  imageUrl, 
  imageAlt = '', 
  type, 
  lang, 
  onReplace, 
  onDelete, 
  onAltChange,
  onLibrarySelect,
  isLoading = false 
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-48 w-full rounded"></div>
    );
  }

  const handleLibraryOpen = () => {
    setIsLibraryOpen(true);
  };

  const handleLibraryClose = () => {
    setIsLibraryOpen(false);
  };

  const handleLibrarySelect = (url) => {
    if (onLibrarySelect) {
      onLibrarySelect(url);
    }
    setIsLibraryOpen(false);
  };

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file && onReplace) {
        onReplace(file);
      }
    };

    input.click();
  };

  if (!imageUrl) {
    return (
      <div className="space-y-2">
        <div 
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
        >
          <div className="flex flex-col items-center justify-center space-y-2">
            <PhotoIcon className="h-12 w-12 text-gray-400" />
            <div className="text-gray-500 dark:text-gray-400 text-sm">Click to add {type} image</div>
            <div className="flex space-x-2">
              <button 
                onClick={handleUpload}
                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
              >
                Upload
              </button>
              <button 
                onClick={handleLibraryOpen}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Library
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div 
        className="relative group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <img 
          src={imageUrl} 
          alt={imageAlt || `${type} image for ${lang}`}
          className="max-w-full h-auto rounded-lg"
          key={`${imageUrl}-${lang}`}
        />
        
        {/* Language badge */}
        <div className="absolute top-2 right-2 bg-yellow-400 text-gray-900 font-medium px-2 py-1 text-xs rounded">
          {lang}
        </div>

        {/* Action buttons on hover */}
        {isHovered && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center gap-4">
            <button
              onClick={handleUpload}
              className="p-2 bg-blue-500 hover:bg-blue-600 rounded-full text-white transition-colors"
              title={`Replace ${type} image`}
            >
              <PhotoIcon className="h-6 w-6" />
            </button>
            <button
              onClick={handleLibraryOpen}
              className="p-2 bg-green-500 hover:bg-green-600 rounded-full text-white transition-colors"
              title="Select from library"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="p-2 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors"
              title={`Delete ${type} image`}
            >
              <TrashIcon className="h-6 w-6" />
            </button>
          </div>
        )}
      </div>
      
      {/* Alt text input */}
      <div className="mt-2">
        <label htmlFor={`alt-text-${type}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Alt Text
        </label>
        <input
          type="text"
          id={`alt-text-${type}`}
          value={imageAlt || ''}
          onChange={(e) => onAltChange && onAltChange(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white sm:text-sm"
          placeholder="Describe the image for accessibility"
        />
      </div>
      
      {/* Image URL display */}
      <div className="text-xs text-gray-500 dark:text-gray-400 break-all">
        URL: {imageUrl}
      </div>

      {/* Image Library Modal */}
      {isLibraryOpen && (
        <ImageLibraryModal
          isOpen={isLibraryOpen}
          onClose={handleLibraryClose}
          onSelect={handleLibrarySelect}
        />
      )}
    </div>
  );
} 