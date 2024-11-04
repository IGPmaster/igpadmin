import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useParams } from 'react-router-dom';
import { useBrandContent } from '../lib/hooks/useBrandContent';
import { getBrandContent, saveBrandContent, updateBrandLogo } from '../lib/api';
import { config } from '../lib/config';
import { useState, useEffect } from 'react';

// New Component
function CopyLanguageSelector({ languages, currentLang, onCopy }) {
  const availableLanguages = languages.filter(l => l !== currentLang);
  
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
          <CopyLanguageSelector 
            languages={['EN', 'JP', 'FI', 'BR', 'ES']}
            currentLang={lang}
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

 {/* Logo Section */}
<div>
  <h3 className="text-lg font-medium text-gray-900">Brand Logo</h3>
  <div className="mt-4 max-w-md">
    <div className="border rounded-lg p-4">
      <label className="block text-sm font-medium text-gray-700">Logo</label>
      <div className="mt-2 flex flex-col space-y-4">
        {localContent?.brand_info?.logo ? (
          <>
            <div className="relative group">
              <img 
                src={localContent.brand_info.logo} 
                alt={localContent.brand_info.logo_alt || `${content.brand_info.brand_name} logo`}
                className="max-h-24 object-contain" 
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                <button
                  onClick={() => handleImageDelete('logo')}
                  className="bg-red-600 text-white px-3 py-1 rounded-md text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo Alt Text (SEO)
              </label>
              <input
                type="text"
                value={localContent?.brand_info?.logo_alt || ''}
                onChange={(e) => handleContentChange('logo_alt', e.target.value)}
                className="shadow-sm block w-full sm:text-sm border border-gray-300 rounded-md p-2 bg-gray-100 text-gray-800"
                placeholder="Describe the logo for SEO"
              />
            </div>
          </>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <p className="text-sm text-gray-500">No logo uploaded</p>
          </div>
        )}
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          onClick={() => handleImageUpload('logo')}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Upload Logo'}
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-500">Recommended: Square format, transparent background</p>
    </div>
  </div>
</div>

            {/* Images Section */}
<div>
  <h3 className="text-lg font-medium text-gray-900">Images</h3>
  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
    {/* Desktop Image */}
    <div className="border rounded-lg p-4">
      <label className="block text-sm font-medium text-gray-700">Desktop Banner</label>
      <div className="mt-2 flex flex-col space-y-4">
        {localContent?.acf?.image_full ? (
          <>
            <div className="relative group">
              <img 
                src={localContent.acf.image_full} 
                alt={localContent?.acf?.image_full_alt || 'Desktop Banner'}
                className="w-full h-40 object-cover rounded-lg" 
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                <button
                  onClick={() => handleImageDelete('desktop')}
                  className="bg-red-600 text-white px-3 py-1 rounded-md text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alt Text (SEO)
              </label>
              <input
                type="text"
                value={localContent?.acf?.image_full_alt || ''}
                onChange={(e) => handleContentChange('image_full_alt', e.target.value)}
                className="shadow-sm block w-full sm:text-sm border border-gray-300 rounded-md p-2 bg-gray-100 text-gray-800"
                placeholder="Describe the image for SEO"
              />
            </div>
          </>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <p className="text-sm text-gray-500">No image uploaded</p>
          </div>
        )}
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          onClick={() => handleImageUpload('desktop')}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </>
          ) : 'Upload Image'}
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-500">Recommended size: 1920x400 pixels</p>
    </div>

    {/* Mobile Image */}
    <div className="border rounded-lg p-4">
      <label className="block text-sm font-medium text-gray-700">Mobile Banner</label>
      <div className="mt-2 flex flex-col space-y-4">
        {localContent?.acf?.image_small ? (
          <>
            <div className="relative group">
              <img 
                src={localContent.acf.image_small} 
                alt={localContent?.acf?.image_small_alt || 'Mobile Banner'}
                className="h-40 object-cover rounded-lg mx-auto" 
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                <button
                  onClick={() => handleImageDelete('mobile')}
                  className="bg-red-600 text-white px-3 py-1 rounded-md text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alt Text (SEO)
              </label>
              <input
                type="text"
                value={localContent?.acf?.image_small_alt || ''}
                onChange={(e) => handleContentChange('image_small_alt', e.target.value)}
                className="shadow-sm block w-full sm:text-sm border border-gray-300 rounded-md p-2 bg-gray-100 text-gray-800"
                placeholder="Describe the image for SEO"
              />
            </div>
          </>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <p className="text-sm text-gray-500">No image uploaded</p>
          </div>
        )}
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          onClick={() => handleImageUpload('mobile')}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </>
          ) : 'Upload Image'}
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-500">Recommended size: 768x400 pixels</p>
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