import ReactQuill from 'react-quill';
import { Tab } from '@headlessui/react';
import 'react-quill/dist/quill.snow.css';
import { useBrandContent } from '../lib/hooks/useBrandContent';
import { getBrandContent, saveBrandContent, updateBrandLogo } from '../lib/api';
import { config } from '../lib/config';
import { useState, useEffect, useCallback } from 'react';
import ImageUpload from '../components/ImageUpload';
import { PromotionForm } from '../components/PromotionForm';
import { PromotionsPanel } from '../components/PromotionsPanel';
import { PagesPanel } from '../components/PagesPanel';
import { PageForm } from '../components/PageForm';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { usePromotions } from '../lib/hooks/usePromotions';
import { Link } from 'react-router-dom';
import { LanguageSelector } from '../components/LanguageSelector';
import { Notification } from '../components/Notification';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import ImageLibraryModal from '../components/ImageLibraryModal';
import { PhotoIcon, TrashIcon } from '@heroicons/react/24/outline';

function CopyLanguageSelector({ currentLang, brandId, onCopy }) {
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAvailableLanguages() {
      try {
        const response = await fetch(`https://worker-casino-brands.tech1960.workers.dev/list/${brandId}`);
        if (response.ok) {
          const data = await response.json();
          setAvailableLanguages(data.languages.filter(lang => lang !== currentLang));
        }
      } catch (error) {
        console.error('Error fetching languages:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAvailableLanguages();
  }, [brandId, currentLang]);
  
  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <select disabled className="block w-48 pl-3 pr-10 py-2 text-sm border-gray-300 rounded-md bg-gray-50">
          <option>Loading languages...</option>
        </select>
      </div>
    );
  }

  if (availableLanguages.length === 0) return null;

  return (
    <div className="flex items-center space-x-2">
      <select
        className="block w-48 pl-3 pr-10 py-2 text-sm border-gray-300 rounded-md"
        onChange={(e) => onCopy(e.target.value)}
        defaultValue=""
      >
        <option value="" disabled>Copy content from...</option>
        {availableLanguages.map((lang) => (
          <option key={lang} value={lang}>
            {lang}
          </option>
        ))}
      </select>
    </div>
  );
}

// Move BrandImage outside the main component
const BrandImage = ({ imageUrl, type, onReplace, onDelete, lang, isLanguageChanging }) => {
  const [isHovered, setIsHovered] = useState(false);

  if (isLanguageChanging) {
    return (
      <div className="animate-pulse bg-gray-200 h-48 w-full rounded"></div>
    );
  }

  if (!imageUrl) {
    return (
      <div 
        className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition-colors"
        onClick={onReplace}
      >
        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
        <div className="text-gray-400 text-sm mt-2">Click to add {type} banner</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div 
        className="relative group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <img 
          src={imageUrl} 
          alt={`${type} banner for ${lang}`}
          className="max-w-full h-auto rounded-lg"
          key={`${imageUrl}-${lang}`}
        />
        
        {/* Language badge */}
        <div className="absolute top-2 right-2 bg-yellow-400 text-gray-900 font-medium px-2 py-1 text-xs rounded">
          {lang}
        </div>

        {/* Action buttons on hover */}
        {isHovered && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center gap-4">
            <button
              onClick={onReplace}
              className="p-2 bg-blue-500 hover:bg-blue-600 rounded-full text-white transition-colors"
              title={`Replace ${type} banner`}
            >
              <PhotoIcon className="h-6 w-6" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors"
              title={`Delete ${type} banner`}
            >
              <TrashIcon className="h-6 w-6" />
            </button>
          </div>
        )}
      </div>
      
      {/* Image URL display */}
      <div className="text-xs text-gray-500 break-all">
        Current URL: {imageUrl || 'None'}
      </div>
    </div>
  );
};

