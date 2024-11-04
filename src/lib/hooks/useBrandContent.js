// src/lib/hooks/useBrandContent.js

import { useState, useEffect } from 'react';
import { getBrandContent, saveBrandContent } from '../api';

// Map of brand IDs to names - this should match your BrandList.jsx
const BRAND_INFO = {
  '12': 'Hippozino',
  '239': 'JazzySpins',
  '65': 'Maxiplay',
  '212': 'BetDukes',
  '188': 'Casimboo',
  '189': 'Royalzee',
  '77': 'MrSlot',
  '76': 'MrMobi',
  '107': 'MrJackvegas',
  '102': 'MrSuperplay',
  '30': 'Dukes Casino',
  '34': 'Jackpot Paradise',
  '26': 'Vegas Paradise'
};

const getDefaultContent = (brandId, lang) => ({
  brand_info: {
    whitelabel_id: brandId,
    brand_name: BRAND_INFO[brandId] || 'Unknown Brand',
    logo: '', // Add this
    logo_alt: '', // Add this
  },
  acf: {
    image_full: '',
    image_full_alt: '', // Add this
    image_small: '',
    image_small_alt: '', // Add this
    trust_icons: '',
    new_games_info: '',
    popular_games_info: '',
    slot_games_info: '',
    casino_games_info: '',
    jackpot_games_info: '',
    live_games_info: '',
    scratch_games_info: '',
    sig_terms: '',
    full_terms: '',
    main_content: '', // Add this line
    tnc_color: '#FEFBF3',
    geo_target_country_sel: [lang]
  }
});

export function useBrandContent(brandId, lang) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchContent() {
      try {
        setLoading(true);
        let data;
        try {
          data = await getBrandContent(brandId, lang);
        } catch (err) {
          // If content doesn't exist, use default structure
          data = getDefaultContent(brandId, lang);
        }
        setContent(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (brandId && lang) {
      fetchContent();
    }
  }, [brandId, lang]);

  const updateContent = async (newContent) => {
    try {
      await saveBrandContent(brandId, lang, newContent);
      setContent(newContent);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  return { content, loading, error, updateContent };
}