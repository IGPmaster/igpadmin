// BrandList.jsx
import { Link } from 'react-router-dom';
import { LanguageSelector } from '../components/LanguageSelector';
import { useState, useEffect } from 'react';
import { getAllBrands, getCloudflareTrafficData, saveBrandContent } from '../lib/api';

export function BrandList() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewBrandModal, setShowNewBrandModal] = useState(false);
  console.log(showNewBrandModal)
  const [newBrandId, setNewBrandId] = useState('');
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandLanguage, setNewBrandLanguage] = useState('');

// In BrandList.jsx
useEffect(() => {
  async function loadBrands() {
    try {
      setLoading(true);
      const brandsData = await getAllBrands();

      const brandsWithTrafficData = await Promise.all(
        brandsData.map(async (brand) => {
          // Make sure we're passing the brand.id
          //console.log("Fetching analytics for brand:", brand.id);
          const trafficData = await getCloudflareTrafficData(brand.id || brand.whitelabel_id);
          return {
            ...brand,
            trafficData,
          };
        })
      );

      setBrands(brandsWithTrafficData);
    } catch (err) {
      console.error('Error loading brands:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  loadBrands();
}, []);

  const handleAddLanguage = (brandId, newLang) => {
    setBrands(prevBrands =>
      prevBrands.map(brand => {
        if (brand.id === brandId && !brand.languages.includes(newLang)) {
          return {
            ...brand,
            languages: [...brand.languages, newLang].sort()
          };
        }
        return brand;
      })
    );
  };

  const handleCreateBrand = async () => {
    try {
      if (!newBrandId || !newBrandName || !newBrandLanguage) {
        alert('Please fill in all fields');
        return;
      }

      const initialContent = {
        brand_info: {
          whitelabel_id: newBrandId,
          brand_name: newBrandName
        },
        acf: {
          image_full: '',
          image_small: '',
          trust_icons: '',
          new_games_info: '',
          popular_games_info: '',
          slot_games_info: '',
          casino_games_info: '',
          jackpot_games_info: '',
          live_games_info: '',
          scratch_games_info: '',
          sig_terms: '',
          full_terms: '',
          tnc_color: '#FEFBF3',
          promo_over: '',
          promo_under: '',
          main_content: '',
          geo_target_country_sel: [newBrandLanguage]
        },
        yoast_head_json: {
          title: '',
          description: '',
          og_title: '',
          og_description: '',
          focus_keywords: ''
        }
      };

      await saveBrandContent(newBrandId, newBrandLanguage, initialContent);
      const brandsData = await getAllBrands();
      setBrands(brandsData);

      setShowNewBrandModal(false);
      setNewBrandId('');
      setNewBrandName('');
      setNewBrandLanguage('');
    } catch (error) {
      console.error('Error creating brand:', error);
      alert('Failed to create brand. Please try again.');
    }
  };

  if (loading) return <div className="p-4">Loading brands...</div>;
  if (error) return <div className="p-4 text-red-600">Error loading brands: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Brands</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage content for all casino brands
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowNewBrandModal(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            Add New Brand
          </button>
        </div>
      </div>

      {/* Brand Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((brand) => (
          <div
            key={brand.id}
            className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex flex-col space-y-3 hover:border-gray-400"
          >
            {/* Row with Brand Name, ID on the left and Logo on the right */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{brand.name}</h3>
                <div className="mt-1 flex items-center text-sm text-gray-500">
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                    ID: {brand.whitelabel_id}
                  </span>
                </div>
              </div>
              <div>
                {brand.brand_info?.logo ? (
                  <img 
                    src={brand.brand_info.logo} 
                    alt={brand.brand_info.logo_alt || `${brand.name} logo`}
                    className="h-12 object-contain max-w-[100px]" 
                  />
                ) : (
                  <p className="text-gray-400 text-xs">No logo yet...</p>
                )}
              </div>
            </div>

           {brand.trafficData ? (
  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg text-sm">
    <div>
      <div className="text-gray-500">24h Views</div>
      <div className="font-semibold text-gray-600">
        {brand.trafficData.traffic24h || '-'}
      </div>
    </div>
    <div>
      <div className="text-gray-500">30d Requests</div>
      <div className="font-semibold text-gray-600">
        {brand.trafficData.requests30d || '-'}
      </div>
    </div>
    <div>
      <div className="text-gray-500">Bandwidth</div>
      <div className="font-semibold text-gray-600">
        {brand.trafficData.bandwidth || '-'}
      </div>
    </div>
    <div>
      <div className="text-gray-500">Security</div>
      <div className={`font-semibold ${
        brand.trafficData.threats > 0 ? 'text-red-600' : 'text-green-600'
      }`}>
        {brand.trafficData.threats > 0 
          ? `${brand.trafficData.threats} threats blocked` 
          : 'Secure'}
      </div>
    </div>
  </div>
) : (
  <div className="text-center text-sm text-gray-500 py-2">
    Analytics data unavailable
  </div>
)}

            {/* Languages Section */}
            <div className="flex flex-wrap gap-2">
              {brand.languages.map((lang) => (
                <Link
                  key={lang}
                  to={`/brands/${brand.id}/${lang}`}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {lang}
                </Link>
              ))}
            </div>

            {/* Language Selector Section */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Add Language
              </label>
              <LanguageSelector 
                onSelect={(lang) => handleAddLanguage(brand.id, lang)} 
              />
            </div>
          </div>
        ))}
      </div>
      {showNewBrandModal && (
  <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity flex items-center justify-center">
    <div className="bg-white rounded-lg px-4 pt-5 pb-4 overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full sm:p-6">
      <div>
        <div className="mt-3 text-center sm:mt-5">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Add New Brand
          </h3>
          <div className="mt-2">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Whitelabel ID
                </label>
                <input
                  type="text"
                  value={newBrandId}
                  onChange={(e) => setNewBrandId(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-gray-100 text-gray-800 pl-4 py-2"
                  placeholder="e.g., 123"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-gray-100 text-gray-800 pl-4 py-2"
                  placeholder="e.g., New Casino"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Initial Language
                </label>
                <select
                  value={newBrandLanguage}
                  onChange={(e) => setNewBrandLanguage(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-gray-100 text-gray-800 pl-4 py-2"
                >
                  <option value="">Select Language</option>
                  <option value="GB">UK Compliant</option>
                  <option value="CA">Canada</option>
                  <option value="IE">EU</option>
                  <option value="BR">Portuguese (BR)</option>
                  {/* Add more languages as needed */}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
        <button
          type="button"
          className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:text-sm"
          onClick={handleCreateBrand}
        >
          Create Brand
        </button>
        <button
          type="button"
          className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:text-sm"
          onClick={() => setShowNewBrandModal(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
