// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { BrandList } from './pages/BrandList';
import { BrandEdit } from './pages/BrandEdit';
import { PromotionsManager } from './pages/PromotionsManager';
import Login from './pages/Login';

function ImageLibrary() {
  return <div>Image Library (Coming Soon)</div>;
}

// Hardcoded credentials
const credentials = {
  admin: { email: 'tech@igpholding.com', password: 'password' },
  collaborator: { email: 'micke@igpholding.com', password: 'password', brandAccess: ['brand1', 'brand2'] }, // Access to specific brands
};

function App() {
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('darkMode') === 'true'
  );
  const [user, setUser] = useState(null); // To track the logged-in user

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
        {/* Dark mode toggle button */}
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
                {/* Admin routes */}
                <Route path="/brands/:brandId/:lang" element={<BrandEdit darkMode={darkMode} />} />
                <Route path="/brands/:brandId/:lang/promotions" element={<PromotionsManager />} />
                <Route path="/images" element={<ImageLibrary />} />
              </>
            ) : (
              <>
                {/* Collaborator routes - restricted to specific brands */}
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
          {/* Redirect any unauthorized route to BrandList */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      ) : (
        // Render Login component if not authenticated
        <Routes>
          <Route path="*" element={<Login onLogin={handleLogin} />} />
        </Routes>
      )}
    </Router>
  );
}

export default App;
