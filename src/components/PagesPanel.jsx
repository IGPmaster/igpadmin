import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { usePages } from '../lib/hooks/usePages';
import { Loader2, FileText, Layout, Share2 } from 'lucide-react';

export const PagesPanel = ({ brandId, lang, onEditPage, onAddPage, refreshTrigger, sharedPages, onPageSharing }) => {
  // Note: sharedPages and onPageSharing are currently unused but kept for future implementation
  const {
    pages,                // From React Query
    loading: pagesLoading, // From React Query
    error,                // From React Query
    deletePage,           // Our delete function
    refreshPages          // Our refresh function
  } = usePages(brandId, lang);

  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [manualRefreshInProgress, setManualRefreshInProgress] = useState(false);
  const previousRefreshTriggerRef = useRef(refreshTrigger);

  useEffect(() => {
    // Only refresh if the trigger value has changed
    if (refreshTrigger !== previousRefreshTriggerRef.current) {
      console.log(`PagesPanel: Refreshing pages. Previous trigger: ${previousRefreshTriggerRef.current}, Current trigger: ${refreshTrigger}`);
      refreshPages();
      previousRefreshTriggerRef.current = refreshTrigger;
    } else {
      console.log(`PagesPanel: Skipping refresh. Trigger value unchanged: ${refreshTrigger}`);
    }
  }, [refreshTrigger, refreshPages]);

  // Log when component mounts or refreshTrigger changes
  useEffect(() => {
    console.log(`PagesPanel mounted/updated with refreshTrigger: ${refreshTrigger}`);
    return () => {
      console.log(`PagesPanel unmounting with refreshTrigger: ${refreshTrigger}`);
    };
  }, [refreshTrigger]);

  // Manual refresh function with loading state
  const handleManualRefresh = async () => {
    try {
      setManualRefreshInProgress(true);
      await refreshPages();
      console.log('PagesPanel: Manual refresh completed successfully');
    } catch (error) {
      console.error('PagesPanel: Manual refresh failed', error);
    } finally {
      setManualRefreshInProgress(false);
    }
  };

  // Function to handle editing a page
  const handleEditPage = (page) => {
    if (onEditPage) {
      const pageCopy = {
        ...page,
        content: page.content ? { ...page.content } : { main: '', excerpt: '' },
        images: page.images || { featured: '', banner: '', thumbnail: '' },
        seo_settings: page.seo_settings || { index: true, follow: true, schema_type: 'WebPage' },
        categories: page.categories || [],
        tags: page.tags || [],
        status: page.status || 'draft',
        template: page.template || 'default',
      };

      onEditPage(pageCopy);
    }
  };

  // Function to handle deleting a page
  const handleDeletePage = async (pageId) => {
    if (!window.confirm('Are you sure you want to delete this page?')) {
      return;
    }

    try {
      setDeleteInProgress(true);
      await deletePage(pageId);
      // No need to manually refresh pages as the deletePage function now does this
    } catch (err) {
      console.error('Failed to delete page:', err);
      alert('Failed to delete page. Please try again.');
    } finally {
      setDeleteInProgress(false); // Make sure this runs
    }
  };

  // Function to handle page sharing
  const handlePageSharing = (pageId) => {
    const isCurrentlyShared = sharedPages.includes(pageId);
    if (onPageSharing) {
      onPageSharing(pageId, !isCurrentlyShared);
    }
  };

  // Function to determine the correct icon for the template
  const getTemplateIcon = (template) => {
    switch (template) {
      case 'landing':
        return <Layout className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading pages</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Pages</h2>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-400">
              Manage content pages
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex space-x-2">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
              onClick={handleManualRefresh}
              disabled={manualRefreshInProgress || pagesLoading}
            >
              {manualRefreshInProgress ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                'Refresh'
              )}
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={() => {
                if (onEditPage) onEditPage(null);
                if (onAddPage) onAddPage(true);
              }}
            >
              Add Page
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-col">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black/5 dark:ring-white/10 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-900">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Title
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Template
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
                    {pagesLoading ? (
                      <tr>
                        <td colSpan="5" className="text-center py-4 dark:bg-gray-700">
                          <div className="flex justify-center items-center space-x-2">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
                            <span className="text-sm text-gray-500 dark:text-gray-400">Loading pages...</span>
                          </div>
                        </td>
                      </tr>
                    ) : pages?.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-4 dark:bg-gray-800">
                          <p className="text-sm text-gray-500 dark:text-gray-400">No pages found</p>
                        </td>
                      </tr>
                    ) : (
                      pages?.map((page) => (
                        <tr key={page.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                          <td className="whitespace-nowrap px-3 py-4">
                            <div className="flex items-center">
                              {getTemplateIcon(page.template)}
                              <span 
                                className="whitespace-nowrap px-3 py-4 text-base text-blue-800 dark:text-blue-400 ml-2 font-medium cursor-pointer hover:underline" 
                                onClick={() => handleEditPage(page)}
                              >
                                {page.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              {/* Categories */}
                              {page.categories?.length > 0 && (
                                <div className="flex items-center gap-1 border-r border-gray-600 pr-2">
                                  <span className="text-xs px-1 text-gray-500 dark:text-gray-400">
                                    Categories:
                                  </span>
                                  {page.categories.map((category) => (
                                    <span 
                                      key={category} 
                                      className="bg-yellow-100 text-yellow-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-yellow-300 border border-yellow-300"
                                    >
                                      {category}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Languages */}
                              {page.languages?.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-500 dark:text-gray-400 px-1">
                                    Post available in:
                                  </span>
                                  {page.languages.map((language) => (
                                    <span 
                                      key={language}
                                      className="bg-green-100 text-green-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-green-400 border border-green-400"
                                    >
                                      {language}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400 capitalize">
                            {page.template}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              page.status === 'published' 
                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
                                : page.status === 'draft'
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
                                : page.status === 'scheduled'
                                ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
                            } transition-colors duration-200`}>
                              {page.status ? page.status.charAt(0).toUpperCase() + page.status.slice(1) : 'Draft'}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {page.updated_at ? new Date(page.updated_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <div className="flex space-x-2 justify-end">
                              <button
                                type="button"
                                onClick={() => handlePageSharing(page.id)}
                                className={`flex items-center ${
                                  sharedPages.includes(page.id)
                                    ? 'text-green-700 bg-green-50 border border-green-700 dark:text-green-400 dark:bg-green-900/50 dark:border-green-500'
                                    : 'text-blue-700 bg-blue-50 border border-blue-700 dark:text-blue-400 dark:bg-blue-900/50 dark:border-blue-500'
                                } hover:bg-opacity-80 px-3 py-1 rounded-md transition-colors duration-200`}
                              >
                                <Share2 className="w-4 h-4 mr-1" />
                                {sharedPages.includes(page.id) ? 'Shared' : 'Share'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePage(page.id)}
                                disabled={deleteInProgress}
                                className="text-red-700 bg-red-50 border border-red-700 dark:text-red-400 dark:bg-red-900/50 dark:border-red-500 hover:bg-red-800 hover:text-white dark:hover:bg-red-800 dark:hover:text-white px-3 py-1 rounded-md transition-colors duration-200"
                              >
                                {deleteInProgress ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
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

PagesPanel.propTypes = {
  brandId: PropTypes.string,
  lang: PropTypes.string.isRequired,
  onEditPage: PropTypes.func,
  onAddPage: PropTypes.func,
  refreshTrigger: PropTypes.number,
  sharedPages: PropTypes.array,
  onPageSharing: PropTypes.func
};

PagesPanel.defaultProps = {
  sharedPages: [],
  onEditPage: () => {},
  onAddPage: () => {},
  onPageSharing: () => {},
  refreshTrigger: 0
};
