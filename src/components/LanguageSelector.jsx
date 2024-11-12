// src/components/LanguageSelector.jsx
export function LanguageSelector({ onSelect, currentLanguages = [], isLoading = false }) { 
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

  const availableToAdd = availableLanguages.filter(
    lang => !currentLanguages.includes(lang.code)
  );

  if (isLoading) {
    return (
      <div className="relative">
        <select
          disabled
          className="block w-full pl-3 pr-10 py-2 font-medium text-gray-500 bg-gray-50 border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option>Loading languages...</option>
        </select>
        <div className="absolute right-2 top-2">
          <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (availableToAdd.length === 0) {
    return (
      <div className="relative">
        <select
          disabled
          className="block w-full pl-3 pr-10 py-2 font-medium text-gray-500 bg-gray-50 border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option>All languages added</option>
        </select>
      </div>
    );
  }

  return (
    <div className="relative">
      <select
        className="block w-full pl-3 pr-10 py-2 font-medium text-gray-700 bg-gray-100 border-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        onChange={(e) => onSelect(e.target.value)}
        defaultValue=""
      >
        <option value="" disabled>Add New Country/Jurisdiction</option>
        {availableToAdd.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}