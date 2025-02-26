import ReactQuill from 'react-quill';
import { Tab } from '@headlessui/react';
import 'react-quill/dist/quill.snow.css';
import { useBrandContent } from '../lib/hooks/useBrandContent';
import { getBrandContent, saveBrandContent, updateBrandLogo } from '../lib/api';
import { config } from '../lib/config';
import { useState, useEffect, useCallback } from 'react';
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
import ImageManager from '../components/ImageManager';
import RichTextEditor from '../components/RichTextEditor';
import FormSection from '../components/FormSection';
import FormField from '../components/FormField';
import MetaDataSection from '../components/MetaDataSection';
import ActionBar from '../components/ActionBar';
import { Globe, Target, BarChart, Image, FileText } from 'lucide-react';
import PropTypes from 'prop-types';

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

CopyLanguageSelector.propTypes = {
  currentLang: PropTypes.string.isRequired,
  brandId: PropTypes.string.isRequired,
  onCopy: PropTypes.func.isRequired
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
  const [logoUpdateTrigger, setLogoUpdateTrigger] = useState(0);

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
      
      console.log(`Switching language from ${lang} to ${newLang} for brand ${brandId}`);
      console.log('Current content structure:', {
        brandId,
        currentLang: lang,
        newLang,
        contentExists: !!localContent,
        contentKeys: localContent ? Object.keys(localContent) : [],
        acfExists: !!localContent?.acf,
        acfKeys: localContent?.acf ? Object.keys(localContent.acf) : []
      });
      
      // Get new content first
      console.log(`Fetching content for brand ${brandId} with language ${newLang}`);
      let newContent;
      try {
        newContent = await getBrandContent(brandId, newLang);
      } catch (contentError) {
        console.error('Error fetching content:', contentError);
        // If we can't get content for the new language, create a default structure
        console.log('Creating default content structure for new language');
        newContent = {
          brand_id: brandId,
          language: newLang,
          acf: {
            language: newLang,
            image_full: '',
            image_small: '',
            image_full_alt: '',
            image_small_alt: '',
            main_content: '',
            new_games_info: '',
            popular_games_info: ''
          },
          brand_info: {
            whitelabel_id: brandId,
            brand_name: localContent?.brand_info?.brand_name || 'Unknown Brand',
            logo: localContent?.brand_info?.logo || ''
          },
          meta: {
            title: '',
            description: '',
            keywords: []
          }
        };
        
        // Try to save this default content
        try {
          await saveBrandContent(brandId, newLang, newContent);
          console.log('Default content saved for new language');
        } catch (saveError) {
          console.error('Failed to save default content:', saveError);
          // Continue anyway - we'll use the default content in memory
        }
      }
      
      console.log('New content structure:', {
        newLang,
        contentExists: !!newContent,
        contentKeys: newContent ? Object.keys(newContent) : [],
        acfExists: !!newContent?.acf,
        acfKeys: newContent?.acf ? Object.keys(newContent.acf) : []
      });
      
      // Ensure the content has the minimum required structure
      if (!newContent.acf) {
        console.log('Adding missing acf structure to content');
        newContent.acf = {
          language: newLang,
          image_full: '',
          image_small: '',
          image_full_alt: '',
          image_small_alt: '',
          main_content: '',
          new_games_info: '',
          popular_games_info: ''
        };
      }
      
      if (!newContent.brand_info) {
        console.log('Adding missing brand_info structure to content');
        newContent.brand_info = {
          whitelabel_id: brandId,
          brand_name: localContent?.brand_info?.brand_name || 'Unknown Brand',
          logo: localContent?.brand_info?.logo || ''
        };
      }
      
      // Log full content for debugging
      console.log('Detailed Content:', {
        lang: newLang,
        oldLogo: localContent?.brand_info?.logo,
        newLogo: newContent?.brand_info?.logo,
        oldYoast: localContent?.yoast_head_json,
        newYoast: newContent?.yoast_head_json,
        oldAcf: localContent?.acf,
        newAcf: newContent?.acf
      });

      // First update the local content
      console.log('Updating local content state with new content');
      setLocalContent(newContent);
      
      // Then navigate to the new URL
      console.log(`Navigating to /brands/${brandId}/${newLang}`);
      navigate(`/brands/${brandId}/${newLang}`);
      
      // Reset state
      setIsDirty(false);
      
      // Small delay before completing the language change
      console.log('Setting timeout to complete language change');
      setTimeout(() => {
        console.log('Language change complete');
        setIsLanguageChanging(false);
      }, 100);

    } catch (error) {
      console.error('Failed to switch language:', error);
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
      console.log(`Adding new language ${newLang} for brand ${brandId}`);
      
      if (!localContent) {
        console.error('Cannot add language: No content available for current language');
        showNotification('Failed to add language: No content available', 'error');
        return;
      }
      
      // Create initial content for the new language
      const initialContent = {
        ...localContent,
        acf: {
          ...localContent.acf,
          language: newLang,
          geo_target_country: newLang
        }
      };
      
      console.log('Initial content structure for new language:', {
        newLang,
        contentExists: !!initialContent,
        contentKeys: initialContent ? Object.keys(initialContent) : [],
        acfExists: !!initialContent?.acf,
        acfKeys: initialContent?.acf ? Object.keys(initialContent.acf) : []
      });
      
      // Save the content for the new language
      console.log(`Saving brand content for new language ${newLang}`);
      await saveBrandContent(brandId, newLang, initialContent);
      
      // Update available languages
      console.log('Updating available languages list');
      const updatedLangs = [...availableLangs, newLang];
      setAvailableLangs(updatedLangs);
      
      // Show success notification
      showNotification(`Added language: ${newLang}`, 'success');
      
      // Navigate to the new language
      console.log(`Navigating to /brands/${brandId}/${newLang}`);
      navigate(`/brands/${brandId}/${newLang}`);
      
      // Fetch new content after a short delay
      console.log('Setting timeout to fetch new content');
      setTimeout(async () => {
        try {
          console.log(`Fetching content for brand ${brandId} with new language ${newLang}`);
          const newContent = await getBrandContent(brandId, newLang);
          
          console.log('New content structure after adding language:', {
            newLang,
            contentExists: !!newContent,
            contentKeys: newContent ? Object.keys(newContent) : [],
            acfExists: !!newContent?.acf,
            acfKeys: newContent?.acf ? Object.keys(newContent.acf) : []
          });
          
          setLocalContent(newContent);
          setIsDirty(false);
          setIsLanguageChanging(false);
        } catch (error) {
          console.error('Failed to fetch content after adding language:', error);
          showNotification('Language added but failed to load content', 'warning');
        }
      }, 500);
      
    } catch (error) {
      console.error('Failed to add language:', error);
      showNotification(`Failed to add language: ${error.message}`, 'error');
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

const handleImageUpload = async (file, type) => {
  try {
    setUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify({
      brand: brandId,
      type: type.toLowerCase(),
      language: lang
    }));

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
  } finally {
    setUploading(false);
  }
};

