// LanguageLinks.jsx
import { Link } from 'react-router-dom';

export function LanguageLinks({ languages, brandId, basePath = '/brands' }) {
  if (!languages || !languages.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {languages.map((lang) => (
        <Link
          key={lang}
          to={`${basePath}/${brandId}/${lang}`}
          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
        >
          {lang}
        </Link>
      ))}
    </div>
  );
}
