import { useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

/**
 * A reusable action bar component for form actions
 * 
 * @param {Object} props
 * @param {boolean} props.isFullScreen - Whether the form is in full screen mode
 * @param {Function} props.onToggleFullScreen - Function to toggle full screen mode
 * @param {Function} props.onSave - Function to save the form
 * @param {Function} props.onClose - Function to close the form
 * @param {Function} props.onDiscard - Function to discard changes
 * @param {boolean} props.saving - Whether the form is currently saving
 * @param {boolean} props.isDirty - Whether the form has unsaved changes
 * @param {string} props.className - Additional class names
 */
export default function ActionBar({
  isFullScreen = false,
  onToggleFullScreen,
  onSave,
  onClose,
  onDiscard,
  saving = false,
  isDirty = false,
  className = '',
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClose = () => {
    if (isDirty && onDiscard) {
      setShowConfirm(true);
    } else if (onClose) {
      onClose();
    }
  };

  const handleConfirmDiscard = () => {
    setShowConfirm(false);
    if (onDiscard) {
      onDiscard();
    }
    if (onClose) {
      onClose();
    }
  };

  const handleCancelDiscard = () => {
    setShowConfirm(false);
  };

  return (
    <div className={`flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center space-x-2">
        {onToggleFullScreen && (
          <button
            type="button"
            onClick={onToggleFullScreen}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isFullScreen ? (
              <>
                <Minimize2 className="h-4 w-4 mr-2" />
                Exit Full Screen
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4 mr-2" />
                Full Screen
              </>
            )}
          </button>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        {onDiscard && (
          <button
            type="button"
            onClick={onDiscard}
            disabled={saving || !isDirty}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Discard Changes
          </button>
        )}
        
        {onSave && (
          <button
            type="button"
            onClick={onSave}
            disabled={saving || !isDirty}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              'Save'
            )}
          </button>
        )}
        
        {onClose && (
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close
          </button>
        )}
      </div>
      
      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Discard changes?</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              You have unsaved changes. Are you sure you want to discard them?
            </p>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                type="button"
                onClick={handleCancelDiscard}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDiscard}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 