// useBrandContent.js
import { useState, useEffect } from 'react';
import { getBrandContent, saveBrandContent } from '../api';

// Map of brand IDs to names
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
  // Core Metadata
  id: crypto.randomUUID(),
  brand_id: brandId,
  language: lang,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),

  // Brand Information
  brand_info: {
    whitelabel_id: brandId,
    brand_name: BRAND_INFO[brandId] || 'Unknown Brand',
    logo: {
      url: '',
      alt: '',
      width: null,
      height: null
    }
  },

  // Images with metadata
  images: {
    desktop: {
      url: '',
      alt: '',
      width: null,
      height: null,
      focal_point: 'center'
    },
    mobile: {
      url: '',
      alt: '',
      width: null,
      height: null,
      focal_point: 'center'
    },
    trust_icons: {
      url: '',
      alt: ''
    }
  },

  // SEO & Meta
  meta: {
    title: '',
    description: '',
    keywords: [],
    focus_keyword: '',
    canonical_url: '',
    
    og_title: '',
    og_description: '',
    og_type: 'website',
    og_image: '',
    
    twitter_card: 'summary_large_image',
    twitter_title: '',
    twitter_description: '',
    twitter_image: '',
    
    structured_data: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: BRAND_INFO[brandId] || '',
      url: ''
    }
  },

  // Main Content Sections
  content: {
    new_games_info: '',
    popular_games_info: '',
    slot_games_info: '',
    casino_games_info: '',
    jackpot_games_info: '',
    live_games_info: '',
    scratch_games_info: '',
    main_content: '',
    excerpt: ''
  },

  // Terms & Compliance
  legal: {
    sig_terms: '',
    full_terms: '',
    tnc_color: '#FEFBF3',
    compliance_notes: ''
  },

  // Enhanced targeting
  targeting: {
    countries: [lang.toUpperCase()],
    excluded_countries: [],
    geo_target_country_sel: [lang],
    regions: [],
    languages: [lang]
  },

  // Page Settings
  settings: {
    status: 'draft',
    template: 'default',
    priority: 0.5,
    indexing: {
      index: true,
      follow: true,
      advanced_robots: ''
    }
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