import { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { config } from '../lib/config';
import ImageUpload from '../components/ImageUpload';

export function PromotionForm({ isOpen, onClose, promotion = null, brandId, lang }) {
  //console.log('PromotionForm initializing with promotion:', promotion);
  
  // Compute initial state
  const initialState = promotion ? {
    title: promotion.title,
    slug: promotion.slug,
    description: promotion.description,
    type: promotion.type,
    status: promotion.status,
    images: promotion.images,
    valid_from: promotion.valid_from?.split('T')[0] || new Date().toISOString().split('T')[0],
    valid_to: promotion.valid_to?.split('T')[0] || '',
    terms: promotion.terms,
    geo_targeting: promotion.geo_targeting || [lang.toUpperCase()],
  } : {
    title: '',
    slug: '',
    description: '',
    type: 'regular',
    status: 'draft',
    images: { desktop: '', mobile: '' },
    valid_from: new Date().toISOString().split('T')[0],
    valid_to: '',
    terms: '',
    geo_targeting: [lang.toUpperCase()],
  };

  const [formData, setFormData] = useState(initialState);
  //console.log('Initial formData:', formData);

  // Update form when promotion changes
  useEffect(() => {
    //console.log('useEffect triggered with promotion:', promotion);
    if (promotion) {
      const updatedData = {
        title: promotion.title,
        slug: promotion.slug,
        description: promotion.description,
        type: promotion.type,
        status: promotion.status,
        images: promotion.images,
        valid_from: promotion.valid_from?.split('T')[0] || new Date().toISOString().split('T')[0],
        valid_to: promotion.valid_to?.split('T')[0] || '',
        terms: promotion.terms,
        geo_targeting: promotion.geo_targeting || [lang.toUpperCase()],
      };
      //console.log('Updating formData to:', updatedData);
      setFormData(updatedData);
    }
  }, [promotion?.id]); // Only update when promotion ID changes

  // Log whenever formData changes
  useEffect(() => {
    //console.log('formData changed:', formData);
  }, [formData]);

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

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity">
      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:p-6">
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-500"
            >
              ✕
            </button>

            <h3 className="text-lg font-semibold leading-6 text-gray-900 mb-4">
              {promotion ? `Edit Promotion: ${promotion.title}` : 'New Promotion'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
                  placeholder="Promotion title"
                  required
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
                  placeholder="Promotion slug"
                  required
                />
              </div>

              {/* Type */}
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

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <ReactQuill
                  theme="snow"
                  value={formData.description}
                  onChange={(content) => setFormData(prev => ({ ...prev, description: content }))}
                  className="h-32 mb-12 text-gray-800"
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

              {/* Desktop Banner */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Desktop Banner</label>
                <ImageUpload
                  imageType="Desktop Banner"
                  currentImageUrl={formData.images.desktop}
                  onUpload={(file) => handleImageUpload(file, 'desktop')}
                  onRemove={() => handleImageDelete('desktop')}
                  allowRemove={true}
                />
              </div>

              {/* Mobile Banner */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Mobile Banner</label>
                <ImageUpload
                  imageType="Mobile Banner"
                  currentImageUrl={formData.images.mobile}
                  onUpload={(file) => handleImageUpload(file, 'mobile')}
                  onRemove={() => handleImageDelete('mobile')}
                  allowRemove={true}
                />
              </div>

              {/* Valid From/To */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Valid From</label>
                  <input
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData(prev => ({ ...prev, valid_from: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Valid To</label>
                  <input
                    type="date"
                    value={formData.valid_to}
                    onChange={(e) => setFormData(prev => ({ ...prev, valid_to: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-100 text-gray-800"
                  />
                </div>
              </div>

              {/* Terms & Conditions */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Terms & Conditions</label>
                <ReactQuill
                  theme="snow"
                  value={formData.terms}
                  onChange={(content) => setFormData(prev => ({ ...prev, terms: content }))}
                  className="h-32 mb-12 text-gray-800"
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

              {/* Status */}
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

              {/* Submit buttons */}
              <div className="mt-6 flex justify-end space-x-3">
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
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}