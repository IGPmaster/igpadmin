import React, { useState } from 'react';
import { usePromotions } from '../lib/hooks/usePromotions';
import { Loader2 } from 'lucide-react';


export const PromotionsPanel = ({ brandId, lang, setShowPromotionForm, setEditingPromotion,  }) => {
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
    <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
      <div className="">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Promotions</h2>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-400">
              Manage promotional content
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 dark:bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 dark:hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200"
              onClick={() => {
                setEditingPromotion(null);
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
              <div className="overflow-hidden shadow ring-1 ring-black/5 dark:ring-white/10 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Title
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Slug
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Status
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Modified
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                    {promotionsLoading ? (
                      <tr>
                        <td colSpan="5" className="text-center py-4 dark:bg-gray-700">
                          <div className="flex justify-center items-center space-x-2">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
                            <span className="text-sm text-gray-500 dark:text-gray-400">Loading promotions...</span>
                          </div>
                        </td>
                      </tr>
                    ) : promotions.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-4 dark:bg-gray-800">
                          <p className="text-sm text-gray-500 dark:text-gray-400">No promotions found</p>
                        </td>
                      </tr>
                    ) : (
                      promotions.map((promotion) => (
                        <tr key={promotion.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                          <td className="whitespace-nowrap px-3 py-4">
                            <div 
                              className="whitespace-nowrap px-3 py-4 text-base text-blue-800 dark:text-blue-400 ml-2 font-medium cursor-pointer hover:underline" 
                              onClick={() => handleEditPromotion(promotion)}
                            >
                              {promotion.title}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {promotion.slug}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              promotion.status === 'active' 
                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
                                : promotion.status === 'draft'
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
                                : promotion.status === 'scheduled'
                                ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'
                                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'
                            } transition-colors duration-200`}>
                              {promotion.status.charAt(0).toUpperCase() + promotion.status.slice(1)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {new Date(promotion.meta?.updated_at || promotion.updated_at).toLocaleDateString()}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <button
                              type="button"
                              className="text-red-700 bg-red-50 border border-red-700 dark:text-red-400 dark:bg-red-900/50 dark:border-red-500 hover:bg-red-800 hover:text-white dark:hover:bg-red-800 dark:hover:text-white px-3 py-1 rounded-md transition-colors duration-200"
                              disabled={deleteInProgress}
                              onClick={() => handleDeletePromotion(promotion.id)}
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