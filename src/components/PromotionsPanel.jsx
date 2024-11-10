import React, { useState } from 'react';
import { usePromotions } from '../lib/hooks/usePromotions';
import { Loader2 } from 'lucide-react';

export const PromotionsPanel = ({ brandId, lang, setShowPromotionForm, setEditingPromotion }) => {
  const {
    promotions,
    loading: promotionsLoading,
    error,
    deletePromotion,
    refreshPromotions
  } = usePromotions(brandId, lang);
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  const handleEditPromotion = (promotion) => {
    
    // Create a clean copy of the promotion
    const promotionCopy = {
      ...promotion,
      images: promotion.images ? { ...promotion.images } : { desktop: '', mobile: '' },
      geo_targeting: promotion.geo_targeting ? [...promotion.geo_targeting] : [lang.toUpperCase()],
      valid_from: promotion.valid_from || new Date().toISOString().split('T')[0],
      valid_to: promotion.valid_to || '',
      description: promotion.description || '',
      terms: promotion.terms || '',
    };
    
    // Set the states in sequence
    setEditingPromotion(promotionCopy);
    setTimeout(() => {
      setShowPromotionForm(true);
    }, 0);
  };

  const handleDeletePromotion = async (promotionId) => {
    if (!window.confirm('Are you sure you want to delete this promotion?')) {
      return;
    }

    try {
      setDeleteInProgress(true);
      await deletePromotion(promotionId);
      await refreshPromotions();
    } catch (err) {
      console.error('Failed to delete promotion:', err);
      alert('Failed to delete promotion. Please try again.');
    } finally {
      setDeleteInProgress(false);
    }
  };

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading promotions</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h2 className="text-xl font-semibold text-gray-900">Promotions</h2>
            <p className="mt-2 text-sm text-gray-700">
              Manage promotional content for this brand
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={() => {
                setEditingPromotion(null); // Ensure we're not in edit mode
                setShowPromotionForm(true);
              }}
            >
              Add Promotion
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-col">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Title
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Slug
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Modified
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {promotionsLoading ? (
                      <tr>
                        <td colSpan="5" className="text-center py-4">
                          <div className="flex justify-center items-center space-x-2">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                            <span className="text-sm text-gray-500">Loading promotions...</span>
                          </div>
                        </td>
                      </tr>
                    ) : promotions.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-4">
                          <p className="text-sm text-gray-500">No promotions found</p>
                        </td>
                      </tr>
                    ) : (
                      promotions.map((promotion) => (
                        <tr key={promotion.id}>
                          <td className="whitespace-nowrap px-3 py-4">
                            <div className="whitespace-nowrap px-3 py-4 text-base text-blue-800 ml-2 font-medium cursor-pointer hover:underline" onClick={() => handleEditPromotion(promotion)}>{promotion.title}</div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {promotion.slug}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              promotion.status === 'active' 
                                ? 'bg-green-100 text-green-800'
                                : promotion.status === 'draft'
                                ? 'bg-gray-100 text-gray-800'
                                : promotion.status === 'scheduled'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {promotion.status.charAt(0).toUpperCase() + promotion.status.slice(1)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {new Date(promotion.meta?.updated_at || promotion.updated_at).toLocaleDateString()}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <button
                              type="button"
                              className="text-blue-700 hover:text-blue-900 mr-4 bg-blue-50 border-blue-800 hover:bg-blue-100"
                              onClick={() => handleEditPromotion(promotion)}
                              disabled={deleteInProgress}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="text-red-700 bg-red-50 border-red-700 hover:text-red-900 hover:bg-red-800 hover:text-red-50"
                              onClick={() => handleDeletePromotion(promotion.id)}
                              disabled={deleteInProgress}
                            >
                              {deleteInProgress ? 'Deleting...' : 'Delete'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};