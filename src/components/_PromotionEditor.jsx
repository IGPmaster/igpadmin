// src/components/PromotionEditor.jsx
import { useState } from 'react';
import { X, Upload, Globe, Calendar } from 'lucide-react';
import ImageUpload from '../components/ImageUpload';

export function PromotionEditor({ onClose, onSave, initialData }) {
  const [formData, setFormData] = useState(initialData || {
    title: '',
    content: '',
    type: 'ongoing',
    valid_from: '',
    valid_to: '',
    geo_targeting: [],
    images: {
      desktop: null,
      mobile: null
    }
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:align-middle">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                {initialData ? 'Edit Promotion' : 'Add New Promotion'}
              </h3>
              <button onClick={onClose}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <div className="mt-4 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              {/* Content - WordPress-style Rich Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Content
                </label>
                <textarea
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                />
              </div>

              {/* Desktop Image */}
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

{/* Mobile Image */}
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

              {/* Dates and Targeting */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Valid From
                  </label>
                  <input
                    type="datetime-local"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Valid To
                  </label>
                  <input
                    type="datetime-local"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={formData.valid_to}
                    onChange={(e) => setFormData({ ...formData, valid_to: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={() => onSave(formData)}
            >
              Save Promotion
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}