// Main Component
export function BrandEdit() {
  const { brandId, lang } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { content, loading, error, updateContent } = useBrandContent(brandId, lang);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copying, setCopying] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [localContent, setLocalContent] = useState(null);
  const [availableLangs, setAvailableLangs] = useState([]);
  const [showPromotionForm, setShowPromotionForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [showPageForm, setShowPageForm] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [isAddingLanguage, setIsAddingLanguage] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: 'info' });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingLanguageSwitch, setPendingLanguageSwitch] = useState(null);
  const [promotionsRefreshTrigger, setPromotionsRefreshTrigger] = useState(0);
  const [loadingLanguages, setLoadingLanguages] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);
  const [forceRefresh, setForceRefresh] = useState(0);
  const [forceRefreshPages, setForceRefreshPages] = useState(0);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [selectedImageType, setSelectedImageType] = useState(null);
  const [isLanguageChanging, setIsLanguageChanging] = useState(false);
  const [sharedPages, setSharedPages] = useState([]);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: 'info' }), 3000);
  };

  const logContentState = (content, source) => {
    console.log(`Content State [${source}] for ${lang}:`, {
      desktop: content?.acf?.image_full,
      mobile: content?.acf?.image_small,
      timestamp: new Date().toISOString()
    });
  };

  useEffect(() => {
    if (content && !isLanguageChanging) {
      // Only update if the content is for the current language
      if (content.acf?.language === lang) {
        setLocalContent(content);
      }
    }
  }, [content, isLanguageChanging, lang]);

  const handleLanguageSwitch = async (newLang) => {
    if (isDirty) {
      setPendingLanguageSwitch(newLang);
      setShowConfirmDialog(true);
      return;
    }

    try {
      setIsLanguageChanging(true);
      // Clear current content
      setLocalContent(null);
      
      // Navigate to new language
      navigate(`/brands/${content.brand_info.whitelabel_id}/${newLang}`);
      
      // Wait for content to be fetched
      const newContent = await getBrandContent(brandId, newLang);
      
      // Set new content with a small delay to ensure clean state
      setTimeout(() => {
        setLocalContent(newContent);
        setIsLanguageChanging(false);
      }, 100);

    } catch (err) {
      console.error('Error switching language:', err);
      showNotification('Failed to switch language', 'error');
      setIsLanguageChanging(false);
    }
  };
  
useEffect(() => {
  if (content?.brand_info?.whitelabel_id) {
    setLoadingLanguages(true); // Start loading
    fetch(`https://worker-casino-brands.tech1960.workers.dev/list/${content.brand_info.whitelabel_id}`)
      .then(res => res.json())
      .then(data => {
        setAvailableLangs(data.languages || []);
      })
      .catch(err => console.error('Error fetching languages:', err))
      .finally(() => setLoadingLanguages(false)); // End loading
  }
}, [content?.brand_info?.whitelabel_id]);

  const handleAddLanguage = async (brandId, newLang) => {
    try {
      if (!localContent) {
        throw new Error('No content available');
      }

      const initialContent = {
        ...localContent,
        acf: {
          ...localContent.acf,
          geo_target_country_sel: [newLang]
        }
      };

      await saveBrandContent(brandId, newLang, initialContent);
      setAvailableLangs(prev => [...prev, newLang].sort());
      navigate(`/brands/${brandId}/${newLang}`);
    } catch (error) {
      console.error('Failed to add language:', error);
      alert('Failed to add language. Please try again.');
    }
  };

  useEffect(() => {
    if (content) {
      setLocalContent(content);
    }
  }, [content]);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Ensure we're saving with the correct language
      const contentToSave = {
        ...localContent,
        acf: {
          ...localContent.acf,
          language: lang,
          // Preserve image fields explicitly
          image_full: localContent.acf?.image_full || '',
          image_small: localContent.acf?.image_small || '',
          image_full_alt: localContent.acf?.image_full_alt || '',
          image_small_alt: localContent.acf?.image_small_alt || ''
        }
      };

      await updateContent(contentToSave);
      setIsDirty(false);

    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyContent = async (fromLang) => {
    try {
      setCopying(true);
      const sourceContent = await getBrandContent(brandId, fromLang);
      
      const newContent = {
        ...content,
        acf: {
          ...sourceContent.acf,
          geo_target_country_sel: content.acf.geo_target_country_sel
        }
      };
      
      setLocalContent(newContent);
      setIsDirty(true);
    } catch (error) {
      console.error('Failed to copy content:', error);
    } finally {
      setCopying(false);
    }
  };

 const handleImageDelete = async (type) => {
  try {
    const updatedContent = {
      ...localContent,
      acf: {
        ...localContent.acf,
        [type === 'Desktop' ? 'image_full' : 'image_small']: '',
        [type === 'Desktop' ? 'image_full_alt' : 'image_small_alt']: ''
      }
    };

    await saveBrandContent(brandId, lang, updatedContent);
    setLocalContent(updatedContent);
    showNotification(`${type} banner deleted successfully`, 'success');
  } catch (error) {
    console.error('Error deleting image:', error);
    showNotification('Failed to delete image', 'error');
  }
};

