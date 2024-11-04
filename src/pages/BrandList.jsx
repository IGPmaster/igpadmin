import { Link } from 'react-router-dom';
import { LanguageSelector } from '../components/LanguageSelector';
import { useState, useEffect } from 'react';
import { getAllBrands, saveBrandContent } from '../lib/api';

export function BrandList() {
  // All state declarations need to be at the top
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewBrandModal, setShowNewBrandModal] = useState(false);
  const [newBrandId, setNewBrandId] = useState('');
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandLanguage, setNewBrandLanguage] = useState('');

  useEffect(() => {
    async function loadBrands() {
      try {
        setLoading(true);
        const brandsData = await getAllBrands();
        setBrands(brandsData);
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

      // Create initial content
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
          geo_target_country_sel: [newBrandLanguage]
        }
      };

      await saveBrandContent(newBrandId, newBrandLanguage, initialContent);
      
      // Refresh the brand list
      const brandsData = await getAllBrands();
      setBrands(brandsData);
      
      // Close modal and reset form
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
      {/* Header with Add Brand button */}
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
            <div>
              {brand.brand_info?.logo ? (
                    <div className="mb-3">
                    <img 
                        src={brand.brand_info.logo} 
                        alt={brand.brand_info.logo_alt || `${brand.name} logo`}
                        className="h-12 object-contain" 
                    />
                    </div>
                ) : (
                    <p className="text-gray-400 text-xs">No logo yet...</p>
                )}
              <h3 className="text-lg font-medium text-gray-900">{brand.name}</h3>
              <div className="mt-1 flex items-center text-sm text-gray-500">
                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                  ID: {brand.whitelabel_id}
                </span>
              </div>
            </div>

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

      {/* New Brand Modal */}
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
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3"
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
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3"
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
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3"
                      >
                        <option value="">Select Language</option>
                        <option value="EN">English EU/IE</option>
                        <option value="GB">English UK</option>
                        <option value="CA">English CA</option>
                        <option value="NZ">English NZ</option>
                        <option value="ZA">English ZA</option>
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