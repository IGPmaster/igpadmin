import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { BrandList } from './pages/BrandList';
import { BrandEdit } from './pages/BrandEdit';

function ImageLibrary() {
  return <div>Image Library Page</div>;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<BrandList />} />
          <Route path="/brands/:brandId/:lang" element={<BrandEdit />} />
          <Route path="/images" element={<ImageLibrary />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App