// src/lib/hooks/usePages.js
import { useState, useEffect } from 'react';
import { config } from '../config';

const WORKER_URL = 'https://casino-pages-api.tech1960.workers.dev'; // Update this to your worker URL

export function usePages(brandId, lang) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // List all pages for a brand/language
  const listPages = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${WORKER_URL}/api/pages?brandId=${brandId}&lang=${lang}`
      );

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
  };

  // Add new page
  const addPage = async (pageData) => {
    try {
      setLoading(true);
      
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

      await listPages();
      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update existing page
  const updatePage = async (pageId, updates) => {
    try {
      setLoading(true);
      
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

      await listPages();
      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete page
  const deletePage = async (pageId) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${WORKER_URL}/api/pages/${pageId}?brandId=${brandId}&lang=${lang}`,
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete page');
      }

      await listPages();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

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

  // Fetch pages on mount and when brand/lang changes
  useEffect(() => {
    if (brandId && lang) {
      listPages();
    }
  }, [brandId, lang]);

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