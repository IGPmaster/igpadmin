import { Link, Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 w-screen">
      <header className="bg-white shadow dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">IGP Casino Content Manager</h1>
        </div>
      </header>
      
      <div className="flex container mx-auto">
        <nav className="w-64 bg-white dark:bg-gray-900">
          <div className="p-4">
          <Link to="/" className="block p-2 text-white bg-gray-600 rounded hover:bg-gray-300 hover:text-gray-700 transition mb-2 font-mono text-sm">Dashboard</Link>
          <Link to="/images" className="block p-2 text-white bg-gray-600 rounded hover:bg-gray-300 hover:text-gray-700 transition mb-2 font-mono text-sm">Images</Link>
          <Link to="/seo" className="block p-2 text-white bg-gray-600 rounded hover:bg-gray-300 hover:text-gray-700 transition mb-2 font-mono text-sm">Pages</Link>
          <Link to="/seo" className="block p-2 text-white bg-gray-600 rounded hover:bg-gray-300 hover:text-gray-700 transition mb-2 font-mono text-sm">Promotions</Link>
          </div>
        </nav>
        
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}