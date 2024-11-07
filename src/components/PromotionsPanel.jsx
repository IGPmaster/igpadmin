import { useState } from 'react';

export function PromotionsPanel({ content, lang, setShowPromotionForm, setEditingPromotion }) {
  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        {/* Header */}
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h2 className="text-xl font-semibold text-gray-900">
              {content.brand_info.brand_name} Promotions
            </h2>
            <p className="mt-2 text-sm text-gray-700">
              Managing {lang} promotions
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
              onClick={() => setShowPromotionForm(true)}
            >
              Add Promotion
            </button>
          </div>
        </div>

        {/* List */}
        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <table className="min-w-full divide-y divide-gray-300">
                {/* ... rest of your table code ... */}
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}