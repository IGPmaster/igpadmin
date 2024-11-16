// src/lib/api.js

import { config } from './config';

const WORKER_URL = 'https://casino-content-admin.tech1960.workers.dev';

// Simplified fetch helper without problematic headers
const fetchWithTimeout = async (url, options, timeout = 5000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

export async function getBrandContent(brandId, lang) {
  if (!brandId || !lang) {
    console.error('Missing required parameters:', { brandId, lang });
    throw new Error('Brand ID and language are required');
  }

  const url = `${WORKER_URL}/kv?key=brand:${brandId}:${lang}`;

  try {
    const response = await fetchWithTimeout(url, {
      method: 'GET',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server response error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Server returned ${response.status}: ${errorText}`);
    }
    
    const content = await response.json();
    
    // Normalize content structure
    const normalizedContent = {
      ...content,
      acf: {
        ...content.acf,
        image_full: content.acf?.image_full || '',
        image_small: content.acf?.image_small || '',
        image_full_alt: content.acf?.image_full_alt || '',
        image_small_alt: content.acf?.image_small_alt || '',
        language: lang
      }
    };

    return normalizedContent;

  } catch (error) {
    console.error('Error fetching brand content:', {
      url,
      brandId,
      lang,
      error: error.message
    });
    throw error;
  }
}

export async function saveBrandContent(brandId, lang, content) {
  if (!brandId || !lang || !content) {
    throw new Error('Brand ID, language and content are required');
  }

  const url = `${WORKER_URL}/kv`;

  try {
    const contentToSave = {
      ...content,
      acf: {
        ...content.acf,
        image_full: content.acf?.image_full || '',
        image_small: content.acf?.image_small || '',
        image_full_alt: content.acf?.image_full_alt || '',
        image_small_alt: content.acf?.image_small_alt || '',
        language: lang
      }
    };

    const response = await fetchWithTimeout(url, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: `brand:${brandId}:${lang}`,
        value: contentToSave
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to save content: ${errorData}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error('Save operation was not successful');
    }

    return contentToSave;

  } catch (error) {
    console.error('Error saving brand content:', {
      url,
      brandId,
      lang,
      error: error.message
    });
    throw error;
  }
}

// Add new savePromotion function for promotions data
export async function savePromotion(brandId, lang, promotionData) {
  try {
    const promoId = promotionData.id || crypto.randomUUID();
    const key = `promo:${brandId}:${lang}:${promoId}`;

    const response = await fetch(`${WORKER_URL}/kv`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key,
        value: promotionData
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save promotion');
    }

    const result = await response.json();
    if (!result.success) throw new Error('Save operation failed');

    return promoId;
  } catch (error) {
    console.error('Error saving promotion:', error);
    throw error;
  }
}

export async function getAllBrands() {
  try {
    const response = await fetch(`${WORKER_URL}/kv/list`, {
      method: 'GET'
    });

    if (!response.ok) throw new Error('Failed to fetch brands');

    const data = await response.json();
    const brandsMap = new Map();

    // First pass: collect brands and languages
    data.forEach(item => {
      const keyParts = item.name.split(':');
      if (keyParts.length === 3) {
        const brandId = keyParts[1];
        const lang = keyParts[2];

        if (!brandsMap.has(brandId)) {
          brandsMap.set(brandId, {
            id: brandId,
            name: getBrandName(brandId),
            whitelabel_id: brandId,
            languages: [],
            brand_info: {}
          });
        }

        const brand = brandsMap.get(brandId);
        if (!brand.languages.includes(lang)) {
          brand.languages.push(lang);
          brand.languages.sort();
        }
      }
    });

    const brandsWithContent = await Promise.all(
      Array.from(brandsMap.values()).map(async (brand) => {
        if (brand.languages.length > 0) {
          try {
            const firstLangContent = await getBrandContent(brand.id, brand.languages[0]);
            return {
              ...brand,
              brand_info: {
                ...brand.brand_info,
                logo: firstLangContent?.brand_info?.logo || '',
                logo_alt: firstLangContent?.brand_info?.logo_alt || ''
              }
            };
          } catch (error) {
            console.error(`Error fetching content for brand ${brand.id}:`, error);
            return brand;
          }
        }
        return brand;
      })
    );

    return brandsWithContent.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error fetching brands:', error);
    throw error;
  }
}

export async function updateBrandLogo(brandId, logoUrl, logoAlt) {
  try {
    // Get all available languages for this brand
    const response = await fetch(`https://worker-casino-brands.tech1960.workers.dev/list/${brandId}`);
    const { languages } = await response.json();

    // Update logo for each language
    for (const lang of languages) {
      const content = await getBrandContent(brandId, lang);
      
      const updatedContent = {
        ...content,
        brand_info: {
          ...content.brand_info,
          logo: logoUrl,
          logo_alt: logoAlt
        }
      };

      await saveBrandContent(brandId, lang, updatedContent);
    }

    return true;
  } catch (error) {
    console.error('Error updating brand logo:', error);
    throw error;
  }
}

function getBrandName(brandId) {
  const brands = {
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
  return brands[brandId] || `Unknown Brand (${brandId})`;
}

// Analytics fetch function
export async function getCloudflareTrafficData(brandId) {
  if (!brandId) {
    console.error('No brandId provided to getCloudflareTrafficData');
    return {
      traffic24h: '-',
      requests30d: '-',
      bandwidth: '-',
      threats: '-'
    };
  }

  try {
    const response = await fetch(`${WORKER_URL}/analytics?brandId=${brandId}`, {
      method: 'GET'
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Analytics error details:', data);
      return data.data || {
        traffic24h: '-',
        requests30d: '-',
        bandwidth: '-',
        threats: '-'
      };
    }

    return data;
  } catch (error) {
    console.error(`Error fetching analytics for brand ${brandId}:`, error);
    return {
      traffic24h: '-',
      requests30d: '-',
      bandwidth: '-',
      threats: '-'
    };
  }
}
