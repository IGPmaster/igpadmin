// src/components/PromotionModal.jsx
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Dialog } from '@headlessui/react';
import { X, Upload, Calendar } from 'lucide-react';

// Move this to the top level
const SUPPORTED_COUNTRIES = [
  { code: 'GB', name: 'United Kingdom' },
  { code: 'IE', name: 'Ireland' },
  { code: 'JP', name: 'Japan' },
  { code: 'FI', name: 'Finland' },
  { code: 'BR', name: 'Brazil' },
  { code: 'CA', name: 'Canada' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'ZA', name: 'South Africa' }
];

// Move helper function to top level
const getDefaultCountryForLanguage = (lang) => {
  switch (lang.toUpperCase()) {
    case 'EN-GB':
    case 'GB':
      return 'GB';
    case 'JP':
      return 'JP';
    case 'FI':
      return 'FI';
    case 'BR':
      return 'BR';
    case 'IE':
      return 'IE';
    default:
      return 'GB'; // Default fallback
  }
};

export function PromotionModal({ isOpen, onClose, onSave, initialData = null }) {
  const { brandId, lang } = useParams();
  
  const [formData, setFormData] = useState(initialData || {
    title: '',
    description: '',
    type: 'regular', // regular, welcome_offer, seasonal
    images: {
      desktop: '',
      mobile: ''
    },
    valid_from: new Date().toISOString().split('T')[0],
    valid_to: '',
    terms: '',
    geo_targeting: [getDefaultCountryForLanguage(lang)],
    status: 'active', // draft, active, expired
    display_order: 0
  });

  const handleImageUpload = async (type) => {
    try {
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
          type: `promotion_${type}`,
          language: lang
        }));

        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${config.CF_ACCOUNT_ID}/images/v1`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${config.CF_IMAGES_TOKEN}`
            },
            body: formData
          }
        );

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
      };

      input.click();
    } catch (error) {
      console.error('Image upload failed:', error);
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose}
      className="fixed inset-0 z-50 overflow-y-auto pt-16"
    >
      <div className="flex min-h-screen text-center md:block md:px-2 lg:px-4">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-60" />

        <div className="inline-block w-full max-w-5xl my-8 text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-medium">
              {initialData ? 'Edit Promotion' : 'Create New Promotion'}
            </Dialog.Title>
            <button onClick={onClose}>
              <X className="w-5 h-5 text-gray-400 hover:text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-6">
            {/* Title & Type */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="regular">Regular Promotion</option>
                  <option value="welcome_offer">Welcome Offer</option>
                  <option value="seasonal">Seasonal</option>
                </select>
              </div>
            </div>

            {/* Images */}
<div className="grid grid-cols-2 gap-4">
  {/* Desktop Image Field */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Desktop Image
    </label>
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
      {formData.images.desktop ? (
        <div className="relative">
          <img 
            src={formData.images.desktop} 
            alt="Desktop Preview"
            className="w-full h-40 object-cover rounded"
          />
          <button 
            onClick={() => handleImageUpload('desktop')}
            className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-lg"
          >
            <Upload className="w-4 h-4" />
          </button>
          {/* Add from Library Button */}
          <button
            onClick={() => {
              setSelectedImageType('desktop');
              setIsLibraryOpen(true);
            }}
            className="absolute top-2 left-2 bg-white p-2 rounded-full shadow-lg text-gray-500 hover:text-gray-700"
          >
            <span className="text-xs">Add from Library</span>
          </button>
        </div>
      ) : (
        <button
          onClick={() => handleImageUpload('desktop')}
          className="w-full h-40 flex flex-col items-center justify-center text-gray-400 hover:text-gray-500"
        >
          <Upload className="w-8 h-8 mb-2" />
          <span>Upload Desktop Image</span>
        </button>
      )}
    </div>
  </div>

  {/* Mobile Image Field */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Mobile Image
    </label>
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
      {formData.images.mobile ? (
        <div className="relative">
          <img 
            src={formData.images.mobile} 
            alt="Mobile Preview"
            className="w-full h-40 object-cover rounded"
          />
          <button 
            onClick={() => handleImageUpload('mobile')}
            className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-lg"
          >
            <Upload className="w-4 h-4" />
          </button>
          {/* Add from Library Button */}
          <button
            onClick={() => {
              setSelectedImageType('mobile');
              setIsLibraryOpen(true);
            }}
            className="absolute top-2 left-2 bg-white p-2 rounded-full shadow-lg text-gray-500 hover:text-gray-700"
          >
            <span className="text-xs">Add from Library</span>
          </button>
        </div>
      ) : (
        <button
          onClick={() => handleImageUpload('mobile')}
          className="w-full h-40 flex flex-col items-center justify-center text-gray-400 hover:text-gray-500"
        >
          <Upload className="w-8 h-8 mb-2" />
          <span>Upload Mobile Image</span>
        </button>
      )}
    </div>
  </div>
</div>


            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={4}
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valid From
                </label>
                <input
                  type="date"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valid To
                </label>
                <input
                  type="date"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={formData.valid_to}
                  onChange={(e) => setFormData({ ...formData, valid_to: e.target.value })}
                />
              </div>
            </div>

            {/* Terms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Terms & Conditions
              </label>
              <textarea
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-md"
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
              />
            </div>

            {/* Geo Targeting */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Geo Targeting
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500">Primary Market</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                    value={SUPPORTED_COUNTRIES.find(c => c.code === getDefaultCountryForLanguage(lang))?.name}
                    disabled
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-500">Additional Markets</label>
                  <select
                    multiple
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={formData.geo_targeting.filter(c => c !== getDefaultCountryForLanguage(lang))}
                    onChange={(e) => {
                      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                      setFormData({
                        ...formData,
                        geo_targeting: [
                          getDefaultCountryForLanguage(lang),
                          ...selectedOptions
                        ]
                      });
                    }}
                  >
                    {SUPPORTED_COUNTRIES
                      .filter(country => country.code !== getDefaultCountryForLanguage(lang))
                      .map(country => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(formData)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              {initialData ? 'Update Promotion' : 'Create Promotion'}
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}