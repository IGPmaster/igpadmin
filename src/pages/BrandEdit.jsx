import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useParams } from 'react-router-dom';
import { useBrandContent } from '../lib/hooks/useBrandContent';
import { getBrandContent, saveBrandContent, updateBrandLogo } from '../lib/api';
import { config } from '../lib/config';
import { useState, useEffect } from 'react';
import ImageUpload from '../components/ImageUpload';

// CopyLanguageSelector Component
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

// Main Component
export function BrandEdit() {
  const { brandId, lang } = useParams();
  const { content, loading, error, updateContent } = useBrandContent(brandId, lang);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copying, setCopying] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [localContent, setLocalContent] = useState(null);

  // Initialize local content when content is loaded
  useEffect(() => {
    if (content) {
      setLocalContent(content);
    }
  }, [content]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateContent(localContent);
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
    if (type === 'logo') {
      const newContent = {
        ...localContent,
        brand_info: {
          ...localContent.brand_info,
          logo: '',
          logo_alt: ''
        }
      };
      setLocalContent(newContent);
      setIsDirty(true);
    } else {
      const newContent = {
        ...localContent,
        acf: {
          ...localContent.acf,
          [type === 'desktop' ? 'image_full' : 'image_small']: ''
        }
      };
      setLocalContent(newContent);
      setIsDirty(true);
    }
  } catch (err) {
    console.error('Failed to delete image:', err);
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
        type: type,
        language: lang
      }));

      try {
        console.log('Uploading to worker...');
        const response = await fetch('https://casino-content-admin.tech1960.workers.dev/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          console.error('Upload failed:', await response.text());
          return;
        }

        const data = await response.json();
        console.log('Upload response:', data);

        if (data.success) {
          const imageUrl = `https://imagedelivery.net/${config.CF_ACCOUNT_HASH}/${data.result.id}/public`;

          if (type === 'logo') {
            try {
              await updateBrandLogo(brandId, imageUrl, localContent.brand_info.logo_alt);
              const newContent = {
                ...localContent,
                brand_info: {
                  ...localContent.brand_info,
                  logo: imageUrl
                }
              };
              setLocalContent(newContent);
              setIsDirty(false); // Already saved to all languages
            } catch (err) {
              console.error('Failed to update logo across languages:', err);
            }
          } else {
            // Declare `newContent` before using it here
            const newContent = {
              ...localContent,
              acf: {
                ...localContent.acf,
                [type === 'desktop' ? 'image_full' : 'image_small']: imageUrl
              }
            };
            setLocalContent(newContent);
            setIsDirty(true);
          }
        }
      } catch (err) {
        console.error('Upload error:', err);
      }
    };

    input.click();
  } catch (err) {
    console.error('Upload failed:', err);
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
        [key]: value
      }
    }));
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!content || !localContent) return <div>Loading content...</div>;

  return (
    <div className="space-y-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {content.brand_info.brand_name} (ID: {content.brand_info.whitelabel_id})
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Editing {lang} version
          </p>
        </div>
        
       <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
  {/* Add debug info */}
  {console.log('Rendering selector with:', { lang, brandId })}
  <CopyLanguageSelector 
    currentLang={lang}
    brandId={brandId}
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
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
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



      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6 space-y-6">

 

{/* Images Section */}
<div>
  <h3 className="text-lg font-medium text-gray-900">Brand Logo</h3>
  <div className="mt-4 max-w-md space-y-4">
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
          console.log('Uploading to worker...');
          const response = await fetch('https://casino-content-admin.tech1960.workers.dev/upload', {
            method: 'POST',
            body: formData
          });

          if (!response.ok) {
            throw new Error(await response.text());
          }

          const data = await response.json();
          console.log('Upload response:', data);

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
            setIsDirty(false); // Already saved to all languages
            return true;
          }
          return false;
        } catch (err) {
          console.error('Upload error:', err);
          throw err;
        }
      }}
    />
    
    {/* Logo ALT text field */}
    <div>
      <label className="block text-sm font-medium text-gray-700">
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
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
        placeholder="Enter descriptive text for the logo"
      />
    </div>
  </div>

  <h3 className="text-lg font-medium text-gray-900 mt-8">Banners</h3>
  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
    <div>
      <label className="block text-sm font-medium text-gray-700">Desktop Banner</label>
      <div className="mt-1 space-y-2">
        <ImageUpload 
          imageType="Desktop Banner"
          currentImageUrl={localContent.acf.image_full}
          onUpload={async (file) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('metadata', JSON.stringify({
              brand: brandId,
              type: 'desktop',
              language: lang
            }));

            try {
              console.log('Uploading to worker...');
              const response = await fetch('https://casino-content-admin.tech1960.workers.dev/upload', {
                method: 'POST',
                body: formData
              });

              if (!response.ok) {
                throw new Error(await response.text());
              }

              const data = await response.json();
              console.log('Upload response:', data);

              if (data.success) {
                const imageUrl = `https://imagedelivery.net/${config.CF_ACCOUNT_HASH}/${data.result.id}/public`;
                const newContent = {
                  ...localContent,
                  acf: {
                    ...localContent.acf,
                    image_full: imageUrl
                  }
                };
                setLocalContent(newContent);
                setIsDirty(true);
                return true;
              }
              return false;
            } catch (err) {
              console.error('Upload error:', err);
              throw err;
            }
          }}
        />
        {/* Desktop Banner ALT text */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Desktop Banner ALT Text
          </label>
          <input
            type="text"
            value={localContent.acf.image_full_alt || ''}
            onChange={(e) => handleContentChange('image_full_alt', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
            placeholder="Enter descriptive text for desktop banner"
          />
        </div>
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700">Mobile Banner</label>
      <div className="mt-1 space-y-2">
        <ImageUpload 
          imageType="Mobile Banner"
          currentImageUrl={localContent.acf.image_small}
          onUpload={async (file) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('metadata', JSON.stringify({
              brand: brandId,
              type: 'mobile',
              language: lang
            }));

            try {
              console.log('Uploading to worker...');
              const response = await fetch('https://casino-content-admin.tech1960.workers.dev/upload', {
                method: 'POST',
                body: formData
              });

              if (!response.ok) {
                throw new Error(await response.text());
              }

              const data = await response.json();
              console.log('Upload response:', data);

              if (data.success) {
                const imageUrl = `https://imagedelivery.net/${config.CF_ACCOUNT_HASH}/${data.result.id}/public`;
                const newContent = {
                  ...localContent,
                  acf: {
                    ...localContent.acf,
                    image_small: imageUrl
                  }
                };
                setLocalContent(newContent);
                setIsDirty(true);
                return true;
              }
              return false;
            } catch (err) {
              console.error('Upload error:', err);
              throw err;
            }
          }}
        />
        {/* Mobile Banner ALT text */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Mobile Banner ALT Text
          </label>
          <input
            type="text"
            value={localContent.acf.image_small_alt || ''}
            onChange={(e) => handleContentChange('image_small_alt', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
            placeholder="Enter descriptive text for mobile banner"
          />
        </div>
      </div>
    </div>
  </div>
</div>


{/* SEO Section */}
<div className="bg-white shadow sm:rounded-lg mt-8">
  <div className="px-4 py-5 sm:p-6 space-y-6">
    <h3 className="text-lg font-medium text-gray-900">SEO Settings</h3>
    
    <div className="space-y-6">
      {/* Meta Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Meta Title
          <span className="ml-1 text-sm text-gray-500">
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
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
          placeholder="Enter meta title"
          maxLength={60}
        />
        <p className="mt-1 text-sm text-gray-500">
          Characters: {(localContent.yoast_head_json?.title || '').length}/60
        </p>
      </div>

      {/* Meta Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Meta Description
          <span className="ml-1 text-sm text-gray-500">
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
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
          placeholder="Enter meta description"
          maxLength={160}
        />
        <p className="mt-1 text-sm text-gray-500">
          Characters: {(localContent.yoast_head_json?.description || '').length}/160
        </p>
      </div>

      {/* Open Graph Title (for social sharing) */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Social Share Title (Open Graph)
          <span className="ml-1 text-sm text-gray-500">
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
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
          placeholder="Enter social share title"
        />
      </div>

      {/* Open Graph Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Social Share Description
          <span className="ml-1 text-sm text-gray-500">
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
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
          placeholder="Enter social share description"
        />
      </div>

      {/* Focus Keywords */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Focus Keywords
          <span className="ml-1 text-sm text-gray-500">
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
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
          placeholder="e.g., online casino, slots, jackpot games"
        />
      </div>

      {/* Canonical URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Canonical URL
          <span className="ml-1 text-sm text-gray-500">
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
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
          placeholder="https://example.com/page"
        />
      </div>

      {/* Schema Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
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
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
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
  <h3 className="text-lg font-medium text-gray-900">Content</h3>
  <div className="mt-4 space-y-4">
    {/* Regular text fields */}
    {Object.entries(localContent?.acf || {})
      .filter(([key]) => key.endsWith('_info'))
      .map(([key, value]) => (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700">
            {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </label>
          <div className="mt-1">
            <textarea
              rows={3}
              className="shadow-sm block w-full sm:text-sm border border-gray-300 rounded-md p-2 bg-gray-100 text-gray-800"
              value={value || ''}
              onChange={(e) => handleContentChange(key, e.target.value)}
            />
          </div>
        </div>
      ))}

    {/* Add these new fields */}
<div>
  <label className="block text-sm font-medium text-gray-700">
    Promo Over Content
  </label>
  <textarea
    rows={5}
    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
    value={localContent.acf.promo_over || ''}
    onChange={(e) => handleContentChange('promo_over', e.target.value)}
  />
</div>

<div>
  <label className="block text-sm font-medium text-gray-700">
    Promo Under Content
  </label>
  <textarea
    rows={5}
    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
    value={localContent.acf.promo_under || ''}
    onChange={(e) => handleContentChange('promo_under', e.target.value)}
  />
</div>




    {/* Terms sections with rich text */}
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Terms & Conditions</h3>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
        <h3 className="text-lg font-medium text-gray-900 mb-4">Main Content</h3>
        <div className="min-h-[400px]"> {/* Increased height for main content */}
            <ReactQuill
            theme="snow"
            value={localContent?.acf?.main_content || ''}
            onChange={(content) => handleContentChange('main_content', content)}
            className="bg-white text-gray-800 h-96" // Taller editor
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
        <p className="mt-2 text-xs text-gray-500">
            This is the main content area for SEO and general page content. All standard formatting options are available.
        </p>
        </div>
      </div>
    </div>
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
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
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
        </div>
      </div>
    </div>
  );
}