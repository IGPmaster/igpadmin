// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { BrandList } from './pages/BrandList';
import { BrandEdit } from './pages/BrandEdit';
import { PromotionsManager } from './pages/PromotionsManager';

// Temporary placeholder for ImageLibrary
function ImageLibrary() {
  return <div>Image Library (Coming Soon)</div>;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<BrandList />} />
          <Route path="/brands/:brandId/:lang" element={<BrandEdit />} />
          <Route path="/brands/:brandId/:lang/promotions" element={<PromotionsManager />} />
          <Route path="/images" element={<ImageLibrary />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;