const handleImageAltChange = (type, altText) => {
  setIsDirty(true);
  setLocalContent(prev => ({
    ...prev,
    acf: {
      ...prev.acf,
      [type === 'Desktop' ? 'image_full_alt' : 'image_small_alt']: altText
    }
  }));
};

const handleLibraryImageSelect = (type, url) => {
  setIsDirty(true);
  setLocalContent(prev => ({
    ...prev,
    acf: {
      ...prev.acf,
      [type === 'Desktop' ? 'image_full' : 'image_small']: url
    }
  }));
  setIsLibraryOpen(false);
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

// Add this function inside the BrandEdit component
const handlePageSharing = async (pageId, isShared) => {
  try {
    // Update the shared pages list in your database
    await fetch(`https://casino-pages-api.tech1960.workers.dev/api/pages/${pageId}/sharing`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ shared: isShared })
    });
    
    // Update local state
    setSharedPages(prev => {
      if (isShared) {
        return [...prev, pageId];
      } else {
        return prev.filter(id => id !== pageId);
      }
    });
    
    showNotification(`Page ${isShared ? 'shared' : 'unshared'} successfully`, 'success');
  } catch (error) {
    console.error('Failed to update page sharing:', error);
    showNotification('Failed to update page sharing', 'error');
  }
};

// Loading indicator with slick spinner
if (loading || !content || !localContent) return (
  <div className="flex justify-center items-center h-full">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    <span className="ml-3 text-gray-500 text-lg">Loading brand content...</span>
  </div>
);

if (error) return <div className="text-red-500">Error: {error}</div>;

