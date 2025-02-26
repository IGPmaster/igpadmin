// src/components/LanguageSelector.jsx
import PropTypes from 'prop-types';

export function LanguageSelector({ 
  currentLang, 
  availableLangs = [], 
  onLanguageChange, 
  onAddLanguage,
  isLoading = false 
}) { 
  const availableLanguages = [
    { code: 'GB', name: 'English (UK)' },
    { code: 'IE', name: 'English (EU)' },
    { code: 'CA', name: 'English (Canada)' },
    { code: 'US', name: 'English (USA)' },
    { code: 'NZ', name: 'English (New Zeeland)' },
    { code: 'ZA', name: 'English (South Africa)' },
    { code: 'ES', name: 'Spanish' },
    { code: 'BR', name: 'Portuguese (BR)' },
    { code: 'DE', name: 'German' },
    { code: 'JP', name: 'Japanese' },
    { code: 'FI', name: 'Finnish' },
    { code: 'IN', name: 'Indian (EN)' }
  ];

  // If the worker API isn't returning any languages, we should still allow adding new ones
  // This is a workaround for the case where the API endpoint isn't working correctly
  const shouldShowAddLanguage = true; // Always show the add language dropdown

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <select
          disabled
          className="block w-48 pl-3 pr-10 py-2 text-sm border-gray-300 rounded-md bg-gray-50"
        >
          <option>Loading languages...</option>
        </select>
        <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Language Switcher */}
      {availableLangs.length > 0 && (
        <select
          value={currentLang}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="block w-48 pl-3 pr-10 py-2 text-sm border-gray-300 rounded-md"
        >
          {availableLangs.map((lang) => (
            <option key={lang} value={lang}>
              {lang.toUpperCase()}
            </option>
          ))}
        </select>
      )}
      
      {/* Add New Language */}
      {shouldShowAddLanguage && (
        <select
          className="block w-48 pl-3 pr-10 py-2 text-sm border-gray-300 rounded-md"
          onChange={(e) => {
            if (e.target.value) {
              onAddLanguage(e.target.value);
              e.target.value = ""; // Reset after selection
            }
          }}
          defaultValue=""
        >
          <option value="" disabled>Add New Country/Jurisdiction</option>
          {availableLanguages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

LanguageSelector.propTypes = {
  currentLang: PropTypes.string.isRequired,
  availableLangs: PropTypes.array,
  onLanguageChange: PropTypes.func.isRequired,
  onAddLanguage: PropTypes.func.isRequired,
  isLoading: PropTypes.bool
};