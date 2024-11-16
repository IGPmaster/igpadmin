import React, { useEffect, useState } from 'react';
const IMAGE_LIBRARY_URL = 'https://image-library-worker.tech1960.workers.dev/images/list';

export default function ImageLibraryModal({ isOpen, onClose, onSelectImage }) {
  const [images, setImages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (isOpen) {
      fetchImages();
    }
  }, [isOpen]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${IMAGE_LIBRARY_URL}`);
      const data = await response.json();
      setImages(data);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredImages = images.filter(image => 
    image.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatFilename = (filename) => {
    return filename
      .replace(/\.[^/.]+$/, '')
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50">
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:p-6">
            <div className="absolute right-4 top-4">
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
              >
                ✕
              </button>
            </div>

            <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white mb-4">
              Select Image from Library
            </h3>

            <div className="mb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search images..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto">
                {filteredImages.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No images found matching your search.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {filteredImages.map((image) => (
                      <div 
                        key={image.id} 
                        className="relative group cursor-pointer"
                        onClick={() => onSelectImage(image.url)}
                      >
                        <div className="aspect-w-16 aspect-h-9 mb-2">
                          <img
                            src={image.url}
                            alt={image.filename}
                            className="w-full h-32 object-cover rounded hover:opacity-75 transition-opacity duration-200"
                          />
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 truncate text-center">
                          {formatFilename(image.filename)}
                        </p>
                        <div className="absolute inset-0 bg-black bg-opacity-50 text-white p-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded flex items-center justify-center text-center pointer-events-none">
                          <span className="line-clamp-3">
                            {formatFilename(image.filename)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
