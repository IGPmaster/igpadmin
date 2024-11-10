// src/components/PageForm.jsx
import { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { config } from '../lib/config';
import ImageUpload from './ImageUpload';

const TEMPLATE_OPTIONS = [
  { value: 'default', label: 'Default Page' },
  { value: 'landing', label: 'Landing Page' },
  { value: 'blog', label: 'Blog Post' }
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'archived', label: 'Archived' }
];

export function PageForm({ isOpen, onClose, page = null, brandId, lang }) {
  console.log('PageForm initializing with page:', page);
const [newCategory, setNewCategory] = useState('');
const [newTag, setNewTag] = useState('');
  // Compute initial state
const initialState = page ? {
  title: page.title || '',
  slug: page.slug || '',
  template: page.template || 'default',
  status: page.status || 'draft',
  content: {
    main: page.content?.main || '',
    excerpt: page.content?.excerpt || '',
  },
  images: {
    featured: page.images?.featured || '',
    banner: page.images?.banner || '',
    thumbnail: page.images?.thumbnail || '',
    alt_featured: page.images?.alt_featured || '',
    alt_banner: page.images?.alt_banner || '',
    alt_thumbnail: page.images?.alt_thumbnail || '',
  },
  categories: page.categories || [],
  tags: page.tags || [],
  meta: {
    title: page.meta?.title || '',
    description: page.meta?.description || '',
    keywords: page.meta?.keywords || [],
    og_title: page.meta?.og_title || '',
    og_description: page.meta?.og_description || '',
    og_image: page.meta?.og_image || '',
    canonical_url: page.meta?.canonical_url || '',
    structured_data: page.meta?.structured_data || {},
  },
  seo_settings: {
    index: page.seo_settings?.index || true,
    follow: page.seo_settings?.follow || true,
    schema_type: page.seo_settings?.schema_type || 'WebPage',
  },
  scheduled_for: page.scheduled_for || null,
} : {
  title: '',
  slug: '',
  template: 'default',
  status: 'draft',
  content: {
    main: '',
    excerpt: '',
  },
  images: {
    featured: '',
    banner: '',
    thumbnail: '',
    alt_featured: '',
    alt_banner: '',
    alt_thumbnail: '',
  },
  categories: [],
  tags: [],
  meta: {
    title: '',
    description: '',
    keywords: [],
    og_title: '',
    og_description: '',
    og_image: '',
    canonical_url: '',
    structured_data: {},
  },
  seo_settings: {
    index: true,
    follow: true,
    schema_type: 'WebPage',
  },
  scheduled_for: null,
};

  const [formData, setFormData] = useState(initialState);

  // Add this effect to auto-generate slug from title
useEffect(() => {
  if (formData.title && !page) {  
    const generatedSlug = formData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') 
      .replace(/(^-|-$)/g, ''); 
    setFormData(prev => ({ ...prev, slug: generatedSlug }));
  }
}, [formData.title]);

  // Update form when page changes
  useEffect(() => {
  if (page) {
    const updatedData = {
      title: page.title || '',
      slug: page.slug || '',
      template: page.template || 'default',
      status: page.status || 'draft',
      content: page.content || { main: '', excerpt: '' },
      images: page.images || { featured: '', banner: '', thumbnail: '' },
      categories: page.categories || [],
      tags: page.tags || [],
      meta: page.meta || {
        title: '',
        description: '',
        keywords: [],
        og_title: '',
        og_description: '',
        og_image: '',
        canonical_url: '',
        structured_data: {}
      },
      seo_settings: page.seo_settings || {
        index: true,
        follow: true,
        schema_type: 'WebPage'
      },
      scheduled_for: page.scheduled_for || null
    };
    setFormData(updatedData);
  }
}, [page]);

  // Log whenever formData changes
  useEffect(() => {
    console.log('formData changed:', formData);
  }, [formData]);

  const handleImageUpload = async (file, type) => {
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('metadata', JSON.stringify({
      brand: brandId,
      type: `page_${type}`,
      language: lang
    }));

    try {
      const response = await fetch('https://casino-content-admin.tech1960.workers.dev/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.CF_IMAGES_TOKEN}`
        },
        body: uploadData
      });

      if (!response.ok) throw new Error('Failed to upload image');

      const data = await response.json();
      if (data.success) {
        const imageUrl = `https://imagedelivery.net/${config.CF_ACCOUNT_HASH}/${data.result.id}/public`;

        setFormData(prev => ({
          ...prev,
          images: {
            ...prev.images,
            [type]: imageUrl
          }
        }));
      }
    } catch (error) {
      console.error('Upload error:', error);
    }
  };


