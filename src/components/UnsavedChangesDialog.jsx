// First create a new component for the dialog
export function UnsavedChangesDialog({ isOpen, onSave, onDiscard, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500/75 backdrop-blur-sm transition-opacity z-50">
      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 border border-gray-200 dark:border-gray-700">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900 sm:mx-0 sm:h-10 sm:w-10">
                <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-200" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                  Unsaved Changes
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    You have unsaved changes that will be lost if you leave this page. Would you like to save your changes?
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-2">
              <button
                type="button"
                onClick={onSave}
                className="inline-flex w-full justify-center items-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:w-auto transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Save Changes
              </button>
              <button
                type="button"
                onClick={onDiscard}
                className="mt-3 inline-flex w-full justify-center items-center rounded-lg bg-red-100 dark:bg-red-900/30 px-4 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 sm:mt-0 sm:w-auto transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Discard Changes
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="mt-3 inline-flex w-full justify-center items-center rounded-lg bg-gray-100 dark:bg-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 sm:mt-0 sm:w-auto transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                </svg>
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}