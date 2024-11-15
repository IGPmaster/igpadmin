import React, { useEffect, useState } from 'react';
const IMAGE_LIBRARY_URL = 'https://image-library-worker.tech1960.workers.dev/images/list';

export default function ImageLibraryModal({ isOpen, onClose, onSelectImage }) {
  const [images, setImages] = useState([]);
  
  useEffect(() => {
    if (isOpen) {
      fetchImages();
    }
  }, [isOpen]);

  const fetchImages = async () => {
    const response = await fetch(`${IMAGE_LIBRARY_URL}`);
    const data = await response.json();
    setImages(data);
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

            <div className="max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-2">
                {images.map((image) => (
                  <img
                    key={image.id}
                    src={image.url}
                    alt={image.filename}
                    onClick={() => onSelectImage(image.url)}
                    className="cursor-pointer hover:opacity-75"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
