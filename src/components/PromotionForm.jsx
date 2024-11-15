import { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { config } from '../lib/config';
import ImageUpload from '../components/ImageUpload';
import { Tab } from '@headlessui/react';
import { Globe, Target, BarChart, Image, FileText, Maximize2, Minimize2 } from 'lucide-react';
import ImageLibraryModal from './ImageLibraryModal'; // Adjust the path if needed
import { UnsavedChangesDialog } from './UnsavedChangesDialog';



export function PromotionForm({ isOpen, onClose, promotion = null, brandId, lang, onSave }) {

  // 1. First define the data structure (not inside a hook)
  const emptyFormData = {
    title: '',
    slug: '',
    type: 'regular',
    status: 'active',
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


  // 2. All useState hooks together
  const [isDirty, setIsDirty] = useState(false);  // Add this
  const [saving, setSaving] = useState(false);     // Add this
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [formData, setFormData] = useState(emptyFormData);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [selectedImageType, setSelectedImageType] = useState(null); // to track if we are updating desktop or mobile
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);


  // 3. All useEffect hooks together
  useEffect(() => {
    if (promotion) {
      const normalizedData = {
        title: promotion.title || '',
        slug: promotion.slug || '',
        type: promotion.type || 'regular',
        status: promotion.status || 'active',
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

  useEffect(() => {
    if (formData.title && !promotion) {
      const generatedSlug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.title, promotion]);

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  // When any field changes, mark as dirty
  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setIsDirty(true);
  };

  // For nested fields (like in content or meta sections)
const handleNestedFieldChange = (section, field, value) => {
  setFormData(prev => ({
    ...prev,
    [section]: {
      ...prev[section],
      [field]: value
    }
  }));
  setIsDirty(true);  // Explicitly set isDirty
};

 // Handle image upload
const handleImageUpload = async (file, type) => {
  try {  // Main try-catch block
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('metadata', JSON.stringify({
      brand: brandId,
      type: `promotion_${type}`,
      language: lang,
    }));

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
      setIsDirty(true);  // Add this to mark form as dirty after upload
    }
  } catch (error) {
    console.error('Upload error:', error);
  }
};

// For image alt text changes
const handleImageAltChange = (type, alt) => {
  setFormData(prev => ({
    ...prev,
    images: {
      ...prev.images,
      [type]: {
        ...prev.images[type],
        alt
      }
    }
  }));
  setIsDirty(true);  // Explicitly set isDirty
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
    setIsDirty(true);  // Add this
  };

const handleSave = async () => {
  try {
    setSaving(true);
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
    
    setIsDirty(false);  // Reset dirty state
    if (onSave) {
      await onSave();  // This will trigger the parent component refresh
    }
    onClose();  // Close the form after successful save
  } catch (error) {
    console.error('Failed to save promotion:', error);
  } finally {
    setSaving(false);
  }
};

  if (!isOpen) return null;

  if (!formData || !formData.content) {
    return null;
  }

  // Add this function near your other handlers in the PromotionForm component
  const handleDiscardChanges = () => {
    // Reset form to initial state if creating new promotion
    if (!promotion) {
      setFormData(emptyFormData);
    } else {
      // Reset to original promotion data if editing
      setFormData({
        title: promotion.title || '',
        slug: promotion.slug || '',
        type: promotion.type || 'regular',
        status: promotion.status || 'active',
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
      });
    }
    setIsDirty(false);
  };

  const handleClose = () => {
    if (isDirty) {
      setShowUnsavedDialog(true);
    } else {
      onClose();
    }
  };

  const handleSaveAndClose = () => {
    handleSave(new Event('submit'));
    setShowUnsavedDialog(false);
  };

  const handleDiscardAndClose = () => {
    setShowUnsavedDialog(false);
    onClose();
  };

  return (
    <>
      <div className={`fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-black dark:bg-opacity-50 transition-opacity
        ${isFullScreen ? 'z-50' : ''}`}>
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className={`flex min-h-full items-end justify-center p-4 text-center sm:items-center transition-all duration-300
            ${isFullScreen ? 'p-0' : 'sm:p-0'}`}>
            <div className={`relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all
              ${isFullScreen ? 'w-full h-screen max-w-none rounded-none' : 'sm:my-8 sm:w-full sm:max-w-5xl sm:p-6'}`}>
                
                {/* Header with close and fullscreen buttons */}
                <div className="absolute right-4 top-4 flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={toggleFullScreen}
                    className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                  >
                    {isFullScreen ? (
                      <Minimize2 className="h-5 w-5" />
                    ) : (
                      <Maximize2 className="h-5 w-5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white mb-4">
                  {promotion ? `Edit Promotion: ${promotion.title}` : 'New Promotion'}
                </h3>

                <form onSubmit={(e) => {
                  e.preventDefault();  // Add this
                  handleSave();
                }}>
                  <div className={`${isFullScreen ? 'h-[calc(100vh-180px)]' : 'min-h-[750px]'}`}>
                    <div className={`${isFullScreen ? 'h-full' : 'min-h-[700px]'}`}>
                      <Tab.Group>
                        <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 dark:bg-gray-900 p-2 sticky top-0 z-10 dark:border-b dark:border-gray-700">
                          <Tab className={({ selected }) =>
                            `w-full rounded-lg py-2.5 text-sm font-medium leading-5 bg-gray-50
                            ${selected 
                              ? 'bg-white text-blue-700 shadow dark:bg-gray-600 dark:text-white'
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
                              ? 'bg-white text-blue-700 shadow dark:bg-gray-600 dark:text-white'
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
                              ? 'bg-white text-blue-700 shadow dark:bg-gray-600 dark:text-white'
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
                              ? 'bg-white text-blue-700 shadow dark:bg-gray-600 dark:text-white'
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
                              ? 'bg-white text-blue-700 shadow dark:bg-gray-600 dark:text-white'
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
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-white">Title</label>
                              <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => handleFieldChange('title', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-white">Slug</label>
                              <input
                                type="text"
                                value={formData.slug}
                                onChange={(e) => handleFieldChange('slug', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white font-mono text-xs"
                                required
                              />
                            </div>
                          </div>
                          {/* Status and Type Grid */}
                          <div className="grid grid-cols-2 gap-4">
                            {/* Status Dropdown */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-white">Status</label>
                              <select
                                value={formData.status}
                                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white"
                              >
                                <option value="active">Active</option>
                                <option value="draft">Draft</option>
                                <option value="scheduled">Scheduled</option>
                                <option value="expired">Expired</option>
                              </select>
                            </div>

                            {/* Type Dropdown */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-white">Type</label>
                              <select
                                value={formData.type}
                                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white"
                              >
                                <option value="regular">Regular Promotion</option>
                                <option value="welcome_offer">Welcome Offer</option>
                                <option value="seasonal">Seasonal</option>
                              </select>
                            </div>
                          </div>

                          {/* Content Fields */}
                          <div className="space-y-6">
                            {/* Short Description */}
                            {/* <div className='p-4 dark:bg-gray-900 rounded-xl'>
                              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                Short Description
                              </label>
                              <input
                                type="text"
                                value={formData.content.short_description}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  content: { ...formData.content, short_description: e.target.value }
                                })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white"
                              />
                            </div> */}

                            {/* Full Description */}
                            <div className={`${isFullScreen ? 'h-[calc(100vh-800px)]' : ''}`}>
                              <label className="block text-sm font-medium text-gray-700 dark:text-white">
                                Full Description
                              </label>
                              <div className={`mt-1 ${isFullScreen ? 'h-[calc(100vh-850px)]' : 'h-[400px]'}`}>
                                <ReactQuill
                                  theme="snow"
                                  value={formData.content.description}
                                  onChange={(content) => setFormData({
                                    ...formData,
                                    content: { ...formData.content, description: content }
                                  })}
                                  className="h-full"
                                  modules={{
                                    toolbar: [
                                      ['bold', 'italic', 'underline', 'strike'],
                                      ['blockquote', 'code-block'],
                                      [{ 'header': 1 }, { 'header': 2 }],
                                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                      [{ 'script': 'sub'}, { 'script': 'super' }],
                                      [{ 'indent': '-1'}, { 'indent': '+1' }],
                                      [{ 'direction': 'rtl' }],
                                      [{ 'size': ['small', false, 'large', 'huge'] }],
                                      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                                      [{ 'color': [] }, { 'background': [] }],
                                      [{ 'font': [] }],
                                      [{ 'align': [] }],
                                      ['clean'],
                                      ['link', 'image']
                                    ]
                                  }}
                                />
                              </div>
                            </div>

                            {/* Terms & Conditions */}
                            <div className='p-4 dark:bg-gray-900 rounded-xl'>
                              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                                Terms & Conditions
                              </label>
                              <ReactQuill
                                theme="snow"
                                value={formData.content.terms}
                                onChange={(content) => setFormData({
                                  ...formData,
                                  content: { ...formData.content, terms: content }
                                })}
                                className="h-12 mb-20"
                                modules={{
                                  toolbar: [
                                    ['bold', 'italic', 'underline', 'strike'],
                                    ['blockquote', 'code-block'],
                                    [{ 'header': 1 }, { 'header': 2 }],
                                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                    [{ 'script': 'sub'}, { 'script': 'super' }],
                                    [{ 'indent': '-1'}, { 'indent': '+1' }],
                                    [{ 'direction': 'rtl' }],
                                    [{ 'size': ['small', false, 'large', 'huge'] }],
                                    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                                    [{ 'color': [] }, { 'background': [] }],
                                    [{ 'font': [] }],
                                    [{ 'align': [] }],
                                    ['clean'],
                                    ['link', 'image']
                                  ]
                                }}
                              />
                            </div>
                          </div>
                        </Tab.Panel>

                        {/* Media Panel */}
                        <Tab.Panel className="space-y-4">
                         {/* Images Section */}
                          <div className="space-y-4">
                            {/* Desktop Banner */}
                            <div className="relative">
                              <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-white">
                                  Desktop Banner
                                </label>
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
                              <ImageUpload
                                key={formData.images.desktop.url}
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
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white font-mono"
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
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Mobile Banner */}
                            <div className="relative">
                              <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-white">
                                  Mobile Banner
                                </label>
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
                              <ImageUpload
                                key={formData.images.mobile.url}
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
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white font-mono"
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
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white"
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
                              <label className="block text-sm font-medium text-gray-700 dark:text-white">
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
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white"
                                maxLength={60}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-white">
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
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white"
                                maxLength={160}
                              />
                            </div>

                            {/* Keywords */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-white">Focus Keyword</label>
                              <input
                                type="text"
                                value={formData.meta.focus_keyword}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  meta: { ...formData.meta, focus_keyword: e.target.value }
                                })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white"
                              />
                            </div>
                          </div>

                          {/* Open Graph */}
                          <div className="space-y-4">
                            <h4 className="font-medium text-gray-900 dark:text-white">Social Media Preview</h4>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-white">OG Title</label>
                              <input
                                type="text"
                                value={formData.meta.og_title}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  meta: { ...formData.meta, og_title: e.target.value }
                                })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white"
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
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white"
                              />
                            </div>
                          </div>
                        </Tab.Panel>

                        {/* Targeting Panel */}
                        <Tab.Panel className="space-y-4">
                          {/* Countries */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-white">Target Countries</label>
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
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white"
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-white">Player Segments</label>
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
                              <label className="block text-sm font-medium text-gray-700 dark:text-white">Campaign ID</label>
                              <input
                                type="text"
                                value={formData.tracking.campaign_id}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  tracking: { ...formData.tracking, campaign_id: e.target.value }
                                })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-white">UTM Source</label>
                              <input
                                type="text"
                                value={formData.tracking.utm_source}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  tracking: { ...formData.tracking, utm_source: e.target.value }
                                })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-white">UTM Medium</label>
                              <input
                                type="text"
                                value={formData.tracking.utm_medium}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  tracking: { ...formData.tracking, utm_medium: e.target.value }
                                })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-white">UTM Campaign</label>
                              <input
                                type="text"
                                value={formData.tracking.utm_campaign}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  tracking: { ...formData.tracking, utm_campaign: e.target.value }
                                })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white"
                              />
                            </div>
                          </div>
                        </Tab.Panel>
                      </Tab.Panels>
                    </Tab.Group>
                  </div>
                </div>

                {/* Form Actions */}
                <div className={`flex justify-end space-x-3 pt-4 border-t dark:border-gray-900
                  ${isFullScreen ? 'fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 p-4' : 'mt-6'}`}>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
                  >
                    {promotion ? 'Update Promotion' : 'Create Promotion'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <ImageLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelectImage={(url) => {
          setFormData(prev => ({
            ...prev,
            images: {
              ...prev.images,
              [selectedImageType]: {
                ...prev.images[selectedImageType],
                url
              }
            }
          }));
          setIsLibraryOpen(false);
          setIsDirty(true);
        }}
      />
      <UnsavedChangesDialog
        isOpen={showUnsavedDialog}
        onSave={handleSaveAndClose}
        onDiscard={handleDiscardAndClose}
        onCancel={() => setShowUnsavedDialog(false)}
      />
    </>
  );
}