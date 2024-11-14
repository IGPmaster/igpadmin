import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import { BrandList } from './pages/BrandList';
import { BrandEdit } from './pages/BrandEdit';
import { PromotionsManager } from './pages/PromotionsManager';
import ImageLibrary from './pages/ImageLibrary';
import Login from './pages/Login';
import './lib/quill-dark.css';

const credentials = {
  admin: { email: 'tech@igpholding.com', password: 'password' },
  collaborator: { email: 'micke@igpholding.com', password: 'password', brandAccess: ['brand1', 'brand2'] },
};

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode === null ? true : savedMode === 'true'; // Default to true if not set
  });
  
  const [user, setUser] = useState(null);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('darkMode', 'true');
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const handleLogin = (email, password) => {
    if (email === credentials.admin.email && password === credentials.admin.password) {
      setUser({ role: 'admin' });
    } else if (email === credentials.collaborator.email && password === credentials.collaborator.password) {
      setUser({ role: 'collaborator', brandAccess: credentials.collaborator.brandAccess });
    } else {
      alert('Invalid credentials');
    }
  };

  const handleLogout = () => setUser(null);

  return (
    <Router>
      <div className="p-4 flex justify-between items-center">
        <button
          onClick={toggleDarkMode}
          className="inline-flex items-center justify-center rounded-md bg-gray-200 dark:bg-gray-700 px-3 py-1 text-sm font-medium text-gray-800 dark:text-gray-100"
        >
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>

        {user && (
          <button onClick={handleLogout} className="text-blue-600">
            Logout
          </button>
        )}
      </div>

      {user ? (
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<BrandList darkMode={darkMode} />} />
            {user.role === 'admin' ? (
              <>
                <Route path="/brands/:brandId/:lang" element={<BrandEdit darkMode={darkMode} />} />
                <Route path="/brands/:brandId/:lang/promotions" element={<PromotionsManager />} />
                <Route path="/images" element={<ImageLibrary />} />
              </>
            ) : (
              <>
                {user.brandAccess.map((brandId) => (
                  <Route
                    key={brandId}
                    path={`/brands/${brandId}/:lang`}
                    element={<BrandEdit darkMode={darkMode} />}
                  />
                ))}
              </>
            )}
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      ) : (
        <Routes>
          <Route path="*" element={<Login onLogin={handleLogin} />} />
        </Routes>
      )}
    </Router>
  );
}

export default App;