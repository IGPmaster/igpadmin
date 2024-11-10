import { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { config } from '../lib/config';
import ImageUpload from '../components/ImageUpload';
import { Tab } from '@headlessui/react';
import { Globe, Target, BarChart, Image, FileText } from 'lucide-react';

export function PromotionForm({ isOpen, onClose, promotion = null, brandId, lang }) {

  // Define empty form data structure
  const emptyFormData = {
    title: '',
    slug: '',
    type: 'regular',
    status: 'draft',
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
      }
    },
    content: {
      description: '',
      short_description: '',
      terms: ''
    },
    meta: {
      title: '',
      description: '',
      keywords: [],
      focus_keyword: '',
      og_title: '',
      og_description: ''
    },
    targeting: {
      countries: [lang.toUpperCase()],
      player_segments: ['new']
    },
    tracking: {
      campaign_id: '',
      utm_source: '',
      utm_medium: '',
      utm_campaign: ''
    }
  };

  // Initialize state with empty form data
  const [formData, setFormData] = useState(emptyFormData);

  useEffect(() => {
  if (promotion) {
    const normalizedData = {
      title: promotion.title || '',
      slug: promotion.slug || '',
      type: promotion.type || 'regular',
      status: promotion.status || 'draft',
      images: {
        desktop: {
          url: promotion.images?.desktop?.url || '',
          alt: promotion.images?.desktop?.alt || '',
          width: promotion.images?.desktop?.width || null,
          height: promotion.images?.desktop?.height || null,
          focal_point: promotion.images?.desktop?.focal_point || 'center'
        },
        mobile: {
          url: promotion.images?.mobile?.url || '',
          alt: promotion.images?.mobile?.alt || '',
          width: promotion.images?.mobile?.width || null,
          height: promotion.images?.mobile?.height || null,
          focal_point: promotion.images?.mobile?.focal_point || 'center'
        }
      },
      content: promotion.content || {},
      meta: promotion.meta || {},
      targeting: promotion.targeting || {},
      tracking: promotion.tracking || {},
    };
    setFormData(normalizedData);
  }
}, [promotion]);

  // Auto-generate slug from title
  useEffect(() => {
    if (formData.title && !promotion) {
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
      type: `promotion_${type}`,
      language: lang,
    }));

    try {
      const response = await fetch('https://casino-content-admin.tech1960.workers.dev/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.CF_IMAGES_TOKEN}`,
        },
        body: uploadData,
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const promoId = promotion?.id || crypto.randomUUID();
      const key = `promo:${brandId}:${lang}:${promoId}`;

      const promotionData = {
        ...formData,
        id: promoId,
        created_at: promotion?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        brand_id: brandId,
        language: lang,
      };

      const response = await fetch(`https://casino-promotions-api.tech1960.workers.dev/promotions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key,
          value: promotionData,
        }),
      });

      if (!response.ok) throw new Error('Failed to save promotion');
      onClose();
    } catch (error) {
      console.error('Failed to save promotion:', error);
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
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-500 "
          >
            ✕
          </button>
          <h3 className="text-lg font-semibold leading-6 text-gray-900 mb-4">
            {promotion ? `Edit Promotion: ${promotion.title}` : 'New Promotion'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="min-h-[600px]">
              <div className="min-h-[700px]"> {/* Fixed height container */}
              <Tab.Group>
                <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1 sticky top-0 z-10">
                  <Tab className={({ selected }) =>
                    `w-full rounded-lg py-2.5 text-sm font-medium leading-5 bg-gray-50
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
                  <Tab className={({ selected }) =>
                    `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                    ${selected 
                      ? 'bg-white text-blue-700 shadow'
                      : 'text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700'}`
                  }>
                    <div className="flex items-center justify-center space-x-2">
                      <Target className="w-4 h-4" />
                      <span>Targeting</span>
                    </div>
                  </Tab>
                  <Tab className={({ selected }) =>
                    `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                    ${selected 
                      ? 'bg-white text-blue-700 shadow'
                      : 'text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700'}`
                  }>
                    <div className="flex items-center justify-center space-x-2">
                      <BarChart className="w-4 h-4" />
                      <span>Tracking</span>
                    </div>
                  </Tab>
              </Tab.List>

              <Tab.Panels className="mt-4">
                
                {/* Basic Info Panel */}
                <Tab.Panel className="space-y-4">
                  {/* Your existing basic fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
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
                      <label className="block text-sm font-medium text-gray-700">Slug</label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800 font-mono text-xs"
                        required
                      />
                    </div>
                  </div>
                  {/* Status and Type Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Status Dropdown */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-gray-100 text-gray-800 p-2"
                      >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="expired">Expired</option>
                      </select>
                    </div>

                    {/* Type Dropdown */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Type</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
                      >
                        <option value="regular">Regular Promotion</option>
                        <option value="welcome_offer">Welcome Offer</option>
                        <option value="seasonal">Seasonal</option>
                      </select>
                    </div>
                  </div>

                  {/* Content fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Short Description</label>
                      <input
                        type="text"
                        value={formData.content.short_description}
                        onChange={(e) => setFormData({
                          ...formData,
                          content: { ...formData.content, short_description: e.target.value }
                        })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Full Description</label>
                      <ReactQuill
                        theme="snow"
                        value={formData.content.description}
                        onChange={(content) => setFormData({
                          ...formData,
                          content: { ...formData.content, description: content }
                        })}
                        className="h-32 mb-12 text-gray-800"
                      />
                    </div>
                  </div>

                  {/* Terms & Scheduling */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Terms & Conditions</label>
                      <ReactQuill
                        theme="snow"
                        value={formData.content.terms}
                        onChange={(content) => setFormData({
                          ...formData,
                          content: { ...formData.content, terms: content }
                        })}
                        className="h-32 mb-12 text-gray-800"
                      />
                    </div>
                  </div>
                </Tab.Panel>

                {/* Media Panel */}
                <Tab.Panel className="space-y-4">
                  {/* Desktop Banner */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Desktop Banner</label>
                      <ImageUpload
                        imageType="Desktop Banner"
                        currentImageUrl={formData.images.desktop.url}
                        onUpload={(file) => handleImageUpload(file, 'desktop')}
                        onRemove={() => handleImageDelete('desktop')}
                        allowRemove={true}
                      />
                      <div className="mt-2 grid grid-cols-2 gap-4">
                        <div>
                          <input
                            type="text"
                            value={formData.images.desktop.alt}
                            onChange={(e) => setFormData({
                              ...formData,
                              images: {
                                ...formData.images,
                                desktop: {
                                  ...formData.images.desktop,
                                  alt: e.target.value
                                }
                              }
                            })}
                            placeholder="ALT text for desktop banner"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800 font-mono"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={formData.images.desktop.focal_point}
                            onChange={(e) => setFormData({
                              ...formData,
                              images: {
                                ...formData.images,
                                desktop: {
                                  ...formData.images.desktop,
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

                    {/* Mobile Banner */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Mobile Banner</label>
                      <ImageUpload
                        imageType="Mobile Banner"
                        currentImageUrl={formData.images.mobile.url}
                        onUpload={(file) => handleImageUpload(file, 'mobile')}
                        onRemove={() => handleImageDelete('mobile')}
                        allowRemove={true}
                      />
                      <div className="mt-2 grid grid-cols-2 gap-4">
                        <div>
                          <input
                            type="text"
                            value={formData.images.mobile.alt}
                            onChange={(e) => setFormData({
                              ...formData,
                              images: {
                                ...formData.images,
                                mobile: {
                                  ...formData.images.mobile,
                                  alt: e.target.value
                                }
                              }
                            })}
                            placeholder="ALT text for mobile banner"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800 font-mono text-sm"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={formData.images.mobile.focal_point}
                            onChange={(e) => setFormData({
                              ...formData,
                              images: {
                                ...formData.images,
                                mobile: {
                                  ...formData.images.mobile,
                                  focal_point: e.target.value
                                }
                              }
                            })}
                            placeholder="Focal point (e.g., center)"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800 text-sm"
                          />
                        </div>
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
                          {formData.meta.title.length}/60
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
                          {formData.meta.description.length}/160
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

                    {/* Keywords */}
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
                  </div>

                  {/* Open Graph */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Social Media Preview</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">OG Title</label>
                      <input
                        type="text"
                        value={formData.meta.og_title}
                        onChange={(e) => setFormData({
                          ...formData,
                          meta: { ...formData.meta, og_title: e.target.value }
                        })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">OG Description</label>
                      <textarea
                        value={formData.meta.og_description}
                        onChange={(e) => setFormData({
                          ...formData,
                          meta: { ...formData.meta, og_description: e.target.value }
                        })}
                        rows={2}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
                      />
                    </div>
                  </div>
                </Tab.Panel>

                {/* Targeting Panel */}
                <Tab.Panel className="space-y-4">
                  {/* Countries */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Target Countries</label>
                    <select
                      multiple
                      value={formData.targeting.countries}
                      onChange={(e) => {
                        const values = Array.from(e.target.selectedOptions, option => option.value);
                        setFormData({
                          ...formData,
                          targeting: { ...formData.targeting, countries: values }
                        });
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
                    >
                      <option value="GB">United Kingdom</option>
                      <option value="JP">Japan</option>
                      <option value="FI">Finland</option>
                      <option value="BR">Brazil</option>
                      <option value="DE">Germany</option>
                      {/* Add more countries */}
                    </select>
                  </div>

                  {/* Player Segments */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Player Segments</label>
                    <div className="mt-2 space-y-2">
                      {['new', 'existing', 'vip'].map((segment) => (
                        <label key={segment} className="inline-flex items-center mr-4">
                          <input
                            type="checkbox"
                            checked={formData.targeting.player_segments.includes(segment)}
                            onChange={(e) => {
                              const newSegments = e.target.checked
                                ? [...formData.targeting.player_segments, segment]
                                : formData.targeting.player_segments.filter(s => s !== segment);
                              setFormData({
                                ...formData,
                                targeting: { ...formData.targeting, player_segments: newSegments }
                              });
                            }}
                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-gray-100 text-gray-800"
                          />
                          <span className="ml-2 text-sm text-gray-700 capitalize">{segment}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </Tab.Panel>

                {/* Tracking Panel */}
                <Tab.Panel className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Campaign ID</label>
                      <input
                        type="text"
                        value={formData.tracking.campaign_id}
                        onChange={(e) => setFormData({
                          ...formData,
                          tracking: { ...formData.tracking, campaign_id: e.target.value }
                        })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">UTM Source</label>
                      <input
                        type="text"
                        value={formData.tracking.utm_source}
                        onChange={(e) => setFormData({
                          ...formData,
                          tracking: { ...formData.tracking, utm_source: e.target.value }
                        })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">UTM Medium</label>
                      <input
                        type="text"
                        value={formData.tracking.utm_medium}
                        onChange={(e) => setFormData({
                          ...formData,
                          tracking: { ...formData.tracking, utm_medium: e.target.value }
                        })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">UTM Campaign</label>
                      <input
                        type="text"
                        value={formData.tracking.utm_campaign}
                        onChange={(e) => setFormData({
                          ...formData,
                          tracking: { ...formData.tracking, utm_campaign: e.target.value }
                        })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
                      />
                    </div>
                  </div>
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
            </div>

             {/* Footer with submit buttons */}
            <div className="mt-6 flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {promotion ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </form>
        </div>
      </div>
    </div>
  </div>
);
}