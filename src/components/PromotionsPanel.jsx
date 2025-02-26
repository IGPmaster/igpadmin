import { useState, useEffect, useRef } from 'react';
import { usePromotions } from '../lib/hooks/usePromotions';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import PropTypes from 'prop-types';


export const PromotionsPanel = ({ brandId, lang, onEditPromotion, onAddPromotion, refreshTrigger }) => {
  const {
    promotions,
    loading: promotionsLoading,
    error,
    deletePromotion,
    refreshPromotions
  } = usePromotions(brandId, lang);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [manualRefreshInProgress, setManualRefreshInProgress] = useState(false);
  const previousRefreshTriggerRef = useRef(refreshTrigger);

  useEffect(() => {
    console.log('PromotionsPanel: refreshTrigger changed from', previousRefreshTriggerRef.current, 'to', refreshTrigger);
    
    // Only refresh if the trigger value has actually changed
    if (refreshTrigger !== previousRefreshTriggerRef.current) {
      console.log('PromotionsPanel: Refreshing promotions due to trigger change');
      refreshPromotions();
      // Update the ref to the current value
      previousRefreshTriggerRef.current = refreshTrigger;
    } else {
      console.log('PromotionsPanel: Skipping refresh as trigger value has not changed');
    }
  }, [refreshTrigger, refreshPromotions]);

  // Log when promotions data changes
  useEffect(() => {
    console.log('PromotionsPanel: Promotions data updated', { 
      count: promotions?.length,
      loading: promotionsLoading,
      error,
      promotionIds: Array.isArray(promotions) ? promotions.map(p => p?.id).filter(Boolean) : []
    });
  }, [promotions, promotionsLoading, error]);

  // Log component mount/unmount
  useEffect(() => {
    console.log('PromotionsPanel: Component mounted with refreshTrigger =', refreshTrigger);
    
    return () => {
      console.log('PromotionsPanel: Component unmounting');
    };
  }, [refreshTrigger]);

  const handleManualRefresh = async () => {
    setManualRefreshInProgress(true);
    try {
      await refreshPromotions();
      console.log('Manual refresh completed');
    } catch (err) {
      console.error('Manual refresh failed:', err);
    } finally {
      setManualRefreshInProgress(false);
    }
  };

  const handleEditPromotion = (promotion) => {
    if (onEditPromotion && promotion) {
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
      
      onEditPromotion(promotionCopy);
    }
  };

  const handleDeletePromotion = async (promotionId) => {
    if (!window.confirm('Are you sure you want to delete this promotion?')) {
      return;
    }

    try {
      setDeleteInProgress(true);
      await deletePromotion(promotionId);
    } catch (err) {
      console.error('Failed to delete promotion:', err);
      alert('Failed to delete promotion. Please try again.');
    } finally {
      setDeleteInProgress(false);
    }
  };

  // Filter out any null or undefined promotions
  const validPromotions = Array.isArray(promotions) 
    ? promotions.filter(promo => promo !== null && promo !== undefined) 
    : [];

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">Promotions</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Manage promotions for this brand
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex space-x-2">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={promotionsLoading || manualRefreshInProgress}
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
          >
            {(promotionsLoading || manualRefreshInProgress) ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </button>
          <button
            type="button"
            onClick={onAddPromotion}
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Add promotion
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-4 border border-red-300 bg-red-50 dark:bg-red-900/30 dark:border-red-800 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Error loading promotions</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                <p>{error}</p>
                <button 
                  onClick={handleManualRefresh}
                  className="mt-2 text-sm font-medium text-red-800 dark:text-red-300 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              {promotionsLoading && !validPromotions.length ? (
                <div className="flex justify-center items-center h-64 bg-white dark:bg-gray-800">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">Loading promotions...</span>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 sm:pl-6">
                        Title
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                        Valid From
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                        Valid To
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                        Status
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                    {validPromotions.length === 0 && !promotionsLoading ? (
                      <tr>
                        <td colSpan="5" className="py-10 text-center text-gray-500 dark:text-gray-400">
                          No promotions found. Click &quot;Add promotion&quot; to create one.
                        </td>
                      </tr>
                    ) : (
                      validPromotions.map((promotion) => (
                        <tr key={promotion.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                            <button
                              type="button"
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                              onClick={() => handleEditPromotion(promotion)}
                            >
                              {promotion.title || 'Untitled Promotion'}
                            </button>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {promotion.valid_from || 'Not set'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {promotion.valid_to || 'Not set'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            {getPromotionStatus(promotion)}
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
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to determine promotion status
function getPromotionStatus(promotion) {
  if (!promotion) {
    return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">Unknown</span>;
  }

  const now = new Date();
  const validFrom = promotion.valid_from ? new Date(promotion.valid_from) : null;
  const validTo = promotion.valid_to ? new Date(promotion.valid_to) : null;
  
  if (!validFrom) {
    return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">Draft</span>;
  }
  
  if (validFrom > now) {
    return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">Scheduled</span>;
  }
  
  if (!validTo || validTo >= now) {
    return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">Active</span>;
  }
  
  return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">Expired</span>;
}

PromotionsPanel.propTypes = {
  brandId: PropTypes.string.isRequired,
  lang: PropTypes.string.isRequired,
  onEditPromotion: PropTypes.func.isRequired,
  onAddPromotion: PropTypes.func.isRequired,
  refreshTrigger: PropTypes.number.isRequired,
};