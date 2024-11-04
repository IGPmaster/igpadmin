// src/components/LanguageSelector.jsx
export function LanguageSelector({ onSelect }) { //This list should be taken from PP Countries API (https://prd-api.casino-pp.net/ClientHelper/GetCountriesByLabel?whitelabelid=12) and make Use of available data from that API ex response:
    //   {
    //     "CountryId": 28,
    //     "CountryName": "Brazil",
    //     "CountryIntlCode": "BR",
    //     "PhoneCode": "55",
    //     "DefaultCurrency": "BRL",
    //     "DefaultCurrencyId": 12,
    //     "DefaultLanguage": "pt-pt,en-mga,ja-jp,fi-fi,fr-ca,es-la",
    //     "LocalesGroupID": 11,
    //     "IsActive": false,
    //     "DefaultLanguageId": 0,
    //     "Culture": "pt-BR",
    //     "JurisdictionId": 722,
    //     "JurisdictionCode": "MGA"
    // }, -> This info is needed later for filtering games by jurisdictionCode etc in NUXT
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

  return (
    <div className="relative">
      <select
        className="block w-full pl-3 pr-10 py-2 font-medium text-gray-700 bg-gray-100 border-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        onChange={(e) => onSelect(e.target.value)}
        defaultValue=""
      >
        <option value="" disabled>Add New Country/Jurisdiction</option>
        {availableLanguages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}