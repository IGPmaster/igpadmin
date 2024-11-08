// src/pages/PromotionsManager.jsx
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePromotions } from '../lib/hooks/usePromotions';
import { Calendar, Image, Globe, Clock, Plus } from 'lucide-react';
import { PromotionModal } from '../components/PromotionModal';

export function PromotionsManager() {
  const { brandId, lang } = useParams();
  const { promotions, loading, addPromotion } = usePromotions(brandId, lang);
  const [isModalOpen, setIsModalOpen] = useState(false);

const handleTestSave = async (formData) => {
  try {
    console.log('Saving promotion:', formData);
    
    // Create test promotion object
    const testPromotion = {
      id: crypto.randomUUID(),
      ...formData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Save to KV
    const key = `promo:${brandId}:${lang}:${testPromotion.id}`;
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${config.CF_ACCOUNT_ID}/storage/kv/namespaces/${config.CF_PROMOTIONS_NAMESPACE_ID}/values/${key}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${config.CF_IMAGES_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPromotion)
      }
    );

    if (!response.ok) {
      throw new Error('Failed to save promotion');
    }

    setIsModalOpen(false);
    // Refresh promotions list
    // We'll add this functionality next
  } catch (error) {
    console.error('Error saving promotion:', error);
    // We'll add proper error handling later
  }
};

{/* In PromotionsManager.jsx */}
{isModalOpen && (
  <PromotionModal
    isOpen={isModalOpen}
    onClose={() => setIsModalOpen(false)}
    onSave={handleTestSave}
  />
)}

  const handleSavePromotion = async (formData) => {
    try {
      await addPromotion(formData);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save promotion:', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage promotions for {brandId === '212' ? 'BetDukes' : 'Casimboo'} ({lang})
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Promotion
        </button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div>Loading promotions...</div>
        ) : promotions?.length > 0 ? (
          promotions.map((promo) => (
            <PromotionCard key={promo.id} promotion={promo} />
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900">No promotions yet</h3>
            <p className="mt-2 text-sm text-gray-500">
              Get started by adding your first promotion
            </p>
          </div>
        )}
      </div>

      {/* Promotion Modal */}
      {isModalOpen && (
        <PromotionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSavePromotion}
        />
      )}
    </div>
  );
}

function PromotionCard({ promotion }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Preview Image */}
      <div className="aspect-video relative overflow-hidden rounded-t-lg bg-gray-100">
        {promotion.images?.desktop ? (
          <img
            src={promotion.images.desktop}
            alt={promotion.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Image className="w-8 h-8 text-gray-400" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-medium text-gray-900">{promotion.title}</h3>
        
        <div className="mt-2 space-y-2">
          {/* Status Badge */}
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            ${promotion.status === 'active' ? 'bg-green-100 text-green-800' : 
              promotion.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' : 
              'bg-gray-100 text-gray-800'}`}>
            {promotion.status}
          </span>

          {/* Meta Info */}
          <div className="flex items-center text-sm text-gray-500 space-x-4">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              <span>{new Date(promotion.valid_from).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center">
              <Globe className="w-4 h-4 mr-1" />
              <span>{promotion.geo_targeting.join(', ')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 rounded-b-lg">
        <div className="flex justify-end space-x-2">
          <button className="text-sm text-blue-600 hover:text-blue-800">
            Edit
          </button>
          <button className="text-sm text-red-600 hover:text-red-800">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}