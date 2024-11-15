import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getAllBrands, getCloudflareTrafficData, saveBrandContent } from '../lib/api';

export function BrandList() {
  const navigate = useNavigate();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewBrandModal, setShowNewBrandModal] = useState(false);
  const [newBrandId, setNewBrandId] = useState('');
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandLanguage, setNewBrandLanguage] = useState('');
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('darkMode') === 'true'
  );

  // Toggle Dark Mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode); // Save preference
    document.documentElement.classList.toggle('dark', newDarkMode); // Apply class to <html>
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode); // Apply initial mode
  }, [darkMode]);

  useEffect(() => {
    async function loadBrands() {
      try {
        setLoading(true);
        const brandsData = await getAllBrands();

        const brandsWithTrafficData = await Promise.all(
          brandsData.map(async (brand) => {
            const trafficData = await getCloudflareTrafficData(brand.id || brand.whitelabel_id);
            return { ...brand, trafficData };
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

  const handleCreateBrand = async () => {
    try {
      if (!newBrandId || !newBrandName || !newBrandLanguage) {
        alert('Please fill in all fields');
        return;
      }

      const initialContent = {
        brand_info: {
          whitelabel_id: newBrandId,
          brand_name: newBrandName,
        },
        acf: { /* fields */ },
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

// Full-page loading screen with slick spinner
if (loading) return (
  <div className="fixed inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900 bg-opacity-75 z-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-xl font-semibold text-gray-700 dark:text-gray-200">Loading all your brands, hang on...</p>
    </div>
  </div>
);

if (error) return (
  <div className="p-4 text-center text-red-600 dark:text-red-400">
    Error loading page: {error}
  </div>
);




  return (
    <div className="space-y-6 bg-gray-100 dark:bg-gray-900 min-h-screen p-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Brands Overview</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Manage content and analytics for all casino brands.
          </p>
        </div>
        <button
          onClick={toggleDarkMode}
          className="inline-flex items-center justify-center rounded-md bg-gray-200 dark:bg-gray-700 px-3 py-1 text-sm font-medium text-gray-800 dark:text-gray-100"
        >
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>

      {/* Add New Brand Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowNewBrandModal(true)}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 dark:bg-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add New Brand
        </button>
      </div>

      {/* Brand Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((brand) => (
          <div
            key={brand.id}
            className="relative rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-md hover:shadow-lg transition duration-200 ease-in-out flex flex-col h-full"
          >
            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{brand.name}</h3>
                  <span className="mt-1 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                    ID: {brand.whitelabel_id}
                  </span>
                </div>
                <div>
                  {brand.brand_info?.logo ? (
                    <img 
                      src={brand.brand_info.logo} 
                      alt={brand.brand_info.logo_alt || `${brand.name} logo`}
                      className="h-12 object-contain max-w-[100px]" 
                    />
                  ) : (
                    <p className="text-gray-400 dark:text-gray-500 text-xs">No logo available</p>
                  )}
                </div>
              </div>

              {/* Traffic Data */}
              {brand.trafficData ? (
                <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">24h Views</p>
                    <p className="font-semibold text-gray-700 dark:text-gray-100">{brand.trafficData.traffic24h || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">30d Requests</p>
                    <p className="font-semibold text-gray-700 dark:text-gray-100">{brand.trafficData.requests30d || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Bandwidth</p>
                    <p className="font-semibold text-gray-700 dark:text-gray-100">{brand.trafficData.bandwidth || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Security</p>
                    <p className={`font-semibold ${brand.trafficData.threats > 0 ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}`}>
                      {brand.trafficData.threats > 0 ? `${brand.trafficData.threats} threats blocked` : 'Secure'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-2">
                  Analytics data unavailable
                </div>
              )}

              {/* Languages */}
              <div className="flex flex-wrap gap-2">
                {brand.languages.map((lang) => (
                  <Link
                    key={lang}
                    to={`/brands/${brand.id}/${lang}`}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300"
                  >
                    {lang.toUpperCase()}
                  </Link>
                ))}
              </div>
            </div>

            {/* CTA Button - now will stick to bottom */}
            <div className="mt-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const defaultLang = brand.languages[0];
                  if (defaultLang) navigate(`/brands/${brand.id}/${defaultLang}`);
                }}
                className="w-full inline-flex items-center justify-center px-4 py-2 rounded-md bg-blue-600 dark:bg-blue-700 text-white text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Update Brand Content
              </button>
            </div>
          </div>
        ))}
      </div>

      {showNewBrandModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 text-center">
              Add New Brand
            </h3>
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Whitelabel ID</label>
                <input
                  type="text"
                  value={newBrandId}
                  onChange={(e) => setNewBrandId(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Brand Name</label>
                <input
                  type="text"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Initial Language</label>
                <select
                  value={newBrandLanguage}
                  onChange={(e) => setNewBrandLanguage(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                >
                  <option value="">Select Language</option>
                  <option value="GB">UK Compliant</option>
                  <option value="CA">Canada</option>
                  <option value="IE">EU</option>
                  <option value="BR">Portuguese (BR)</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setShowNewBrandModal(false)}
                className="px-4 py-2 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 shadow-sm border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBrand}
                className="px-4 py-2 rounded-md bg-blue-600 dark:bg-blue-700 text-white shadow-sm hover:bg-blue-700 dark:hover:bg-blue-800"
              >
                Create Brand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
