// src/components/PagesPanel.jsx
import React, { useState } from 'react';
import { usePages } from '../lib/hooks/usePages';
import { Loader2, FileText, Layout } from 'lucide-react';

export const PagesPanel = ({ content, lang, setShowPageForm, setEditingPage }) => {
  const brandId = content?.brand_info?.whitelabel_id;
  const {
    pages,
    loading: pagesLoading,
    error,
    deletePage,
    refreshPages
  } = usePages(brandId, lang);
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  // Function to handle editing a page
  const handleEditPage = (page) => {
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

    setEditingPage(pageCopy);
    setShowPageForm(true);
  };

  // Function to handle deleting a page
  const handleDeletePage = async (pageId) => {
    if (!window.confirm('Are you sure you want to delete this page?')) {
      return;
    }

    try {
      setDeleteInProgress(true);
      await deletePage(pageId);
      await refreshPages(); // Ensure the list refreshes after deletion
    } catch (err) {
      console.error('Failed to delete page:', err);
      alert('Failed to delete page. Please try again.');
    } finally {
      setDeleteInProgress(false);
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
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h2 className="text-xl font-semibold text-gray-900">Pages</h2>
            <p className="mt-2 text-sm text-gray-700">
              Manage content pages for {content?.brand_info?.brand_name}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
              onClick={() => {
                setEditingPage(null); // Reset editing state
                setShowPageForm(true);
              }}
            >
              Add Page
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
                        Template
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
                    {pagesLoading ? (
                      <tr>
                        <td colSpan="5" className="text-center py-4">
                          <div className="flex justify-center items-center space-x-2">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                            <span className="text-sm text-gray-500">Loading pages...</span>
                          </div>
                        </td>
                      </tr>
                    ) : pages?.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-4">
                          <p className="text-sm text-gray-500">No pages found</p>
                        </td>
                      </tr>
                    ) : (
                      pages?.map((page) => (
                        <tr key={page.id}>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                            <div className="flex items-center">
                              {getTemplateIcon(page.template)}
                              <span className="ml-2 font-medium">{page.title}</span>
                            </div>
                            {page.categories?.length > 0 && (
                              <div className="mt-1 flex gap-1">
                                {page.categories.map((category) => (
                                  <span key={category} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                    {category}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 capitalize">
                            {page.template}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              page.status === 'published' 
                                ? 'bg-green-100 text-green-800'
                                : page.status === 'draft'
                                ? 'bg-gray-100 text-gray-800'
                                : page.status === 'scheduled'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {page.status.charAt(0).toUpperCase() + page.status.slice(1)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {new Date(page.updated_at).toLocaleDateString()}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <button
                              type="button"
                              className="text-blue-600 hover:text-blue-900 mr-4"
                              onClick={() => handleEditPage(page)}
                              disabled={deleteInProgress}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="text-red-600 hover:text-red-900"
                              onClick={() => handleDeletePage(page.id)}
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