const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const pageId = page?.id || crypto.randomUUID();
    const key = `page:${brandId}:${lang}:${pageId}`;

    const pageData = {
      ...formData,  // Keep all form data
      id: pageId,
      brand_id: brandId,
      language: lang,
      created_at: page?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('=== Debug Submit ===');
    console.log('Form Data:', formData);
    console.log('Page Data:', pageData);

    const requestBody = {
      brandId,
      lang,
      key,
      value: pageData,
    };

    console.log('Request Body:', requestBody);

    const response = await fetch(`https://casino-pages-api.tech1960.workers.dev/api/pages/`, {
      method: 'POST',  // Always POST for new pages
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();
    console.log('Response:', responseData);

    if (!response.ok) throw new Error(`Failed to save page: ${JSON.stringify(responseData)}`);
    onClose();
  } catch (error) {
    console.error('Failed to save page:', error);
  }
};


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity">
      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <button
  type="button"
  onClick={onClose}
  className="absolute right-4 top-4 text-gray-400 hover:text-gray-500"
>
  ✕
</button>
              {/* Basic Info Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Basic Information</h3>
                
                {/* Title & Template */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Template</label>
                    <select
                      value={formData.template}
                      onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
                    >
                      {TEMPLATE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">URL Slug</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800 font-mono"
                    required
                  />
                </div>
              </div>

              {/* Content Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Content</h3>
                
                {/* Main Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Main Content</label>
                  <div className="mt-1 text-gray-800">
                    <ReactQuill
                      theme="snow"
                      value={formData.content.main}
                      onChange={(value) => setFormData({
                        ...formData,
                        content: { ...formData.content, main: value }
                      })}
                      className="h-64 bg-white"
                      modules={{
                        toolbar: [
                          [{ 'header': [1, 2, 3, false] }],
                          ['bold', 'italic', 'underline', 'strike'],
                          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                          ['link', 'image'],
                          ['clean']
                        ]
                      }}
                    />
                  </div>
                </div>

                {/* Excerpt */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Excerpt</label>
                  <textarea
                    value={formData.content.excerpt}
                    onChange={(e) => setFormData({
                      ...formData,
                      content: { ...formData.content, excerpt: e.target.value }
                    })}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800 font-mono"
                  />
                </div>
              </div>

              {/* Images Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Images</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Featured Image */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Featured Image</label>
                    <ImageUpload
                      imageType="Featured Image"
                      currentImageUrl={formData.images.featured}
                      onUpload={(file) => handleImageUpload(file, 'featured')}
                      allowRemove={true}
                    />
                    <input
        type="text"
        value={formData.images.alt_featured}
        onChange={(e) => setFormData({
          ...formData,
          images: { ...formData.images, alt_featured: e.target.value }
        })}
        placeholder="ALT text for featured image"
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
      />
                  </div>

                  {/* Banner Image */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Banner Image</label>
                    <ImageUpload
                      imageType="Banner Image"
                      currentImageUrl={formData.images.banner}
                      onUpload={(file) => handleImageUpload(file, 'banner')}
                      allowRemove={true}
                    />
                    <input
        type="text"
        value={formData.images.alt_banner}
        onChange={(e) => setFormData({
          ...formData,
          images: { ...formData.images, alt_banner: e.target.value }
        })}
        placeholder="ALT text for banner image"
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
      />
                  </div>
                </div>
              </div>
              {/* SEO Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900">SEO Settings</h3>
                
                {/* Meta Title & Description */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Meta Title
                      <span className="ml-1 text-sm text-gray-500">
                        ({formData.meta.title.length}/60)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={formData.meta.title}
                      onChange={(e) => setFormData({
                        ...formData,
                        meta: { ...formData.meta, title: e.target.value }
                      })}
                      maxLength={60}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Meta Description
                      <span className="ml-1 text-sm text-gray-500">
                        ({formData.meta.description.length}/160)
                      </span>
                    </label>
                    <textarea
                      value={formData.meta.description}
                      onChange={(e) => setFormData({
                        ...formData,
                        meta: { ...formData.meta, description: e.target.value }
                      })}
                      maxLength={160}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
                    />
                  </div>
                </div>

                {/* Keywords */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Keywords</label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {formData.meta.keywords.map((keyword, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 p-2 bg-gray-100 text-gray-800"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() => {
                            const newKeywords = [...formData.meta.keywords];
                            newKeywords.splice(index, 1);
                            setFormData({
                              ...formData,
                              meta: { ...formData.meta, keywords: newKeywords }
                            });
                          }}
                          className="ml-1 inline-flex items-center p-0.5 text-blue-400 hover:text-blue-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      placeholder="Add keyword and press Enter"
                      className="flex-grow min-w-[200px] rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          e.preventDefault();
                          setFormData({
                            ...formData,
                            meta: {
                              ...formData.meta,
                              keywords: [...formData.meta.keywords, e.target.value.trim()]
                            }
                          });
                          e.target.value = '';
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Categories & Tags */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Categories */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Categories</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="Add category"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newCategory.trim()) {
                            setFormData({
                              ...formData,
                              categories: [...formData.categories, newCategory.trim()]
                            });
                            setNewCategory('');
                          }
                        }}
                        className="mt-1 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.categories.map((category, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {category}
                          <button
                            type="button"
                            onClick={() => {
                              const newCategories = [...formData.categories];
                              newCategories.splice(index, 1);
                              setFormData({ ...formData, categories: newCategories });
                            }}
                            className="ml-1 inline-flex items-center p-0.5 text-gray-400 hover:text-gray-600"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tags</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add tag"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newTag.trim()) {
                            setFormData({
                              ...formData,
                              tags: [...formData.tags, newTag.trim()]
                            });
                            setNewTag('');
                          }
                        }}
                        className="mt-1 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => {
                              const newTags = [...formData.tags];
                              newTags.splice(index, 1);
                              setFormData({ ...formData, tags: newTags });
                            }}
                            className="ml-1 inline-flex items-center p-0.5 text-gray-400 hover:text-gray-600"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Schema Type & Robots */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Schema Type</label>
                    <select
                      value={formData.seo_settings.schema_type}
                      onChange={(e) => setFormData({
                        ...formData,
                        seo_settings: {
                          ...formData.seo_settings,
                          schema_type: e.target.value
                        }
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
                    >
                      <option value="WebPage">Web Page</option>
                      <option value="Article">Article</option>
                      <option value="BlogPosting">Blog Post</option>
                      <option value="FAQPage">FAQ Page</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Robots</label>
                    <div className="mt-2 space-x-4">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.seo_settings.index}
                          onChange={(e) => setFormData({
                            ...formData,
                            seo_settings: {
                              ...formData.seo_settings,
                              index: e.target.checked
                            }
                          })}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 bg-gray-100 text-green-800"
                        />
                        <span className="ml-2 text-sm text-gray-700">Index</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.seo_settings.follow}
                          onChange={(e) => setFormData({
                            ...formData,
                            seo_settings: {
                              ...formData.seo_settings,
                              follow: e.target.checked
                            }
                          })}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 bg-gray-100 text-gray-800"
                        />
                        <span className="ml-2 text-sm text-gray-700">Follow</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status & Schedule */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
                  >
                    {STATUS_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.status === 'scheduled' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Schedule For</label>
                    <input
                      type="datetime-local"
                      value={formData.scheduled_for || ''}
                      onChange={(e) => setFormData({ ...formData, scheduled_for: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
                    />
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
                >
                  {page ? 'Update Page' : 'Create Page'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}