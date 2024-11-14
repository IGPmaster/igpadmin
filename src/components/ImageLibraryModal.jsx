import React, { useEffect, useState } from 'react';
const IMAGE_LIBRARY_URL = 'https://image-library-worker.tech1960.workers.dev/images/list';

function ImageLibraryModal({ isOpen, onClose, onSelectImage }) {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow-md max-w-md w-full">
        <h2 className="text-lg font-semibold mb-4">Select an Image</h2>
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
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-700 text-white rounded">Close</button>
      </div>
    </div>
  );
}

export default ImageLibraryModal;
