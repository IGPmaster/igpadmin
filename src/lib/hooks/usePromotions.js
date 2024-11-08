// src/lib/hooks/usePromotions.js
import { useState, useEffect } from 'react';
import { config } from '../config';

const WORKER_URL = 'https://casino-promotions-api.tech1960.workers.dev'; // Update this to your actual worker URL

export function usePromotions(brandId, lang) {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // List all promotions for a brand/language
  const listPromotions = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${WORKER_URL}/promotions?brandId=${brandId}&lang=${lang}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch promotions');
      }
      
      const data = await response.json();
      setPromotions(data);
      return data;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Add new promotion
  const addPromotion = async (promotionData) => {
    try {
      setLoading(true);
      
      // Handle image uploads first if needed
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

      const response = await fetch(
        `${WORKER_URL}/promotions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key,
            value: promotionContent
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add promotion');
      }

      await listPromotions();
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
      
      // Handle image updates if needed
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

      const response = await fetch(
        `${WORKER_URL}/promotions`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key,
            value: updatedContent
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update promotion');
      }

      await listPromotions();
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
      const key = `promo:${brandId}:${lang}:${promoId}`;

      const response = await fetch(
        `${WORKER_URL}/promotions`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ key })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete promotion');
      }

      await listPromotions();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Upload images to Cloudflare Images (keeping existing implementation)
  const uploadPromotionImages = async (images) => {
    const uploadImage = async (file, type) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify({
        brand: brandId,
        type: `promotion_${type}`,
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

    const imageUrls = {
      desktop: '',
      mobile: ''
    };

    if (images?.desktop) {
      imageUrls.desktop = await uploadImage(images.desktop, 'desktop');
    }
    if (images?.mobile) {
      imageUrls.mobile = await uploadImage(images.mobile, 'mobile');
    }

    return imageUrls;
  };

  // Fetch promotions on mount and when brand/lang changes
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
    refreshPromotions: listPromotions
  };
}