import { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { config } from '../lib/config';
import ImageUpload from './ImageUpload';
import { Tab } from '@headlessui/react';
import { Globe, Target, BarChart, Image, FileText } from 'lucide-react';

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

  const [newCategory, setNewCategory] = useState('');
  const [newTag, setNewTag] = useState('');

  // Define empty form data structure
  const emptyFormData = {
    title: '',
    slug: '',
    template: 'default',
    status: 'draft',
    content: {
      main: '',
      excerpt: ''
    },
    images: {
      featured: {
        url: '',
        alt: '',
        width: null,
        height: null,
        focal_point: 'center'
      },
      banner: {
        url: '',
        alt: '',
        width: null,
        height: null,
        focal_point: 'center'
      },
      thumbnail: {
        url: '',
        alt: ''
      }
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
      focus_keyword: '',
      structured_data: {}
    },
    seo_settings: {
      index: true,
      follow: true,
      schema_type: 'WebPage'
    },
    scheduled_for: null
  };

  // Initialize state with empty form data
  const [formData, setFormData] = useState(emptyFormData);

  // Use effect to handle page data normalization
  useEffect(() => {
    if (page) {
      
      const normalizedData = {
        title: page.title || '',
        slug: page.slug || '',
        template: page.template || 'default',
        status: page.status || 'draft',
        content: {
          main: page.content?.main || '',
          excerpt: page.content?.excerpt || ''
        },
        images: {
          featured: {
    url: page.images?.featured?.url || '',
    alt: page.images?.featured?.alt || '', // Direct from the stored structure
    width: page.images?.featured?.width || null,
    height: page.images?.featured?.height || null,
    focal_point: page.images?.featured?.focal_point || 'center'
  },
  banner: {
    url: page.images?.banner?.url || '',
    alt: page.images?.banner?.alt || '', // Direct from the stored structure
    width: page.images?.banner?.width || null,
    height: page.images?.banner?.height || null,
    focal_point: page.images?.banner?.focal_point || 'center'
  }
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
          focus_keyword: page.meta?.focus_keyword || '',
          structured_data: page.meta?.structured_data || {}
        },
        seo_settings: {
          index: page.seo_settings?.index ?? true,
          follow: page.seo_settings?.follow ?? true,
          schema_type: page.seo_settings?.schema_type || 'WebPage'
        },
        scheduled_for: page.scheduled_for || null
      };

      setFormData(normalizedData);
    }
  }, [page]);

  // Auto-generate slug from title
  useEffect(() => {
    if (formData.title && !page) {
      const generatedSlug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.title]);

  // Handle image upload
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
            [type]: {
              ...prev.images[type],
              url: imageUrl
            }
          }
        }));
      }
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  // Handle image delete
  const handleImageDelete = (type) => {
    setFormData(prev => ({
      ...prev,
      images: {
        ...prev.images,
        [type]: {
          ...prev.images[type],
          url: ''
        }
      }
    }));
  };

  // Your existing handleSubmit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const pageId = page?.id || crypto.randomUUID();
      const key = `page:${brandId}:${lang}:${pageId}`;

      const pageData = {
        ...formData,
        id: pageId,
        brand_id: brandId,
        language: lang,
        created_at: page?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const requestBody = {
        brandId,
        lang,
        key,
        value: pageData,
      };

      const response = await fetch(`https://casino-pages-api.tech1960.workers.dev/api/pages/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error('Failed to save page');
      onClose();
    } catch (error) {
      console.error('Failed to save page:', error);
    }
  };

  if (!isOpen) return null;

  // Safety check for form data
  if (!formData || !formData.content) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity">
      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-5xl sm:p-6">
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-500"
            >
              ✕
            </button>
            <h3 className="text-lg font-semibold leading-6 text-gray-900 mb-4">
              {page ? `Edit Page: ${page.title}` : 'New Page'}
            </h3>

            <form onSubmit={handleSubmit}>
              <div className="min-h-[750px]">
                <Tab.Group>
                  <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1 sticky top-0 z-10">
                    <Tab className={({ selected }) =>
                      `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                      ${selected 
                        ? 'bg-white text-blue-700 shadow'
                        : 'text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700'}`
                    }>
                      <div className="flex items-center justify-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span>Basic Info</span>
                      </div>
                    </Tab>
                    <Tab className={({ selected }) =>
                      `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                      ${selected 
                        ? 'bg-white text-blue-700 shadow'
                        : 'text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700'}`
                    }>
                      <div className="flex items-center justify-center space-x-2">
                        <Image className="w-4 h-4" />
                        <span>Media</span>
                      </div>
                    </Tab>
                    <Tab className={({ selected }) =>
                      `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                      ${selected 
                        ? 'bg-white text-blue-700 shadow'
                        : 'text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700'}`
                    }>
                      <div className="flex items-center justify-center space-x-2">
                        <Globe className="w-4 h-4" />
                        <span>SEO</span>
                      </div>
                    </Tab>
                  </Tab.List>
                  <Tab.Panels className="mt-4">
                    {/* Basic Info Panel */}
                    <Tab.Panel className="space-y-4">
                      {/* Title, Template & Status */}
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

                      {/* Slug & Status */}
                      <div className="grid grid-cols-2 gap-4">
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
                      </div>

                      {/* Main Content */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Main Content</label>
                        <div className="mt-1">
                          <ReactQuill
                            theme="snow"
                            value={formData.content.main}
                            onChange={(value) => setFormData({
                              ...formData,
                              content: { ...formData.content, main: value }
                            })}
                            className="h-64 bg-white text-gray-800"
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
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
                        />
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
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {category}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newCategories = [...formData.categories];
                                    newCategories.splice(index, 1);
                                    setFormData({ ...formData, categories: newCategories });
                                  }}
                                  className="ml-1 inline-flex items-center p-0.5 text-blue-400 hover:text-blue-600"
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
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newTags = [...formData.tags];
                                    newTags.splice(index, 1);
                                    setFormData({ ...formData, tags: newTags });
                                  }}
                                  className="ml-1 inline-flex items-center p-0.5 text-blue-400 hover:text-blue-600"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Tab.Panel>
                    {/* Media Panel */}
                    <Tab.Panel className="space-y-4">
                      {/* Featured Image */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Featured Image</label>
                        <ImageUpload
                          imageType="Featured Image"
                          currentImageUrl={formData.images.featured.url}
                          onUpload={(file) => handleImageUpload(file, 'featured')}
                          onRemove={() => handleImageDelete('featured')}
                          allowRemove={true}
                        />
                        <div className="mt-2 grid grid-cols-2 gap-4">
                          <div>
                            <input
                              type="text"
                              value={formData.images.featured.alt}
                              onChange={(e) => setFormData({
                                ...formData,
                                images: {
                                  ...formData.images,
                                  featured: {
                                    ...formData.images.featured,
                                    alt: e.target.value
                                  }
                                }
                              })}
                              placeholder="ALT text for featured image"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={formData.images.featured.focal_point}
                              onChange={(e) => setFormData({
                                ...formData,
                                images: {
                                  ...formData.images,
                                  featured: {
                                    ...formData.images.featured,
                                    focal_point: e.target.value
                                  }
                                }
                              })}
                              placeholder="Focal point (e.g., center)"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Banner Image */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Banner Image</label>
                        <ImageUpload
                          imageType="Banner Image"
                          currentImageUrl={formData.images.banner.url}
                          onUpload={(file) => handleImageUpload(file, 'banner')}
                          onRemove={() => handleImageDelete('banner')}
                          allowRemove={true}
                        />
                        <div className="mt-2 grid grid-cols-2 gap-4">
                          <div>
                            <input
                              type="text"
                              value={formData.images.banner.alt}
                              onChange={(e) => setFormData({
                                ...formData,
                                images: {
                                  ...formData.images,
                                  banner: {
                                    ...formData.images.banner,
                                    alt: e.target.value
                                  }
                                }
                              })}
                              placeholder="ALT text for banner image"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={formData.images.banner.focal_point}
                              onChange={(e) => setFormData({
                                ...formData,
                                images: {
                                  ...formData.images,
                                  banner: {
                                    ...formData.images.banner,
                                    focal_point: e.target.value
                                  }
                                }
                              })}
                              placeholder="Focal point (e.g., center)"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
                            />
                          </div>
                        </div>
                      </div>
                    </Tab.Panel>

                    {/* SEO Panel */}
                    <Tab.Panel className="space-y-4">
                      {/* Meta Title & Description */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Meta Title
                            <span className="ml-2 text-sm text-gray-500">
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
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
                            maxLength={60}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Meta Description
                            <span className="ml-2 text-sm text-gray-500">
                              ({formData.meta.description.length}/160)
                            </span>
                          </label>
                          <textarea
                            value={formData.meta.description}
                            onChange={(e) => setFormData({
                              ...formData,
                              meta: { ...formData.meta, description: e.target.value }
                            })}
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
                            maxLength={160}
                          />
                        </div>

                        {/* Focus Keyword */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Focus Keyword</label>
                          <input
                            type="text"
                            value={formData.meta.focus_keyword}
                            onChange={(e) => setFormData({
                              ...formData,
                              meta: { ...formData.meta, focus_keyword: e.target.value }
                            })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
                          />
                        </div>

                        {/* Canonical URL */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Canonical URL</label>
                          <input
                            type="text"
                            value={formData.meta.canonical_url}
                            onChange={(e) => setFormData({
                              ...formData,
                              meta: { ...formData.meta, canonical_url: e.target.value }
                            })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
                          />
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
                                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">Follow</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Tab.Panel>
                  </Tab.Panels>
                </Tab.Group>
              </div>

              {/* Form Actions */}
              <div className="mt-6 flex justify-end space-x-3 pt-4 border-t">
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