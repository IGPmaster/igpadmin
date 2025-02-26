import { useState, useEffect, useRef } from 'react';
import { config } from '../config';

const WORKER_URL = 'https://casino-promotions-api.tech1960.workers.dev';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export function usePromotions(brandId, lang) {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const refreshInProgress = useRef(false);

  // List all promotions for a brand/language with retry logic
  const listPromotions = async (retryCount = 0) => {
    // If a refresh is already in progress, don't start another one
    if (refreshInProgress.current) {
      console.log('Refresh already in progress, skipping');
      return;
    }

    try {
      refreshInProgress.current = true;
      setLoading(true);
      
      console.log(`Attempting to fetch promotions (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
      
      const response = await fetch(`${WORKER_URL}/api/promotions?brandId=${brandId}&lang=${lang}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        // Add cache busting parameter to avoid browser caching
        cache: 'no-store'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch promotions');
      }

      const data = await response.json();
      console.log(`Successfully fetched ${data.length} promotions`);
      setPromotions(data);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error('Error fetching promotions:', err);
      
      // Implement retry logic
      if (retryCount < MAX_RETRIES && err.message !== 'Failed to fetch promotions') {
        console.log(`Retrying in ${RETRY_DELAY}ms...`);
        setTimeout(() => {
          refreshInProgress.current = false;
          listPromotions(retryCount + 1);
        }, RETRY_DELAY);
        return;
      }
      
      setError(err.message);
    } finally {
      setLoading(false);
      refreshInProgress.current = false;
    }
  };

  // Refresh function for promotions list
  const refreshPromotions = async () => {
    // Only refresh if not already refreshing
    if (!refreshInProgress.current) {
      await listPromotions();
    } else {
      console.log('Refresh already in progress, skipping');
    }
  };

  // Add new promotion
  const addPromotion = async (promotionData) => {
    try {
      setLoading(true);
      const imageUrls = await uploadPromotionImages(promotionData.images);
      const promoId = crypto.randomUUID();
      const key = `promo:${brandId}:${lang}:${promoId}`;

      const promotionContent = {
        ...promotionData,
        id: promoId,
        images: imageUrls,
        meta: {
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };

      const response = await fetch(`${WORKER_URL}/api/promotions`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ key, value: promotionContent })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add promotion');
      }

      await refreshPromotions();
      return promoId;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update existing promotion
  const updatePromotion = async (promoId, updates) => {
    try {
      setLoading(true);
      if (updates.images) {
        updates.images = await uploadPromotionImages(updates.images);
      }

      const key = `promo:${brandId}:${lang}:${promoId}`;
      const updatedContent = {
        ...updates,
        id: promoId,
        meta: {
          ...updates.meta,
          updated_at: new Date().toISOString()
        }
      };

      const response = await fetch(`${WORKER_URL}/api/promotions/${promoId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ key, value: updatedContent })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update promotion');
      }

      await refreshPromotions();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete promotion
  const deletePromotion = async (promoId) => {
    try {
      setLoading(true);
      console.log(`Deleting promotion: ${promoId} for brand: ${brandId}, lang: ${lang}`);
      
      const key = `promo:${brandId}:${lang}:${promoId}`;

      // Optimistically update the UI by removing the promotion from the list
      setPromotions(currentPromotions => 
        currentPromotions.filter(promo => promo && promo.id !== promoId)
      );

      const response = await fetch(`${WORKER_URL}/api/promotions/${promoId}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ key })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Delete API Error (${response.status}):`, errorData);
        
        // If deletion fails, refresh the list to restore the correct state
        await refreshPromotions();
        
        throw new Error(errorData.error || `Failed to delete promotion (${response.status})`);
      }

      console.log(`Successfully deleted promotion ${promoId}`);
      // We've already updated the UI optimistically, but refresh to ensure consistency
      await refreshPromotions();
    } catch (err) {
      console.error('Error deleting promotion:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Image upload helper function
  const uploadPromotionImages = async (images) => {
    const uploadImage = async (file, type) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify({ brand: brandId, type: `promotion_${type}`, language: lang }));

      const response = await fetch('https://casino-content-admin.tech1960.workers.dev/upload', {
        method: 'POST',
        headers: {
          'Accept': 'application/json'
        },
        body: formData
      });

      if (!response.ok) throw new Error(`Failed to upload ${type} image`);
      const data = await response.json();
      return `https://imagedelivery.net/${config.CF_ACCOUNT_HASH}/${data.result.id}/public`;
    };

    return {
      desktop: images?.desktop ? await uploadImage(images.desktop, 'desktop') : '',
      mobile: images?.mobile ? await uploadImage(images.mobile, 'mobile') : ''
    };
  };

  useEffect(() => {
    if (brandId && lang) {
      listPromotions();
    }
  }, [brandId, lang]);

  return {
    promotions,
    loading,
    error,
    addPromotion,
    updatePromotion,
    deletePromotion,
    refreshPromotions
  };
}