return (
  <div className="container mx-auto px-4 py-8">
    {notification.message && (
      <Notification message={notification.message} type={notification.type} />
    )}
    
    {showConfirmDialog && (
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        title="Unsaved Changes"
        message="You have unsaved changes. Do you want to discard them?"
        confirmLabel="Discard Changes"
        cancelLabel="Keep Editing"
        onConfirm={() => {
          setShowConfirmDialog(false);
          if (pendingLanguageSwitch) {
            handleLanguageSwitch(pendingLanguageSwitch);
            setPendingLanguageSwitch(null);
          }
        }}
        onClose={() => {
          setShowConfirmDialog(false);
          setPendingLanguageSwitch(null);
        }}
        onCancel={() => {
          setShowConfirmDialog(false);
          setPendingLanguageSwitch(null);
        }}
      />
    )}
    
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {localContent.brand_info.brand_name} - {lang.toUpperCase()}
      </h1>
      
      <div className="flex space-x-4">
        <CopyLanguageSelector 
          currentLang={lang} 
          brandId={brandId} 
          onCopy={handleCopyContent} 
        />
        
        <LanguageSelector
          currentLang={lang}
          availableLangs={availableLangs}
          onLanguageChange={handleLanguageSwitch}
          onAddLanguage={(newLang) => handleAddLanguage(brandId, newLang)}
          isLoading={loadingLanguages}
        />
        
        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className={`px-4 py-2 rounded-md text-white ${
            saving || !isDirty
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
    
    <Tab.Group selectedIndex={currentTab} onChange={setCurrentTab}>
      <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
        <Tab className={({ selected }) =>
          `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
          ${selected 
            ? 'bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-400 shadow' 
            : 'text-gray-700 dark:text-gray-300 hover:bg-white/[0.12] hover:text-blue-600'
          }`
        }>
          Content
        </Tab>
        <Tab className={({ selected }) =>
          `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
          ${selected 
            ? 'bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-400 shadow' 
            : 'text-gray-700 dark:text-gray-300 hover:bg-white/[0.12] hover:text-blue-600'
          }`
        }>
          Promotions
        </Tab>
        <Tab className={({ selected }) =>
          `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
          ${selected 
            ? 'bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-400 shadow' 
            : 'text-gray-700 dark:text-gray-300 hover:bg-white/[0.12] hover:text-blue-600'
          }`
        }>
          Pages
        </Tab>
      </Tab.List>
      
      <Tab.Panels className="mt-2">
        <Tab.Panel className="rounded-xl bg-white dark:bg-gray-900 p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Desktop Banner */}
            <div>
              <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Desktop Banner</h3>
              <ImageManager
                imageUrl={localContent.acf?.image_full}
                imageAlt={localContent.acf?.image_full_alt}
                type="Desktop"
                lang={lang}
                onReplace={(file) => handleImageUpload(file, 'Desktop')}
                onDelete={() => handleImageDelete('Desktop')}
                onAltChange={(alt) => handleImageAltChange('Desktop', alt)}
                onLibrarySelect={(url) => handleLibraryImageSelect('Desktop', url)}
                isLoading={isLanguageChanging}
              />
            </div>
            
            {/* Mobile Banner */}
            <div>
              <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Mobile Banner</h3>
              <ImageManager
                imageUrl={localContent.acf?.image_small}
                imageAlt={localContent.acf?.image_small_alt}
                type="Mobile"
                lang={lang}
                onReplace={(file) => handleImageUpload(file, 'Mobile')}
                onDelete={() => handleImageDelete('Mobile')}
                onAltChange={(alt) => handleImageAltChange('Mobile', alt)}
                onLibrarySelect={(url) => handleLibraryImageSelect('Mobile', url)}
                isLoading={isLanguageChanging}
              />
            </div>
          </div>
          
          <div className="mt-8">
            <FormSection 
              title="Main Content" 
              icon={<FileText size={18} />}
              defaultExpanded={true}
            >
              <div className="space-y-4">
                <FormField
                  label="Brand Name"
                  name="brand-name"
                  value={localContent.brand_info?.brand_name || ''}
                  onChange={(value) => {
                    setIsDirty(true);
                    setLocalContent(prev => ({
                      ...prev,
                      brand_info: {
                        ...prev.brand_info,
                        brand_name: value
                      }
                    }));
                  }}
                  placeholder="Enter brand name"
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Main Content
                  </label>
                  <RichTextEditor
                    value={localContent.acf?.main_content || ''}
                    onChange={(value) => handleContentChange('main_content', value)}
                    darkMode={true}
                    minHeight={300}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    New Games Info
                  </label>
                  <RichTextEditor
                    value={localContent.acf?.new_games_info || ''}
                    onChange={(value) => handleContentChange('new_games_info', value)}
                    darkMode={true}
                    minHeight={200}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Popular Games Info
                  </label>
                  <RichTextEditor
                    value={localContent.acf?.popular_games_info || ''}
                    onChange={(value) => handleContentChange('popular_games_info', value)}
                    darkMode={true}
                    minHeight={200}
                  />
                </div>
              </div>
            </FormSection>
            
            <MetaDataSection
              metadata={localContent.meta || {}}
              onChange={(newMetadata) => {
                setIsDirty(true);
                setLocalContent(prev => ({
                  ...prev,
                  meta: newMetadata
                }));
              }}
              defaultExpanded={false}
            />
            
            <FormSection 
              title="Terms & Compliance" 
              icon={<FileText size={18} />}
              defaultExpanded={false}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Significant Terms
                  </label>
                  <RichTextEditor
                    value={localContent.acf?.sig_terms || ''}
                    onChange={(value) => handleContentChange('sig_terms', value)}
                    darkMode={true}
                    minHeight={200}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Terms
                  </label>
                  <RichTextEditor
                    value={localContent.acf?.full_terms || ''}
                    onChange={(value) => handleContentChange('full_terms', value)}
                    darkMode={true}
                    minHeight={300}
                  />
                </div>
              </div>
            </FormSection>
          </div>
        </Tab.Panel>
        
        <Tab.Panel className="rounded-xl bg-white dark:bg-gray-900 p-3">
          <PromotionsPanel 
            brandId={brandId} 
            lang={lang}
            onEditPromotion={(promotion) => {
              setEditingPromotion(promotion);
              setShowPromotionForm(true);
            }}
            onAddPromotion={() => {
              setEditingPromotion(null);
              setShowPromotionForm(true);
            }}
            refreshTrigger={promotionsRefreshTrigger}
          />
          
          {showPromotionForm && (
            <PromotionForm
              isOpen={showPromotionForm}
              onClose={() => setShowPromotionForm(false)}
              promotion={editingPromotion}
              brandId={brandId}
              lang={lang}
              onSave={(savedPromotion) => {
                console.log('BrandEdit: Promotion saved, refreshing promotions list', savedPromotion);
                setShowPromotionForm(false);
                // Increment the refresh trigger to force a refresh of the promotions list
                // Use a function to ensure we get the latest state
                setPromotionsRefreshTrigger(prev => {
                  const newValue = prev + 1;
                  console.log('BrandEdit: Setting promotionsRefreshTrigger from', prev, 'to', newValue);
                  return newValue;
                });
              }}
            />
          )}
        </Tab.Panel>
        
        <Tab.Panel className="rounded-xl bg-white dark:bg-gray-900 p-3">
          <PagesPanel 
            brandId={brandId} 
            lang={lang}
            onEditPage={(page) => {
              setEditingPage(page);
              setShowPageForm(true);
            }}
            onAddPage={() => {
              setEditingPage(null);
              setShowPageForm(true);
            }}
            refreshTrigger={forceRefreshPages}
            sharedPages={sharedPages}
            onPageSharing={handlePageSharing}
          />
          
          {showPageForm && (
            <PageForm
              isOpen={showPageForm}
              onClose={() => setShowPageForm(false)}
              page={editingPage}
              brandId={brandId}
              lang={lang}
              onSave={() => {
                console.log('BrandEdit: PageForm onSave callback triggered');
                setShowPageForm(false);
                console.log('BrandEdit: Incrementing forceRefreshPages from', forceRefreshPages);
                setForceRefreshPages(prev => {
                  const newValue = prev + 1;
                  console.log('BrandEdit: forceRefreshPages incremented to', newValue);
                  return newValue;
                });
              }}
            />
          )}
        </Tab.Panel>
      </Tab.Panels>
    </Tab.Group>
    
    <ActionBar
      isDirty={isDirty}
      saving={saving}
      onSave={handleSave}
      className="mt-8"
    />
  </div>
);
} 