const handleImageUpload = async (type) => {
  try {
    setUploading(true);
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify({
        brand: brandId,
        type: type.toLowerCase(),
        language: lang
      }));

      try {
        const response = await fetch('https://casino-content-admin.tech1960.workers.dev/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          console.error('Upload failed:', await response.text());
          return;
        }

        const data = await response.json();

        if (data.success) {
          const imageUrl = `https://imagedelivery.net/${config.CF_ACCOUNT_HASH}/${data.result.id}/public`;

          const newContent = {
            ...localContent,
            acf: {
              ...localContent.acf,
              [type === 'Desktop' ? 'image_full' : 'image_small']: imageUrl,
              language: lang
            }
          };

          console.log(`Updating ${type} image:`, {
            type,
            url: imageUrl,
            field: type === 'Desktop' ? 'image_full' : 'image_small'
          });

          setLocalContent(newContent);
          setIsDirty(true);
          
          await updateContent(newContent);
          showNotification(`${type} banner updated successfully`, 'success');
        }
      } catch (err) {
        console.error('Upload error:', err);
        showNotification(`Failed to upload ${type} banner`, 'error');
      }
    };

    input.click();
  } catch (err) {
    console.error('Upload failed:', err);
    showNotification('Upload failed', 'error');
  } finally {
    setUploading(false);
  }
};

const handleContentChange = (key, value) => {
  setIsDirty(true);
  setLocalContent(prev => ({
    ...prev,
    acf: {
      ...prev.acf,
      [key]: value,
      language: lang
    }
  }));
};

// Loading indicator with slick spinner
if (loading || !content || !localContent) return (
  <div className="flex justify-center items-center h-full">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    <span className="ml-3 text-gray-500 text-lg">Loading brand content...</span>
  </div>
);

if (error) return <div className="text-red-500">Error: {error}</div>;

// Add this function inside the BrandEdit component
const handlePageSharing = async (pageId, isShared) => {
  try {
    // Update the shared pages list in your database
    await fetch(`https://casino-pages-api.tech1960.workers.dev/api/pages/${pageId}/sharing`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        isShared,
        brandId,
        languages: isShared ? availableLangs : [lang] // If shared, make available in all languages
      })
    });

    // Update local state
    setSharedPages(prev => 
      isShared 
        ? [...prev, pageId]
        : prev.filter(id => id !== pageId)
    );

    showNotification(
      isShared 
        ? 'Page is now shared across all languages' 
        : 'Page is now language-specific',
      'success'
    );
  } catch (error) {
    console.error('Failed to update page sharing:', error);
    showNotification('Failed to update page sharing status', 'error');
  }
};

