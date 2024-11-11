// src/lib/hooks/usePages.js
import { useQuery } from '@tanstack/react-query';
import { config } from '../config';

const WORKER_URL = 'https://casino-pages-api.tech1960.workers.dev';

export function usePages(brandId, lang) {
  // Updated React Query hook with object syntax
  const {
    data: pages,
    isLoading: loading,
    error,
    refetch
  } = useQuery({
    queryKey: ['pages', brandId, lang],
    queryFn: async () => {
      const response = await fetch(`${WORKER_URL}/api/pages?brandId=${brandId}&lang=${lang}`);
      if (!response.ok) {
        throw new Error('Failed to fetch pages');
      }
      return response.json();
    },
    enabled: !!brandId && !!lang,
  });

  // Handle image uploads
  const uploadPageImages = async (images) => {
    const uploadImage = async (file, type) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify({
        brand: brandId,
        type: `page_${type}`,
        language: lang
      }));

      const response = await fetch('https://casino-content-admin.tech1960.workers.dev/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error(`Failed to upload ${type} image`);
      const data = await response.json();
      return `https://imagedelivery.net/${config.CF_ACCOUNT_HASH}/${data.result.id}/public`;
    };

    const imageUrls = {};
    
    for (const [key, file] of Object.entries(images)) {
      if (file instanceof File) {
        imageUrls[key] = await uploadImage(file, key);
      } else {
        imageUrls[key] = file; // Keep existing URL
      }
    }

    return imageUrls;
  };

  // Add new page
  const addPage = async (pageData) => {
    try {
      // Handle image uploads if needed
      if (pageData.images) {
        pageData.images = await uploadPageImages(pageData.images);
      }

      const response = await fetch(
        `${WORKER_URL}/api/pages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            brandId,
            lang,
            ...pageData
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create page');
      }

      await refetch(); // Use React Query's refetch
      return await response.json();
    } catch (err) {
      throw err;
    }
  };

  // Update existing page
  const updatePage = async (pageId, updates) => {
    try {
      // Handle image updates if needed
      if (updates.images) {
        updates.images = await uploadPageImages(updates.images);
      }

      const response = await fetch(
        `${WORKER_URL}/api/pages/${pageId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pageId,
            brandId,
            lang,
            ...updates
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update page');
      }

      await refetch(); // Use React Query's refetch
      return await response.json();
    } catch (err) {
      throw err;
    }
  };

  // Delete page
  const deletePage = async (pageId) => {
  try {
    const response = await fetch(`${WORKER_URL}/api/pages`, {  // Changed endpoint
      method: 'DELETE',  // Changed to DELETE
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pageId,
        brandId,
        lang,
        key: `page:${brandId}:${lang}:${pageId}`
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete page');
    }

    await refetch(); // Refresh the list after successful deletion
    return await response.json();
  } catch (error) {
    console.error('Delete error:', error);
    throw error;
  }
};

  return {
    pages,
    loading,
    error,
    addPage,
    updatePage,
    deletePage,
    refreshPages: refetch
  };
}