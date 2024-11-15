import { useState, useEffect } from 'react';
import { config } from '../lib/config';
import ImageUpload from '../components/ImageUpload';

const WORKER_URL = 'https://casino-content-admin.tech1960.workers.dev';
const IMAGE_LIBRARY_URL = 'https://image-library-worker.tech1960.workers.dev/images/list';
const DELETE_IMAGE_URL = 'https://image-library-worker.tech1960.workers.dev/images';

const LibraryImageUpload = ({ onUpload }) => {
  const [key, setKey] = useState(0);

  const handleUpload = async (file) => {
    const success = await onUpload(file);
    if (success) {
      setTimeout(() => setKey(prev => prev + 1), 1500);
    }
    return success;
  };

  return (
    <ImageUpload 
      key={key}
      onUpload={handleUpload}
      imageType="Library Image"
      allowRemove={false}
    />
  );
};

export default function ImageLibrary() {
  const [images, setImages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleting, setIsDeleting] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchImages = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(IMAGE_LIBRARY_URL, {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch images');
        }

        const data = await response.json();

        const processedImages = data.map((item) => ({
          id: item.id,
          url: item.url,
          filename: item.filename || 'Untitled',
          uploaded: item.uploaded || new Date().toISOString(),
        }));

        setImages(processedImages);
      } catch (error) {
        setError(`Failed to load images: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchImages();
  }, []);

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify({
      type: 'library',
      filename: file.name,
    }));

    try {
      const response = await fetch(`${WORKER_URL}/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      if (data.success) {
        const newImage = {
          id: data.result.id,
          url: `https://imagedelivery.net/${config.CF_ACCOUNT_HASH}/${data.result.id}/public`,
          filename: file.name,
          uploaded: new Date().toISOString()
        };

        setImages(prev => [newImage, ...prev]);
        return true;
      }
    } catch (error) {
      setError('Failed to upload image');
    }
    return false;
  };

  const handleDelete = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    setIsDeleting(imageId);
    try {
      const response = await fetch(`${DELETE_IMAGE_URL}/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }

      setImages(prev => prev.filter(img => img.id !== imageId));
    } catch (error) {
      setError(`Failed to delete image: ${error.message}`);
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredImages = searchQuery
    ? images.filter(image => 
        image.filename.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : images;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Image Library</h2>
        <LibraryImageUpload onUpload={handleUpload} />
      </div>
      
      <input
        type="text"
        placeholder="Search images..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="p-2 border rounded mb-4 w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
      />

      {isLoading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 p-4 bg-red-50 rounded dark:bg-red-900/50">{error}</div>
      ) : filteredImages.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">No images found</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredImages.map((image) => (
            <div key={image.id} className="border rounded-lg overflow-hidden bg-white shadow dark:bg-gray-800 dark:border-gray-700">
              <div className="relative group">
                <img 
                  src={image.url} 
                  alt={image.filename} 
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => handleDelete(image.id)}
                    disabled={isDeleting === image.id}
                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                  >
                    {isDeleting === image.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
              <div className="p-4">
                <p className="font-medium truncate dark:text-white" title={image.filename}>
                  {image.filename}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(image.uploaded).toLocaleDateString()}
                </p>
                <div className="mt-2 flex items-center space-x-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(image.url);
                      alert('URL copied to clipboard!');
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Copy URL
                  </button>
                
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <a
                    href={image.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    View Full Size
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}