return (
  <div className="space-y-8">
    <div className="sm:flex sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 pb-5">
          {content.brand_info.brand_name} (ID: {content.brand_info.whitelabel_id})
        </h1>

        {/* Language Pills */}
<div className="flex flex-wrap gap-2">
  {loadingLanguages ? (
    <div className="flex items-center">
      <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
      </svg>
      <span className="ml-2 text-gray-500 text-sm">Loading languages...</span>
    </div>
  ) : (
    availableLangs.map((language) => (
      <button
        key={language}
        onClick={() => handleLanguageSwitch(language)}
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
          language === lang 
            ? 'bg-blue-600 dark:bg-blue-100 text-white dark:text-blue-800' 
            : 'bg-blue-100 dark:bg-blue-600 text-blue-800 dark:text-white hover:bg-blue-200'
        }`}
      >
        {language}
      </button>
    ))
  )}
</div>

      

        {/* Add Language selector */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-1">
            Add Language
          </label>
          <LanguageSelector
            currentLanguages={availableLangs}
            isLoading={isAddingLanguage}
            onSelect={async (newLang) => {
              try {
                setIsAddingLanguage(true);
                showNotification('Adding new language...', 'info');
                
                // Create empty content structure instead of copying existing content
                const newContent = {
                  brand_info: {
                    whitelabel_id: content.brand_info.whitelabel_id
                  },
                  acf: {
                    language: newLang,
                    geo_target_country_sel: [newLang],
                    image_full: '',
                    image_small: '',
                    casino_games_info: '',
                    slot_games_info: '',
                    main_content: '',
                    promo_over: '',
                    promo_under: '',
                    sig_terms: '',
                    trust_icons: '',
                    yoast_head_json: {
                      title: '',
                      description: ''
                    }
                  }
                };
                
                await saveBrandContent(content.brand_info.whitelabel_id, newLang, newContent);
                setAvailableLangs(prev => [...new Set([...prev, newLang])].sort());
                
                showNotification('Language added successfully!', 'success');
                navigate(`/brands/${content.brand_info.whitelabel_id}/${newLang}`);
              } catch (error) {
                console.error('Failed to add language:', error);
                showNotification('Failed to add language. Please try again.', 'error');
              } finally {
                setIsAddingLanguage(false);
              }
            }}
          />
        </div>
      </div>

  {/* Keep your existing Copy From Language section */}
  <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
    <CopyLanguageSelector 
      currentLang={lang}
      brandId={content.brand_info.whitelabel_id}
      onCopy={handleCopyContent}
    />
    {copying && (
      <span className="ml-2 text-sm text-gray-500">
        Copying content...
      </span>
    )}
  </div>
</div>

    {/* Save Button Section */}
    <div className="mt-6 flex justify-end space-x-3">
      {isDirty && (
        <>
          <button
            type="button"
            onClick={() => {
              setLocalContent(content);
              setIsDirty(false);
            }}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-black shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-50 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Discard Changes
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </>
      )}
    </div>
      <div className="bg-white shadow sm:rounded-lg dark:bg-gray-800">
        <div className="px-4 py-5 sm:p-6 space-y-6">
        <Tab.Group selectedIndex={currentTab} onChange={setCurrentTab}>
          <Tab.List className="flex space-x-1 border-b border-gray-900 pb-2">
            <Tab 
              className={({ selected }) =>
                `px-4 py-2 text-sm bg-blue-50 font-medium leading-5 dark:bg-gray-700  
                ${selected 
                  ? 'text-blue-700 border-b-2 border-blue-700 dark:border-gray-500 dark:text-gray-50' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 dark:hover:border-gray-500'}`
              }
            >
              Content
            </Tab>
            <Tab 
              className={({ selected }) =>
                `px-4 py-2 text-sm bg-blue-50 font-medium leading-5 dark:bg-gray-700 
                ${selected 
                  ? 'text-blue-700 border-b-2 border-blue-700 dark:border-gray-500 dark:text-gray-50' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 dark:hover:border-gray-500'}`
              }
            >
              Promotions
            </Tab>
            <Tab 
              className={({ selected }) =>
                `px-4 py-2 text-sm bg-blue-50 font-medium leading-5 dark:bg-gray-700 
                ${selected 
                  ? 'text-blue-700 border-b-2 border-blue-700 dark:border-gray-500 dark:text-gray-50' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 dark:hover:border-gray-500'}`
              }
            >
              Pages
            </Tab>
          </Tab.List>

          <Tab.Panels>
            <Tab.Panel>
              {/* Move your existing content div here */}
              <div className="bg-white shadow sm:rounded-lg dark:bg-gray-800">
                {/* Images Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Brand Logo</h3>
          <div className="mt-4 max-w-md space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs  font-medium text-gray-700 dark:text-gray-400">For website use - we prefer SVG's</label>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImageType('logo');
                    setIsLibraryOpen(true);
                  }}
                  className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium 
                    text-blue-700 bg-blue-50 border border-blue-200 rounded-md 
                    hover:bg-blue-100 dark:bg-blue-900/50 dark:text-blue-200 
                    dark:border-blue-800 dark:hover:bg-blue-900/75 transition-colors"
                >
                  Add from Library
                </button>
              </div>
              <ImageUpload 
                imageType="Brand Logo"
                currentImageUrl={localContent.brand_info.logo}
                onUpload={async (file) => {
                  const formData = new FormData();
                  formData.append('file', file);
                  formData.append('metadata', JSON.stringify({
                    brand: brandId,
                    type: 'logo',
                    language: lang
                  }));

                  try {
                    const response = await fetch('https://casino-content-admin.tech1960.workers.dev/upload', {
                      method: 'POST',
                      body: formData
                    });

                    if (!response.ok) {
                      throw new Error(await response.text());
                    }

                    const data = await response.json();

                    if (data.success) {
                      const imageUrl = `https://imagedelivery.net/${config.CF_ACCOUNT_HASH}/${data.result.id}/public`;
                      await updateBrandLogo(brandId, imageUrl, localContent.brand_info.logo_alt);
                      const newContent = {
                        ...localContent,
                        brand_info: {
                          ...localContent.brand_info,
                          logo: imageUrl
                        }
                      };
                      setLocalContent(newContent);
                      setIsDirty(false);
                      return true;
                    }
                    return false;
                  } catch (err) {
                    console.error('Upload error:', err);
                    throw err;
                  }
                }}
              />
            </div>
            
            {/* Logo ALT text field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-100">
                Logo ALT Text (SEO)
              </label>
              <input
                type="text"
                value={localContent.brand_info.logo_alt || ''}
                onChange={(e) => {
                  setLocalContent(prev => ({
                    ...prev,
                    brand_info: {
                      ...prev.brand_info,
                      logo_alt: e.target.value
                    }
                  }));
                  setIsDirty(true);
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800 dark:text-gray-100 dark:bg-gray-700"
                placeholder="Enter descriptive text for the logo"
              />
            </div>
          </div>

          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-8">Banners</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-100">Desktop Banner</label>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImageType('desktop');
                    setIsLibraryOpen(true);
                  }}
                  className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium 
                    text-blue-700 bg-blue-50 border border-blue-200 rounded-md 
                    hover:bg-blue-100 dark:bg-blue-900/50 dark:text-blue-200 
                    dark:border-blue-800 dark:hover:bg-blue-900/75 transition-colors"
                >
                  Add from Library
                </button>
              </div>
              <BrandImage 
                key={`${lang}-desktop`}
                imageUrl={localContent?.acf?.image_full} 
                type="Desktop"
                lang={lang}
                isLanguageChanging={isLanguageChanging}
                onReplace={() => handleImageUpload('Desktop')}
                onDelete={() => handleImageDelete('Desktop')}
              />
            </div>
            {/* Desktop Banner ALT text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 pb-">
                Desktop Banner ALT Text
              </label>
              <input
                type="text"
                value={localContent.acf.image_full_alt || ''}
                onChange={(e) => handleContentChange('image_full_alt', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800 dark:text-gray-100 dark:bg-gray-700"
                placeholder="Enter descriptive text for desktop banner"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-100">Mobile Banner</label>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImageType('mobile');
                    setIsLibraryOpen(true);
                  }}
                  className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium 
                    text-blue-700 bg-blue-50 border border-blue-200 rounded-md 
                    hover:bg-blue-100 dark:bg-blue-900/50 dark:text-blue-200 
                    dark:border-blue-800 dark:hover:bg-blue-900/75 transition-colors"
                >
                  Add from Library
                </button>
              </div>
              <BrandImage 
                key={`${lang}-mobile`}
                imageUrl={localContent?.acf?.image_small} 
                type="Mobile"
                lang={lang}
                isLanguageChanging={isLanguageChanging}
                onReplace={() => handleImageUpload('Mobile')}
                onDelete={() => handleImageDelete('Mobile')}
              />
            </div>
            {/* Mobile Banner ALT text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 pb-4">
                Mobile Banner ALT Text
              </label>
              <input
                type="text"
                value={localContent.acf.image_small_alt || ''}
                onChange={(e) => handleContentChange('image_small_alt', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800 dark:text-gray-100 dark:bg-gray-700"
                placeholder="Enter descriptive text for mobile banner"
              />
            </div>
          </div>
        </div>


        {/* SEO Section */}
        <div className="bg-white shadow sm:rounded-lg mt-8 dark:bg-gray-900 dark:text-gray-100">
          <div className="px-4 py-5 sm:p-6 space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">SEO Settings</h3>
            
            <div className="space-y-6">
              {/* Meta Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Meta Title
                  <span className="ml-1 text-sm text-gray-500 dark:text-gray-300">
                    (Recommended: 50-60 characters)
                  </span>
                </label>
                <input
                  type="text"
                  value={localContent.yoast_head_json?.title || ''}
                  onChange={(e) => {
                    setLocalContent(prev => ({
                      ...prev,
                      yoast_head_json: {
                        ...prev.yoast_head_json,
                        title: e.target.value
                      }
                    }));
                    setIsDirty(true);
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800 dark:text-gray-100 dark:bg-gray-700"
                  placeholder="Enter meta title"
                  maxLength={60}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Characters: {(localContent.yoast_head_json?.title || '').length}/60
                </p>
              </div>

              {/* Meta Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Meta Description
                  <span className="ml-1 text-sm text-gray-500 dark:text-gray-300">
                    (Recommended: 150-160 characters)
                  </span>
                </label>
                <textarea
                  value={localContent.yoast_head_json?.description || ''}
                  onChange={(e) => {
                    setLocalContent(prev => ({
                      ...prev,
                      yoast_head_json: {
                        ...prev.yoast_head_json,
                        description: e.target.value
                      }
                    }));
                    setIsDirty(true);
                  }}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800 dark:text-gray-100 dark:bg-gray-700"
                  placeholder="Enter meta description"
                  maxLength={160}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Characters: {(localContent.yoast_head_json?.description || '').length}/160
                </p>
              </div>

              {/* Open Graph Title (for social sharing) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Social Share Title (Open Graph)
                  <span className="ml-1 text-sm text-gray-500 dark:text-gray-300">
                    (Optional - defaults to Meta Title if empty)
                  </span>
                </label>
                <input
                  type="text"
                  value={localContent.yoast_head_json?.og_title || ''}
                  onChange={(e) => {
                    setLocalContent(prev => ({
                      ...prev,
                      yoast_head_json: {
                        ...prev.yoast_head_json,
                        og_title: e.target.value
                      }
                    }));
                    setIsDirty(true);
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800 dark:text-gray-100 dark:bg-gray-700"
                  placeholder="Enter social share title"
                />
              </div>

              {/* Open Graph Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Social Share Description
                  <span className="ml-1 text-sm text-gray-500 dark:text-gray-300">
                    (Optional - defaults to Meta Description if empty)
                  </span>
                </label>
                <textarea
                  value={localContent.yoast_head_json?.og_description || ''}
                  onChange={(e) => {
                    setLocalContent(prev => ({
                      ...prev,
                      yoast_head_json: {
                        ...prev.yoast_head_json,
                        og_description: e.target.value
                      }
                    }));
                    setIsDirty(true);
                  }}
                  rows={2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800 dark:text-gray-100 dark:bg-gray-700"
                  placeholder="Enter social share description"
                />
              </div>

              {/* Focus Keywords */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Focus Keywords
                  <span className="ml-1 text-sm text-gray-500 dark:text-gray-300">
                    (Comma-separated, 3-5 recommended)
                  </span>
                </label>
                <input
                  type="text"
                  value={localContent.yoast_head_json?.focus_keywords || ''}
                  onChange={(e) => {
                    setLocalContent(prev => ({
                      ...prev,
                      yoast_head_json: {
                        ...prev.yoast_head_json,
                        focus_keywords: e.target.value
                      }
                    }));
                    setIsDirty(true);
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800 dark:text-gray-100 dark:bg-gray-700"
                  placeholder="e.g., online casino, slots, jackpot games"
                />
              </div>

              {/* Canonical URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Canonical URL
                  <span className="ml-1 text-sm text-gray-500 dark:text-gray-300">
                    (Optional - use for duplicate content)
                  </span>
                </label>
                <input
                  type="url"
                  value={localContent.yoast_head_json?.canonical || ''}
                  onChange={(e) => {
                    setLocalContent(prev => ({
                      ...prev,
                      yoast_head_json: {
                        ...prev.yoast_head_json,
                        canonical: e.target.value
                      }
                    }));
                    setIsDirty(true);
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800 dark:text-gray-100 dark:bg-gray-700"
                  placeholder="https://example.com/page"
                />
              </div>

              {/* Schema Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Schema Type
                </label>
                <select
                  value={localContent.yoast_head_json?.schema_type || 'WebPage'}
                  onChange={(e) => {
                    setLocalContent(prev => ({
                      ...prev,
                      yoast_head_json: {
                        ...prev.yoast_head_json,
                        schema_type: e.target.value
                      }
                    }));
                    setIsDirty(true);
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800 dark:text-gray-100 dark:bg-gray-700"
                >
                  <option value="WebPage">Web Page</option>
                  <option value="Article">Article</option>
                  <option value="Organization">Organization</option>
                  <option value="Product">Product</option>
                </select>
              </div>
            </div>
          </div>
        </div>


        {/* Content Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Content</h3>
          <div className="mt-4 space-y-4">

            {/* Games Info Section */}
<div className="bg-white shadow sm:rounded-lg mt-8 dark:bg-gray-900 dark:text-gray-100">
  <div className="px-4 py-5 sm:p-6 space-y-6">
    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Games Info</h3>
    
    <div className="space-y-6">
      {[
        {
          key: 'new_games_info',
          label: 'New Games Info',
          description: 'Description for new games section'
        },
        {
          key: 'popular_games_info',
          label: 'Popular Games Info',
          description: 'Description for popular games section'
        },
        {
          key: 'slot_games_info',
          label: 'Slot Games Info',
          description: 'Description for slot games section'
        },
        {
          key: 'casino_games_info',
          label: 'Casino Games Info',
          description: 'Description for casino games section'
        },
        {
          key: 'jackpot_games_info',
          label: 'Jackpot Games Info',
          description: 'Description for jackpot games section'
        },
        {
          key: 'live_games_info',
          label: 'Live Games Info',
          description: 'Description for live games section'
        },
        {
          key: 'scratch_games_info',
          label: 'Scratch Games Info',
          description: 'Description for scratch games section'
        }
      ].map(({ key, label, description }) => (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            <span className="ml-1 text-sm text-gray-500 dark:text-gray-300">
              ({description})
            </span>
          </label>
          <textarea
            rows={4}
            value={localContent?.acf?.[key] || ''}
            onChange={(e) => {
              setLocalContent(prev => ({
                ...prev,
                acf: {
                  ...prev.acf,
                  [key]: e.target.value
                }
              }));
              setIsDirty(true);
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800 dark:text-gray-100 dark:bg-gray-700"
            placeholder={`Enter ${label.toLowerCase()}`}
          />
        </div>
      ))}
    </div>
  </div>
</div>


            {/* Promo Over/Under Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-100">
            Promo Over Content
          </label>
          <ReactQuill
                    theme="snow"
                    value={localContent?.acf?.promo_over || ''}
                    onChange={(content) => handleContentChange('promo_over', content)}
                    className="bg-white text-gray-800 dark:"
                    modules={{
                      toolbar: [
                        ['bold', 'italic', 'underline'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['link'],
                        ['clean']
                      ]
                    }}
                  />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-100">
            Promo Under Content
          </label>
          <ReactQuill
            theme="snow"
            value={localContent?.acf?.promo_under || ''}
            onChange={(content) => handleContentChange('promo_under', content)}
            className="bg-white text-gray-800"
            modules={{
              toolbar: [
                ['bold', 'italic', 'underline'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link'],
                ['clean']
              ]
            }}
            />
        </div>
        {/* Terms sections with rich text */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Terms & Conditions</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Significant Terms
              </label>
              <ReactQuill
                theme="snow"
                value={localContent?.acf?.sig_terms || ''}
                onChange={(content) => handleContentChange('sig_terms', content)}
                className="bg-white text-gray-800"
                modules={{
                  toolbar: [
                    ['bold', 'italic', 'underline'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link'],
                    ['clean']
                  ]
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Full Terms
              </label>
              <ReactQuill
                theme="snow"
                value={localContent?.acf?.full_terms || ''}
                onChange={(content) => handleContentChange('full_terms', content)}
                className="bg-white text-gray-800"
                modules={{
                  toolbar: [
                    ['bold', 'italic', 'underline'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link'],
                    ['clean']
                  ]
                }}
              />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Main Content</h3>
                <div className="min-h-[400px]"> {/* Increased height for main content */}
                  <ReactQuill
                    theme="snow"
                    value={localContent?.acf?.main_content || ''}
                    onChange={(content) => handleContentChange('main_content', content)}
                    className="bg-white text-gray-800 h-96"
                    modules={{
                      toolbar: [
                        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'color': [] }, { 'background': [] }],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        [{ 'indent': '-1'}, { 'indent': '+1' }],
                        ['link'],
                        [{ 'align': [] }],
                        ['clean']
                      ]
                    }}
                    formats={[
                      'header',
                      'bold', 'italic', 'underline', 'strike',
                      'color', 'background',
                      'list', 'bullet',
                      'indent',
                      'link',
                      'align'
                    ]}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                    This is the main content area for SEO and general page content. All standard formatting options are available.
                </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </Tab.Panel>
      <Tab.Panel>
        <div className="bg-white shadow sm:rounded-lg dark:bg-gray-800">
        <div className="px-4 py-5 sm:p-6">
          <PromotionsPanel 
            key={forceRefresh}
            brandId={brandId}
            lang={lang}
            setShowPromotionForm={setShowPromotionForm}
            setEditingPromotion={setEditingPromotion}
          />
        </div>
      </div>
        </Tab.Panel>
        <Tab.Panel>
          <PagesPanel 
            key={forceRefreshPages}
            content={content}
            lang={lang}
            setShowPageForm={setShowPageForm}
            setEditingPage={setEditingPage}
            forceRefresh={setForceRefreshPages}
            sharedPages={sharedPages}
            onToggleSharing={handlePageSharing}
            availableLanguages={availableLangs}
          />
        </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
        {/* Form Modals - keep these outside Tab.Panels */}
        {showPromotionForm && (
          <PromotionForm
            key={`promotion-${editingPromotion?.id || 'new'}`}
            isOpen={showPromotionForm}
            onClose={() => {
              setShowPromotionForm(false);
              setEditingPromotion(null);
            }}
            promotion={editingPromotion}
            brandId={brandId}
            lang={lang}
            onSave={() => {
              setPromotionsRefreshTrigger(prev => prev + 1); // Just trigger a refresh
              return Promise.resolve();
            }}
          />
        )}

                    {showPageForm && (
          <PageForm
            isOpen={showPageForm}
            onClose={() => {
              setShowPageForm(false);
              setEditingPage(null);
              setForceRefreshPages(prev => prev + 1); // Add this to force PagesPanel to remount
            }}
            page={editingPage}
            brandId={brandId}
            lang={lang}
            onSave={async () => {
              setForceRefreshPages(prev => prev + 1); // Also trigger here for redundancy
              return Promise.resolve();
            }}
          />
)}
          {/* Save Button Section */}
          <div className="mt-6 flex justify-end space-x-3">
            {showPromotionForm && (
              <PromotionForm
                key={`promotion-${editingPromotion?.id || 'new'}`}
                isOpen={showPromotionForm}
                onClose={() => {
                  setShowPromotionForm(false);
                  setEditingPromotion(null);
                  setForceRefresh(prev => prev + 1); // Add this to force PromotionsPanel to remount
                }}
                promotion={editingPromotion}
                brandId={brandId}
                lang={lang}
                onSave={async () => {
                  setForceRefresh(prev => prev + 1); // Also trigger here for redundancy
                  return Promise.resolve();
                }}
              />
            )}
          </div>
        </div>
      </div>
      <Notification 
        message={notification.message} 
        type={notification.type} 
      />
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={() => {
          setShowConfirmDialog(false);
          setPendingLanguageSwitch(null);
        }}
        onConfirm={() => {
          if (pendingLanguageSwitch) {
            navigate(`/brands/${content.brand_info.whitelabel_id}/${pendingLanguageSwitch}`);
          }
        }}
        title="Unsaved Changes"
        message="You have unsaved changes. Switching languages will lose these changes. Do you want to continue?"
        confirmText="Switch Language"
        cancelText="Stay Here"
      />
      <ImageLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelectImage={(url) => {
          if (selectedImageType === 'logo') {
            setLocalContent(prev => ({
              ...prev,
              brand_info: {
                ...prev.brand_info,
                logo: url
              }
            }));
          } else if (selectedImageType === 'desktop') {
            setLocalContent(prev => ({
              ...prev,
              acf: {
                ...prev.acf,
                image_full: url
              }
            }));
          } else if (selectedImageType === 'mobile') {
            setLocalContent(prev => ({
              ...prev,
              acf: {
                ...prev.acf,
                image_small: url
              }
            }));
          }
          setIsLibraryOpen(false);
          setIsDirty(true);
        }}
      />
    </div>
  );
}