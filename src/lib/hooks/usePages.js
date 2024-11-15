// src/lib/hooks/usePages.js
import { useState, useEffect, useCallback } from 'react';
import { config } from '../config';

const WORKER_URL = 'https://casino-pages-api.tech1960.workers.dev';

export function usePages(brandId, lang) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // List all pages for a brand/language
  const listPages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${WORKER_URL}/api/pages?brandId=${brandId}&lang=${lang}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch pages');
      }
      
      const data = await response.json();
      setPages(data);
      return data;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [brandId, lang]);

  // Add new page
  const addPage = useCallback(async (pageData) => {
    try {
      setLoading(true);

      if (pageData.images) {
        pageData.images = await uploadPageImages(pageData.images);
      }

      const response = await fetch(`${WORKER_URL}/api/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId, lang, ...pageData })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create page');
      }

      await listPages();
      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [brandId, lang, listPages]);

  // Update existing page
  const updatePage = useCallback(async (pageId, updates) => {
    try {
      setLoading(true);

      if (updates.images) {
        updates.images = await uploadPageImages(updates.images);
      }

      const response = await fetch(`${WORKER_URL}/api/pages/${pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, brandId, lang, ...updates })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update page');
      }

      await listPages();
      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [brandId, lang, listPages]);

  // Delete page
 const deletePage = async (pageId) => {
  console.log('deletePage called with:', { pageId, brandId, lang });

  try {
    setLoading(true);

    // Include brandId, lang, and pageId in the URL
    const deleteUrl = `${WORKER_URL}/api/pages/${pageId}?brandId=${brandId}&lang=${lang}`;

    console.log('Sending DELETE request to:', deleteUrl);

    const response = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('Delete response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Delete response error:', errorData);
      throw new Error(JSON.stringify(errorData));
    }

    console.log('Delete successful, refreshing pages');
    await refreshPages();
  } catch (err) {
    console.error('Delete error in usePages:', err);
    throw err;
  } finally {
    setLoading(false);
  }
};

  // Handle image uploads
  const uploadPageImages = useCallback(async (images) => {
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
  }, [brandId, lang]);

  // Fetch pages on mount and when brand/lang changes
  useEffect(() => {
    if (brandId && lang) {
      listPages();
    }
  }, [brandId, lang, listPages]);

  return {
    pages,
    loading,
    error,
    addPage,
    updatePage,
    deletePage,
    refreshPages: listPages
  };
}
